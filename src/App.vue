<template>
  <div>
    <div class="main">
      <b-navbar type fixed-top>
        <template slot="brand">
          <b-navbar-item tag="router-link" :to="{ path: '/' }">
            <img src="images/logo.svg" alt="Порфирьевич" class="neuro-logo" />
          </b-navbar-item>
        </template>
        <!-- <template slot="start">
            <b-navbar-item href="#">

            </b-navbar-item>
        </template>-->

        <template slot="end">
          <b-navbar-item tag="router-link" to="/gallery">Галерея</b-navbar-item>
          <b-navbar-item tag="router-link" to="/about">О проекте</b-navbar-item>
          <b-navbar-item v-if="user" @click="logout">Выход</b-navbar-item>
          <b-navbar-item v-else tag="router-link" to="/login">Вход</b-navbar-item>
        </template>
      </b-navbar>

      <section class="section">
        <div class="columns is-mobile">
          <div class="column is-full">
            <router-view />
          </div>
        </div>
      </section>

      <footer class="footer">
        <div class="content has-text-centered">
          <p>
            <a href="https://github.com/mgrankin/ru_transformers" target="_blank">
              <b-icon size="is-large" icon="github-circle" />
            </a>
          </p>
        </div>
      </footer>
    </div>
  </div>
</template>

<script lang="ts" src="./App.ts">
</script>

<style lang="css" scoped>
.main {
  display: flex;
  min-height: 100vh;
  flex-direction: column;
}

.neuro-logo {
  max-height: 2.3rem;
}

.section {
  flex: 1;
  /* background: #f5f5f5; */
}

@media screen and (min-width: 768px) {
  .section {
    padding: 20px 10%;
  }
}

@media screen and (min-width: 1500px) {
  .section {
    padding: 30px 20%;
  }
}
</style>
