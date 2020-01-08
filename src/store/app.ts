import {
  VuexModule,
  Module,
  getModule,
  Action,
  MutationAction,
  Mutation
} from 'vuex-module-decorators';
import store from '.';
import { StoryResponse, Scheme, GetStoriesOptions } from '../interfaces';

import StoryService from '../services/StoryService';
import { User } from '../../srv/entity/User';

@Module({ dynamic: true, store: store, name: 'catalog' })
class AppStore extends VuexModule {
  stories: StoryResponse[] = [];
  story: StoryResponse | false = false;
  hasMore = false;
  user: User | false = false;
  token: string | false = false;
  liked: string[] = [];

  @MutationAction({ mutate: ['stories', 'hasMore'] })
  async getStories(opt?: GetStoriesOptions) {
    const resp = await StoryService.all(opt);
    // @ts-ignore
    let stories: StoryResponse[] = (this.state && this.state.stories) || [];
    if (stories) {
      stories = [...stories];
      if (resp.data) {
        stories = stories.concat(resp.data);
      }
    }

    return { stories, hasMore: resp.hasMore };
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
      { token: this.token || '' }
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
