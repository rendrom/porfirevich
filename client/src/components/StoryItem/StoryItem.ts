import {
  defineComponent,
  ref,
  computed,
  PropType,
  getCurrentInstance,
} from 'vue';
import { ToastProgrammatic as Toast } from 'buefy';
import { escapeHtml } from '@shared/utils/escapeHtml';
import config from '@shared/config';
import StoryService from '@/services/StoryService';
import { useAppStore } from '@/store/app';
import LikeButton from '@/components/LikeButton';
import type { Story } from '@shared/types/Story';

export default defineComponent({
  name: 'StoryItem',
  components: { LikeButton },
  props: {
    story: {
      type: Object as PropType<Story>,
      required: true,
    },
  },
  emits: ['show'],
  setup(props, { emit }) {
    const appModule = useAppStore();
    const instance = getCurrentInstance();
    const router = instance?.proxy.$router;

    const violationLoading = ref(false);
    const deleteLoading = ref(false);
    const publishLoading = ref(false);

    const content = computed(() => {
      const c = JSON.parse(props.story.content) as [string, number][];
      let html = '';
      c.forEach((x) => {
        let text = escapeHtml(x[0]);
        text = text.replace(/\n/g, '<br>');
        if (x[1]) {
          html += `<strong style="color:${color.value}">${text}</strong>`;
        } else {
          html += `<span>${text}</span>`;
        }
      });
      return html;
    });

    const color = computed(() => config.primaryColor);
    const user = computed(() => appModule.user);
    const userCanEdit = computed(() => isSuperuser.value || isOwner.value);
    const isOwner = computed(
      () => user.value && user.value.id === props.story.user?.id
    );
    const isSuperuser = computed(() => user.value && user.value.isSuperuser);
    const alreadySet = computed(() => appModule.liked.includes(props.story.id));
    const disabled = computed(() => !appModule.user);

    const show = () => {
      emit('show', props.story);
    };

    const go = () => {
      router?.push('/' + props.story.id);
    };

    const remove = async () => {
      deleteLoading.value = true;
      try {
        const deleted = await StoryService.edit(props.story.id, {
          isDeleted: !props.story.isDeleted,
        });
        if (deleted) {
          appModule.updateStory({
            id: props.story.id,
            params: { isDeleted: deleted.isDeleted },
          });
        }
      } catch {
        // Handle error
      } finally {
        deleteLoading.value = false;
      }
    };

    const publish = async () => {
      publishLoading.value = true;
      try {
        const resp = await StoryService.edit(props.story.id, {
          isPublic: !props.story.isPublic,
        });
        if (resp) {
          appModule.updateStory({
            id: props.story.id,
            params: { isPublic: resp.isPublic },
          });
        }
      } catch {
        // Handle error
      } finally {
        publishLoading.value = false;
      }
    };

    const violation = async () => {
      violationLoading.value = true;
      try {
        await StoryService.violation(props.story);
        Toast.open({
          message: 'Спасибо, сообщение о нарушение отправлено на рассмотрение',
          type: 'is-success',
          position: 'is-bottom',
          duration: 6000,
        });
      } catch (er) {
        console.log(er);
      } finally {
        violationLoading.value = false;
      }
    };

    return {
      violationLoading,
      deleteLoading,
      publishLoading,
      content,
      color,
      user,
      userCanEdit,
      isOwner,
      isSuperuser,
      alreadySet,
      disabled,
      show,
      go,
      remove,
      publish,
      violation,
    };
  },
});
