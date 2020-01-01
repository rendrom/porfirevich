import {
  VuexModule,
  Module,
  getModule,
  Action,
  Mutation
} from 'vuex-module-decorators';
import store from '.';
import { Story } from '../../srv/entity/Story';
import { Scheme } from '../interfaces';
import StoryService from '../services/StoryService';

@Module({ dynamic: true, store: store, name: 'catalog' })
class AppStore extends VuexModule {
  stories: Story[] = [];
  story: Story | false = false;

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
  protected SET_STORY(story: Story | false) {
    this.story = story;
  }

}

export const appModule = getModule(AppStore);
