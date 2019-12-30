// import '../../images/logo.png';
// @ts-ignore
import VueHtml2Canvas from 'vue-html2canvas';

import { Vue, Component, Prop, Ref } from 'vue-property-decorator';
import { copyStory, CopyType } from '../../utils/copyToClipboard';
import StoryService from '../../services/StoryService';
import { Scheme } from '../../interfaces';
import { Story } from '../../../srv/entity/Story';
import { SITE } from '../../config';

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
  story: Story | false = false;
  id?: string | false = false;

  get location() {
    return SITE; // window.location.origin;
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
    try {
      if (!id) {
        const content = JSON.stringify(this.scheme);
        story = await StoryService.create({ content });
      } else {
        story = await StoryService.one(id)
      }
    } catch (er) {
      console.error(er);
    }
    if (story) {
      this.story = story;
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

  copyToClipboard(type?: CopyType, text?: string) {
    console.log(text);
    text = text !== undefined ? text : this.html;
    copyStory(text, type);
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
