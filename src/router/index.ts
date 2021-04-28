import Vue from 'vue';
import Router from 'vue-router';

Vue.use(Router);

export default new Router({
  mode: 'history',
  base: process.env.BASE_URL,
  routes: [
    {
      path: '/about',
      component: () => import('../views/About')
    },
    {
      path: '/gallery',
      name: 'gallery',
      component: () => import('../views/Gallery/Gallery.vue')
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/Login')
    },
    {
      path: '/auth-redirect',
      component: () => import('../views/AuthRedirect.vue')
    },
    {
      path: '/:id?',
      name: 'transformer',
      props: true,
      component: () => import('../views/Home.vue')
    }
  ]
});
