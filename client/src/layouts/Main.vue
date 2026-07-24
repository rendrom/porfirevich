<template>
  <div class="main">
    <b-navbar fixed-top>
      <template #brand>
        <b-navbar-item tag="router-link" :to="{ path: '/' }">
          <img src="/images/favicon.svg" alt="Порфирьевич" class="neuro-logo" />
          <span class="neuro-logo-text primary">Порфирьевич</span>
        </b-navbar-item>
      </template>

      <template #end>
        <b-navbar-item tag="router-link" to="/gallery">
          <strong>Галерея</strong>
        </b-navbar-item>
        <b-navbar-item tag="router-link" to="/about">О проекте</b-navbar-item>
        <b-navbar-item
          v-if="user?.isSuperuser"
          tag="router-link"
          to="/admin/users"
        >
          Пользователи
        </b-navbar-item>
        <div class="navbar-item">
          <ThemeSwitcher />
        </div>
        <b-navbar-item v-if="user" @click="logout">Выход</b-navbar-item>

        <b-dropdown
          v-else
          position="is-bottom-left"
          aria-role="menu"
          trap-focus
        >
          <template #trigger>
            <a class="navbar-item" role="button">
              <span>Вход</span>
              <b-icon icon="menu-down" />
            </a>
          </template>

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
        <p class="footer-social-links">
          <a
            href="https://t.me/+x3FR1E6PIbVjN2I6"
            target="_blank"
            title="porfirevich_ru"
            aria-label="Telegram"
          >
            <TelegramIcon />
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

<script setup lang="ts">
import {
  BButton,
  BDropdown,
  BDropdownItem,
  BIcon,
  BLoading,
  BNavbar,
  BNavbarItem,
} from 'buefy';
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

import config from '@shared/config';

import ThemeSwitcher from '@/components/ThemeSwitcher.vue';
import TelegramIcon from '@/components/icons/TelegramIcon.vue';
import {
  clearStoredAccessToken,
  closeServerSession,
  getStoredAccessToken,
  refreshAccessToken,
  storeAccessToken,
} from '@/services/AuthService';
import UserService from '@/services/UserService';
import { useAppStore } from '@/store/app';
import { APP_TOKEN_KEY } from '@/utils/constants';
import { HttpError } from '@/utils/http';
import openWindow from '@/utils/openWindow';

const route = useRoute();
const appStore = useAppStore();
const isLoading = ref(true);

const user = computed(() => appStore.user);
const color = computed(() => config.primaryColor);
const pageKey = computed(() => {
  const routeName = String(route.name || '');
  return routeName.startsWith('transformer')
    ? 'page-transformer'
    : `page-${routeName}`;
});

function removeTokenFromUrl() {
  const currentUrl = new URL(window.location.href);
  if (!currentUrl.searchParams.has('token')) return;

  currentUrl.searchParams.delete('token');
  const nextUrl = currentUrl.pathname + currentUrl.search + currentUrl.hash;
  window.history.replaceState(window.history.state, '', nextUrl);
}

function resetClientSession() {
  clearStoredAccessToken();
  appStore.setUser(null);
  appStore.setToken(null);
}

async function applyAccessToken(token: string) {
  storeAccessToken(token);
  await appStore.setToken(token);
  appStore.setUser(await UserService.getUser(token));
}

function login() {
  const popup = openWindow('/auth/google/start', 'Google ID', 540, 540);
  let closePoll: number | undefined;

  const cleanup = () => {
    window.localStorage.removeItem(APP_TOKEN_KEY);
    window.removeEventListener('storage', receiveToken);
    if (closePoll !== undefined) window.clearInterval(closePoll);
    popup?.close();
  };

  const receiveToken = async (event: StorageEvent) => {
    if (event.key !== APP_TOKEN_KEY) return;

    try {
      if (event.newValue) await applyAccessToken(event.newValue);
    } catch (error) {
      resetClientSession();
      console.error('Unable to finish authentication', error);
    } finally {
      cleanup();
    }
  };

  if (popup) {
    window.localStorage.setItem(APP_TOKEN_KEY, '');
    window.addEventListener('storage', receiveToken);
    closePoll = window.setInterval(() => {
      if (popup.closed) cleanup();
    }, 500);
  }
}

async function logout() {
  resetClientSession();
  try {
    await closeServerSession();
  } catch (error) {
    console.error('Unable to close server session', error);
  }
}

onMounted(async () => {
  let token = new URL(window.location.href).searchParams.get('token');
  token = token ? token.replace(/#$/, '') : getStoredAccessToken();

  try {
    if (token) {
      try {
        await applyAccessToken(token);
      } catch (error) {
        if (!(error instanceof HttpError) || error.status !== 401) throw error;
        await applyAccessToken(await refreshAccessToken());
      }
    } else {
      await applyAccessToken(await refreshAccessToken());
    }
  } catch (error) {
    if (error instanceof HttpError && error.status === 401) {
      resetClientSession();
    } else {
      console.error('Unable to restore authentication', error);
    }
  } finally {
    removeTokenFromUrl();
    isLoading.value = false;
  }
});
</script>

<style scoped>
.footer {
  padding: 1rem 1.5rem 1rem;
}

.footer-social-links {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}

.footer-social-links a {
  display: inline-flex;
  align-items: center;
  justify-content: center;
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
  color: #5371ff;
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
