import { Vue, Component, Prop } from 'vue-property-decorator';
import { Story } from '../../../srv/entity/Story';
import config from '../../../config';
import StoryService from '@/services/StoryService';

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
    return false;
  }

  mounted() {
    this.likesCount = this.story.likesCount;
  }

  async like() {
    this.isLoading = true;
    try {
      const like = await StoryService.like(this.story);
      if (like) {
        this.likesCount = like.likesCount;
      }
    } catch (er) {
      console.log(er);
    } finally {
      this.isLoading = false;
    }
  }
}
