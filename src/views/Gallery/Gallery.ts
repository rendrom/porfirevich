import { Component, Vue, Watch } from 'vue-property-decorator';

import { Story } from '../../../classes/Story';
import { appModule } from '../../store/app';
import StoryItem from '../../components/StoryItem/StoryItem.vue';
import { GetStoriesOptions } from '../../interfaces';
import { Nav } from '../../services/Nav';

const today = new Date();

type FilterType = 'all' | 'my' | 'favorite';
type SortType = 'random' | 'new' | 'popular';

const PERIODS: Record<string, Date | null> = {
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
  isLoading = true;
  isShareModalActive = false;
  story: Story | false = false;
  sort: SortType = 'random';

  sortItems = [
    { text: 'Случайный порядок', value: 'random' },
    { text: 'Популярные', value: 'popular' },
    { text: 'Новые', value: 'new' }
  ];

  filter: FilterType = 'all';
  filterItems = [
    { text: 'все', value: 'all' },
    { text: 'только мои', value: 'my' },
    { text: 'понравившиеся', value: 'favorite' }
  ];

  period = 'month';
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
    this.onMount();
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

  private onMount() {
    const query = this.$route.query;
    const { filter, sort, period } = query;
    if (filter) {
      this.filter = filter as FilterType;
    }
    if (sort) {
      this.sort = sort as SortType;
    }
    if (period) {
      this.period = period as string;
    }

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
