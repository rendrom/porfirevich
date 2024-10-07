import { Component, Prop, Vue } from 'vue-property-decorator';

import type { User } from '@shared/types/User';

import UserService from '@/services/UserService';

@Component
export default class UserItem extends Vue {
  @Prop({ type: Object }) readonly user!: User;

  isBanLoading = false;

  async onBanBtnClick() {
    this.isBanLoading = true;
    try {
      await UserService.edit(String(this.user.id), {
        isBanned: !this.user.isBanned,
      });
      this.user.isBanned = !this.user.isBanned;
    } catch (er) {
      console.log(er);
    }

    this.isBanLoading = false;
  }
}
