<template>
  <div>
    <div class="columns is-mobile">
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
      <div class="field is-horizontal">
        <div class="field-label is-small mr-1" v-if="usePeriods || user">
          <label class="label">Показать</label>
        </div>
        <div class="field mr-1">
          <b-select
            v-if="user"
            v-model="filter"
            size="is-small"
            :disabled="isLoading"
          >
            <option v-for="f in filterItems" :value="f.value" :key="f.text">
              {{ f.text }}
            </option>
          </b-select>
        </div>
        <div class="field-label is-small mr-1" v-if="usePeriods">
          <label class="label">за:</label>
        </div>
        <div class="field-body">
          <div class="field">
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
        </div>
      </div>
    </div>
    <div v-for="i in stories" :key="i.id" class="columns">
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
  month: new Date(today.getFullYear(), today.getMonth() - 1, 1),
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

  filter: "all" | "my" | "favorite" = "all";
  filterItems = [
    { text: "все", value: "all" },
    { text: "только мои", value: "my" },
    { text: "понравившиеся", value: "favorite" },
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

  get user() {
    return appModule.user;
  }

  get stories() {
    return appModule.stories;
  }

  get liked() {
    return appModule.liked;
  }

  @Watch("sort")
  @Watch("period")
  @Watch("filter")
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
      if (this.user && this.filter !== 'all') {
        opt.filter = this.filter;
      }
      // Hard fix to disable scroll bottom on add new items
      const scrollPosition = document.documentElement.scrollTop;
      const resp = await appModule.fetchStories(opt);
      document.documentElement.scrollTop = scrollPosition;
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
