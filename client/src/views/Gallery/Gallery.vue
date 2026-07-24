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
        <div v-if="usePeriods || user" class="field-label is-small mr-1">
          <label class="label">Показать</label>
        </div>
        <div class="field mr-1">
          <b-select
            v-if="user"
            v-model="filter"
            size="is-small"
            :disabled="isLoading"
          >
            <option v-for="f in filterItems" :key="f.text" :value="f.value">
              {{ f.text }}
            </option>
          </b-select>
        </div>
        <div v-if="usePeriods" class="field-label is-small mr-1">
          <label class="label">за:</label>
        </div>
        <div v-if="usePeriods" class="field-body">
          <div class="field">
            <b-select v-model="period" size="is-small" :disabled="isLoading">
              <option v-for="p in periods" :key="p.text" :value="p.value">
                {{ p.text }}
              </option>
            </b-select>
          </div>
        </div>
        <div class="field-label is-small mr-1">
          <label class="label">содержит</label>
        </div>
        <div class="field-body">
          <div class="field">
            <b-taginput
              v-model="tags"
              maxlength="20"
              :maxtags="5"
              size="is-small"
              :disabled="isLoading"
              :has-counter="false"
              :before-adding="beforeTagAdding"
            />
          </div>
        </div>
      </div>
    </div>
    <div v-for="i in stories" :key="i.id" class="columns">
      <div class="column">
        <story-item :story="i" @show="showStory" />
      </div>
    </div>
    <div class="columns">
      <div class="column has-text-centered">
        <b-button
          :loading="isLoading"
          :disabled="!hasMore"
          @click="loadMore"
          >Загрузить ещё</b-button
        >
      </div>
    </div>
    <b-modal v-model:active="isShareModalActive" :width="620">
      <Share v-if="isShareModalActive && story" :story="story" />
    </b-modal>
  </div>
</template>

<script setup lang="ts">
import { BButton, BModal, BRadio, BSelect, BTaginput } from 'buefy';
import { computed, defineAsyncComponent, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import type { Story } from '@shared/types/Story';

import StoryItem from '@/components/StoryItem/StoryItem.vue';
import type {
  FilterType,
  GetStoriesOptions,
  Period,
  SortType,
} from '@/interfaces';
import { Nav } from '@/services/Nav';
import { useAppStore } from '@/store/app';

const Share = defineAsyncComponent(() => import('@/components/Share/Share.vue'));
const route = useRoute();
const appStore = useAppStore();

const today = new Date();
const PERIODS: Record<Period, Date | null> = {
  all: null,
  week: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000),
  month: new Date(today.getFullYear(), today.getMonth() - 1, 1),
  '6-months': new Date(today.getFullYear(), today.getMonth() - 6, 1),
};

const isLoading = ref(false);
const isShareModalActive = ref(false);
const story = ref<Story | false>(false);
const hasMore = ref(true);

const query = computed({
  get: () => appStore.query,
  set: (value: string) => appStore.setQuery(value),
});
const tags = computed({
  get: () => appStore.tags,
  set: (value: string[]) => appStore.setTags(value),
});
const sort = computed({
  get: () => appStore.sort,
  set: (value: SortType) => appStore.setSort(value),
});
const filter = computed({
  get: () => appStore.filter,
  set: (value: FilterType) => appStore.setFilter(value),
});
const period = computed({
  get: () => appStore.period,
  set: (value: Period) => appStore.setPeriod(value),
});

const baseSortItems = [
  { text: 'Случайный порядок', value: 'random' },
  { text: 'Популярные', value: 'likesCount' },
  { text: 'Новые', value: 'new' },
];
const sortItems = computed(() =>
  appStore.user?.isSuperuser
    ? [...baseSortItems, { text: 'Жалобы', value: 'violationsCount' }]
    : baseSortItems,
);
const filterItems = [
  { text: 'все', value: 'all' },
  { text: 'только мои', value: 'my' },
  { text: 'понравившиеся', value: 'favorite' },
];
const periods = [
  { text: 'всё время', value: 'all' },
  { text: 'полгода', value: '6-months' },
  { text: 'месяц', value: 'month' },
  { text: 'неделю', value: 'week' },
];

const usePeriods = computed(() => sort.value !== 'new');
const user = computed(() => appStore.user);
const stories = computed(() => appStore.stories);

function setQueryParams() {
  Nav.gallery({
    period: period.value,
    sort: sort.value,
    query: query.value,
    tags: tags.value.join(','),
  });
}

async function loadMore() {
  if (isLoading.value) return;

  isLoading.value = true;
  try {
    const orderBy: string[] = [];
    if (sort.value === 'random') {
      orderBy.push('RAND()');
    } else if (sort.value && sort.value !== 'new') {
      orderBy.push(sort.value);
    }

    const options: GetStoriesOptions = {
      limit: 20,
      offset: appStore.stories.length,
      orderBy,
    };

    if (period.value !== 'all' && usePeriods.value) {
      const periodDate = PERIODS[period.value];
      if (periodDate) options.afterDate = periodDate.getTime();
    }
    if (query.value) options.query = query.value;
    if (tags.value.length) options.tags = tags.value.join(',');
    if (user.value && filter.value !== 'all') options.filter = filter.value;

    const scrollPosition = document.documentElement.scrollTop;
    const response = await appStore.fetchStories(options);
    document.documentElement.scrollTop = scrollPosition;
    hasMore.value = response.length >= (options.limit || 20);
  } catch (error) {
    console.error(error);
  } finally {
    isLoading.value = false;
  }
}

function showStory(storyItem: Story) {
  isShareModalActive.value = true;
  story.value = storyItem;
}

function beforeTagAdding(tag: string) {
  return !tag.includes(',');
}

onMounted(async () => {
  const {
    filter: routeFilter,
    sort: routeSort,
    period: routePeriod,
    tags: routeTags,
  } = route.query;

  if (routeFilter) await appStore.setFilter(routeFilter as FilterType);
  if (routeSort) await appStore.setSort(routeSort as SortType);
  if (routePeriod) await appStore.setPeriod(routePeriod as Period);
  if (routeTags) {
    await appStore.setTags(
      Array.isArray(routeTags)
        ? (routeTags.filter(Boolean) as string[])
        : routeTags.split(','),
    );
  }
  if (appStore.token) {
    try {
      await appStore.getLikes();
    } catch (error) {
      console.error(error);
    }
  }

  setQueryParams();
  if (!stories.value.length) await loadMore();
});

watch([sort, period, filter, tags], async () => {
  await appStore.setStories([]);
  await loadMore();
  setQueryParams();
});
</script>
