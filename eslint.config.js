import js from '@eslint/js';
import { includeIgnoreFile } from '@eslint/compat';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';
import { fileURLToPath } from 'node:url';
import ts from 'typescript-eslint';
import svelteConfig from './svelte.config.js';
const gitignorePath = fileURLToPath(new URL('./.gitignore', import.meta.url));

const pedanticWarn = process.env.PEDANTIC ? 'warn' : 'off';

export default ts.config(
  includeIgnoreFile(gitignorePath),
  js.configs.recommended,
  ...ts.configs.recommendedTypeChecked,
  ...svelte.configs['flat/recommended'],
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  {
    files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],
    ignores: ['eslint.config.js', 'svelte.config.js'],

    languageOptions: {
      parserOptions: {
        projectService: true,
        extraFileExtensions: ['.svelte'],
        parser: ts.parser,
        svelteConfig,
        svelteFeatures: {
          experimentalGenerics: true,
        },
      },
    },
    rules: {
      'no-unexpected-multiline': 'off',
      'prefer-const': 'off',
      // This ends up duplicating the svelte warnings in the editor
      'svelte/valid-compile': pedanticWarn,
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-unsafe-return': pedanticWarn,
      '@typescript-eslint/no-unsafe-call': pedanticWarn,
      '@typescript-eslint/no-unsafe-member-access': pedanticWarn,
      '@typescript-eslint/no-unsafe-assignment': pedanticWarn,
      '@typescript-eslint/no-unsafe-argument': pedanticWarn,
      '@typescript-eslint/no-unsafe-return': pedanticWarn,
      '@typescript-eslint/no-explicit-any': pedanticWarn,
      '@typescript-eslint/require-await': pedanticWarn,
      // Doesn't work properly with zod's z.infer
      '@typescript-eslint/no-redundant-type-constituents': 'off',
      '@typescript-eslint/no-floating-promises': [
        'error',
        {
          allowForKnownSafeCalls: ['goto', 'invalidate', 'invalidateAll'],
        },
      ],
    },
  }
);
