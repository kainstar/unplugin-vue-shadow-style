import { createHash } from 'node:crypto';
import { TransformResult } from 'vite';
import path from 'path';
import slash from 'slash';
import { type SFCBlock, SFCStyleBlock, SFCDescriptor, MagicString, parse } from 'vue/compiler-sfc';

declare module 'vue/compiler-sfc' {
  interface SFCDescriptor {
    id: string;
  }
}

/**
 * get style block request id
 * copy from https://github.com/vitejs/vite-plugin-vue/blob/main/packages/plugin-vue/src/main.ts
 */
const ignoreList = ['id', 'index', 'src', 'type', 'lang', 'module', 'scoped', 'generic'];

function attrsToQuery(attrs: SFCBlock['attrs'], langFallback?: string, forceLangFallback = false): string {
  let query = ``;
  for (const name in attrs) {
    const value = attrs[name];
    if (!ignoreList.includes(name)) {
      query += `&${encodeURIComponent(name)}${value ? `=${encodeURIComponent(value)}` : ``}`;
    }
  }
  if (langFallback || attrs.lang) {
    query +=
      `lang` in attrs ? (forceLangFallback ? `&lang.${langFallback}` : `&lang.${attrs.lang}`) : `&lang.${langFallback}`;
  }
  return query;
}

function getStyleRequest(style: SFCStyleBlock, descriptor: SFCDescriptor, guessScopeHash: string, index: number) {
  const src = style.src || descriptor.filename;
  const descriptorId = descriptor.id || guessScopeHash;
  // do not include module in default query, since we use it to indicate
  // that the module needs to export the modules json
  const attrsQuery = attrsToQuery(style.attrs, 'css');
  const srcQuery = style.src ? (style.scoped ? `&src=${descriptorId}` : '&src=true') : '';
  const scopedQuery = style.scoped ? `&scoped=${descriptorId}` : ``;
  const query = `?vue&type=style&index=${index}${srcQuery}${scopedQuery}`;
  const styleRequest = src + query + attrsQuery;

  return styleRequest;
}
/** copy end */

const createShadowStyleIdentifier = (index: number) => `_shadow_style_${index}`;

// https://github.com/vitejs/vite-plugin-vue/blob/main/packages/plugin-vue/src/utils/descriptorCache.ts
function getHash(text: string): string {
  return createHash('sha256').update(text).digest('hex').substring(0, 8);
}

// function nearestOffsetBefore(blocks: SFCBlock[], targetOffset: number) {
//   let nearest = 0;
//   for (const block of blocks) {
//     // true offset is in `</type>`'s end instead of start
//     const blockEndOffset = block.loc.end.offset + block.type.length + 3;
//     if (blockEndOffset < targetOffset && blockEndOffset > nearest) {
//       nearest = blockEndOffset;
//     }
//   }
//   return nearest;
// }

export async function transformShadowStyle(
  code: string,
  id: string,
  options: {
    isProduction: boolean;
    root: string;
  },
): Promise<TransformResult | void> {
  const { isProduction, root } = options;

  const sfc = parse(code, {
    filename: id,
  });

  if (!sfc.descriptor.scriptSetup) {
    return;
  }

  const normalizedPath = slash(path.normalize(path.relative(root, id)));
  const guessDescriptorId = sfc.descriptor.id ?? getHash(normalizedPath + (isProduction ? code : ''));

  const styles = sfc.descriptor.styles;
  const scriptSetup = sfc.descriptor.scriptSetup;
  const hasShadowStyle = styles.some((style) => style.attrs.shadow);

  if (!hasShadowStyle) {
    return;
  }

  const s = new MagicString(code);
  const scriptSetupStart = scriptSetup.loc.start.offset;
  const scriptSetupEnd = scriptSetup.loc.end.offset;

  s.prependLeft(scriptSetupStart, "\nimport { useShadowStyle } from 'vite-plugin-vue-shadow-style/dist/client'\n");

  styles.forEach((style, index) => {
    if (style.attrs.shadow) {
      const styleIdentifier = createShadowStyleIdentifier(index);
      const updateMethodIdentifier = `update${styleIdentifier}`;
      const styleRequestId = getStyleRequest(style, sfc.descriptor, guessDescriptorId, index);
      // TODO: production mode should use uniq id instead of fullRequestId
      const fullRequestId = path.isAbsolute(styleRequestId)
        ? styleRequestId
        : path.resolve(path.dirname(sfc.descriptor.filename), styleRequestId);
      s.prependLeft(scriptSetupStart, `\nimport ${styleIdentifier} from '${styleRequestId}?inline'\n`);
      s.appendRight(
        scriptSetupEnd,
        `\nconst ${updateMethodIdentifier} = useShadowStyle(${styleIdentifier}, '${
          isProduction ? getHash(fullRequestId) : fullRequestId
        }')\n`,
      );
      const relativeHotAcceptPath = path.relative(root, fullRequestId);

      // insert hmr accept handler
      if (!isProduction) {
        const viteClientHotHandler =
          `import.meta.hot?.accept("/${relativeHotAcceptPath}?inline", async (mod) => {\n` +
          `  ${updateMethodIdentifier}(mod.default);\n` +
          `});\n`;
        s.appendRight(scriptSetupEnd, viteClientHotHandler);
      }

      // if (style.attrs.shadow === 'only') {
      //   const blocks = [sfc.scriptSetup, sfc.template, ...sfc.styles, ...sfc.customBlocks].filter(
      //     (v): v is SFCBlock => !!v,
      //   );
      //   const prevOffset = nearestOffsetBefore(blocks, style.loc.start.offset);
      //   const nextOffset = style.loc.end.offset + style.type.length + 3;

      //   s.remove(prevOffset, nextOffset);
      // }
    }
  });

  if (s.hasChanged()) {
    return {
      code: s.toString(),
      map: s.generateMap({
        source: id,
        includeContent: true,
        hires: 'boundary',
      }) as any,
    };
  }
}
