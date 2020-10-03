<template>
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
          <!-- <b-navbar-item v-else tag="router-link" to="/login">Вход</b-navbar-item> -->
          <b-dropdown v-else position="is-bottom-left" aria-role="menu" trap-focus>
            <a class="navbar-item" slot="trigger" role="button">
              <span>Вход</span>
              <b-icon icon="menu-down"></b-icon>
            </a>

            <b-dropdown-item aria-role="menu-item" :focusable="false" custom paddingless>
              <div class="custom-menu-content">
                <div class="custom-menu-item">
                  <p>Войти через:</p>
                </div>
                <div class="custom-menu-item">
                  <b-button icon-left="google" @click="login">Google</b-button>
                </div>
              </div>
            </b-dropdown-item>
          </b-dropdown>
        </template>
      </b-navbar>

      <section class="section">
        <div class="columns is-mobile">
          <div class="column is-full" v-if="!isLoading">
            <router-view />
          </div>
          <b-loading v-else :is-full-page="false"></b-loading>
        </div>
      </section>

      <footer class="footer">
        <div class="content has-text-centered">
          <p>
            <a href="https://github.com/mgrankin/ru_transformers" target="_blank">
              <b-icon size="is-large" icon="github" />
            </a>
          </p>
        </div>
      </footer>
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
}

.custom-menu-content {
  padding: 0 20px;
}
.custom-menu-item {
  padding: 10px 0;
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
