import { Component, Vue, Watch } from 'vue-property-decorator';

import { Story } from '../../../classes/Story';
import { appModule } from '../../store/app';
import StoryItem from '../../components/StoryItem/StoryItem.vue';
import {
  FilterType,
  GetStoriesOptions,
  Period,
  SortType
} from '../../interfaces';
import { Nav } from '../../services/Nav';

const today = new Date();

const PERIODS: Record<Period, Date | null> = {
  all: null,
  week: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000),
  month: new Date(today.getFullYear(), today.getMonth() - 1, 1),
  '6-months': new Date(today.getFullYear(), today.getMonth() - 6, 1)
};

@Component({
  components: {
    StoryItem,
    Share: () =>
      import(/* webpackChunkName: "share" */ '../../components/Share/Share.vue')
  }
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

  get sort(): SortType {
    return appModule.sort;
  }
  set sort(val: SortType) {
    appModule.setSort(val);
  }

  sortItems = [
    { text: 'Случайный порядок', value: 'random' },
    { text: 'Популярные', value: 'popular' },
    { text: 'Новые', value: 'new' }
  ];

  get filter(): FilterType {
    return appModule.filter;
  }
  set filter(val: FilterType) {
    appModule.setFilter(val);
  }

  filterItems = [
    { text: 'все', value: 'all' },
    { text: 'только мои', value: 'my' },
    { text: 'понравившиеся', value: 'favorite' }
  ];

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
      value: '6-months'
    },
    { text: 'месяц', value: 'month' },
    { text: 'неделю', value: 'week' }
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
  async onPopularOrderingChange(val: boolean) {
    await appModule.setStories([]);
    this.loadMore();
    Nav.gallery({
      // filter: this.filter,
      period: this.period,
      sort: this.sort
    });
  }

  mounted() {
    const query = this.$route.query;
    const { filter, sort, period } = query;
    if (filter) {
      this.filter = filter as FilterType;
    }
    if (sort) {
      this.sort = sort as SortType;
    }
    if (period) {
      this.period = period as Period;
    }

    if (appModule.token) {
      try {
        appModule.getLikes();
      } catch (er) {
        console.log(er);
      }
    }
    Nav.gallery({
      // filter: this.filter,
      period: this.period,
      sort: this.sort
    });
    if (!this.stories.length) {
      this.loadMore();
    }
  }

  async loadMore() {
    this.isLoading = true;
    try {
      const orderBy = [];
      if (this.sort === 'popular') {
        orderBy.push('likesCount');
      } else if (this.sort === 'random') {
        orderBy.push('RAND()');
      }
      const opt: GetStoriesOptions = {
        limit: 20,
        offset: appModule.stories.length,
        orderBy
      };
      if (this.period !== 'all' && this.usePeriods) {
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
}
