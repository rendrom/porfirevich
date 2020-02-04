import { Vue, Component, Prop } from 'vue-property-decorator';
import { User } from '../../../srv/entity/User';

@Component
export default class extends Vue {
  @Prop({ type: Object }) readonly user!: User;
}
