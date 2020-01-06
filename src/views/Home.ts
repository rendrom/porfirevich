import { Component, Vue, Prop } from 'vue-property-decorator';
import { Story } from '../../srv/entity/Story';

import { copyStory } from '../utils/copyToClipboard';

// @ts-ignore
import Transformer from '../components/Transformer/Transformer.vue';
import { appModule } from '../store/app';
import { Scheme } from '../interfaces';
import { schemeToHtml } from '../utils/schemeUtils';

@Component({
  components: {
    Transformer,
    // @ts-ignore
    Share: () =>
      // @ts-ignore
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

  async beforeMount() {
    if (this.id) {
      this.isLoading = true;
      try {
        const story = await appModule.getStory(this.id);
        if (story) {
          this.scheme = JSON.parse(story.content) as Scheme;
        }
      } catch (er) {
        //
      } finally {
        this.isLoading = false;
      }
    }

    setTimeout(() => this.$watch('scheme', () => this.clean()));
  }

  async saveStory() {
    this.isShareModalActive = true;
    if (!appModule.story) {
      const story = await appModule.createStory(this.scheme);
      const path = '/' + (story ? story.id : '');
      if (this.$route.path !== path) {
        this.$router.push(path);
      }
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
}
