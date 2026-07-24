<template>
  <div v-if="!isLoading && !error">
    <Transformer />

    <div class="save-control columns is-mobile">
      <div class="column is-1">
        <div class="tools">
          <b-dropdown
            class="settings-dropdown"
            position="is-bottom-right"
            aria-role="menu"
            trap-focus
          >
            <template #trigger>
              <b-button size="is-small" icon-left="cog" />
            </template>

            <b-dropdown-item custom aria-role="listitem">
              <TransformerSettings />
            </b-dropdown-item>
          </b-dropdown>
        </div>
      </div>
      <div class="column is-1">
        <LikeButton v-if="story" :story="story" />
      </div>

      <div class="column has-text-right">
        <div class="buttons is-justify-content-flex-end">
          <b-button
            icon-left="backspace-outline"
            size="is-small"
            :disabled="isShareDisabled"
            @click="cleanContent"
          />
          <b-button
            icon-left="content-copy"
            size="is-small"
            :disabled="isShareDisabled"
            @click="copyToClipboard"
          />
          <b-button
            icon-left="share-variant"
            size="is-small"
            :loading="isSaving"
            :disabled="isShareDisabled"
            @click="saveStory"
          >
            Поделиться
          </b-button>
        </div>
      </div>
    </div>
    <UserItem
      v-if="story && story.user && user && user.isSuperuser"
      v-model:user="story.user"
    />

    <b-modal v-model="isShareModalActive" :width="620">
      <Share v-if="story && isShareModalActive" :story="story" />
    </b-modal>
  </div>
  <LoadingPage v-else :error="error" />
</template>

<script setup lang="ts">
import { BButton, BDropdown, BDropdownItem, BModal } from 'buefy';
import { computed, defineAsyncComponent, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import type { Scheme } from '@shared/types/Scheme';

import LikeButton from '@/components/LikeButton.vue';
import LoadingPage from '@/components/LoadingPage.vue';
import Transformer from '@/components/Transformer/Transformer.vue';
import TransformerSettings from '@/components/TransformerSettings/TransformerSettings.vue';
import UserItem from '@/components/UserItem/UserItem.vue';
import { useAppStore } from '@/store/app';
import { useTransformerStore } from '@/store/transformerStore';
import { copyStory } from '@/utils/copyToClipboard';

const props = withDefaults(defineProps<{ id?: string }>(), { id: '' });
const Share = defineAsyncComponent(() => import('@/components/Share/Share.vue'));

const route = useRoute();
const router = useRouter();
const appStore = useAppStore();
const transformer = useTransformerStore();

const isShareModalActive = ref(false);
const isLoading = ref(true);
const isSaving = ref(false);
const error = ref('');

const hasShareableText = computed(() => {
  const text = transformer.text.trim();
  return Boolean(text) && text !== transformer.placeholder.trim();
});
const isShareDisabled = computed(
  () =>
    !hasShareableText.value ||
    transformer.isLoading ||
    isLoading.value ||
    isSaving.value,
);
const story = computed(() => appStore.story);
const user = computed(() => appStore.user);

watch(
  () => appStore.story,
  () => appStore.getLikes(),
);

async function pushRoute(path: string) {
  await router.push(path);
}

async function restore(id: string) {
  const restoredStory = await appStore.getStory(id);
  if (!restoredStory) return;

  transformer.setScheme(JSON.parse(restoredStory.content) as Scheme);
  transformer.editor?.setCursorToEnd();
  transformer.removeWindowUnloadListener();
}

async function clean() {
  isShareModalActive.value = false;
  appStore.removeActiveStory();
  if (route.params.id) await pushRoute('/');
}

async function onRouteChange() {
  const id = route.params.id;
  if (typeof id !== 'string' || !id) {
    await clean();
  } else if (appStore.story?.id !== id) {
    await restore(id);
  }
}

async function saveStory() {
  if (isShareDisabled.value) return;

  if (appStore.story) {
    isShareModalActive.value = true;
    return;
  }

  const scheme = transformer.editor?.getContents();
  if (!scheme) return;

  isSaving.value = true;
  try {
    const newStory = await appStore.createStory(scheme);
    if (!newStory) return;

    const path = '/' + newStory.id;
    if (route.path !== path) await pushRoute(path);
    transformer.removeWindowUnloadListener();
    isShareModalActive.value = true;
  } catch (saveError) {
    console.error('Unable to create story', saveError);
  } finally {
    isSaving.value = false;
  }
}

function cleanContent() {
  transformer.clean();
}

function copyToClipboard() {
  copyStory(transformer.editor?.getHtmlStr() || '', 'text', story.value);
}

onMounted(async () => {
  isLoading.value = true;
  try {
    await transformer.getModels();
    let stopReadyWatch: () => void = () => {};
    stopReadyWatch = watch(
      () => transformer.isReady,
      async (ready) => {
        if (!ready) return;

        stopReadyWatch();
        if (props.id) await restore(props.id);
        watch(() => transformer.text, clean);
      },
      { immediate: true },
    );
  } catch {
    error.value = 'Ошибка соединения с сервером';
  } finally {
    isLoading.value = false;
    watch(() => route.fullPath, onRouteChange);
  }
});
</script>

<style scoped>
.save-control {
  padding-top: 20px;
}

.settings-dropdown :deep(.dropdown-menu) {
  width: 400px;
  max-width: 90vw;
}

.settings-dropdown :deep(.dropdown-content) {
  width: 100%;
}
</style>
