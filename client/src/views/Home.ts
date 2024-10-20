import {
  defineComponent,
  ref,
  computed,
  onMounted,
  watch,
  getCurrentInstance,
} from 'vue';
import { ToastProgrammatic as Toast } from 'buefy';

import LikeButton from '../components/LikeButton';
import Transformer from '../components/Transformer/Transformer.vue';
import TransformerSettings from '../components/TransformerSettings/TransformerSettings.vue';
import LoadingPage from '../components/LoadingPage.vue';
import UserItem from '../components/UserItem/UserItem.vue';
import { useAppStore } from '../store/app';
import { useTransformerStore } from '@/store/transformerStore';
import { copyStory } from '../utils/copyToClipboard';
import { schemeToHtml } from '../utils/schemeUtils';

import type { Scheme } from '@shared/types/Scheme';

export default defineComponent({
  name: 'Home',
  components: {
    UserItem,
    Transformer,
    LikeButton,
    LoadingPage,
    TransformerSettings,
    Share: () =>
      import(/* webpackChunkName: "share" */ '../components/Share/Share.vue'),
  },
  props: {
    id: {
      type: String,
      default: '',
    },
  },
  setup(props) {
    const instance = getCurrentInstance();
    const appStore = useAppStore();
    const transformerStore = useTransformerStore();

    const isSettings = ref(false);
    const isShareModalActive = ref(false);
    const isLoading = ref(true);
    const error = ref('');

    const isShareDisabled = computed(() => {
      return (
        !transformerStore.localScheme.filter((x) => x[0] !== '\n').length ||
        transformerStore.isLoading
      );
    });

    const story = computed(() => appStore.story);
    const user = computed(() => appStore.user);

    watch(
      () => appStore.story,
      () => {
        appStore.getLikes();
      }
    );

    const onRouteChange = () => {
      if (
        instance?.proxy.$route.name === 'transformer' &&
        instance.proxy.$route.fullPath === '/'
      ) {
        setTimeout(() => {
          transformerStore.clean();
          clean();
        }, 20);
      } else {
        restore(instance?.proxy.$route.fullPath.substring(1) || '');
      }
    };

    const saveStory = async () => {
      if (!appStore.story) {
        const isCorrupted = false;
        if (isCorrupted) {
          Toast.open({
            message:
              'Обнаружены недопустимые модификации дополнений Порфирьевича. Публикация истории отменена.',
            type: 'is-danger',
            position: 'is-bottom',
          });
        } else {
          isShareModalActive.value = true;
          const story = await appStore.createStory(
            transformerStore.localScheme
          );
          const path = '/' + (story ? story.id : '');
          if (instance?.proxy.$route.path !== path) {
            await pushRoute(path);
          }
          transformerStore.removeWindowUnloadListener();
        }
      } else {
        isShareModalActive.value = true;
      }
    };

    const clean = async () => {
      isShareModalActive.value = false;
      appStore.removeActiveStory();
      if (instance?.proxy.$route.params.id) {
        await pushRoute('/');
      }
    };

    const copyToClipboard = () => {
      copyStory(
        schemeToHtml(transformerStore.localScheme),
        'text',
        story.value
      );
    };

    const onTransformerReady = (_val: boolean) => {
      transformerStore.setIsReady(false);
      setTimeout(() => {
        watch(
          () => transformerStore.localScheme,
          () => {
            clean();
          }
        );
      }, 20);
    };

    const pushRoute = async (path: string) => {
      await instance?.proxy.$router.push(path);
    };

    const restore = async (id: string) => {
      const restoredStory = await appStore.getStory(id);
      if (restoredStory) {
        const scheme = JSON.parse(restoredStory.content) as Scheme;
        transformerStore.setScheme(scheme);
        const replies = scheme.filter((x) => x[1] === 1).map((x) => x[0]);
        appStore.appendReplies(replies);
        transformerStore.removeWindowUnloadListener();
      }
    };

    onMounted(async () => {
      isLoading.value = true;
      try {
        await transformerStore.getModels();
        if (props.id) {
          await restore(props.id);
        }
      } catch (er) {
        error.value = 'Ошибка соединения с сервером';
      }
      isLoading.value = false;
      watch(() => instance?.proxy.$route, onRouteChange);
    });

    return {
      isShareModalActive,
      transformerStore,
      isShareDisabled,
      isSettings,
      isLoading,
      story,
      error,
      user,
      clean,
      saveStory,
      copyToClipboard,
      onTransformerReady,
    };
  },
});
