<template>
  <div class="admin-users">
    <div class="level">
      <div class="level-left">
        <div>
          <h1 class="title is-3">Пользователи</h1>
        </div>
      </div>
      <div class="level-right">
        <b-tag type="is-light">найдено: {{ total }}</b-tag>
      </div>
    </div>

    <div class="columns is-mobile is-variable is-2 is-align-items-flex-end mb-5">
      <div class="column">
        <b-field label="Поиск" class="mb-0">
          <b-input
            v-model="searchInput"
            icon="magnify"
            maxlength="100"
            :has-counter="false"
            placeholder="Имя или email"
            size="is-small"
            :disabled="isLoading"
            @keyup.enter="applyFilters"
          />
        </b-field>
      </div>
      <div class="column is-narrow">
        <b-field label="Роль" class="mb-0">
          <b-select
            v-model="selectedRole"
            size="is-small"
            :disabled="isLoading"
          >
            <option value="all">Все роли</option>
            <option value="admin">Администраторы</option>
            <option value="user">Пользователи</option>
          </b-select>
        </b-field>
      </div>
      <div class="column is-narrow">
        <b-field label="Статус" class="mb-0">
          <b-select
            v-model="selectedStatus"
            size="is-small"
            :disabled="isLoading"
          >
            <option value="all">Все статусы</option>
            <option value="active">Активные</option>
            <option value="banned">Заблокированные</option>
          </b-select>
        </b-field>
      </div>
      <div class="column is-narrow">
        <b-button
          type="is-primary"
          size="is-small"
          :disabled="isLoading"
          @click="applyFilters"
        >
          Применить
        </b-button>
      </div>
      <div class="column is-narrow">
        <b-button
          type="is-light"
          size="is-small"
          :disabled="isLoading || !hasFilters"
          @click="clearFilters"
        >
          Сбросить
        </b-button>
      </div>
    </div>

    <b-notification
      v-if="errorMessage"
      type="is-danger"
      :closable="false"
    >
      {{ errorMessage }}
    </b-notification>

    <div class="admin-users-table">
      <table class="table is-fullwidth is-hoverable">
        <thead>
          <tr>
            <th>Пользователь</th>
            <th>Email</th>
            <th>Роль</th>
            <th>Статус</th>
            <th class="has-text-right">Действие</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in users" :key="item.id">
            <td>
              <strong>{{ item.username }}</strong>
            </td>
            <td class="has-text-grey">
              {{ item.email || '—' }}
            </td>
            <td>
              <b-tag :type="item.isSuperuser ? 'is-info' : 'is-light'">
                {{ item.isSuperuser ? 'Администратор' : 'Пользователь' }}
              </b-tag>
            </td>
            <td>
              <b-tag :type="item.isBanned ? 'is-danger' : 'is-success'">
                {{ item.isBanned ? 'Заблокирован' : 'Активен' }}
              </b-tag>
            </td>
            <td class="has-text-right">
              <b-button
                :type="item.isBanned ? 'is-success' : 'is-danger'"
                size="is-small"
                :loading="updatingUserId === item.id"
                :disabled="updatingUserId !== null"
                @click="toggleBan(item)"
              >
                {{ item.isBanned ? 'Разблокировать' : 'Заблокировать' }}
              </b-button>
            </td>
          </tr>
          <tr v-if="!isLoading && users.length === 0">
            <td colspan="5" class="has-text-centered py-6">
              Пользователи не найдены
            </td>
          </tr>
        </tbody>
      </table>
      <b-loading :active="isLoading" :is-full-page="false" />
    </div>

    <div v-if="total > pageSize" class="level mt-5">
      <div class="level-left">
        <span class="has-text-grey">
          Страница {{ page }} из {{ totalPages }}
        </span>
      </div>
      <div class="level-right">
        <b-pagination
          v-model="page"
          :total="total"
          :per-page="pageSize"
          :range-before="2"
          :range-after="2"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  BButton,
  BField,
  BInput,
  BLoading,
  BNotification,
  BPagination,
  BSelect,
  BTag,
} from 'buefy';
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import type { AdminUserSummary } from '@shared/types/AdminUser';

import AdminUserService from '@/services/AdminUserService';
import { useAppStore } from '@/store/app';
import { HttpError } from '@/utils/http';

const router = useRouter();
const appStore = useAppStore();

const users = ref<AdminUserSummary[]>([]);
const searchInput = ref('');
const search = ref('');
const selectedRole = ref<'all' | 'admin' | 'user'>('all');
const role = ref<'all' | 'admin' | 'user'>('all');
const selectedStatus = ref<'all' | 'active' | 'banned'>('all');
const status = ref<'all' | 'active' | 'banned'>('all');
const page = ref(1);
const pageSize = 20;
const total = ref(0);
const totalPages = ref(0);
const isLoading = ref(false);
const updatingUserId = ref<number | null>(null);
const errorMessage = ref('');
const hasFilters = computed(
  () =>
    Boolean(search.value) ||
    role.value !== 'all' ||
    status.value !== 'all',
);

async function loadUsers() {
  if (!appStore.user?.isSuperuser || !appStore.token) {
    await router.replace('/');
    return;
  }

  isLoading.value = true;
  errorMessage.value = '';
  try {
    const response = await AdminUserService.list(appStore.token, {
      page: page.value,
      pageSize,
      search: search.value,
      role: role.value,
      status: status.value,
    });
    users.value = response.items;
    total.value = response.total;
    totalPages.value = response.totalPages;
  } catch (error) {
    if (error instanceof HttpError && [401, 403].includes(error.status)) {
      await router.replace('/');
      return;
    }
    errorMessage.value = 'Не удалось загрузить список пользователей';
    console.error('Unable to load users', error);
  } finally {
    isLoading.value = false;
  }
}

async function applyFilters() {
  search.value = searchInput.value.trim();
  role.value = selectedRole.value;
  status.value = selectedStatus.value;
  await resetPageAndLoad();
}

async function clearFilters() {
  searchInput.value = '';
  search.value = '';
  selectedRole.value = 'all';
  role.value = 'all';
  selectedStatus.value = 'all';
  status.value = 'all';
  await resetPageAndLoad();
}

async function resetPageAndLoad() {
  if (page.value === 1) {
    await loadUsers();
  } else {
    page.value = 1;
  }
}

async function toggleBan(user: AdminUserSummary) {
  if (!appStore.token || updatingUserId.value !== null) return;

  updatingUserId.value = user.id;
  errorMessage.value = '';
  try {
    const updatedUser = await AdminUserService.setBanStatus(
      appStore.token,
      user.id,
      !user.isBanned,
    );
    const index = users.value.findIndex((item) => item.id === user.id);
    if (index !== -1) users.value[index] = updatedUser;

    if (appStore.user?.id === updatedUser.id) {
      appStore.setUser({
        ...appStore.user,
        isBanned: updatedUser.isBanned,
      });
    }
  } catch (error) {
    errorMessage.value = 'Не удалось изменить статус пользователя';
    console.error('Unable to update user status', error);
  } finally {
    updatingUserId.value = null;
  }
}

onMounted(loadUsers);
watch(page, loadUsers);
</script>

<style scoped>
.admin-users {
  max-width: 1100px;
  margin: 0 auto;
}

.admin-users .subtitle {
  margin-bottom: 0;
}

.admin-users-table {
  position: relative;
  min-height: 10rem;
  overflow-x: auto;
}
</style>
