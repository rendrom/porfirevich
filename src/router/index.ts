import Vue from 'vue';
import Router from 'vue-router';

Vue.use(Router);

export default new Router({
  mode: 'history',
  base: process.env.BASE_URL,
  routes: [
    {
      path: '/:id?',
      props: true,
      component: () => import('../views/Home.vue')
    },
    {
      path: '/about',
      component: () => import('../views/About')
    }
  ]
});
