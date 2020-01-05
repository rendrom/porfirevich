<template>
  <div>
    <div v-for="(i, j) in items" :key="j" class="columns">
      <div class="column story-item" v-html="i" />
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

@Component
export default class Gallery extends Vue {
  isLoading = true;

  get hasMore () {
    return appModule.hasMore;
  }

  get items () {
    return appModule.stories.map(x => {
      return schemeToHtml(JSON.parse(x.content));
    });
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
.story-item {
  margin: 10px;
  border: 1px solid rgba(0, 0, 0, 0.3);
}
</style>
