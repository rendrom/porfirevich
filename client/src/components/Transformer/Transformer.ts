import {
  defineComponent,
  onMounted,
  onUnmounted,
  watch,
  ref,
  PropType,
} from 'vue';
import { useTransformerStore } from '@/store/transformerStore';
import { SnackbarProgrammatic as Snackbar } from 'buefy';
import { Scheme } from '@shared/types/Scheme';

export default defineComponent({
  name: 'Transformer',
  props: {
    scheme: {
      type: Array as PropType<Scheme>,
      default: () => [],
    },
  },
  emits: ['change', 'loading', 'ready'],
  setup(props, { emit }) {
    const store = useTransformerStore();

    const isSettings = ref(false);

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
        store.createQuill('#editorjs');
        window.addEventListener('keydown', onKeydown);
        if (props.scheme && props.scheme.length) {
          store.setScheme(props.scheme);
        }
      });
    });

    onUnmounted(() => {
      window.removeEventListener('keydown', onKeydown);
      store.removeWindowUnloadListener();
    });

    watch(() => store.isAutocomplete, store.abort);
    watch(() => store.interval, store.bindDebounceTransform);
    watch(
      () => store.isLoading,
      (val) => emit('loading', val)
    );
    watch(
      () => store.isReady,
      (val) => emit('ready', val)
    );
    watch(
      () => store.localScheme,
      (val) => emit('change', val)
    );

    store.$patch({ handleRequestError });

    return {
      isSettings,
      store,
    };
  },
});
