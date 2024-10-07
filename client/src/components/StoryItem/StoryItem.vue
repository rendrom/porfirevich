<template>
  <div class="story-item" :class="{ isdeleted: story.isDeleted }">
    <span v-html="content" />

    <div class="item-controls">
      <div class="columns is-mobile controls-pane">
        <div class="column is-1">
          <LikeButton :story="story" />
        </div>

        <div class="main-actions column buttons has-text-centered">
          <b-button size="is-small" icon-left="share-variant" @click="show"
            >Поделиться</b-button
          >
          <b-button size="is-small" icon-left="border-color" @click="go" />
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
                  user.isSuperuser ? ' (' + story.violationsCount + ')' : ''
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

<script lang="ts" src="./StoryItem.ts"></script>

<style scoped>
.main-actions {
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
  border: 1px solid rgba(0, 0, 0, 0.3);
}
.item-controls {
  padding-top: 5px;
}
</style>
