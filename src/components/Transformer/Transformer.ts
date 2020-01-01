import { Vue, Component, Watch, Emit, Model } from 'vue-property-decorator';
import Quill, { Sources } from 'quill';
import { SnackbarProgrammatic as Snackbar } from 'buefy';
import debounce from 'debounce';
import config from '../../../config';
import PlainClipboard from '../../utils/PlainClipboard';
import { Delta, Scheme } from '../../interfaces';
import { PRIMARY_COLOR } from '../../config';
import { schemeToDelta, deltaToScheme } from '../../utils/schemeUtils';

const ESC = 27;
const TAB = 9;
// const CTRL = 17;
const ALT = 18;

Quill.register('modules/clipboard', PlainClipboard, true);

interface TransformResp {
  replies?: string[];
  detail?: string;
}

@Component
export default class extends Vue {
  @Model('change', { type: Array, default: () => ([]) }) readonly scheme!: Scheme;
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

  get prompt () {
    return this._stripHtml(this.text)
      .replace(this.lastReply, '')
      .trimLeft();
  }

  @Watch('isAutocomplete')
  abort () {
    this.abortControllers.forEach(x => x.abort());
    this.abortControllers = [];
    this.isError = false;
  }

  @Watch('interval')
  bindDebounceTransform () {
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

  mounted () {
    this.bindDebounceTransform();
    this._createQuill();
    window.addEventListener('keyup', event => {
      this.onKeydown(event);
    });
  }

  @Emit('change')
  setContent () {
    const content = this.quill.getContents();
    this.html = this.quill.root.innerHTML;
    this.localScheme = deltaToScheme(content);
    return this.localScheme;
  }

  clean () {
    this.abort();
    this.text = '';
    this.html = '';
    this.quill.setText('', 'api');
  }

  escape () {
    if (this.isLoading) {
      this.abort();
    } else if (this.lastReply) {
      this.cleanLastReply();
    } else {
      this.clean();
    }
  }

  cleanLastReply () {
    const text = this.quill.getText();
    const index = text.indexOf(this.lastReply);
    if (index !== -1) {
      this.quill.deleteText(index, this.lastReply.length, 'api');
    }
    this.lastReply = '';
    this.replies = [];
    this.setCursor();
  }

  onTextChange (delta: Delta, oldDelta: Delta, source: Sources) {
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
  }

  onKeydown (e: KeyboardEvent) {
    if (e.keyCode === ALT) {
      // this.isAutocomplete = !this.isAutocomplete;
    } else if (e.keyCode === TAB) {
      if (this.isLoading) {
        this.abort();
      } else {
        this.transform();
      }
    } else if (e.keyCode === ESC) {
      this.escape();
    }
  }

  async transform () {
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

  setCursor () {
    const length = this.text ? this.text.length : 0;
    setTimeout(() => {
      this.quill.focus();
      this.quill.setSelection(length, length);
    }, 0);
  }

  setPlaceholder () {
    const q = this.quill;
    const text = q.getText();
    // TODO: remove always first '/n' to set init length 0
    q.root.dataset.placeholder = text.length > 1 ? '' : this.placeholder;
  }

  private _handleRequestError () {
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

  private async _request (prompt: string) {
    const controller = new AbortController();
    this.abortControllers.push(controller);

    // return new Promise((resolve, reject) => {
    //   setTimeout(reject, 1000);
    // });
    prompt = prompt.slice(-this.promptMaxLength);
    prompt = prompt.trim();

    const resp = await fetch(`${config.endpoint}/gpt2/medium/`, {
      method: 'POST',
      signal: controller.signal,
      body: JSON.stringify({
        prompt,
        length: this.length,
        num_samples: 4 // eslint-disable-line @typescript-eslint/camelcase
      })
    });
    const data: TransformResp = await resp.json();
    return data;
  }

  private _createQuill () {
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
      modules: { keyboard: { bindings } },
      placeholder: 'Придумайте начало вашей истории'
      // clipboard: {
      //   matchVisual: false
      // }
    });
    this.setPlaceholder();
    this.quill.focus();
    this.quill.on(
      'text-change',
      (delta: Delta, oldDelta: Delta, source: Sources) =>
        this.onTextChange(delta, oldDelta, source)
    );
    if (this.scheme && this.scheme.length) {
      const delta = schemeToDelta(this.scheme);
      const ops = delta.ops;
      // @ts-ignore
      this.quill.setContents(ops, 'api');
      this.setCursor();
    }
  }

  private _stripHtml (html: string) {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  }
}
