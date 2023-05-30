import { Component, Vue, Prop, Watch, Ref } from 'vue-property-decorator';
import { ToastProgrammatic as Toast } from 'buefy';
import { Story } from '../../classes/Story';

import { copyStory } from '../utils/copyToClipboard';

import TransformerKlass from '../components/Transformer/Transformer';
import Transformer from '../components/Transformer/Transformer.vue';
import UserItem from '../components/UserItem/UserItem.vue';
import LikeButton from '../components/LikeButton';
import { appModule } from '../store/app';
import { Scheme } from '../interfaces';
import { schemeToHtml } from '../utils/schemeUtils';
// import { checkCorrupted } from '../utils/checkCorrupted';

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
  @Ref('Transformer') readonly transformer!: TransformerKlass;

  scheme: Scheme = [];
  isShareModalActive = false;
  isLoading = false;
  isTransformLoading = false;
  isReady = false;

  routerWatcherStop: (() => void) | null = null;

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

  onRouteChange() {
    if (this.$route.name === 'transformer' && this.$route.fullPath === '/') {
      setTimeout(() => {
        this.transformer.clean();
        this.clean();
      }, 20);
    } else {
      this._restore(this.$route.fullPath.substring(1));
    }
  }

  mounted() {
    this._mounted();
    this.startRouterWatch();
  }

  stopRouterWatch() {
    if (this.routerWatcherStop) {
      this.routerWatcherStop();
    }
    this.routerWatcherStop = null;
  }

  startRouterWatch() {
    this.routerWatcherStop = this.$watch('$route', this.onRouteChange);
  }

 

  async saveStory() {
    if (!appModule.story) {
      const isCorrupted = false;
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
          await this._pushRoute(path);
        }
        this.transformer.removeWindowUnloadListener();
      }
    } else {
      this.isShareModalActive = true;
    }
  }

  checkTransformLoading(val: boolean) {
    this.isTransformLoading = val;
  }

  async clean() {
    this.isShareModalActive = false;
    appModule.removeActiveStory();
    if (this.$route.params.id) {
      await this._pushRoute('/');
    }
  }

  copyToClipboard() {
    copyStory(schemeToHtml(this.scheme), 'text', this.story);
  }

  onTransformerReady(val: boolean) {
    this.isReady = false;
    setTimeout(
      () =>
        this.$watch('scheme', () => {
          this.clean();
        }),
      20
    );
  }

  private async _pushRoute(path: string) {
    this.stopRouterWatch();
    await this.$router.push(path);
    this.startRouterWatch();
  }

  private async _mounted() {
    if (this.id) {
      this._restore(this.id);
    }
  }

  private async _restore(id: string) {
    this.isLoading = true;
    try {
      const story = await appModule.getStory(id);
      if (story) {
        this.scheme = JSON.parse(story.content) as Scheme;
        const replies = this.scheme.filter(x => x[1] === 1).map(x => x[0]);
        appModule.appendReplies(replies);
        this.transformer.removeWindowUnloadListener();
      }
    } catch (er) {
      //
    } finally {
      this.isLoading = false;
    }
  }
}
