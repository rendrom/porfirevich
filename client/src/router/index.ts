import { createRouter, createWebHistory } from 'vue-router';
import Main from '@/layouts/Main.vue';

export default createRouter({
  history: createWebHistory('/'),
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
          component: () => import('../views/About.vue'),
        },
        {
          path: '/gallery',
          name: 'gallery',
          component: () => import('../views/Gallery/Gallery.vue'),
        },
        {
          path: '/login',
          name: 'login',
          component: () => import('../views/Login.vue'),
        },
        {
          path: '/admin/users',
          name: 'admin-users',
          component: () => import('../views/AdminUsers.vue'),
        },
        {
          path: '',
          name: 'transformer',
          props: true,
          component: () => import('../views/Home.vue'),
        },
        {
          path: ':id',
          name: 'transformer-story',
          props: true,
          component: () => import('../views/Home.vue'),
        },
      ],
    },
  ],
});
