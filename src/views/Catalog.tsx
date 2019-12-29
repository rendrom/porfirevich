import { Component, Vue } from 'vue-property-decorator';

import { catalogModule } from '../store/catalog';

@Component
export default class Catalog extends Vue {
  render (): Vue.VNode {
    const items = catalogModule.stories.map((x: any) => {
      return <div>{x.title}</div>;
    });

    return <div>{items}</div>;
  }
}
