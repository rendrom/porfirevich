<template>
  <div>
    <div v-for="(i, j) in stories" :key="j" class="columns">
      <div class="column">
        <story-item :story="i"></story-item>
      </div>
    </div>
    <div class="columns">
      <div class="column has-text-centered">
        <b-button
          type
          :loading="isLoading"
          :disabled="!hasMore"
          @click="loadMore"
        >
          Загрузить ещё
        </b-button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';

import { appModule } from '../store/app';
import { schemeToHtml } from '../utils/schemeUtils';
// @ts-ignore
import StoryItem from '../components/StoryItem/StoryItem.vue';

@Component({components: {StoryItem}})
export default class Gallery extends Vue {
  isLoading = true;

  get hasMore () {
    return appModule.hasMore;
  }

  get stories () {
    return appModule.stories
  }

  mounted () {
    this.loadMore();
  }

  async loadMore () {
    this.isLoading = true;
    try {
      await appModule.getStories({
        limit: 50,
        offset: appModule.stories.length
      });
    } catch (er) {
      //
    } finally {
      this.isLoading = false;
    }
  }
}
</script>
<style scoped>

</style>
