<template>
  <div class="story-item" v-bind:class="{ isdeleted: story.isDeleted }">
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
          <b-button size="is-small" icon-left="camera" @click="show">Получить картинку</b-button>
        </div>

        <div class="column is-1">
          <div class="tools is-pulled-right">
            <section>
              <b-tooltip
                v-if="isSuperuser"
                type="is-dark"
                :label="story.isDeleted ? 'Восстановить' : 'Удалить'"
                class="right-control-btn"
              >
                <b-button
                  size="is-small"
                  :icon-right="story.isDeleted ? 'restore' : 'delete'"
                  type="is-danger"
                  position="is-left"
                  @click="remove"
                  :loading="deleteLoading"
                ></b-button>
              </b-tooltip>
              <b-tooltip type="is-dark" label="Сообщить о нарушении" class="right-control-btn">
                <b-button
                  size="is-small"
                  icon-right="alert-circle-outline"
                  position="is-left"
                  @click="violation"
                  :loading="violationLoading"
                ></b-button>
              </b-tooltip>
            </section>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" src="./StoryItem.ts"></script>

<style scoped>
.isdeleted {
  opacity: 0.3;
}

.right-control-btn {
  padding-left: 3px;
}
.story-item {
  padding: 10px;
  border: 1px solid rgba(0, 0, 0, 0.3);
}
.item-controls {
  padding-top: 5px;
}
</style>
