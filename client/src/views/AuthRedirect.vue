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

<script setup lang="ts">
import { onMounted, ref } from 'vue';

import { APP_TOKEN_KEY } from '@/utils/constants';

const loading = ref(true);
const error = ref('');

onMounted(() => {
  const token = new URL(window.location.href).searchParams
    .get('token')
    ?.replace(/#$/, '');

  if (token) {
    window.localStorage.setItem(APP_TOKEN_KEY, token);
    window.close();
  } else {
    error.value = 'Не удалось получить токен авторизации';
  }
  loading.value = false;
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
