import { readonly, ref } from 'vue';

export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = Exclude<ThemePreference, 'system'>;

const STORAGE_KEY = 'porfirevich-theme';
const SYSTEM_THEME_QUERY = '(prefers-color-scheme: dark)';

const themePreference = ref<ThemePreference>('system');
const resolvedTheme = ref<ResolvedTheme>('light');

let mediaQuery: MediaQueryList | undefined;
let initialized = false;

function isThemePreference(value: string | null): value is ThemePreference {
  return value === 'light' || value === 'dark' || value === 'system';
}

function applyTheme() {
  const theme =
    themePreference.value === 'system'
      ? mediaQuery?.matches
        ? 'dark'
        : 'light'
      : themePreference.value;

  resolvedTheme.value = theme;
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

function handleSystemThemeChange() {
  if (themePreference.value === 'system') applyTheme();
}

export function initializeTheme() {
  if (initialized) return;

  const storedTheme = window.localStorage.getItem(STORAGE_KEY);
  themePreference.value = isThemePreference(storedTheme)
    ? storedTheme
    : 'system';

  mediaQuery = window.matchMedia(SYSTEM_THEME_QUERY);
  mediaQuery.addEventListener('change', handleSystemThemeChange);
  initialized = true;
  applyTheme();
}

export function setThemePreference(theme: ThemePreference) {
  themePreference.value = theme;
  window.localStorage.setItem(STORAGE_KEY, theme);
  applyTheme();
}

export function useTheme() {
  return {
    themePreference: readonly(themePreference),
    resolvedTheme: readonly(resolvedTheme),
    setThemePreference,
  };
}
