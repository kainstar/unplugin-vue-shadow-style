/// <reference types="vite/client" />

import { getCurrentInstance, onMounted } from 'vue';

function getShadowRoot(node?: Node | null) {
  let parent = node && node.parentNode;
  while (parent) {
    if (parent.toString() === '[object ShadowRoot]') {
      return parent;
    }
    parent = parent.parentNode;
  }
  return null;
}

export function useShadowStyle(style: string, requestId: string) {
  let styleElement: HTMLStyleElement | null = null;

  onMounted(() => {
    const instance = getCurrentInstance();

    const styleQuery = `style[data-shadow-style-id="${requestId}"]`;

    const componentEl = instance?.vnode.el;
    const shadowRoot = getShadowRoot(componentEl as Node);

    if (!shadowRoot) {
      return;
    }

    const existStyle = shadowRoot?.querySelector(styleQuery);
    if (existStyle) {
      return;
    }

    styleElement = document.createElement('style');
    styleElement.dataset.shadowStyleId = requestId;
    styleElement.innerHTML = style;
    shadowRoot?.prepend(styleElement);
  });

  return (newStyle: string) => {
    if (!styleElement) {
      return;
    }
    styleElement.innerHTML = newStyle;
  };
}
