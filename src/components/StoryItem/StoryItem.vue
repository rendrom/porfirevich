<template>
  <div class="story-item">
    <span v-for="(c, i) in content" :key="i">
      <strong v-if="c[1]" :style="{color: color}">{{c[0]}}</strong>
      <span v-else>{{c[0]}}</span>
    </span>

    <div class="item-controls">
      <div class="columns is-mobile controls-pane">
        <div class="column is-1">
          <b-tooltip type="is-dark" :label="disabled ? 'Сначала войдите' : ''">
            <b-button
              icon-left="thumb-up-outline"
              size="is-small"
              :type="(alreadySet && !disabled) ? 'is-primary' : 'is-light'"
              :loading="isLoading"
              :disabled="disabled"
              @click="onLikeBtnClick"
            >{{likesCount}}</b-button>
          </b-tooltip>
        </div>

        <div class="column has-text-centered">
          <b-button
            size="is-small"
            icon-left="camera"
            @click="show"
          >Получить картинку</b-button>
        </div>

        <div class="column is-1">
          <div class="tools is-pulled-right">
            <b-tooltip type="is-dark" label="Сообщить о нарушении">
            <b-button size="is-small" icon-right="alert-circle-outline"></b-button>
            </b-tooltip>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" src="./StoryItem.ts"></script>

<style scoped>
.story-item {
  padding: 10px;
  border: 1px solid rgba(0, 0, 0, 0.3);
}
.item-controls {
  padding-top: 5px;
}
</style>
