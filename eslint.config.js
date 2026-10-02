import js from '@eslint/js';
import globals from 'globals';

export default [
  { ignores: ['assets/**', 'node_modules/**', '_site/**'] },
  js.configs.recommended,
  {
    files: ['_js/**/*.js'],
    languageOptions: { ecmaVersion: 2022, sourceType: 'module', globals: globals.browser },
    rules: { eqeqeq: 'error', 'no-var': 'error', 'prefer-const': 'error' }
  },
  {
    files: ['scripts/**/*.mjs', 'tests/**/*.js', 'eslint.config.js'],
    languageOptions: { ecmaVersion: 2022, sourceType: 'module', globals: globals.node }
  }
];
