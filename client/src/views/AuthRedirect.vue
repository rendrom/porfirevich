<template>
  <div class="auth-callback">
    <div class="content">
      <img src="/images/favicon.svg" alt="Порфирьевич" class="neuro-logo" />
      <div class="message">
        <div v-if="loading">Загрузка...</div>
        <div v-else-if="error">{{ error }}</div>
        <div v-else>Авторизация выполнена успешно, перенаправление на сайт</div>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, onMounted } from 'vue';
import UrlParams from '@nextgis/url-runtime-params';
import { APP_TOKEN_KEY } from '../utils/constants';

const urlParams = new UrlParams();

export default defineComponent({
  name: 'AuthCallback',
  setup() {
    const loading = ref(true);
    const error = ref('');

    onMounted(() => {
      let token = urlParams.get('token');
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

    return {
      loading,
      error,
    };
  },
});
</script>

<style scoped>
.auth-callback {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f5f5f5;
}

.content {
  text-align: center;
}

.neuro-logo {
  width: 100px; /* Adjust as needed */
  height: auto;
  margin-bottom: 20px;
}

.message {
  font-size: 18px;
  color: #333;
}
</style>
