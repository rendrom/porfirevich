import { Component, Vue, Prop } from 'vue-property-decorator';
import { StoryResponse } from '../interfaces';
import { appModule } from '../store/app';
import StoryService from '../services/StoryService';

@Component
export default class LikeButton extends Vue {
  @Prop({ type: Object }) story!: StoryResponse;

  isLoading = false;
  likesCount = 0;

  get alreadySet(): boolean {
    return appModule.liked.includes(this.story.id);
  }

  get disabled() {
    return !appModule.user;
  }

  mounted() {
    this.likesCount = this.story.likesCount;
  }

  render(): Vue.VNode {
    return (
      <b-tooltip type="is-dark" label={this.disabled ? 'Сначала войдите' : ''}>
        <b-button
          icon-left="thumb-up-outline"
          size="is-small"
          type={this.alreadySet && !this.disabled ? 'is-primary' : 'is-light'}
          loading={this.isLoading}
          disabled={this.disabled}
          nativeOnClick={this.onLikeBtnClick}
        >
          {this.likesCount}
        </b-button>
      </b-tooltip>
    );
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
