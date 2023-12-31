import { createApp } from 'vue';
import App from './App.vue';

// render vue into shadow root
const appContainer = document.querySelector('#app')!;
const shadowRoot = appContainer.attachShadow({ mode: 'open' });
const shadowRootContainer = document.createElement('div');
shadowRootContainer.id = 'shadow-root-container';
shadowRoot.appendChild(shadowRootContainer);
createApp(App).mount(shadowRootContainer);
