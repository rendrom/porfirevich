<template>
  <div v-if="user">

    <div class="media">
      <div class="media-left" v-if="user.photoUrl">
        <figure class="image is-48x48">
          <img :src="user.photoUrl">
        </figure>
      </div>
      <div class="media-content">
        <p class="title is-4">{{user.username}}</p>
        <p class="subtitle is-6">{{user.email}}</p>
      </div>
    </div>

  </div>
</template>

<script lang="ts" src="./UserItem.ts"></script>

<style scoped>

</style>
