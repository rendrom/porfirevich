<template>
  <div>
    <Transformer v-if="!isLoading" v-model="scheme" @loading="checkTransformLoading" />
    <div class="save-control columns">
      <div class="column has-text-centered">
        <b-button
          type
          icon-left="content-copy"
          :disabled="isShareDisabled"
          @click="copyToClipboard"
        />
        <b-button
          type
          icon-left="camera"
          :disabled="isShareDisabled"
          @click="saveStory"
        >Получить картинку</b-button>
      </div>
    </div>

    <b-modal :active.sync="isShareModalActive" :width="620">
      <Share v-if="isShareModalActive" v-model="story" />
    </b-modal>
  </div>
</template>

<script lang="ts" src="./Home.ts">
</script>


<style scoped>
.save-control {
  padding-top: 20px;
}
</style>
