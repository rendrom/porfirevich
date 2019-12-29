<template>
  <Transformer
    v-if="!isLoading"
    v-model="scheme"
  />
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator';
// @ts-ignore
import Transformer from '../components/Transformer/Transformer.vue';
import { Scheme } from '../interfaces';
import StoryService from '../services/StoryService';

@Component({
  components: {
    Transformer
  }
})
export default class Home extends Vue {
  @Prop({ type: String, default: '' }) id!: string;
  scheme: Scheme = [];

  isLoading = false;

  async beforeMount () {
    if (this.id) {
      this.isLoading = true;
      try {
        const story = await StoryService.one(this.id);
        if (story && story.content) {
          const scheme = JSON.parse(story.content) as Scheme;
          this.scheme = scheme;
        }
      } catch {
        //
      } finally {
        this.isLoading = false;
      }
    }
    setTimeout(() => this.$watch('scheme', () => this.cleanId()));
  }

  cleanId () {
    if (this.$route.params.id) {
      this.$router.push('/');
    }
  }
}
</script>
