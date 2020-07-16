<template>
  <div>
    <div class="columns">
      <div class="column">
         <div class="field">
            <b-switch v-model="popularFirst">
                Сначала популярные
            </b-switch>
        </div>
      </div>
    </div>
    <div v-for="(i, j) in stories" :key="j" class="columns">
      <div class="column">
        <story-item :story="i" @show="showStory"></story-item>
      </div>
    </div>
    <div class="columns">
      <div class="column has-text-centered">
        <b-button
          type
          :loading="isLoading"
          :disabled="!hasMore"
          @click="loadMore"
        >Загрузить ещё</b-button>
      </div>
    </div>
    <b-modal :active.sync="isShareModalActive" :width="620">
      <Share v-if="isShareModalActive" v-model="story" />
    </b-modal>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from "vue-property-decorator";

import { appModule } from "../store/app";
import { schemeToHtml } from "../utils/schemeUtils";
// @ts-ignore
import StoryItem from "../components/StoryItem/StoryItem.vue";
import UserService from "../services/UserService";
import { Story } from "../../classes/Story";

@Component({
  components: {
    StoryItem,
    Share: () =>
      // @ts-ignore
      import(/* webpackChunkName: "share" */ "../components/Share/Share.vue")
  }
})
export default class Gallery extends Vue {
  isLoading = true;
  isShareModalActive = false;
  story: Story | false = false;
  popularFirst = false;

  get hasMore() {
    return appModule.hasMore;
  }

  get stories() {
    return appModule.stories;
  }

  get liked() {
    return appModule.liked;
  }

  @Watch('popularFirst')
  async onPopularOrderingChange(val: boolean) {
    await appModule.setStories([]);
    this.loadMore();
  }

  mounted() {
    this.onMount();
  }

  async loadMore() {
    this.isLoading = true;
    try {
      const orderBy = [];
      if (this.popularFirst) {
        orderBy.push('likesCount');
      }
      await appModule.getStories({
        limit: 50,
        offset: appModule.stories.length,
        orderBy
      });
    } catch (er) {
      //
    } finally {
      this.isLoading = false;
    }
  }

  showStory(story: Story) {
    this.isShareModalActive = true;
    this.story = story;
  }

  private async onMount() {
    if (appModule.token) {
      try {
        appModule.getLikes();
      } catch (er) {
        console.log(er);
      }
    }
    this.loadMore();
  }
}
</script>
<style scoped>
</style>
