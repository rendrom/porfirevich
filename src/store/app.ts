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

  @Action({ commit: 'SET_STORY' })
  async createStory(scheme: Scheme) {
    const content = JSON.stringify(scheme);
    const story = await StoryService.create({ content });
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

  @Mutation
  protected SET_STORY(story: StoryResponse | false) {
    this.story = story;
  }

  @Mutation
  protected SET_USER(user: User | false) {
    this.user = user;
  }
}

export const appModule = getModule(AppStore);
