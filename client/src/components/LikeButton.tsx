import { Component, Prop, Vue } from 'vue-property-decorator';

import StoryService from '../services/StoryService';
import { useAppStore } from '../store/app';

import type { Story } from '@shared/types/Story';

const appModule = useAppStore();

@Component
export default class LikeButton extends Vue {
  @Prop({ type: Object }) story!: Story;

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
      <b-tooltip
        type="is-dark"
        label={
          this.disabled
            ? 'Сначала войдите'
            : this.alreadySet
            ? 'Больше не нравится'
            : 'Мне нравится'
        }
      >
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
