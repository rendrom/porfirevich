import { Vue, Component, Prop, Emit } from 'vue-property-decorator';
import { ToastProgrammatic as Toast } from 'buefy';
import { Story } from '../../../srv/entity/Story';
import config from '../../../config';
import StoryService from '@/services/StoryService';
import { appModule } from '@/store/app';

@Component
export default class extends Vue {
  @Prop({ type: Object }) readonly story!: Story;

  isLoading = false;
  violationLoading = false;
  deleteLoading = false;

  likesCount = 0;

  get content() {
    return JSON.parse(this.story.content);
  }

  get color() {
    return config.primaryColor;
  }

  get user() {
    return appModule.user;
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

  mounted() {
    this.likesCount = this.story.likesCount;
  }

  @Emit()
  show() {
    return this.story;
  }

  async onLikeBtnClick() {
    if (this.alreadySet) {
      this.dislike();
    } else {
      this.like();
    }
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

  async like() {
    this.isLoading = true;
    try {
      await StoryService.like(this.story);
      this.likesCount = this.likesCount + 1;
      appModule.addLike(this.story.id);
    } catch (er) {
      console.log(er);
    } finally {
      this.isLoading = false;
    }
  }

  async dislike() {
    this.isLoading = true;
    try {
      await StoryService.dislike(this.story);
      this.likesCount = this.likesCount - 1;
      appModule.removeLike(this.story.id);
    } catch (er) {
      console.log(er);
    } finally {
      this.isLoading = false;
    }
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
