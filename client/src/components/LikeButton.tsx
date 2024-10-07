import { defineComponent, ref, computed, onMounted, h } from 'vue';
import StoryService from '../services/StoryService';
import { useAppStore } from '../store/app';
import type { Story } from '@shared/types/Story';

export default defineComponent({
  name: 'LikeButton',
  props: {
    story: {
      type: Object as () => Story,
      required: true
    }
  },
  setup(props) {
    const appModule = useAppStore();
    const isLoading = ref(false);
    const likesCount = ref(0);

    const alreadySet = computed(() => appModule.liked.includes(props.story.id));
    const disabled = computed(() => !appModule.user);

    onMounted(() => {
      likesCount.value = props.story.likesCount;
    });

    const onLikeBtnClick = async () => {
      if (alreadySet.value) {
        await dislike();
      } else {
        await like();
      }
    };

    const like = async () => {
      isLoading.value = true;
      try {
        await StoryService.like(props.story);
        likesCount.value++;
        appModule.addLike(props.story.id);
      } catch (er) {
        console.log(er);
      } finally {
        isLoading.value = false;
      }
    };

    const dislike = async () => {
      isLoading.value = true;
      try {
        await StoryService.dislike(props.story);
        likesCount.value--;
        appModule.removeLike(props.story.id);
      } catch (er) {
        console.log(er);
      } finally {
        isLoading.value = false;
      }
    };

    return () => h('b-tooltip', {
      props: {
        type: 'is-dark',
        label: disabled.value
          ? 'Сначала войдите'
          : alreadySet.value
          ? 'Больше не нравится'
          : 'Мне нравится'
      }
    }, [
      h('b-button', {
        props: {
          'icon-left': 'thumb-up-outline',
          size: 'is-small',
          type: alreadySet.value && !disabled.value ? 'is-primary' : 'is-light',
          loading: isLoading.value,
          disabled: disabled.value
        },
        on: {
          click: onLikeBtnClick
        }
      }, likesCount.value)
    ]);
  }
});
