<template>
  <div class="story-item">
    <span v-for="(c, i) in content" :key="i">
      <strong v-if="c[1]" :style="{color: color}">{{c[0]}}</strong>
      <span v-else>{{c[0]}}</span>
    </span>

    <div class="item-controls">
      <span>
        <b-button
            icon-left="thumb-up-outline"
            :loading="isLoading"
            :disabled="alreadySet"
            @click="like"
          >
          {{likesCount}}
          </b-button>
      </span>
    </div>
  </div>
</template>

<script lang="ts" src="./StoryItem.ts"></script>

<style scoped>
.story-item {
  padding: 10px;
  border: 1px solid rgba(0, 0, 0, 0.3);
}
</style>
