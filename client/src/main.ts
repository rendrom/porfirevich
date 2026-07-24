import { createApp } from 'vue';

import { createPinia } from 'pinia';

import router from './router/index';
import App from './App.vue';
import { initializeTheme } from './composables/useTheme';

import '@mdi/font/css/materialdesignicons.css';
import 'buefy/dist/css/buefy.css';
import './style.css';

import pkg from '../package.json';

initializeTheme();

const pinia = createPinia();
const app = createApp(App);

app.use(pinia);
app.use(router);
app.mount('#app');

console.log(pkg.version);
