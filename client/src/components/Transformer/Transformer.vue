<template>
  <div>
    <div v-if="isSettings" class="columns settings-control">
      <div class="column">
        <b-field label="Автодополнение">
          <div class="autocomplate-control">
            <b-switch v-model="store.isAutocomplete" size="is-small">
              {{ store.isAutocomplete ? 'вкл' : 'выкл' }}
            </b-switch>
          </div>
        </b-field>
      </div>
      <div class="column">
        <b-field label="Задержка автодополнения" style="max-width: 250px">
          <b-numberinput
            v-model="store.interval"
            size="is-small"
            controls-rounded
            :min="1"
          />
        </b-field>
      </div>
      <div class="column">
        <b-field label="Количество автодополняемых слов">
          <b-slider
            v-model="store.length"
            size="is-small"
            :min="1"
            :max="60"
            rounded
          >
            <b-slider-tick
              v-for="val in [10, 20, 30, 40, 50]"
              :key="val"
              :value="val"
            >
              {{ val }}
            </b-slider-tick>
          </b-slider>
        </b-field>
      </div>
    </div>

    <div class="box" :class="{ isError: store.isError }">
      <div id="editorjs" />

      <div class="columns is-mobile controls-pane">
        <div class="column is-1">
          <div class="tools">
            <b-button
              size="is-small"
              type
              icon-left="cog"
              @click="isSettings = !isSettings"
            />
          </div>
        </div>
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

        <div class="column is-1" />
        <div class="column is-1">
          <div class="tools is-pulled-right">
            <b-button
              size="is-small"
              type
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

<script lang="ts" src="./Transformer.ts"></script>

<style>
.ql-editor {
  min-height: 150px;
  white-space: pre-wrap;
}
.ql-editor::before {
  content: attr(data-placeholder);
  position: absolute;
  font-style: italic;
  color: rgba(0, 0, 0, 0.4);
  cursor: text;
}
.ql-editor,
.ql-editor:focus {
  outline: none;
}
.ql-clipboard {
  display: none;
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

/* .transform-btn {
  width: 120px;
} */
</style>
