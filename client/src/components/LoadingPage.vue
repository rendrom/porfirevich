<template>
  <div class="loading-component">
    <div class="content">
      <img
        :src="
          errorMessage ? '/images/favicon-danger.svg' : '/images/favicon.svg'
        "
        :alt="errorMessage ? 'Ошибка' : 'Порфирьевич'"
        class="neuro-logo"
      />
      <div class="loading-message">
        <div v-if="errorMessage" class="has-text-danger">
          {{ errorMessage }}
        </div>
        <div v-else-if="isLoading">Идёт загрузка моделей Порфирьевича</div>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, computed } from 'vue';

export default defineComponent({
  name: 'LoadingComponent',
  props: {
    loading: {
      type: Boolean,
      default: true,
    },
    error: {
      type: String,
      default: '',
    },
  },
  setup(props) {
    const isLoading = computed(() => props.loading);
    const errorMessage = computed(() => props.error);

    return {
      isLoading,
      errorMessage,
    };
  },
});
</script>

<style scoped>
.loading-component {
  display: flex;
  justify-content: center;
  align-items: center;
}

.content {
  text-align: center;
}

.neuro-logo {
  width: 100px; /* Adjust as needed */
  height: auto;
  margin-bottom: 20px;
}

.loading-message {
  font-size: 18px;
}
</style>
