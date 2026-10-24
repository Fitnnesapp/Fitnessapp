// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  {
    // three.js-Elemente (<mesh position={...}>) sind keine DOM-Elemente, die Regel kennt ihre Props nicht
    files: ['src/components/three/**'],
    rules: { 'react/no-unknown-property': 'off' },
  },
]);
