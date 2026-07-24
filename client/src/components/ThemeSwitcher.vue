<template>
  <b-dropdown
    v-model="selectedTheme"
    position="is-bottom-left"
    aria-role="menu"
    trap-focus
    class="theme-switcher"
  >
    <template #trigger>
      <b-button
        type="is-ghost"
        class="theme-trigger"
        :icon-left="currentOption.icon"
        :aria-label="`Тема: ${currentOption.label}`"
        :title="`Тема: ${currentOption.label}`"
      />
    </template>

    <b-dropdown-item
      v-for="option in themeOptions"
      :key="option.value"
      :value="option.value"
      aria-role="menuitem"
    >
      <span class="theme-option">
        <b-icon :icon="option.icon" size="is-small" />
        <span class="theme-option-label">{{ option.label }}</span>
        <b-icon
          v-if="selectedTheme === option.value"
          icon="check"
          size="is-small"
        />
      </span>
    </b-dropdown-item>
  </b-dropdown>
</template>

<script setup lang="ts">
import { BButton, BDropdown, BDropdownItem, BIcon } from 'buefy';
import { computed } from 'vue';

import {
  setThemePreference,
  type ThemePreference,
  useTheme,
} from '@/composables/useTheme';

const themeOptions: {
  value: ThemePreference;
  label: string;
  icon: string;
}[] = [
  { value: 'light', label: 'Светлая', icon: 'white-balance-sunny' },
  { value: 'dark', label: 'Тёмная', icon: 'weather-night' },
  { value: 'system', label: 'Системная', icon: 'circle-half-full' },
];

const { themePreference } = useTheme();
const selectedTheme = computed({
  get: () => themePreference.value,
  set: setThemePreference,
});
const currentOption = computed(
  () =>
    themeOptions.find((option) => option.value === selectedTheme.value) ||
    themeOptions[2],
);
</script>

<style scoped>
.theme-trigger {
  color: var(--bulma-text);
  text-decoration: none;
}

.theme-option {
  display: flex;
  align-items: center;
  min-width: 9rem;
  gap: 0.5rem;
}

.theme-option-label {
  flex: 1;
}
</style>
