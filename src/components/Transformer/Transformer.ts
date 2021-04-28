import { Vue, Component, Watch, Emit, Model } from 'vue-property-decorator';
import Quill, { Sources } from 'quill';
import { SnackbarProgrammatic as Snackbar } from 'buefy';
import debounce from 'debounce';
import config from '../../../config';
import PlainClipboard from '../../utils/PlainClipboard';
import { Delta, Scheme } from '../../interfaces';
import { PRIMARY_COLOR } from '../../config';
import { schemeToDelta, deltaToScheme } from '../../utils/schemeUtils';
import { appModule } from '@/store/app';

// const ESC = 27;
// const TAB = 9;
// const CTRL = 17;
// const ALT = 18;

Quill.register('modules/clipboard', PlainClipboard, true);

interface TransformResp {
  replies?: string[];
  detail?: string;
}

@Component
export default class Transformer extends Vue {
  @Model('change', { type: Array, default: () => [] }) readonly scheme!: Scheme;
  text = '';
  html = '';
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
  promptMaxLength = 1000;
  debouncedTransform!: () => void;
  debouncedHistory!: () => void;

  historyInterval = 300;
  historyLength = 100;
  history: Scheme[] = [];

  __onKeydown!: (e: KeyboardEvent) => void;
  __windowUnload?: (e: BeforeUnloadEvent) => void;

  get prompt() {
    return this._stripHtml(this.text)
      .replace(this.lastReply, '')
      .trimLeft();
  }

  @Watch('isAutocomplete')
  abort() {
    this.abortControllers.forEach(x => x.abort());
    this.abortControllers = [];
    this.isError = false;
  }

  @Watch('interval')
  bindDebounceTransform() {
    this.debouncedTransform = debounce(
      () => this.transform(),
      this.interval * 1000
    );
  }

  @Watch('isLoading')
  @Emit()
  loading(val: boolean) {
    return val;
  }

  @Emit('change')
  setContent() {
    this.html = this.quill.root.innerHTML;
    this.localScheme = this._getScheme();
    return this.localScheme;
  }

  bindDebounceHistory() {
    this.debouncedHistory = debounce(
      () => this.updateHistory(),
      this.historyInterval
    );
  }

  mounted() {
    this.bindDebounceTransform();
    this.bindDebounceHistory();
    this._createQuill();
    this.__onKeydown = event => {
      this.onKeydown(event);
    };
    window.addEventListener('keydown', this.__onKeydown);
  }

  destroyed() {
    window.removeEventListener('keydown', this.__onKeydown);
    this.removeWindowUnloadListener();
  }

  appendHistory(scheme: Scheme) {
    const history = [...this.history];
    if (history.length > this.historyLength) {
      history.splice(0, history.length - this.historyLength, scheme);
    } else {
      history.push(scheme);
    }
    this.history = history;
  }

  historyBack() {
    this.abort();
    this.cleanLastReply();
    const history = [...this.history];
    history.pop(); // last changes
    const prev = history.pop();
    if (prev) {
      this._setScheme(prev);
    } else {
      this.clean();
    }
    this.history = history;
  }

  updateHistory() {
    const scheme = this._getScheme();
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

  onTextChange(delta: Delta, oldDelta: Delta, source: Sources) {
    this.setContent();
    this.text = this.quill.getText();
    this.setPlaceholder();
    this.lastReply = '';
    this.replies = [];
    this.abort();
    if (source === 'user') {
      let insert: string | undefined;
      let retain = 0;
      delta.ops.forEach(x => {
        if (x.insert) {
          insert = x.insert;
        } else if (x.retain) {
          retain = x.retain;
        }
        x.attributes = [];
      });
      if (insert) {
        this.quill.removeFormat(retain, insert.length);
        this.quill.formatText(
          retain,
          insert.length,
          {
            bold: false,
            color: '#000'
          },
          'api'
        );
      }
      if (this.isAutocomplete) {
        this.debouncedTransform();
      }
    }
    this.debouncedHistory();
    if (this.text.trim().length) {
      this._addWindowUnloadListener();
    } else {
      this.removeWindowUnloadListener();
    }
  }

  onKeydown(e: KeyboardEvent) {
    if (e.key === 'Alt') {
      // this.isAutocomplete = !this.isAutocomplete;
    } else if (e.key === 'Tab') {
      if (this.isLoading) {
        this.abort();
      } else {
        this.transform();
      }
    } else if (e.key === 'Escape') {
      // this.escape();
    } else if (e.code === 'KeyZ') {
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
        const data = await this._request(prompt);
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
            color: PRIMARY_COLOR
          },
          'api'
        );
        this.lastReply = reply;
        this.replies = replies;
      }
    } catch (err) {
      if (err && err.name === 'AbortError') {
        // aborted
        mem.isAborted = true;
      } else {
        this.isError = true;
        this._handleRequestError();
      }
    } finally {
      this.isLoading = false;
      this.setCursor();
    }
  }

  setCursor() {
    const length = this.text ? this.text.length : 0;
    setTimeout(() => {
      this.quill.focus();
      this.quill.setSelection(length, length);
    }, 0);
  }

  setPlaceholder() {
    const q = this.quill;
    const text = q.getText();
    // TODO: remove always first '/n' to set init length 0
    q.root.dataset.placeholder = text.length > 1 ? '' : this.placeholder;
  }

  removeWindowUnloadListener() {
    if (this.__windowUnload) {
      window.removeEventListener('beforeunload', this.__windowUnload);
      this.__windowUnload = undefined;
    }
  }

  private _addWindowUnloadListener() {
    if (!this.__windowUnload) {
      this.__windowUnload = (e: BeforeUnloadEvent) => {
        e.preventDefault();
        e.returnValue =
          'Вы действительно хотите покинуть страницу? История будет утеряна.';
      };
      window.addEventListener('beforeunload', this.__windowUnload);
    }
  }

  private _handleRequestError() {
    Snackbar.open({
      duration: 5000,
      message: '<b>Ошибка</b></br>Нейросеть не отвечает.',
      type: 'is-danger',
      position: 'is-bottom',
      actionText: 'Повторить',
      queue: false,
      onAction: () => {
        this.transform();
      }
    });
  }

  private async _request(prompt: string) {
    const controller = new AbortController();
    this.abortControllers.push(controller);

    prompt = prompt.slice(-this.promptMaxLength);
    prompt = prompt.trim();

    const resp = await fetch(`${config.endpoint}/generate/`, {
      method: 'POST',
      signal: controller.signal,
      body: JSON.stringify({
        prompt,
        length: this.length
        // num_samples: 4 // eslint-disable-line @typescript-eslint/camelcase
      })
    });
    const data: TransformResp = await resp.json();
    return data;
  }

  private _createQuill() {
    const bindings = {
      // This will overwrite the default binding also named 'tab'
      tab: {
        key: 9,
        handler: () => {
          // Handle tab
        }
      }
    };
    this.quill = new Quill('#editorjs', {
      formats: ['bold', 'color'],
      modules: {
        keyboard: { bindings },
        history: {
          delay: Infinity,
          maxStack: 0,
          userOnly: true
        }
      },
      placeholder: 'Придумайте начало вашей истории'
      // clipboard: {
      //   matchVisual: false
      // }
    });
    const keyboard = this.quill.getModule('keyboard');
    for (const key in keyboard.hotkeys) {
      delete keyboard.hotkeys[key];
    }
    this.setPlaceholder();
    this.quill.focus();
    this.quill.on(
      'text-change',
      (delta: Delta, oldDelta: Delta, source: Sources) =>
        this.onTextChange(delta, oldDelta, source)
    );
    if (this.scheme && this.scheme.length) {
      this._setScheme(this.scheme);
    }
  }

  private _setScheme(scheme: Scheme) {
    const delta = schemeToDelta(scheme);
    const ops = delta.ops;
    // @ts-ignore
    this.quill.setContents(ops, 'api');
    this.setCursor();
  }

  private _getScheme(): Scheme {
    const content = this.quill.getContents();
    return deltaToScheme(content);
  }

  private _stripHtml(html: string) {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  }
}
