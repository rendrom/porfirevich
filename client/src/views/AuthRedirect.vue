<template>
  <div v-if="loading">Загрузка...</div>
  <div v-else-if="error"></div>
  <div v-else>Авторизация выполнена успешно, перенаправление на сайт</div>
</template>

<script lang="ts">
import Vue from "vue";
import UrlParams from '@nextgis/url-runtime-params';
import { APP_TOKEN_KEY } from "../utils/constants";

const urlParams = new UrlParams();

export default Vue.extend({
  data: {
    loading: true,
    error: "",
  },

  mounted() {
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
  },
});
</script>
