import '../public/images/logo.svg';

import UrlParams from '@nextgis/url-runtime-params';
import { Component, Vue } from 'vue-property-decorator';
import UserService from './services/UserService';
import { appModule } from './store/app';
import config from '../config';

@Component
export default class App extends Vue {
  isLoading = true;
  rememberMe = true;
  get urlParams() {
    return new UrlParams();
  }

  get user() {
    return appModule.user;
  }

  get color() {
    return config.primaryColor;
  }

  async mounted() {
    let token: string | null = this.urlParams.get('token') as string;
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
        await appModule.setToken(token);
        const user = await UserService.getUser(token);
        await appModule.setUser(user);
      } catch (er) {
        this.logout();
      }
    }
    this.removeTokenFromUrl();
    this.isLoading = false;
  }

  login() {
    const next = this.$route.path !== '/' ? `?next=${this.$route.path}` : '';
    window.open('/auth/google/start' + next, '_self');
  }

  logout() {
    localStorage.setItem('token', '');
    appModule.setUser(false);
    appModule.setToken(false);
  }

  private removeTokenFromUrl() {
    this.urlParams.remove('token');
  }
}
