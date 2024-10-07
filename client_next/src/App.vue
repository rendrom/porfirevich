<template>
  <q-layout container style="height: 400px" class="" the>
    <q-header >
      <q-toolbar>
        <q-avatar>
          <img src="images/logo-icon.svg" class="neuro-logo" />
        </q-avatar>

        <q-toolbar-title> Порфирьевич </q-toolbar-title>

        <q-btn flat round dense icon="whatshot" />
      </q-toolbar>
    </q-header>

    <q-page-container>
      <q-page padding>
        <router-view v-slot="{ Component }" :key="pageKey">
          <component :is="Component" /> </router-view
      ></q-page>
    </q-page-container>

    <q-footer class="footer"> Порфирьевич </q-footer>
  </q-layout>
</template>

<script lang="ts" setup>
import UrlParams from '@nextgis/url-runtime-params';
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

import { QPage, QFooter, QHeader, QToolbar, QBtn } from 'quasar';

import UserService from './services/UserService';
import { useAppStore } from './stores/app';
import { APP_TOKEN_KEY } from './utils/constants';
import openWindow from './utils/openWindow';

const urlParams = new UrlParams();
const appModule = useAppStore();
const route = useRoute();
const isLoading = ref(true);
const rememberMe = ref(true);

const user = computed(() => appModule.user);
// const color = computed(() => appModule.color);
const pageKey = computed(() => `page-${String(route.name)}`);

const removeTokenFromUrl = () => {
  urlParams.remove('token');
};

const login = () => {
  const newWindow = openWindow('/auth/google/start', 'NextGIS ID', 540, 540);
  const cleanTempStore = () => {
    window.localStorage.removeItem(APP_TOKEN_KEY);
    window.removeEventListener('storage', messageReceive);
    if (newWindow) {
      newWindow.close();
    }
  };
  const messageReceive = (ev: StorageEvent) => {
    if (ev.key === APP_TOKEN_KEY) {
      const token = ev.newValue;
      if (token) {
        appModule.setToken(token);
        UserService.getUser(token).then((user) => {
          appModule.setUser(user);
        });
      }
      cleanTempStore();
    }
  };
  if (newWindow) {
    window.localStorage.setItem(APP_TOKEN_KEY, '');
    window.addEventListener('storage', messageReceive);
  }
};

const logout = () => {
  localStorage.setItem('token', '');
  appModule.setUser(null);
  appModule.setToken(null);
};

onMounted(async () => {
  let token: string | null = urlParams.get('token') as string;
  if (token) {
    token = token.replace(/#$/, '');
    if (rememberMe.value) {
      localStorage.setItem('token', token);
    }
  } else {
    token = localStorage.getItem('token');
  }
  if (token) {
    try {
      await appModule.setToken(token);
      const user = await UserService.getUser(token);
      await appModule.setUser(user);
    } catch {
      logout();
    }
  }
  removeTokenFromUrl();
  isLoading.value = false;
});
</script>

<style scoped>
.neuro-logo {
  max-height: 2.3rem;
}
</style>
