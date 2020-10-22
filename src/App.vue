<template>
  <div class="main">
    <b-navbar type fixed-top>
      <template slot="brand">
        <b-navbar-item tag="router-link" :to="{ path: '/' }">
          <img src="images/logo.svg" alt="Порфирьевич" class="neuro-logo" />
        </b-navbar-item>
      </template>
      <!-- <template slot="start">

      </template> -->


      <template slot="end">
        <b-navbar-item tag="router-link" to="/gallery">Галерея</b-navbar-item>
        <b-navbar-item tag="router-link" to="/about">О проекте</b-navbar-item>
        <b-navbar-item v-if="user" @click="logout">Выход</b-navbar-item>
        <!-- <b-navbar-item v-else tag="router-link" to="/login">Вход</b-navbar-item> -->
        <b-dropdown
          v-else
          position="is-bottom-left"
          aria-role="menu"
          trap-focus
        >
          <a class="navbar-item" slot="trigger" role="button">
            <span>Вход</span>
            <b-icon icon="menu-down"></b-icon>
          </a>

          <b-dropdown-item
            aria-role="menu-item"
            :focusable="false"
            custom
            paddingless
          >
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
      <div class="content has-text-centered footer-support">
        <h4 class="footer-title">
          <strong>Поддержите</strong> Порфирьевича
        </h4>

        <div class="footer-donations columns">

          <div class="footer-donation column">
            <div class="footer-donation-action">
              <!-- <a
                class="button bd-github-button"
                href="https://github.com/users/jgthms/sponsorship"
                target="_blank"
              >
                <span class="icon">
                  <svg
                    class="svg-inline--fa fa-heart fa-w-16"
                    aria-hidden="true"
                    focusable="false"
                    data-prefix="fas"
                    data-icon="heart"
                    role="img"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 512 512"
                    data-fa-i2svg=""
                  >
                    <path
                      fill="currentColor"
                      d="M462.3 62.6C407.5 15.9 326 24.3 275.7 76.2L256 96.5l-19.7-20.3C186.1 24.3 104.5 15.9 49.7 62.6c-62.8 53.6-66.1 149.8-9.9 207.9l193.5 199.8c12.5 12.9 32.8 12.9 45.3 0l193.5-199.8c56.3-58.1 53-154.3-9.8-207.9z"
                    ></path></svg
                  >
                </span>
                <strong>Sponsor</strong>
              </a> -->

              <a
                class="patreon-button"
                href="https://www.patreon.com/Porfirevich"
                target="_blank"
              >
                <img
                  src="https://bulma.io/images/become-a-patron.png"
                  srcset="
                    https://bulma.io/images/become-a-patron.png    1x,
                    https://bulma.io/images/become-a-patron@2x.png 2x,
                    https://bulma.io/images/become-a-patron@3x.png 3x
                  "
                  alt="Become a Patron"
                  width="148"
                  height="36"
                />
              </a>
            </div>
          </div>
        </div>
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
