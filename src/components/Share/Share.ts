import { Vue, Component, Watch, Prop, Model } from 'vue-property-decorator';

import { Story } from '../../../srv/entity/Story';
import { schemeToHtml } from '../../utils/schemeUtils';
import { copyStory, CopyType } from '../../utils/copyToClipboard';
import { SITE } from '../../config';
import { StoryResponse } from '../../interfaces';
import StoryService from '@/services/StoryService';

@Component
export default class extends Vue {
  @Model('update', {}) readonly story!: Story;

  isError = false;

  get location () {
    return SITE; // window.location.origin;
  }

  get shareUrl () {
    if (this.story) {
      return `${this.location}/${this.story.id}`;
    }
  }

  get isLoading () {
    return !this.story;
  }

  get html () {
    const html = this.story && schemeToHtml(JSON.parse(this.story.content));
    return html;
  }

  get output () {
    return this.story && this.story.postcard;
  }

  @Watch('story.isPublic')
  async onPublicChange (isPublic: boolean) {
    if (this.story.editId) {
      await StoryService.edit(this.story.id, {
        editId: this.story.editId,
        isPublic
      });
    }
  }

  copyToClipboard (type?: CopyType, text?: string | false) {
    text = text !== undefined ? text : this.html;
    if (text) {
      copyStory(text, type);
    }
  }
}
