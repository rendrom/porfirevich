import { defineComponent, computed, ref, watch, PropType } from 'vue';
import { SnackbarProgrammatic as Snackbar } from 'buefy';
import { useAppStore } from '@/store/app';
import { SITE } from '@/config';
import StoryService from '@/services/StoryService';
import { copyStory, CopyType } from '@/utils/copyToClipboard';
import { schemeToHtml } from '@/utils/schemeUtils';
import type { Story } from '@shared/types/Story';

export default defineComponent({
  name: 'StoryShare',
  props: {
    story: {
      type: Object as PropType<Story>,
      required: true,
    },
  },
  emits: ['update:story'],
  setup(props) {
    const appModule = useAppStore();
    const isError = ref(false);
    const changePublicStatusLoading = ref(false);

    const location = computed(() => SITE);
    const user = computed(() => appModule.user);
    const shareUrl = computed(() =>
      props.story ? `${location.value}/${props.story.id}` : false
    );
    const isLoading = computed(() => !props.story);
    const html = computed(() =>
      props.story ? schemeToHtml(JSON.parse(props.story.content)) : ''
    );
    const output = computed(() => props.story && props.story.postcard);
    const isUserAuthor = computed(() => {
      return (
        user.value &&
        props.story &&
        props.story.user &&
        user.value.id === props.story.user.id
      );
    });

    watch(
      () => props.story.isPublic,
      async (isPublic, oldVal) => {
        if (oldVal !== undefined && user.value) {
          try {
            changePublicStatusLoading.value = true;
            const edited = await StoryService.edit(props.story.id, {
              editId: props.story.editId,
              isPublic,
            });
            if (edited) {
              if (edited.isPublic) {
                appModule.appendStories(props.story);
                Snackbar.open({
                  duration: 5000,
                  message:
                    '<b>Ваша история опубликована в галерее</b></br>Теперь любой желающий может с ней ознакомиться.',
                  type: 'is-success',
                  position: 'is-bottom',
                });
              } else {
                appModule.removeFromStories(props.story);
              }
            }
          } catch (er) {
            Snackbar.open({
              duration: 5000,
              message:
                '<b>Ошибка</b></br>Не удаётся поменять статус публикации вашей истории.',
              type: 'is-danger',
              position: 'is-bottom',
            });
          } finally {
            changePublicStatusLoading.value = false;
          }
        }
      }
    );

    const copyToClipboard = (type?: CopyType, text?: string | false) => {
      text = text !== undefined ? text : html.value;
      if (text) {
        copyStory(text, type, props.story);
      }
    };

    return {
      isError,
      changePublicStatusLoading,
      location,
      user,
      shareUrl,
      isLoading,
      html,
      output,
      isUserAuthor,
      copyToClipboard,
    };
  },
});
