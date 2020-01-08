import { Vue, Component, Prop } from 'vue-property-decorator';
import { Story } from '../../../srv/entity/Story';
import config from '../../../config';
import StoryService from '@/services/StoryService';
import { appModule } from '@/store/app';

@Component
export default class extends Vue {
  @Prop({ type: Object }) readonly story!: Story;

  isLoading = false;

  likesCount = 0;

  get content() {
    return JSON.parse(this.story.content);
  }

  get color() {
    return config.primaryColor;
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

  async onLikeBtnClick() {
    if (this.alreadySet) {
      this.dislike();
    } else {
      this.like();
    }
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
}
