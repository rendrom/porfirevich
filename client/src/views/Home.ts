import {
  defineComponent,
  ref,
  computed,
  onMounted,
  watch,
  getCurrentInstance,
} from 'vue';

import LikeButton from '../components/LikeButton';
import Transformer from '../components/Transformer/Transformer.vue';
import TransformerSettings from '../components/TransformerSettings/TransformerSettings.vue';
import LoadingPage from '../components/LoadingPage.vue';
import UserItem from '../components/UserItem/UserItem.vue';
import { useAppStore } from '../store/app';
import { useTransformerStore } from '@/store/transformerStore';
import { copyStory } from '../utils/copyToClipboard';

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
    const transformer = useTransformerStore();

    const isSettings = ref(false);
    const isShareModalActive = ref(false);
    const isLoading = ref(true);
    const error = ref('');

    const isShareDisabled = computed(() => {
      return (
        !transformer.text.length || transformer.isLoading || isLoading.value
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
        clean();
      } else {
        restore(instance?.proxy.$route.fullPath.substring(1) || '');
      }
    };

    const saveStory = async () => {
      if (!appStore.story) {
        isShareModalActive.value = true;
        const scheme = transformer.editor?.getContents();
        if (scheme) {
          const newStory = await appStore.createStory(scheme);
          const path = '/' + (newStory ? newStory.id : '');
          if (instance?.proxy.$route.path !== path) {
            await pushRoute(path);
          }
        }
        transformer.removeWindowUnloadListener();
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

    const cleanContent = async () => {
      transformer.clean();
    };

    const copyToClipboard = () => {
      copyStory(transformer.editor?.getHtmlStr() || '', 'text', story.value);
    };

    const pushRoute = async (path: string) => {
      await instance?.proxy.$router.push(path);
    };

    const restore = async (id: string) => {
      const restoredStory = await appStore.getStory(id);
      if (restoredStory) {
        const scheme = JSON.parse(restoredStory.content) as Scheme;

        transformer.setScheme(scheme);
        transformer.editor?.setCursorToEnd();

        transformer.removeWindowUnloadListener();
      }
    };

    onMounted(async () => {
      isLoading.value = true;
      try {
        await transformer.getModels();
        const unwatch = watch(
          () => transformer.isReady,
          async (val) => {
            if (val) {
              unwatch();
              if (props.id) {
                await restore(props.id);
              }
              watch(() => transformer.text, clean);
            }
          }
        );
      } catch (er) {
        error.value = 'Ошибка соединения с сервером';
      }
      isLoading.value = false;
      watch(() => instance?.proxy.$route, onRouteChange);
    });

    return {
      isShareModalActive,
      isShareDisabled,
      isSettings,
      isLoading,
      story,
      error,
      user,
      clean,
      saveStory,
      cleanContent,
      copyToClipboard,
    };
  },
});
