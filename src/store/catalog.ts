import {
  VuexModule,
  Module,
  getModule
} from 'vuex-module-decorators';
import store from '../store';

@Module({ dynamic: true, store: store, name: 'catalog' })
class Catalog extends VuexModule {
  stories: any[] = [];
}

export const catalogModule = getModule(Catalog);
