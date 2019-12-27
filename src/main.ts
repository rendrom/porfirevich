import 'core-js';
import 'regenerator-runtime/runtime';
import 'unfetch/polyfill';
import 'abortcontroller-polyfill';

import '@mdi/font/css/materialdesignicons.css';
import './style.scss';

import Vue from 'vue'
import App from './App.vue'
import router from './router/index'
import store from './store/index'

import Buefy from 'buefy';

Vue.config.productionTip = false
Vue.use(Buefy);

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
