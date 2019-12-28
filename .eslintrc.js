module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    amd: true,
    es6: true
  },
  parser: 'vue-eslint-parser',
  parserOptions: {
    parser: '@typescript-eslint/parser'
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'plugin:vue/recommended',
    '@vue/standard',
    '@vue/typescript'
  ],
  rules: {
    'vue/no-v-html': 0,
    quotes: ['error', 'single'],
    semi: ['error', 'always'],
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off'
  }
};
