import { defineComponent, ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router/composables';
import UrlParams from '@nextgis/url-runtime-params';
import config from '@shared/config';
import UserService from '../services/UserService';
import { useAppStore } from '../store/app';
import { APP_TOKEN_KEY } from '../utils/constants';
import openWindow from '../utils/openWindow';

import '../../public/images/logo.svg';

const urlParams = new UrlParams();

export default defineComponent({
  name: 'App',
  setup() {
    const router = useRouter();
    const route = useRoute();
    const appStore = useAppStore();

    const isLoading = ref(true);
    const rememberMe = ref(true);

    const user = computed(() => appStore.user);
    const color = computed(() => config.primaryColor);
    const pageKey = computed(() => 'page-' + route.name);

    const removeTokenFromUrl = () => {
      urlParams.remove('token');
    };

    const login = () => {
      const newWindow = openWindow('/auth/google/start', 'Google ID', 540, 540);

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
            appStore.setToken(token).then(() => {
              UserService.getUser(token).then((user) => {
                appStore.setUser(user);
              });
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
      appStore.setUser(null);
      appStore.setToken(null);
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
          await appStore.setToken(token);
          const user = await UserService.getUser(token);
          await appStore.setUser(user);
        } catch (er) {
          logout();
        }
      }
      removeTokenFromUrl();
      isLoading.value = false;
    });

    return {
      isLoading,
      rememberMe,
      user,
      color,
      pageKey,
      login,
      logout,
    };
  },
});
