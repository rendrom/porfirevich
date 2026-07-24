<template>
  <div>
    <div v-show="!isLoading" class="box">
      <div>
        <p v-if="isError" class="subtitle">Произошла ошибка!</p>
        <p v-else class="subtitle">
          Сохраните изображение ниже, чтобы поделиться историей
        </p>
      </div>
      <div class="output-block">
        <div v-if="isError">
          <p>Не удалось сгенерировать "открытку" из вашей истории.</p>
        </div>
        <div v-else class="image-share-container">
          <img
            :src="output"
            class="image-share"
            alt="Generated story postcard"
            @error="imageError = true"
          />
        </div>
        <div>
          <p v-if="isError">Копировать:</p>
          <p v-else>или скопируйте:</p>

          <div>
            <b-button
              v-if="story"
              type="is-text"
              icon-left="link"
              @click="copyToClipboard('text', shareUrl)"
              >{{ shareUrl }}</b-button
            >
          </div>
          <div>
            <b-button
              type="is-text"
              icon-left="content-copy"
              @click="copyToClipboard"
              >текст</b-button
            >
            <b-button
              type="is-text"
              icon-left="xml"
              @click="copyToClipboard('html')"
              >текст c разметкой</b-button
            >
            <b-button
              type="is-text"
              icon-left="format-quote-close"
              @click="copyToClipboard('quote')"
              >цитату</b-button
            >
          </div>
        </div>
        <div class="pt10">
          <b-tooltip
            v-if="isUserAuthor"
            type="is-dark"
            label="Сначала войдите"
            :active="!user"
          >
            <b-field>
              <b-checkbox
                v-model="isPublic"
                :disabled="!user || changePublicStatusLoading"
                >Публиковать в галерее</b-checkbox
              >
            </b-field>
          </b-tooltip>
        </div>
      </div>
      <b-notification
        v-if="story.editId && !user"
        class="pt10"
        type="is-info"
        aria-close-label="Close notification"
        role="alert"
      >
        Заведите <strong>аккаунт</strong> и публикуйте истории в галерее.
        <br />
      </b-notification>
    </div>
    <b-loading :active="isLoading" />
  </div>
</template>

<script setup lang="ts">
import {
  BButton,
  BCheckbox,
  BField,
  BLoading,
  BNotification,
  BTooltip,
  SnackbarProgrammatic,
} from 'buefy';
import { computed, ref, watch } from 'vue';

import type { Story } from '@shared/types/Story';

import { SITE } from '@/config';
import StoryService from '@/services/StoryService';
import { useAppStore } from '@/store/app';
import { copyStory, type CopyType } from '@/utils/copyToClipboard';
import { schemeToHtml } from '@/utils/schemeUtils';

const props = defineProps<{ story: Story }>();
const appStore = useAppStore();
const snackbar = new SnackbarProgrammatic();

const imageError = ref(false);
const changePublicStatusLoading = ref(false);
const isPublic = ref(props.story.isPublic);

const user = computed(() => appStore.user);
const shareUrl = computed(() => `${SITE}/${props.story.id}`);
const isLoading = computed(() => !props.story);
const html = computed(() => schemeToHtml(JSON.parse(props.story.content)));
const output = computed(() => {
  const postcard = props.story.postcard;
  if (!postcard) return '';
  if (/^https?:\/\//i.test(postcard) || postcard.startsWith('/media/')) {
    return postcard;
  }

  const fileName = postcard.replace(/\\/g, '/').split('/').pop();
  return fileName ? `/media/${fileName}` : '';
});
const isError = computed(() => !output.value || imageError.value);
const isUserAuthor = computed(
  () =>
    Boolean(props.story.editId) ||
    Boolean(
      user.value &&
        (props.story.userId === user.value.id ||
          props.story.user?.id === user.value.id),
    ),
);

watch(output, () => {
  imageError.value = false;
});

watch(
  isPublic,
  async (isPublic, previousValue) => {
    if (previousValue === undefined || !user.value) return;

    try {
      changePublicStatusLoading.value = true;
      const edited = await StoryService.edit(props.story.id, {
        editId: props.story.editId,
        isPublic,
      });
      if (!edited) return;

      if (edited.isPublic) {
        appStore.appendStories(props.story);
        snackbar.open({
          duration: 5000,
          message:
            '<b>Ваша история опубликована в галерее</b></br>Теперь любой желающий может с ней ознакомиться.',
          type: 'is-success',
          position: 'is-bottom',
        });
      } else {
        appStore.removeFromStories(props.story);
      }
    } catch {
      snackbar.open({
        duration: 5000,
        message:
          '<b>Ошибка</b></br>Не удаётся поменять статус публикации вашей истории.',
        type: 'is-danger',
        position: 'is-bottom',
      });
    } finally {
      changePublicStatusLoading.value = false;
    }
  },
);

function copyToClipboard(type?: CopyType, value?: string | false) {
  const text = value ?? html.value;
  if (text) copyStory(text, type, props.story);
}
</script>

<style>
.animation-content {
  overflow-x: hidden;
  overflow-y: auto;
}
</style>

<style scoped>
.output-block {
  padding-top: 1rem;
}

.image-share-container {
  width: 100%;
  height: 100%;
}

.image-share {
  box-shadow: 1px 4px 6px;
}

.hidden-block {
  position: absolute;
  left: 5555px;
  max-width: 580px;
  /* height: 225px; */
}

.share-container {
  display: block;
  background-color: #ffffff;
  padding: 0;
  margin: 0;
  width: 100%;
  height: 100%;
}

.html-to-share {
  border: 1px solid rgba(0, 0, 0, 0.3);
  min-width: 550px;
}

.share-logo {
  width: 175px;
}
</style>
