import { Component, Vue, Prop, Watch } from 'vue-property-decorator';
import { ToastProgrammatic as Toast } from 'buefy';
import { Story } from '../../classes/Story';

import { copyStory } from '../utils/copyToClipboard';

import Transformer from '../components/Transformer/Transformer.vue';
import UserItem from '../components/UserItem/UserItem.vue';
import LikeButton from '../components/LikeButton';
import { appModule } from '../store/app';
import { Scheme } from '../interfaces';
import { schemeToHtml } from '../utils/schemeUtils';
import { checkCorrupted } from '@/utils/checkCorrupted';

@Component({
  components: {
    Transformer,
    LikeButton,
    UserItem,
    Share: () =>
      import(/* webpackChunkName: "share" */ '../components/Share/Share.vue')
  }
})
export default class Home extends Vue {
  @Prop({ type: String, default: '' }) id!: string;
  scheme: Scheme = [];
  isShareModalActive = false;
  isLoading = false;
  isTransformLoading = false;

  get isShareDisabled() {
    return (
      !this.scheme.filter(x => x[0] !== '\n').length || this.isTransformLoading
    );
  }

  get story(): Story | false {
    return appModule.story;
  }

  get user() {
    return appModule.user;
  }

  @Watch('story')
  onStoryChange() {
    appModule.getLikes();
  }

  mounted() {
    this._mounted();
  }

  async saveStory() {
    if (!appModule.story) {
      const isCorrupted = checkCorrupted(this.scheme);
      console.log(isCorrupted);
      if (isCorrupted) {
        Toast.open({
          message:
            'Обнаружены недопустимые модификации дополнений Порфирьевича. Публикация истории отменена.',
          type: 'is-danger',
          position: 'is-bottom'
        });
      } else {
        this.isShareModalActive = true;
        const story = await appModule.createStory(this.scheme);
        const path = '/' + (story ? story.id : '');
        if (this.$route.path !== path) {
          this.$router.push(path);
        }
      }
    } else {
      this.isShareModalActive = true;
    }
  }

  checkTransformLoading(val: boolean) {
    this.isTransformLoading = val;
  }

  clean() {
    this.isShareModalActive = false;
    appModule.removeActiveStory();
    if (this.$route.params.id) {
      this.$router.push('/');
    }
  }

  copyToClipboard() {
    copyStory(schemeToHtml(this.scheme), 'text');
  }

  private async _mounted() {
    if (this.id) {
      this.isLoading = true;
      try {
        const story = await appModule.getStory(this.id);
        if (story) {
          this.scheme = JSON.parse(story.content) as Scheme;
          const replies = this.scheme.filter(x => x[1] === 1).map(x => x[0]);
          appModule.appendReplies(replies);
        }
      } catch (er) {
        //
      } finally {
        this.isLoading = false;
      }
    }

    setTimeout(() => this.$watch('scheme', () => this.clean()));
  }
}
