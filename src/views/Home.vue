<template>
  <Transformer
    v-if="!isLoading"
    :delta="content"
  />
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator';
// @ts-ignore
import Transformer from '../components/Transformer/Transformer.vue';
import { Delta, Scheme } from '../interfaces';
import StoryService from '../services/StoryService';
import { schemeToDelta } from '../utils/schemeUtils';

@Component({
  components: {
    Transformer
  }
})
export default class Home extends Vue {
  @Prop({ type: String, default: '' }) id!: string;
  content: Delta = { ops: [] };

  isLoading = false;

  async beforeMount () {
    if (this.id) {
      this.isLoading = true;
      try {
        const story = await StoryService.one(this.id);
        if (story && story.content) {
          const scheme = JSON.parse(story.content) as Scheme;
          this.content = schemeToDelta(scheme);
        }
      } catch {
        //
      } finally {
        this._cleanId();
      }
    }
  }

  private _cleanId () {
    this.isLoading = false;
    this.$router.push('/');
  }
}
</script>
