import { Component, Vue } from 'vue-property-decorator';

import { catalogModule } from '../store/catalog';

@Component
export default class Catalog extends Vue {
  render(h: Vue.CreateElement): Vue.VNode {
    const items = catalogModule.items.map((x: any) => {
      return <div>{x.title}</div>;
    });

    return <div>{items}</div>;
  }
}
