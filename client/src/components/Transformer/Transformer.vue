<template>
  <div>
    <div class="box" :class="{ isError: store.isError }">
      <div id="editorjs" />

      <div class="columns is-mobile controls-pane">
        <div class="column is-1">
          <b-button
            v-if="store.models.length > 1"
            size="is-small"
            type="is-ghost"
            @click="store.changeModel"
            >{{ store.activeModel }}</b-button
          >
        </div>
        <div class="column has-text-centered">
          <b-button
            size="is-small"
            type="is-primary"
            :icon-left="store.lastReply ? 'restart' : 'send'"
            :loading="store.isLoading"
            :disabled="!store.prompt"
            class="transform-btn"
            @click="store.transform"
          >
            {{ (store.lastReply ? 'Варианты' : 'Дополнить') + ' (Tab)' }}
          </b-button>
        </div>

        <div class="column is-1">
          <div class="tools is-pulled-right">
            <b-button
              size="is-small"
              :icon-right="
                store.isLoading || !store.history.length
                  ? 'close'
                  : 'arrow-left'
              "
              @click="store.escape"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { BButton, SnackbarProgrammatic } from 'buefy';
import { onMounted, onUnmounted } from 'vue';

import { useTransformerStore } from '@/store/transformerStore';

const store = useTransformerStore();
const snackbar = new SnackbarProgrammatic();

function handleRequestError() {
  snackbar.open({
    duration: 5000,
    message: '<b>Ошибка</b></br>Нейросеть не отвечает.',
    type: 'is-danger',
    position: 'is-bottom',
    actionText: 'Повторить',
    queue: false,
    onAction: () => store.transform(),
  });
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Tab') {
    event.preventDefault();
    if (store.isLoading) store.abort();
    else store.transform();
  } else if (event.key === 'Escape') {
    store.easyEscape();
  } else if ((event.metaKey || event.ctrlKey) && event.code === 'KeyZ') {
    store.historyBack();
  }
}

onMounted(async () => {
  await store.getModels();
  store.initialize();
  store.createEditor('#editorjs');
  window.addEventListener('keydown', onKeydown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown);
  store.removeWindowUnloadListener();
});

store.$patch({ handleRequestError });
</script>

<style>
#editorjs {
  white-space: pre-wrap;

  box-sizing: border-box;
  color: var(--porfirevich-editor-text);
  display: block;
  font-family: BlinkMacSystemFont, -apple-system, 'Segoe UI', Roboto, Oxygen,
    Ubuntu, Cantarell, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', Helvetica,
    Arial, sans-serif;
  font-size: 16px;
  font-weight: 400;
  min-height: 150px;
  line-break: after-white-space;
  line-height: 24px;

  overflow-wrap: break-word;
  text-rendering: optimizelegibility;
  text-size-adjust: 100%;
  text-wrap-mode: wrap;
  unicode-bidi: isolate;
  white-space-collapse: preserve;
}

#editorjs,
#editorjs:focus {
  outline: none;
}
</style>

<style scoped>
.box.isError {
  box-shadow: 0 2px 3px rgba(255, 255, 255, 0.1),
    0 0 0 1px rgba(255, 2, 2, 0.36);
}

.controls-pane {
  padding-top: 10px;
}

</style>
