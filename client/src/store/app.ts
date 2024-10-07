import {
  Action,
  getModule,
  Module,
  Mutation,
  MutationAction,
  VuexModule,
} from 'vuex-module-decorators';

import StoryService from '../services/StoryService';
import UserService from '../services/UserService';

import store from '.';

import type { User } from '../../classes/User';
import type {
  FilterType,
  GetStoriesOptions,
  Period,
  Scheme,
  SortType,
  StoryResponse,
} from '../interfaces';

@Module({ dynamic: true, store: store, name: 'catalog' })
class AppStore extends VuexModule {
  stories: StoryResponse[] = [];
  story: StoryResponse | false = false;
  // hasMore = false;
  user: User | false = false;
  token: string | false = false;
  liked: string[] = [];
  replies: string[] = [];

  sort: SortType = 'random';
  filter: FilterType = 'all';
  period: Period = 'month';
  query = '';
  tags: string[] = [];

  @MutationAction({ mutate: ['sort'] })
  async setSort(sort: SortType) {
    return { sort };
  }

  @MutationAction({ mutate: ['tags'] })
  async setTags(tags: string[]) {
    return { tags };
  }

  @MutationAction({ mutate: ['filter'] })
  async setFilter(filter: FilterType) {
    return { filter };
  }

  @MutationAction({ mutate: ['period'] })
  async setPeriod(period: Period) {
    return { period };
  }

  @MutationAction({ mutate: ['query'] })
  async setQuery(query: string) {
    return { query };
  }

  @Action({ commit: 'SET_STORIES' })
  async fetchStories(opt?: GetStoriesOptions) {
    const resp = await StoryService.all(opt);
    // @ts-ignore
    const stories: StoryResponse[] = [...this.stories];
    if (resp.data) {
      resp.data.forEach((x) => {
        const exist = stories.find((y) => y.id === x.id);
        if (!exist) {
          stories.push(x);
        }
      });
    }

    return stories;
  }

  @MutationAction({ mutate: ['stories'] })
  async setStories(stories: StoryResponse[]) {
    return { stories };
  }

  @Action({ commit: 'SET_STORIES' })
  async appendStories(story: StoryResponse) {
    const stories = [...this.stories];
    if (!stories.find((x) => x.id === story.id)) {
      stories.push(story);
    }
    return stories;
  }

  @Action({ commit: 'SET_REPLIES' })
  async appendReplies(replies: string[]) {
    const currentReplies = [...this.replies];
    replies.forEach((x) => currentReplies.push(x));
    return currentReplies;
  }

  @Action({ commit: 'SET_STORIES' })
  async removeFromStories(story: StoryResponse) {
    const stories = [...this.stories];
    const index = stories.findIndex((x) => x.id === story.id);
    if (index !== -1) {
      stories.splice(index, 1);
    }
    return stories;
  }

  @Action({ commit: 'SET_STORIES' })
  async updateStory(opt: {
    id: number | string;
    params: Partial<StoryResponse>;
  }) {
    const stories = [...this.stories];
    const storyIndex = stories.findIndex((x) => x.id === opt.id);
    if (storyIndex !== -1) {
      const story = stories[storyIndex];
      const newStory: StoryResponse = {
        ...story,
        ...opt.params,
      } as StoryResponse;
      stories[storyIndex] = newStory;
    }
    return stories;
  }

  @Action({ commit: 'SET_USER' })
  async setUser(user: User | false) {
    return user;
  }

  @Action({ commit: 'SET_TOKEN' })
  async setToken(token: string | false) {
    return token;
  }

  @Action({ commit: 'SET_STORY' })
  async createStory(scheme: Scheme) {
    const content = JSON.stringify(scheme);
    const story = await StoryService.create(
      { content },
      { token: this.token || '' },
    );
    return story;
  }

  @Action({ commit: 'SET_STORY' })
  async getStory(id: string) {
    const story = await StoryService.one(id);
    return story;
  }

  @Action({ commit: 'SET_STORY' })
  removeActiveStory() {
    return false;
  }

  @Action({ commit: 'SET_TOKEN' })
  removeActiveToken() {
    return false;
  }

  @Action({ commit: 'SET_LIKED' })
  addLike(like: string) {
    const liked = [...this.liked];
    if (!liked.includes(like)) {
      liked.push(like);
    }
    return liked;
  }

  @Action({ commit: 'SET_LIKED' })
  setLikes(likes: string[]) {
    return likes;
  }

  @Action({ commit: 'SET_LIKED' })
  async getLikes() {
    if (this.token) {
      const likes = await UserService.getLikes(this.token);
      const likedStories = likes.map((x) => x.storyId) as string[];
      return likedStories;
    }
    return [];
  }

  @Action({ commit: 'SET_LIKED' })
  removeLike(like: string) {
    const liked = [...this.liked];
    const index = liked.indexOf(like);
    if (index !== -1) {
      liked.splice(index, 1);
    }
    return liked;
  }

  @Mutation
  protected SET_STORY(story: StoryResponse | false) {
    this.story = story;
  }

  @Mutation
  protected SET_REPLIES(replies: string[]) {
    this.replies = replies;
  }

  @Mutation
  protected SET_STORIES(stories: StoryResponse[]) {
    this.stories = stories;
  }

  @Mutation
  protected SET_USER(user: User | false) {
    this.user = user;
  }

  @Mutation
  protected SET_TOKEN(token: string | false) {
    this.token = token;
  }

  @Mutation
  protected SET_LIKED(liked: string[]) {
    this.liked = liked;
  }
}

export const appModule = getModule(AppStore);
