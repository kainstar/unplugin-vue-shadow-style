<script setup lang="ts">
import { ref } from 'vue';

const count = ref(0);
</script>

<template>
  <div>
    <a href="https://vuejs.org/" target="_blank">
      <img src="./assets/vue.svg" class="logo vue" alt="Vue logo" />
    </a>
  </div>
  <h1>Vue in Shadow DOM</h1>

  <div class="card">
    <button type="button" @click="count++">count is {{ count }}</button>
  </div>

  <p class="read-the-docs">Click on the Vue logos to learn more</p>
</template>

<style lang="scss" scoped shadow>
.logo {
  height: 12em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;

  &.vue:hover {
    filter: drop-shadow(0 0 2em #42b883aa);
  }
}
</style>

<style src="./app.scss" shadow lang="scss"></style>
