import Vue from 'vue';

import { createPinia, PiniaVuePlugin } from 'pinia';
import Buefy from 'buefy';

import router from './router/index';
import App from './App.vue';

import '@mdi/font/css/materialdesignicons.css';
import './style.scss';

import pkg from '../package.json';

Vue.config.productionTip = false;

Vue.use(PiniaVuePlugin);

const pinia = createPinia();

Vue.use(Buefy);

new Vue({
  router,
  pinia,
  render: (h) => h(App),
}).$mount('#app');

console.log(pkg.version);
