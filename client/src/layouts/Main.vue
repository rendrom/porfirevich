<template>
  <div class="main">
    <b-navbar type fixed-top>
      <template slot="brand">
        <b-navbar-item tag="router-link" :to="{ path: '/' }">
          <img src="images/favicon.svg" alt="Порфирьевич" class="neuro-logo" />
          <span class="neuro-logo-text primary">Порфирьевич</span>
        </b-navbar-item>
      </template>

      <template slot="end">
        <b-navbar-item tag="router-link" to="/gallery">
          <strong>Галерея</strong>
        </b-navbar-item>
        <b-navbar-item tag="router-link" to="/about">О проекте</b-navbar-item>
        <b-navbar-item v-if="user" @click="logout">Выход</b-navbar-item>

        <b-dropdown
          v-else
          position="is-bottom-left"
          aria-role="menu"
          trap-focus
        >
          <a slot="trigger" class="navbar-item" role="button">
            <span>Вход</span>
            <b-icon icon="menu-down" />
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
        <div v-if="!isLoading" class="column is-full">
          <router-view v-slot="{ Component }" :key="pageKey">
            <component :is="Component" />
          </router-view>
        </div>
        <b-loading v-else :is-full-page="false" />
      </div>
    </section>

    <footer class="footer">
      <div class="content has-text-centered">
        <p>
          <a
            href="https://t.me/+x3FR1E6PIbVjN2I6"
            target="_blank"
            title="porfirevich_ru"
          >
            <b-icon size="is-large" icon="telegram" />
          </a>
          <a href="https://github.com/mgrankin/ru_transformers" target="_blank">
            <b-icon size="is-large" icon="github" />
          </a>
        </p>
      </div>
      <div class="content has-text-centered footer-support">
        <h4 class="footer-title">
          Поддержите <strong :style="{ color: color }">Порфирьевича</strong>
        </h4>

        <div class="footer-donations columns">
          <div class="footer-donation column">
            <div class="footer-donation-action">
              <a
                class="button boosty-button"
                href="https://boosty.to/porfirevich"
                target="_blank"
              >
                <img src="/images/boosty_white.svg" alt="Boosty" />
              </a>

              <a
                class="patreon-button"
                href="https://www.patreon.com/Porfirevich"
                target="_blank"
              >
                <img
                  src="https://bulma.io/assets/images/become-a-patron.png"
                  srcset="
                    https://bulma.io/assets/images/become-a-patron.png    1x,
                    https://bulma.io/assets/images/become-a-patron@2x.png 2x,
                    https://bulma.io/assets/images/become-a-patron@3x.png 3x
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

<script lang="ts" src="./Main.ts"></script>

<style lang="scss" scoped>
@import '../style.scss';

.footer {
  padding: 1rem 1.5rem 1rem;
}

.main {
  display: flex;
  min-height: calc(100vh - 52px);
  flex-direction: column;
}

.boosty-button {
  background-color: #f15f2c;
  border-color: #f15f2c !important;
  color: #fff;
  font-size: 0.875rem;
  height: 36px;
  width: 146px;
  padding: calc(0.5em - 1px) 1em;
  position: relative;
  border-radius: 0;
  margin-right: 0.5rem;
}

.boosty-button img {
  height: 36px;
}

.neuro-logo {
  width: 54px;
  max-height: 2.3rem;
}

.neuro-logo-text {
  color: $primary;
  font-weight: 500;
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
