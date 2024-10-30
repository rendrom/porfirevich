import { defineStore } from 'pinia';

import StoryService from '../services/StoryService';
import UserService from '../services/UserService';

import type { Scheme } from '../../../shared/types/Scheme';
import type { Story } from '../../../shared/types/Story';
import type { User } from '../../../shared/types/User';
import type {
  FilterType,
  GetStoriesOptions,
  Period,
  SortType,
} from '../interfaces';

export const useAppStore = defineStore('catalog', {
  state: () => ({
    stories: [] as Story[],
    story: null as Story | null,
    user: null as User | null,
    token: null as string | null,
    liked: [] as string[],
    sort: 'random' as SortType,
    filter: 'all' as FilterType,
    period: 'month' as Period,
    query: '',
    tags: [] as string[],
  }),
  actions: {
    setSort(sort: SortType) {
      this.sort = sort;
    },
    setTags(tags: string[]) {
      this.tags = tags;
    },
    setFilter(filter: FilterType) {
      this.filter = filter;
    },
    setPeriod(period: Period) {
      this.period = period;
    },
    setQuery(query: string) {
      this.query = query;
    },
    async fetchStories(opt?: GetStoriesOptions) {
      const resp = await StoryService.all(opt);
      if (resp.data) {
        resp.data.forEach((x) => {
          if (!this.stories.find((y) => y.id === x.id)) {
            this.stories.push(x);
          }
        });
      }
      return this.stories;
    },
    setStories(stories: Story[]) {
      this.stories = stories;
    },
    appendStories(story: Story) {
      if (!this.stories.find((x) => x.id === story.id)) {
        this.stories.push(story);
      }
    },

    removeFromStories(story: Story) {
      this.stories = this.stories.filter((x) => x.id !== story.id);
    },
    updateStory(opt: { id: number | string; params: Partial<Story> }) {
      const storyIndex = this.stories.findIndex((x) => x.id === opt.id);
      if (storyIndex !== -1) {
        this.stories[storyIndex] = {
          ...this.stories[storyIndex],
          ...opt.params,
        };
      }
    },
    setUser(user: User | null) {
      this.user = user;
    },
    async setToken(token: string | null) {
      this.token = token;
      return token;
    },
    async createStory(scheme: Scheme) {
      const content = JSON.stringify(scheme);
      const story = await StoryService.create(
        { content },
        { token: this.token || '' }
      );
      this.story = story;
      return story;
    },
    async getStory(id: string) {
      const story = await StoryService.one(id);
      this.story = story;
      return story;
    },
    removeActiveStory() {
      this.story = null;
    },
    removeActiveToken() {
      this.token = null;
    },
    addLike(like: string) {
      if (!this.liked.includes(like)) {
        this.liked.push(like);
      }
    },
    setLikes(likes: string[]) {
      this.liked = likes;
    },
    async getLikes() {
      if (this.token) {
        const likes = await UserService.getLikes(this.token);
        const likesId = likes.map((x) => x.storyId).filter(Boolean);
        this.liked = likesId as string[];
      } else {
        this.liked = [];
      }
    },
    removeLike(like: string) {
      this.liked = this.liked.filter((x) => x !== like);
    },
  },
});
