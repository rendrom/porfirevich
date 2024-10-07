import { Component, Vue, Watch } from 'vue-property-decorator';

import { useAppStore } from '@/store/app';
import StoryItem from '../../components/StoryItem/StoryItem.vue';
import { Nav } from '../../services/Nav';

import type { Story } from '@shared/types/Story';
import type {
  FilterType,
  GetStoriesOptions,
  Period,
  SortType,
} from '../../interfaces';

const appModule = useAppStore();
const today = new Date();

const PERIODS: Record<Period, Date | null> = {
  all: null,
  week: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000),
  month: new Date(today.getFullYear(), today.getMonth() - 1, 1),
  '6-months': new Date(today.getFullYear(), today.getMonth() - 6, 1),
};

@Component({
  components: {
    StoryItem,
    Share: () =>
      import(
        /* webpackChunkName: "share" */ '../../components/Share/Share.vue'
      ),
  },
})
export default class Gallery extends Vue {
  isLoading = false;
  isShareModalActive = false;
  story: Story | false = false;

  get query(): string {
    return appModule.query;
  }
  set query(val: string) {
    appModule.setQuery(val);
  }

  get tags(): string[] {
    return appModule.tags;
  }
  set tags(val: string[]) {
    appModule.setTags(val);
  }

  get sort(): SortType {
    return appModule.sort;
  }
  set sort(val: SortType) {
    appModule.setSort(val);
  }

  sortItemsForUser = [
    { text: 'Случайный порядок', value: 'random' },
    { text: 'Популярные', value: 'likesCount' },
    { text: 'Новые', value: 'new' },
  ];

  get sortItems() {
    if (this.user && this.user.isSuperuser) {
      return [
        ...this.sortItemsForUser,
        { text: 'Жалобы', value: 'violationsCount' },
      ];
    }
    return this.sortItemsForUser;
  }

  get filter(): FilterType {
    return appModule.filter;
  }
  set filter(val: FilterType) {
    appModule.setFilter(val);
  }

  filterItemsForUser = [
    { text: 'все', value: 'all' },
    { text: 'только мои', value: 'my' },
    { text: 'понравившиеся', value: 'favorite' },
  ];

  get filterItems() {
    if (this.user && this.user.isSuperuser) {
      return [
        ...this.filterItemsForUser,
        // { text: 'жалобы', value: 'violations' }
      ];
    }
    return this.filterItemsForUser;
  }

  get period(): Period {
    return appModule.period;
  }
  set period(val: Period) {
    appModule.setPeriod(val);
  }

  periods = [
    { text: 'всё время', value: 'all' },
    {
      text: 'полгода',
      value: '6-months',
    },
    { text: 'месяц', value: 'month' },
    { text: 'неделю', value: 'week' },
  ];

  hasMore = true;

  get usePeriods(): boolean {
    return this.sort !== 'new';
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

  @Watch('sort')
  @Watch('period')
  @Watch('filter')
  @Watch('tags')
  async onQueryChange() {
    await appModule.setStories([]);
    this.loadMore();
    this.setQueryParams();
  }

  async mounted() {
    const query = this.$route.query;
    const { filter, sort, period, tags } = query;
    if (filter) {
      await appModule.setFilter(filter as FilterType);
    }
    if (sort) {
      await appModule.setSort(sort as SortType);
    }
    if (period) {
      await appModule.setPeriod(period as Period);
    }
    if (tags) {
      await appModule.setTags(
        Array.isArray(tags)
          ? (tags.filter((x) => x) as string[])
          : tags.split(',')
      );
    }
    if (appModule.token) {
      try {
        appModule.getLikes();
      } catch (er) {
        console.log(er);
      }
    }
    this.setQueryParams();
    if (!this.stories.length) {
      this.loadMore();
    }
  }

  setQueryParams() {
    Nav.gallery({
      // filter: this.filter,
      period: this.period,
      sort: this.sort,
      query: this.query,
      tags: this.tags.join(','),
    });
  }

  beforeTagAdding(tag: string) {
    return tag.indexOf(',') === -1;
    // return tag.length === 20;
  }

  async loadMore() {
    if (this.isLoading) {
      return;
    }
    this.isLoading = true;
    try {
      const orderBy = [];
      if (this.sort) {
        if (this.sort === 'random') {
          orderBy.push('RAND()');
        } else if (this.sort !== 'new') {
          orderBy.push(this.sort);
        }
      }
      const opt: GetStoriesOptions = {
        limit: 20,
        offset: appModule.stories.length,
        orderBy,
      };
      if (this.period !== 'all' && this.usePeriods) {
        const period = PERIODS[this.period];
        if (period) {
          opt.afterDate = period.getTime();
        }
      }
      if (this.query) {
        opt.query = this.query;
      }
      if (this.tags) {
        opt.tags = this.tags.join(',');
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
}
