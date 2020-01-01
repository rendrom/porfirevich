import { Component, Vue } from 'vue-property-decorator';

import { appModule } from '../store/app';

@Component
export default class Catalog extends Vue {
  render (): Vue.VNode {
    const items = appModule.stories.map((x: any) => {
      return <div>{x.title}</div>;
    });

    return <div>{items}</div>;
  }
}
