import {
  VuexModule,
  Module,
  Mutation,
  getModule
} from 'vuex-module-decorators';
import store from '../store';

@Module({ dynamic: true, store: store, name: 'catalog' })
class Catalog extends VuexModule {
  public items: any[] = [];
}

export const catalogModule = getModule(Catalog);
