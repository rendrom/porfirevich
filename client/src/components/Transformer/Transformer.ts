import { defineComponent, onMounted, onUnmounted } from 'vue';
import { useTransformerStore } from '@/store/transformerStore';
import { SnackbarProgrammatic as Snackbar } from 'buefy';

export default defineComponent({
  name: 'Transformer',
  setup() {
    const store = useTransformerStore();

    const handleRequestError = () => {
      Snackbar.open({
        duration: 5000,
        message: '<b>Ошибка</b></br>Нейросеть не отвечает.',
        type: 'is-danger',
        position: 'is-bottom',
        actionText: 'Повторить',
        queue: false,
        onAction: () => {
          store.transform();
        },
      });
    };

    const onKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        if (store.isLoading) {
          store.abort();
        } else {
          store.transform();
        }
      } else if (e.key === 'Escape') {
        store.easyEscape();
      } else if ((e.metaKey || e.ctrlKey) && e.code === 'KeyZ') {
        store.historyBack();
      }
    };

    onMounted(() => {
      store.getModels().finally(() => {
        store.initialize();
        store.createEditor('#editorjs');
        window.addEventListener('keydown', onKeydown);
      });
    });

    onUnmounted(() => {
      window.removeEventListener('keydown', onKeydown);
      store.removeWindowUnloadListener();
    });

    store.$patch({ handleRequestError });

    return {
      store,
    };
  },
});
