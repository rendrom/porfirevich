<template>
  <div v-if="user">
    <div class="media">
      <div v-if="user.photoUrl" class="media-left">
        <figure class="image is-48x48">
          <img :src="user.photoUrl" />
        </figure>
      </div>
      <div class="media-content">
        <p class="title is-4">{{ user.username }}</p>
        <p class="subtitle is-6">{{ user.email }}</p>
      </div>
      <div>
        <b-tooltip
          type="is-dark"
          :label="
            user.isBanned
              ? 'Разблокировать пользователя'
              : 'Заблокировать пользователя'
          "
        >
          <b-button
            :icon-left="user.isBanned ? 'restore' : 'delete'"
            :type="user.isBanned ? 'is-light' : 'is-danger'"
            :loading="isBanLoading"
            @click="onBanBtnClick"
          />
        </b-tooltip>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { BButton, BTooltip } from 'buefy';
import { ref } from 'vue';

import type { User } from '@shared/types/User';

import UserService from '@/services/UserService';

const user = defineModel<User>('user', { required: true });
const isBanLoading = ref(false);

async function onBanBtnClick() {
  isBanLoading.value = true;
  try {
    const isBanned = !user.value.isBanned;
    await UserService.edit(String(user.value.id), { isBanned });
    user.value = { ...user.value, isBanned };
  } catch (error) {
    console.error(error);
  } finally {
    isBanLoading.value = false;
  }
}
</script>
