import { SnackbarProgrammatic as Snackbar } from 'buefy';
import debounce from 'debounce';
import Quill from 'quill';
import { Component, Emit, Model, Vue, Watch } from 'vue-property-decorator';

import { generateApi, getModelsApi } from '../../api/porfirevich';
import { PRIMARY_COLOR } from '../../config';
import PlainClipboard from '../../utils/PlainClipboard';
import { deltaToScheme, schemeToDelta } from '../../utils/schemeUtils';

import type { Sources } from 'quill';
import type { Delta } from '../../interfaces';
import { Scheme } from '@shared/types/Scheme';

import { useAppStore } from '@/store/app';

Quill.register('modules/clipboard', PlainClipboard, true);

const appModule = useAppStore();

@Component
export default class Transformer extends Vue {
  @Model('change', { type: Array, default: () => [] }) readonly scheme!: Scheme;
  text = '';
  html = '';
  isReady = false;
  isLoading = false;
  isError = false;
  isAutocomplete = false;
  isSettings = false;
  lastReply = '';
  replies: string[] = [];
  interval = 1;
  length = 30;
  placeholder = 'Придумайте начало истории';
  quill!: Quill;

  localScheme: Scheme = [];

  abortControllers: AbortController[] = [];
  private readonly promptMaxLength = 1000000;
  private readonly debounceDelay = 10;
  debouncedTextChange!: (
    delta: Delta,
    oldDelta: Delta,
    source: Sources
  ) => void;
  debouncedTransform!: () => void;
  debouncedHistory!: () => void;

  private readonly historyInterval = 300;
  private readonly historyLength = 2000;
  history: Scheme[] = [];
  models: string[] = [];
  activeModel = '';

  private handleKeydown: (e: KeyboardEvent) => void;
  private handleBeforeUnload: (e: BeforeUnloadEvent) => void;

  constructor() {
    super();
    this.handleKeydown = this.onKeydown.bind(this);
    this.handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue =
        'Вы действительно хотите покинуть страницу? История будет утеряна.';
    };
  }

  get prompt() {
    return this.stripHtml(this.text).replace(this.lastReply, '').trimStart();
  }

  @Watch('isAutocomplete')
  abort() {
    this.abortControllers.forEach((x) => x.abort());
    this.abortControllers = [];
    this.isError = false;
  }

  @Watch('interval')
  bindDebounceTransform() {
    this.debouncedTransform = debounce(
      this.transform.bind(this),
      this.interval * 1000
    );
  }

  @Watch('isLoading')
  @Emit()
  loading(val: boolean) {
    return val;
  }

  @Watch('isReady')
  @Emit()
  ready(val: boolean) {
    return val;
  }

  @Emit('change')
  setContent() {
    this.html = this.quill.root.innerHTML;
    this.localScheme = this.getScheme();
    return this.localScheme;
  }

  bindDebounceHistory() {
    this.debouncedHistory = debounce(
      this.updateHistory.bind(this),
      this.historyInterval
    );
  }

  bindDebounceTextChange() {
    this.debouncedTextChange = debounce(
      (delta: Delta, oldDelta: Delta, source: Sources) =>
        this.onTextChange(delta, oldDelta, source),
      this.debounceDelay
    );
  }

  mounted() {
    this.getModels().finally(() => {
      this.initialize();
    });
  }

  destroyed() {
    window.removeEventListener('keydown', this.handleKeydown);
    this.removeWindowUnloadListener();
  }

  changeModel() {
    const activeModelIndex = this.models.indexOf(this.activeModel);
    this.activeModel =
      activeModelIndex !== -1
        ? this.models[(activeModelIndex + 1) % this.models.length]
        : this.models[0];
    this.replies = [];
  }

  appendHistory(scheme: Scheme) {
    this.history = [...this.history, scheme].slice(-this.historyLength);
  }

  historyBack() {
    this.abort();
    this.cleanLastReply();
    const history = [...this.history];
    history.pop(); // last changes
    const prev = history.pop();
    if (prev) {
      this.setScheme(prev, true);
    } else {
      this.clean();
    }
    this.history = history;
  }

  updateHistory() {
    const scheme = this.getScheme();
    this.appendHistory(scheme);
  }

  clean() {
    this.abort();
    this.text = '';
    this.html = '';
    this.removeWindowUnloadListener();
    this.quill.setText('', 'api');
  }

  escape() {
    if (this.isLoading) {
      this.abort();
    } else if (this.history.length) {
      this.historyBack();
    } else if (this.lastReply) {
      this.cleanLastReply();
    } else {
      this.clean();
    }
  }

  easyEscape() {
    if (this.isLoading) {
      this.abort();
    }
    if (this.lastReply) {
      this.lastReply = '';
    }
  }

  cleanLastReply() {
    const text = this.quill.getText();
    const index = text.indexOf(this.lastReply);
    if (index !== -1) {
      this.quill.deleteText(index, this.lastReply.length, 'api');
    }
    this.lastReply = '';
    this.replies = [];
    this.setCursor();
  }

  onTextChange(delta: Delta, _oldDelta: Delta, source: Sources) {
    this.setContent();
    this.text = this.quill.getText();
    this.setPlaceholder();
    this.abort();

    if (source === 'user') {
      this.lastReply = '';
      this.replies = [];

      delta.ops.forEach((op) => {
        if (op.attributes) {
          op.attributes = {};
        }
      });

      if (this.isAutocomplete) {
        this.debouncedTransform();
      }
    }

    this.debouncedHistory();

    if (this.text.trim().length) {
      this.addWindowUnloadListener();
    } else {
      this.removeWindowUnloadListener();
    }
  }

  onKeydown(e: KeyboardEvent) {
    if (e.key === 'Tab') {
      e.preventDefault();
      if (this.isLoading) {
        this.abort();
      } else {
        this.transform();
      }
    } else if (e.key === 'Escape') {
      this.easyEscape();
    } else if ((e.metaKey || e.ctrlKey) && e.code === 'KeyZ') {
      this.historyBack();
    }
  }

  async transform() {
    this.abort();
    const mem = { isAborted: false };
    try {
      const prompt = this.prompt;
      if (!prompt) {
        return;
      }
      this.isLoading = true;
      let replies: string[] | undefined;
      if (this.replies.length) {
        replies = this.replies;
      } else {
        const data = await this.request(prompt);
        replies = data && data.replies;
        if (replies) {
          appModule.appendReplies(replies);
        }
      }
      if (replies && !mem.isAborted) {
        const reply = replies.pop() || '';
        this.cleanLastReply();
        const text = this.quill.getText();
        const length = text.length - 1;
        this.quill.insertText(
          length,
          reply,
          {
            bold: true,
            color: PRIMARY_COLOR,
          },
          'api'
        );
        setTimeout(() => {
          this.lastReply = reply;
        }, 20);
        this.replies = replies;
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        mem.isAborted = true;
      } else {
        this.isError = true;
        this.handleRequestError();
      }
    } finally {
      this.isLoading = false;
      this.setCursor();
    }
  }

  setCursor() {
    setTimeout(() => {
      this.quill.focus();
    }, 0);
  }

  setPlaceholder() {
    const q = this.quill;
    const text = q.getText();
    q.root.dataset.placeholder = text.length > 1 ? '' : this.placeholder;
  }

  removeWindowUnloadListener() {
    window.removeEventListener('beforeunload', this.handleBeforeUnload);
  }

  private async getModels() {
    const data = await getModelsApi();
    this.models = data;
    this.activeModel = data[0];
  }

  private initialize() {
    this.bindDebounceTransform();
    this.bindDebounceTextChange();
    this.bindDebounceHistory();
    this.createQuill();
    window.addEventListener('keydown', this.handleKeydown);
    this.isReady = true;
  }

  private addWindowUnloadListener() {
    window.addEventListener('beforeunload', this.handleBeforeUnload);
  }

  private handleRequestError() {
    Snackbar.open({
      duration: 5000,
      message: '<b>Ошибка</b></br>Нейросеть не отвечает.',
      type: 'is-danger',
      position: 'is-bottom',
      actionText: 'Повторить',
      queue: false,
      onAction: () => {
        this.transform();
      },
    });
  }

  private async request(prompt: string) {
    const controller = new AbortController();
    this.abortControllers.push(controller);

    prompt = prompt.slice(-this.promptMaxLength);
    prompt = prompt.trim();

    return generateApi({
      prompt,
      signal: controller.signal,
      model: this.activeModel,
      length: this.length,
    });
  }

  private createQuill() {
    const bindings = {
      tab: {
        key: 9,
        handler: () => {
          // Handle tab
        },
      },
    };
    this.quill = new Quill('#editorjs', {
      formats: ['bold', 'color'],
      modules: {
        keyboard: { bindings },
        history: {
          delay: Infinity,
          maxStack: 0,
          userOnly: true,
        },
      },
      placeholder: 'Придумайте начало вашей истории',
    });
    const keyboard = this.quill.getModule('keyboard');
    for (const key in keyboard.hotkeys) {
      delete keyboard.hotkeys[key];
    }
    this.setPlaceholder();
    this.quill.focus();
    this.quill.on('text-change', (delta, oldDelta, source) => {
      this.debouncedTextChange(delta, oldDelta, source);
    });
    if (this.scheme && this.scheme.length) {
      this.setScheme(this.scheme);
    }
  }

  private setCursorToEnd() {
    const length = this.quill.getLength();
    this.quill.setSelection(length - 1, 0);
  }

  private setScheme(scheme: Scheme, setCursorToEnd: boolean = false) {
    const delta = schemeToDelta(scheme);
    this.quill.setContents(delta, 'api');
    if (setCursorToEnd) {
      this.setCursorToEnd();
    } else {
      this.setCursor();
    }
  }

  private getScheme(): Scheme {
    const content = this.quill.getContents();
    return deltaToScheme(content);
  }

  private stripHtml(html: string) {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  }
}
