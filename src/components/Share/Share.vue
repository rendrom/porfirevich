<template>
  <div>
    <div class="hidden-block box" id="js-hidden-block" ref="HiddenBlock">
    <!-- <div class="box" id="js-hidden-block" ref="HiddenBlock"> -->
      <div class="html-to-share share-container" ref="HtmlToShare">
        <div class="card">
          <div class="card-content">
            <p class="subtitle" v-html="content"></p>
            <div class="media">
              <div class="media-left">
                <figure class="image">
                  <img src="logo.png" alt="Нейропоэт" class="share-logo" />
                </figure>
              </div>
              <div class="media-content">
                <p class="title is-6">написано с помощью нейронной сети</p>
                <p class="subtitle is-6">{{location}}</p>
                <!-- <p class="subtitle is-6">#порфирьевич</p> -->
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="box" v-show="!isLoading">
      <div>
        <p class="subtitle" v-if="isError">Произошла ошибка!</p>
        <p class="subtitle" v-else>Сохраните изображение ниже, чтобы поделиться историей</p>
      </div>
      <div class="output-block">
        <div v-if="isError">
          <p>Не удалось сгенерировать "открытку" из вашей истории.</p>
        </div>
        <div v-else class="image-share-container">
            <img :src="output" class="image-share">
        </div>
        <div>
          <p v-if="isError">Копировать:</p>
          <p v-else>или скопируйте:</p>
          <div>
            <b-button type="is-text" icon-left="content-copy" @click="copyToClipboard">текст</b-button>
            <b-button type="is-text" icon-left="xml" @click="copyToClipboard('html')">текст c разметкой</b-button>
            <b-button type="is-text" icon-left="format-quote-close" @click="copyToClipboard('quote')">цитату</b-button>
          </div>
        </div>
        <div class="has-text-grey-light is-size-6 has-text-right">Используйте тег <code>#порфирьевич</code> для социальных сетей</div>
      </div>
    </div>
    <b-loading :active.sync="isLoading"></b-loading>
  </div>
</template>

<script lang="ts" src="./Share.ts">
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
  border: 1px solid rgba(0,0,0,.3);
  min-width: 550px;
}

.share-logo {
  width: 175px;
}
</style>
