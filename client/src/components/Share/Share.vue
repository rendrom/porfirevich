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
          <img :src="output" class="image-share" />
        </div>
        <div>
          <p v-if="isError">Копировать:</p>
          <p v-else>или скопируйте:</p>

          <div>
            <b-button
              v-if="story"
              type="is-text"
              icon-left="link"
              @click="copyToClipboard('test', shareUrl)"
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
                v-model="story.isPublic"
                :disabled="!user || changePublicStatusLoading"
                >Публиковать в галерее</b-checkbox
              >
            </b-field>
          </b-tooltip>
        </div>
        <!-- <div class="has-text-grey-light is-size-6 has-text-right">
          Используйте тег <code>#порфирьевич</code> для социальных сетей
        </div>-->
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
    <b-loading :active.sync="isLoading" />
  </div>
</template>

<script lang="ts" src="./Share.ts"></script>

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
