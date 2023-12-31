# vite-plugin-vue-shadow-style

[![npm package][npm-img]][npm-url] [![Build Status][build-img]][build-url] [![Downloads][downloads-img]][downloads-url] [![Issues][issues-img]][issues-url] [![Code Coverage][codecov-img]][codecov-url] [![Commitizen Friendly][commitizen-img]][commitizen-url] [![Semantic Release][semantic-release-img]][semantic-release-url]

Plugin to inject Vue setup SFC style to shadow root.

Typically, the framework injects the style into the document head when assets are loaded, indicating that it is static. However, in the shadow DOM, the style should be injected dynamically into the shadow root where the component is rendered.

This plugin will recognize the style blocks with the `shadow` attribute and help you inject them into the shadow root in runtime.

## Install

```bash
npm install vite-plugin-vue-shadow-style --save-dev
yarn add vite-plugin-vue-shadow-style -D
pnpm add vite-plugin-vue-shadow-style -D
```

## Usage

### Config Bundler

```ts vite.config.ts
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

import vueShadowStyle from 'vite-plugin-vue-shadow-style';

export default defineConfig({
  plugins: [vue(), vueShadowStyle()],
});
```

### Write SFC

This plugin use composition API to inject style to shadow root, so you should use `<script setup>` to write your component.

```vue
<script setup lang="ts"></script>

<template>
  <h1>Vue in Shadow DOM</h1>
</template>

<!-- Add `shadow` attr on style block which you want to inject in runtime -->
<style scoped shadow>
h1 {
  color: red;
}
</style>

<!-- import other files also okay -->
<style src="./style.scss" shadow></style>
```

[build-img]: https://github.com/kainstar/vite-plugin-vue-shadow-style/actions/workflows/release.yml/badge.svg
[build-url]: https://github.com/kainstar/vite-plugin-vue-shadow-style/actions/workflows/release.yml
[downloads-img]: https://img.shields.io/npm/dt/vite-plugin-vue-shadow-style
[downloads-url]: https://www.npmtrends.com/vite-plugin-vue-shadow-style
[npm-img]: https://img.shields.io/npm/v/vite-plugin-vue-shadow-style
[npm-url]: https://www.npmjs.com/package/vite-plugin-vue-shadow-style
[issues-img]: https://img.shields.io/github/issues/kainstar/vite-plugin-vue-shadow-style
[issues-url]: https://github.com/kainstar/vite-plugin-vue-shadow-style/issues
[codecov-img]: https://codecov.io/gh/kainstar/vite-plugin-vue-shadow-style/branch/main/graph/badge.svg
[codecov-url]: https://codecov.io/gh/kainstar/vite-plugin-vue-shadow-style
[semantic-release-img]: https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg
[semantic-release-url]: https://github.com/semantic-release/semantic-release
[commitizen-img]: https://img.shields.io/badge/commitizen-friendly-brightgreen.svg
[commitizen-url]: http://commitizen.github.io/cz-cli/
