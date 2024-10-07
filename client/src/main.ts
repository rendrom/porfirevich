import Buefy from 'buefy';
import Vue from 'vue';

import router from './router/index';
import store from './store/index';
import App from './App.vue';



import '@mdi/font/css/materialdesignicons.css';
import './style.scss';

Vue.config.productionTip = false;
Vue.use(Buefy);

new Vue({
  router,
  store,
  render: (h) => h(App),
}).$mount('#app');
