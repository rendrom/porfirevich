import { defineComponent, ref, computed } from 'vue';
import type { User } from '@shared/types/User';
import UserService from '@/services/UserService';

export default defineComponent({
  name: 'UserItem',
  props: {
    user: {
      type: Object as () => User,
      required: true,
    },
  },
  emits: ['update:user'],
  setup(props, { emit }) {
    const isBanLoading = ref(false);

    const isBanned = computed({
      get: () => props.user.isBanned,
      set: (value: boolean) =>
        emit('update:user', { ...props.user, isBanned: value }),
    });

    const onBanBtnClick = async () => {
      isBanLoading.value = true;
      try {
        await UserService.edit(String(props.user.id), {
          isBanned: !isBanned.value,
        });
        isBanned.value = !isBanned.value;
      } catch (er) {
        console.log(er);
      }
      isBanLoading.value = false;
    };

    return {
      isBanLoading,
      isBanned,
      onBanBtnClick,
    };
  },
});
