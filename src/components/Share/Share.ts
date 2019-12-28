import '../../images/logo.png';
// @ts-ignore
import VueHtml2Canvas from 'vue-html2canvas';

import { Vue, Component, Prop, Ref } from 'vue-property-decorator';
import config from '../../../config';
import { copyStory, CopyType } from '../../utils/copyToClipboard';

Vue.use(VueHtml2Canvas);

@Component
export default class extends Vue {
  @Prop({ type: String }) content!: string;
  @Ref('HtmlToShare') readonly htmlToShare!: HTMLElement;
  @Ref('HiddenBlock') readonly hiddenBlock!: HTMLElement;

  isLoading = false;
  isError = false;
  output: string | false = false;

  get location () {
    return config.site; // window.location.origin;
  }

  mounted () {
    this.print();
  }

  async print () {
    const node = this.htmlToShare;
    const options = {
      type: 'dataURL'
    };
    this.isLoading = true;
    try {
      // @ts-ignore
      this.output = await this.$html2canvas(node, options);
    } catch (er) {
      console.error('oops, something went wrong!', er);
      this._appendErrorMessage();
    } finally {
      this.isLoading = false;
      this._clean();
    }
  }

  copyToClipboard (type: CopyType) {
    copyStory(this.content, type);
  }

  private _clean () {
    const node = this.hiddenBlock;
    const parent = node.parentElement;
    if (parent) {
      parent.removeChild(node);
    }
  }

  private _appendErrorMessage () {
    this.isError = true;
  }
}
