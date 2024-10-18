import { defineComponent } from 'vue';

export default defineComponent({
  name: 'Login',
  setup() {
    return () => (
      <a href="/auth/google/start">Нажмите, чтобы войти с помощью Google</a>
    );
  },
});
