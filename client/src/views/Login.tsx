import { defineComponent, h } from 'vue';

export default defineComponent({
  name: 'About',
  setup() {
    return () => (
      <a href="/auth/google/start">Нажмите, чтобы войти с помощью Google</a>
    );
  },
});
