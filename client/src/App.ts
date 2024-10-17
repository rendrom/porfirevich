import UrlParams from '@nextgis/url-runtime-params';
import { Component, Vue } from 'vue-property-decorator';

import config from '@shared/config';

import UserService from './services/UserService';
import { useAppStore } from './store/app';
import { APP_TOKEN_KEY } from './utils/constants';
import openWindow from './utils/openWindow';

import '../public/images/logo.svg';

const urlParams = new UrlParams();

@Component
export default class App extends Vue {
  isLoading = true;
  rememberMe = true;

  get appModule() {
    return useAppStore();
  }

  get user() {
    return this.appModule.user;
  }

  get color() {
    return config.primaryColor;
  }

  get pageKey() {
    const route = this.$route;
    return 'page-' + route.name;
  }

  async mounted() {
    let token: string | null = urlParams.get('token') as string;
    if (token) {
      token = token.replace(/#$/, '');
      if (this.rememberMe) {
        localStorage.setItem('token', token);
      }
    } else {
      token = localStorage.getItem('token');
    }
    if (token) {
      try {
        await this.appModule.setToken(token);
        const user = await UserService.getUser(token);
        await this.appModule.setUser(user);
      } catch (er) {
        this.logout();
      }
    }
    this.removeTokenFromUrl();
    this.isLoading = false;
  }

  login() {
    // const next = this.$route.path !== '/' ? `?next=${this.$route.path}` : '';
    // window.open('/auth/google/start' + next, '_self');
    const newWindow = openWindow(
      // 'http://localhost:3000' +
      '/auth/google/start',
      'Google ID',
      540,
      540
    );
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
          this.appModule.setToken(token).then(() => {
            UserService.getUser(token).then((user) => {
              this.appModule.setUser(user);
            });
          });
        }
        cleanTempStore();
      }
    };
    if (newWindow) {
      // introduce new temporary storage for communication between browser tabs
      window.localStorage.setItem(APP_TOKEN_KEY, '');
      window.addEventListener('storage', messageReceive);
    }
  }

  logout() {
    localStorage.setItem('token', '');
    this.appModule.setUser(null);
    this.appModule.setToken(null);
  }

  private removeTokenFromUrl() {
    urlParams.remove('token');
  }
}
