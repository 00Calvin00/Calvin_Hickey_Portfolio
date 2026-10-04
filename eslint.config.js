import js from '@eslint/js';
import globals from 'globals';

export default [
  { ignores: ['node_modules/', '.lighthouseci/'] },
  js.configs.recommended,
  {
    files: ['site/**/*.js'],
    languageOptions: { ecmaVersion: 'latest', sourceType: 'module', globals: globals.browser },
  },
  {
    files: ['*.js', '*.cjs', 'scripts/**/*.js'],
    languageOptions: { ecmaVersion: 'latest', globals: globals.node },
  },
];
