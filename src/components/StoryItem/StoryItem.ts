import { Vue, Component, Prop, Emit } from 'vue-property-decorator';
import { ToastProgrammatic as Toast } from 'buefy';
import { Story } from '../../../classes/Story';
import config from '../../../config';
import LikeButton from '../LikeButton';
import StoryService from '../../services/StoryService';
import { appModule } from '../../store/app';

@Component({ components: { LikeButton } })
export default class extends Vue {
  @Prop({ type: Object }) readonly story!: Story;

  violationLoading = false;
  deleteLoading = false;
  publishLoading = false;

  get content() {
    const c = JSON.parse(this.story.content) as [string, number][];
    let html = '';
    c.forEach(x => {
      const text = x[0];
      const lineBreaks = text.match(/\n/g) || [];
      if (x[1]) {
        html += `<strong style="color:${this.color}">${text}</strong>`;
      } else {
        html += `<span>${text}</span>`;
      }
      lineBreaks.forEach(() => {
        html += '<br>';
      });
    });
    return html;
  }

  get color() {
    return config.primaryColor;
  }

  get user() {
    return appModule.user;
  }

  get userCanEdit() {
    return this.isSuperuser || this.isOwner;
  }

  get isOwner() {
    return this.user && this.user.id === this.story.user?.id;
  }

  get isSuperuser() {
    return this.user && this.user.isSuperuser;
  }

  get alreadySet(): boolean {
    return appModule.liked.includes(this.story.id);
  }

  get disabled() {
    return !appModule.user;
  }

  @Emit()
  show() {
    return this.story;
  }

  go() {
    this.$router.push('/' + this.story.id);
  }

  async remove() {
    this.deleteLoading = true;
    try {
      const deleted = await StoryService.edit(this.story.id, {
        isDeleted: !this.story.isDeleted
      });
      if (deleted) {
        appModule.updateStory({
          id: this.story.id,
          params: { isDeleted: deleted.isDeleted }
        });
      }
    } catch {
      //
    }
    this.deleteLoading = false;
  }

  async publish() {
    this.publishLoading = true;
    try {
      const resp = await StoryService.edit(this.story.id, {
        isPublic: !this.story.isPublic
      });
      if (resp) {
        appModule.updateStory({
          id: this.story.id,
          params: { isPublic: resp.isPublic }
        });
      }
    } catch {
      //
    }
    this.publishLoading = false;
  }

  async violation() {
    this.violationLoading = true;
    try {
      await StoryService.violation(this.story);
      Toast.open({
        message: 'Спасибо, сообщение о нарушение отправлено на рассмотрение',
        type: 'is-success',
        position: 'is-bottom',
        duration: 6000
      });
    } catch (er) {
      console.log(er);
    } finally {
      this.violationLoading = false;
    }
  }
}
