import { createPinia } from 'pinia';
import type { RouteLocationNormalizedLoaded } from 'vue-router';

/*
 * When adding new properties to stores, you should also
 * extend the `PiniaCustomProperties` interface.
 * @see https://pinia.vuejs.org/core-concepts/plugins.html#typing-new-store-properties
 */
declare module 'pinia' {
  export interface PiniaCustomProperties {
    readonly router: RouteLocationNormalizedLoaded;
  }
}

const pinia = createPinia();

export default pinia;
