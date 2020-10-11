import { Vue, Component, Prop } from 'vue-property-decorator';
import { User } from '../../../classes/User';
import UserService from '@/services/UserService';

@Component
export default class extends Vue {
  @Prop({ type: Object }) readonly user!: User;

  isBanLoading = false;

  async onBanBtnClick() {
    this.isBanLoading = true;
    try {
      await UserService.edit(String(this.user.id), {
        isBanned: !this.user.isBanned
      });
      this.user.isBanned = !this.user.isBanned;
    } catch (er) {
      console.log(er);
    }

    this.isBanLoading = false;
  }
}
