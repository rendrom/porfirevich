<template>
  <div>
    <div class="columns">
      <div class="column">
        <div class="block">
          <b-radio
            v-for="s in sortItems"
            :key="s.text"
            v-model="sort"
            name="sort"
            :native-value="s.value"
            :disabled="isLoading"
            >{{ s.text }}</b-radio
          >
        </div>
      </div>

      <b-select
        v-if="usePeriods"
        v-model="period"
        size="is-small"
        :disabled="isLoading"
      >
        <option v-for="p in periods" :value="p.value" :key="p.text">
          {{ p.text }}
        </option>
      </b-select>
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
          >Загрузить ещё</b-button
        >
      </div>
    </div>
    <b-modal :active.sync="isShareModalActive" :width="620">
      <Share v-if="isShareModalActive" v-model="story" />
    </b-modal>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from "vue-property-decorator";

import { Story } from "../../classes/Story";
import { appModule } from "../store/app";
import { schemeToHtml } from "../utils/schemeUtils";
import StoryItem from "../components/StoryItem/StoryItem.vue";
import UserService from "../services/UserService";
import { GetStoriesOptions } from "../interfaces";

const today = new Date();

const PERIODS: Record<string, Date | null> = {
  all: null,
  week: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000),
  month: new Date(today.getFullYear(), today.getMonth() - 1 , 1),
  "6-months": new Date(today.getFullYear(), today.getMonth() - 6, 1),
};

@Component({
  components: {
    StoryItem,
    Share: () =>
      // @ts-ignore
      import(/* webpackChunkName: "share" */ "../components/Share/Share.vue"),
  },
})
export default class Gallery extends Vue {
  isLoading = true;
  isShareModalActive = false;
  story: Story | false = false;
  sort: "random" | "new" | "popular" = "random";

  sortItems = [
    { text: "Случайный порядок", value: "random" },
    { text: "Популярные", value: "popular" },
    { text: "Новые", value: "new" },
  ];

  period = "month";
  periods = [
    { text: "всё время", value: "all" },
    {
      text: "полгода",
      value: "6-months",
    },
    { text: "месяц", value: "month" },
    { text: "неделю", value: "week" },
  ];

  hasMore = true;

  get usePeriods(): boolean {
    return this.sort !== "new";
  }

  // get hasMore() {
  //   return appModule.hasMore;
  // }

  get stories() {
    return appModule.stories;
  }

  get liked() {
    return appModule.liked;
  }

  @Watch("sort")
  @Watch("period")
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
      if (this.sort === "popular") {
        orderBy.push("likesCount");
      } else if (this.sort === "random") {
        orderBy.push("RAND()");
      }
      const opt: GetStoriesOptions = {
        limit: 20,
        offset: appModule.stories.length,
        orderBy,
      };
      if (this.period !== "all" && this.usePeriods) {
        const period = PERIODS[this.period];
        if (period) {
          opt.afterDate = period.getTime();
        }
      }
      const resp = await appModule.fetchStories(opt);
      this.hasMore = resp.length >= (opt.limit || 20);
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
