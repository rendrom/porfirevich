import '../public/images/logo.svg';

import UrlParams from '@nextgis/url-runtime-params';
import { Component, Vue } from 'vue-property-decorator';
import UserService from './services/UserService';
import { appModule } from './store/app';

@Component
export default class App extends Vue {
  isLoading = true;
  get urlParams() {
    return new UrlParams();
  }

  get user() {
    return appModule.user;
  }

  async mounted() {
    let token: string | null = this.urlParams.get('token') as string;
    if (token) {
      token = token.replace(/#$/, '');
      localStorage.setItem('token', token);
    } else {
      token = localStorage.getItem('token');
    }
    if (token) {
      try {
        appModule.setToken(token);
        const user = await UserService.getUser(token);
        appModule.setUser(user);
      } catch (er) {
        this.logout();
      }
    }
    this.removeTokenFromUrl();
    this.isLoading = false;
  }

  logout() {
    localStorage.setItem('token', '');
    appModule.setUser(false);
    appModule.setToken(false);
  }

  private removeTokenFromUrl() {
    this.urlParams.remove('token');
    // const query = this.urlParams.params();
    // if (Object.keys(query).length < 1) {
    //   this.$router.push(this.$route.path);
    // }
    // const query = { ...this.$route.query };
    // delete query.token;
    // this.$router.replace({ query });
  }
}
