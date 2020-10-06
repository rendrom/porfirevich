import { objectDeepEqual, full } from '@nextgis/utils';

import router from '../router';

export class Nav {
  static gallery(obj: Record<string, any>) {
    const query: Record<string, string> = {};
    for (const key in obj) {
      const val = obj[key];
      if (full(val)) {
        query[key] = String(val);
      }
    }
    this.open('gallery', { query });
  }

  static open(
    name: string,
    opt: {
      params?: Record<string, string>;
      query?: Record<string, string>;
    } = {}
  ) {
    const route = router.currentRoute;
    let paramsEqual = true;
    let queryEqual = true;
    if (opt.params) {
      paramsEqual = objectDeepEqual(route.params || {}, opt.params);
    }
    if (opt.query) {
      queryEqual = objectDeepEqual(route.query || {}, opt.query);
    }
    if (router.currentRoute.name === name) {
      if (!paramsEqual || !queryEqual) {
        router.push({ name, ...opt });
      }
    } else {
      router.push({ name, ...opt });
    }
  }
}
