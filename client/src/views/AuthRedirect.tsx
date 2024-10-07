import { defineComponent, ref, onMounted } from 'vue';
import UrlParams from '@nextgis/url-runtime-params';
import { APP_TOKEN_KEY } from "../utils/constants";

const urlParams = new UrlParams();

export default defineComponent({
  name: 'AuthCallback',
  setup() {
    const loading = ref(true);
    const error = ref('');

    onMounted(() => {
      let token: string | null = urlParams.get('token') as string;
      if (token) {
        token = token.replace(/#$/, '');
      } else {
        token = localStorage.getItem('token');
      }
      if (token) {
        window.localStorage.setItem(APP_TOKEN_KEY, token);
        window.close();
      }
      loading.value = false;
    });

    return () => {
      if (loading.value) {
        return <div>Загрузка...</div>;
      } else if (error.value) {
        return <div>{error.value}</div>;
      } else {
        return <div>Авторизация выполнена успешно, перенаправление на сайт</div>;
      }
    };
  }
});
