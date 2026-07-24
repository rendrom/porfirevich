<template>
  <div class="story-item" :class="{ isdeleted: story.isDeleted }">
    <span v-html="content" />

    <div class="item-controls">
      <div class="columns is-mobile controls-pane">
        <div class="column is-1">
          <LikeButton :story="story" />
        </div>

        <div class="main-actions column">
          <div class="buttons is-centered">
            <b-button size="is-small" icon-left="share-variant" @click="show"
              >Поделиться</b-button
            >
            <b-button size="is-small" icon-left="border-color" @click="go" />
          </div>
        </div>

        <div class="column is-1">
          <div class="tools is-pulled-right">
            <section>
              <b-tooltip
                v-if="userCanEdit"
                type="is-dark"
                :label="story.isDeleted ? 'Восстановить' : 'Удалить'"
                class="right-control-btn"
              >
                <b-button
                  size="is-small"
                  :icon-right="story.isDeleted ? 'restore' : 'delete'"
                  type="is-danger"
                  position="is-left"
                  :loading="deleteLoading"
                  @click="remove"
                />
              </b-tooltip>
            </section>
          </div>
        </div>
        <div class="column is-1">
          <div class="tools is-pulled-right">
            <section>
              <b-tooltip
                v-if="userCanEdit"
                type="is-dark"
                :label="story.isPublic ? 'Не публиковать' : 'Публиковать'"
                class="right-control-btn"
              >
                <b-button
                  size="is-small"
                  :icon-right="story.isPublic ? 'eye-off' : 'eye'"
                  position="is-left"
                  :loading="publishLoading"
                  @click="publish"
                />
              </b-tooltip>
            </section>
          </div>
        </div>
        <div class="column is-1">
          <div class="tools is-pulled-right">
            <section>
              <b-tooltip
                type="is-dark"
                :label="`Сообщить о нарушении${
                  user && user.isSuperuser
                    ? ' (' + story.violationsCount + ')'
                    : ''
                }`"
                class="right-control-btn"
              >
                <b-button
                  size="is-small"
                  icon-right="alert-circle-outline"
                  position="is-left"
                  :loading="violationLoading"
                  @click="violation"
                />
              </b-tooltip>
            </section>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { BButton, BTooltip, ToastProgrammatic } from 'buefy';
import { useRouter } from 'vue-router';

import config from '@shared/config';
import type { Story } from '@shared/types/Story';
import { escapeHtml } from '@shared/utils/escapeHtml';

import LikeButton from '@/components/LikeButton.vue';
import StoryService from '@/services/StoryService';
import { useAppStore } from '@/store/app';

const props = defineProps<{ story: Story }>();
const emit = defineEmits<{ show: [story: Story] }>();
const appStore = useAppStore();
const router = useRouter();
const toast = new ToastProgrammatic();

const violationLoading = ref(false);
const deleteLoading = ref(false);
const publishLoading = ref(false);

const color = computed(() => config.primaryColor);
const content = computed(() => {
  const scheme = JSON.parse(props.story.content) as [string, number][];
  return scheme
    .map(([value, highlighted]) => {
      const text = escapeHtml(value).replace(/\n/g, '<br>');
      return highlighted
        ? `<strong style="color:${color.value}">${text}</strong>`
        : `<span>${text}</span>`;
    })
    .join('');
});
const user = computed(() => appStore.user);
const isOwner = computed(() => {
  const userId = user.value?.id;
  return (
    userId !== undefined &&
    (userId === props.story.userId || userId === props.story.user?.id)
  );
});
const isSuperuser = computed(() => Boolean(user.value?.isSuperuser));
const userCanEdit = computed(() => isSuperuser.value || isOwner.value);

function show() {
  emit('show', props.story);
}

function go() {
  router.push('/' + props.story.id);
}

async function remove() {
  deleteLoading.value = true;
  try {
    const deleted = await StoryService.edit(props.story.id, {
      isDeleted: !props.story.isDeleted,
    });
    if (deleted) {
      appStore.updateStory({
        id: props.story.id,
        params: { isDeleted: deleted.isDeleted },
      });
    }
  } finally {
    deleteLoading.value = false;
  }
}

async function publish() {
  publishLoading.value = true;
  try {
    const response = await StoryService.edit(props.story.id, {
      isPublic: !props.story.isPublic,
    });
    if (response) {
      appStore.updateStory({
        id: props.story.id,
        params: { isPublic: response.isPublic },
      });
    }
  } finally {
    publishLoading.value = false;
  }
}

async function violation() {
  violationLoading.value = true;
  try {
    await StoryService.violation(props.story);
    toast.open({
      message: 'Спасибо, сообщение о нарушении отправлено на рассмотрение',
      type: 'is-success',
      position: 'is-bottom',
      duration: 6000,
    });
  } catch (error) {
    console.error(error);
  } finally {
    violationLoading.value = false;
  }
}
</script>

<style scoped>
.main-actions .buttons {
  margin-bottom: 0;
}

.isdeleted {
  opacity: 0.3;
}

.right-control-btn {
  padding-left: 3px;
}
.story-item {
  padding: 10px;
  border: 1px solid var(--porfirevich-border-color);
}
.item-controls {
  padding-top: 5px;
}
</style>
