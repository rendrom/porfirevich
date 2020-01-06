import { Component, Vue } from 'vue-property-decorator';

@Component
export default class About extends Vue {
  render(): Vue.VNode {
    return (
      <a href="/auth/google/start">Нажмите, чтобы войти с помощью Google</a>
      // <div>
      //   <p>Войти через:</p>
      //   <b-button
      //     type
      //     icon-left="google"
      //   >
      //   </b-button>
      // </div>
    );
  }
}
