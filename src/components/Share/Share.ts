// import '../../images/logo.png';
// @ts-ignore
import VueHtml2Canvas from 'vue-html2canvas';

import { Vue, Component, Prop, Ref } from 'vue-property-decorator';
import config from '../../../config';
import { copyStory, CopyType } from '../../utils/copyToClipboard';
import StoryService from '../../services/StoryService';
import { Scheme } from '../../interfaces';
import { Story } from '../../../srv/entity/Story';

Vue.use(VueHtml2Canvas);

@Component
export default class extends Vue {
  @Prop({ type: String }) html!: string;
  @Prop({ type: Array }) scheme!: Scheme;
  @Ref('HtmlToShare') readonly htmlToShare!: HTMLElement;
  @Ref('HiddenBlock') readonly hiddenBlock!: HTMLElement;

  isLoading = false;
  isError = false;
  output: string | false = false;

  id?: string | false = false;

  get location() {
    return config.site; // window.location.origin;
  }

  get shareUrl() {
    if (this.id) {
      return `${this.location}/${this.id}`;
    }
  }

  mounted() {
    this.load();
  }

  async load() {
    this.isLoading = true;
    let story: Story | undefined;
    const id = this.$route.params.id;
    if (!id) {
      const content = JSON.stringify(this.scheme);
      story = await StoryService.create({ content });
    } else {
      story = await StoryService.one(id)
    }
    if (story) {
      this._clean();
      this.id = story.id;
      this.$router.push('/' + this.id);
      if (story.postcard) {
        this.output = story.postcard;
      }
    } else {
      this.id = id;
      await this.print();
    }
    this.isLoading = false;
  }

  async print() {
    const node = this.htmlToShare;
    const options = {
      type: 'dataURL'
    };

    try {
      // @ts-ignore
      this.output = await this.$html2canvas(node, options);
    } catch (er) {
      console.error('oops, something went wrong!', er);
      this._appendErrorMessage();
    } finally {
      this._clean();
    }
  }

  copyToClipboard(type: CopyType) {
    copyStory(this.html, type);
  }

  private _clean() {
    const node = this.hiddenBlock;
    const parent = node.parentElement;
    if (parent) {
      parent.removeChild(node);
    }
  }

  private _appendErrorMessage() {
    this.isError = true;
  }
}
