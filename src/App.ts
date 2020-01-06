import '../public/images/logo.svg';

import UrlParams from '@nextgis/url-runtime-params';
import { Component, Vue } from 'vue-property-decorator';
import { User } from '../srv/entity/User';
import UserService from './services/UserService';
import { appModule } from './store/app';

@Component
export default class App extends Vue {

  get urlParams() {
    return new UrlParams();
  }

  get user() {
    return appModule.user;
  }

  mounted() {
    let token: string | null = this.urlParams.get('token') as string;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      token = localStorage.getItem('token');
    }
    if (token) {
      UserService.getUser(token).then((user: User) => {
        appModule.setUser(user);
      });
    }
    this.removeTokenFromUrl();
  }

  logout() {
    localStorage.setItem('token', '');
    appModule.setUser(false);
  }

  private removeTokenFromUrl() {
    this.urlParams.remove('token');
    // const query = { ...this.$route.query };
    // delete query.token;
    // this.$router.replace({ query });
  }
}
