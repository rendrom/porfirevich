<template>
  <b-tooltip
    type="is-dark"
    :label="
      disabled
        ? 'Сначала войдите'
        : alreadySet
          ? 'Больше не нравится'
          : 'Мне нравится'
    "
  >
    <b-button
      icon-left="thumb-up-outline"
      size="is-small"
      :type="alreadySet && !disabled ? 'is-primary' : 'is-light'"
      :loading="isLoading"
      :disabled="disabled"
      @click="onLikeBtnClick"
    >
      {{ likesCount }}
    </b-button>
  </b-tooltip>
</template>

<script setup lang="ts">
import { BButton, BTooltip } from 'buefy';
import { computed, ref, watch } from 'vue';

import type { Story } from '@shared/types/Story';

import StoryService from '@/services/StoryService';
import { useAppStore } from '@/store/app';

const props = defineProps<{ story: Story }>();
const appStore = useAppStore();
const isLoading = ref(false);
const likesCount = ref(props.story.likesCount);

const alreadySet = computed(() => appStore.liked.includes(props.story.id));
const disabled = computed(() => !appStore.user);

watch(
  () => props.story,
  (story) => {
    likesCount.value = story.likesCount;
  },
);

async function onLikeBtnClick() {
  if (alreadySet.value) await dislike();
  else await like();
}

async function like() {
  isLoading.value = true;
  try {
    await StoryService.like(props.story);
    likesCount.value++;
    appStore.addLike(props.story.id);
  } catch (error) {
    console.error(error);
  } finally {
    isLoading.value = false;
  }
}

async function dislike() {
  isLoading.value = true;
  try {
    await StoryService.dislike(props.story);
    likesCount.value--;
    appStore.removeLike(props.story.id);
  } catch (error) {
    console.error(error);
  } finally {
    isLoading.value = false;
  }
}
</script>
