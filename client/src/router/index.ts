import Vue from 'vue';
import Router from 'vue-router';
import Main from '@/layouts/Main.vue';

Vue.use(Router);

export default new Router({
  mode: 'history',
  base: '/',
  routes: [
    {
      path: '/auth-redirect',
      component: () => import('../views/AuthRedirect.vue'),
    },
    {
      path: '/',
      component: Main,
      children: [
        {
          path: '/about',
          component: () => import('../views/About'),
        },
        {
          path: '/gallery',
          name: 'gallery',
          component: () => import('../views/Gallery/Gallery.vue'),
        },
        {
          path: '/login',
          name: 'login',
          component: () => import('../views/Login'),
        },
        {
          path: '/:id?',
          name: 'transformer',
          props: true,
          component: () => import('../views/Home.vue'),
        },
      ],
    },
  ],
});
