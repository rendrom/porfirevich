import { Vue, Component, Prop, Ref, Watch } from 'vue-property-decorator';

import { schemeToHtml } from '../../utils/schemeUtils'
import { copyStory, CopyType } from '../../utils/copyToClipboard';
import { SITE } from '../../config';
import { appModule } from '../../store/app';
import { StoryResponse } from '../../interfaces';


@Component
export default class extends Vue {

  isError = false;

  get location() {
    return SITE; // window.location.origin;
  }

  get shareUrl() {
    if (this.story) {
      return `${this.location}/${this.story.id}`;
    }
  }

  get story() {
    return appModule.story;
  }

  get isLoading() {
    return !this.story;
  }

  get html() {
    const html = this.story && schemeToHtml(JSON.parse(this.story.content));
    return html;
  }

  get output() {
    return this.story && this.story.postcard;
  }

  @Watch('story')
  onStoryChange(story: StoryResponse) {
    const path = '/' + (story ? story.id : '');
    if (this.$route.path !== path) {
      this.$router.push(path);
    }
  }

  copyToClipboard(type?: CopyType, text?: string | false) {
    text = text !== undefined ? text : this.html;
    if (text) {
      copyStory(text, type);
    }
  }
}
