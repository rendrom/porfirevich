import { defineComponent, ref, computed, watch, onMounted } from 'vue';
import { useRoute } from 'vue-router/composables';
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

const today = new Date();

const PERIODS: Record<Period, Date | null> = {
  all: null,
  week: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000),
  month: new Date(today.getFullYear(), today.getMonth() - 1, 1),
  '6-months': new Date(today.getFullYear(), today.getMonth() - 6, 1),
};

export default defineComponent({
  name: 'Gallery',
  components: {
    StoryItem,
    Share: () =>
      import(
        /* webpackChunkName: "share" */ '../../components/Share/Share.vue'
      ),
  },
  setup() {
    const route = useRoute();
    const appModule = useAppStore();
    const isLoading = ref(false);
    const isShareModalActive = ref(false);
    const story = ref<Story | false>(false);

    const query = computed({
      get: () => appModule.query,
      set: (val: string) => appModule.setQuery(val),
    });

    const tags = computed({
      get: () => appModule.tags,
      set: (val: string[]) => appModule.setTags(val),
    });

    const sort = computed({
      get: () => appModule.sort,
      set: (val: SortType) => appModule.setSort(val),
    });

    const sortItemsForUser = [
      { text: 'Случайный порядок', value: 'random' },
      { text: 'Популярные', value: 'likesCount' },
      { text: 'Новые', value: 'new' },
    ];

    const sortItems = computed(() =>
      appModule.user && appModule.user.isSuperuser
        ? [...sortItemsForUser, { text: 'Жалобы', value: 'violationsCount' }]
        : sortItemsForUser
    );

    const filter = computed({
      get: () => appModule.filter,
      set: (val: FilterType) => appModule.setFilter(val),
    });

    const filterItemsForUser = [
      { text: 'все', value: 'all' },
      { text: 'только мои', value: 'my' },
      { text: 'понравившиеся', value: 'favorite' },
    ];

    const filterItems = computed(() =>
      appModule.user && appModule.user.isSuperuser
        ? filterItemsForUser
        : filterItemsForUser
    );

    const period = computed({
      get: () => appModule.period,
      set: (val: Period) => appModule.setPeriod(val),
    });

    const periods = [
      { text: 'всё время', value: 'all' },
      { text: 'полгода', value: '6-months' },
      { text: 'месяц', value: 'month' },
      { text: 'неделю', value: 'week' },
    ];

    const hasMore = ref(true);

    const usePeriods = computed(() => sort.value !== 'new');
    const user = computed(() => appModule.user);
    const stories = computed(() => appModule.stories);
    const liked = computed(() => appModule.liked);

    const setQueryParams = () => {
      Nav.gallery({
        period: period.value,
        sort: sort.value,
        query: query.value,
        tags: tags.value.join(','),
      });
    };

    const loadMore = async () => {
      if (isLoading.value) return;

      isLoading.value = true;
      try {
        const orderBy = [];
        if (sort.value) {
          if (sort.value === 'random') {
            orderBy.push('RAND()');
          } else if (sort.value !== 'new') {
            orderBy.push(sort.value);
          }
        }

        const opt: GetStoriesOptions = {
          limit: 20,
          offset: appModule.stories.length,
          orderBy,
        };

        if (period.value !== 'all' && usePeriods.value) {
          const periodDate = PERIODS[period.value];
          if (periodDate) {
            opt.afterDate = periodDate.getTime();
          }
        }

        if (query.value) {
          opt.query = query.value;
        }

        if (tags.value.length) {
          opt.tags = tags.value.join(',');
        }

        if (user.value && filter.value !== 'all') {
          opt.filter = filter.value;
        }

        const scrollPosition = document.documentElement.scrollTop;
        const resp = await appModule.fetchStories(opt);
        document.documentElement.scrollTop = scrollPosition;

        hasMore.value = resp.length >= (opt.limit || 20);
      } catch (error) {
        console.error(error);
      } finally {
        isLoading.value = false;
      }
    };

    const showStory = (storyItem: Story) => {
      isShareModalActive.value = true;
      story.value = storyItem;
    };

    const beforeTagAdding = (tag: string) => tag.indexOf(',') === -1;

    onMounted(async () => {
      const { filter, sort, period, tags } = route.query;

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
          await appModule.getLikes();
        } catch (error) {
          console.log(error);
        }
      }
      setQueryParams();
      if (!stories.value.length) {
        await loadMore();
      }
    });

    watch([sort, period, filter, tags], async () => {
      await appModule.setStories([]);
      await loadMore();
      setQueryParams();
    });

    return {
      isLoading,
      isShareModalActive,
      story,
      query,
      tags,
      sort,
      sortItems,
      filter,
      filterItems,
      period,
      periods,
      hasMore,
      usePeriods,
      user,
      stories,
      liked,
      setQueryParams,
      loadMore,
      showStory,
      beforeTagAdding,
    };
  },
});
