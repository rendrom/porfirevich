import { Vue, Component, Watch, Model } from 'vue-property-decorator';
import { SnackbarProgrammatic as Snackbar } from 'buefy';

import { Story } from '../../../classes/Story';
import { schemeToHtml } from '../../utils/schemeUtils';
import { copyStory, CopyType } from '../../utils/copyToClipboard';
import { SITE } from '../../config';
import StoryService from '../../services/StoryService';
import { appModule } from '../..//store/app';

@Component
export default class extends Vue {
  @Model('update', {}) readonly story!: Story;

  isError = false;
  changePublicStatusLoading = false;

  get location() {
    return SITE; // window.location.origin;
  }

  get user() {
    return appModule.user;
  }

  get shareUrl() {
    if (this.story) {
      return `${this.location}/${this.story.id}`;
    }
    return null;
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

  @Watch('story.isPublic')
  async onPublicChange(isPublic: boolean, oldVal: boolean) {
    if (oldVal !== undefined && this.user && this.story.editId) {
      try {
        this.changePublicStatusLoading = true;
        const edited = await StoryService.edit(this.story.id, {
          editId: this.story.editId,
          isPublic
        });
        if (edited) {
          if (edited.isPublic) {
            appModule.appendStories(this.story);
            Snackbar.open({
              duration: 5000,
              message:
                '<b>Ваша история опубликована в галерее</b></br>Теперь любой желающий может с ней ознакомиться.',
              type: 'is-success',
              position: 'is-bottom'
            });
          } else {
            appModule.removeFromStories(this.story);
          }
        }
      } catch (er) {
        Snackbar.open({
          duration: 5000,
          message:
            '<b>Ошибка</b></br>Не удаётся поменять статус публикации вашей истории.',
          type: 'is-danger',
          position: 'is-bottom'
        });
      } finally {
        this.changePublicStatusLoading = false;
      }
    }
  }

  copyToClipboard(type?: CopyType, text?: string | false) {
    text = text !== undefined ? text : this.html;
    if (text) {
      copyStory(text, type, this.story);
    }
  }
}
