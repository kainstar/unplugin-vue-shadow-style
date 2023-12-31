import { Plugin, createFilter, FilterPattern } from 'vite';
import { transformShadowStyle } from './core.js';

export interface Options {
  include?: FilterPattern;
  exclude?: FilterPattern;
}

const name = 'vue:shadow-style';

const vitePluginVueShadowStyle = (options?: Options): Plugin => {
  const filter = createFilter(options?.include ?? /\.vue$/, options?.exclude);

  let root = process.cwd();
  let isProduction = process.env.NODE_ENV === 'production';

  return {
    name,
    enforce: 'pre' as const,

    configResolved(config) {
      root = config.root;
      isProduction = config.isProduction;
    },

    async handleHotUpdate({ modules, timestamp, server }) {
      modules.forEach(async (module) => {
        // find shadow style block
        if (module.id?.match(/\?vue&type=style&.*&shadow=true.*?inline$/)) {
          module.importers.forEach((importer) => {
            // https://github.com/vitejs/vite/issues/6871#issuecomment-1214559647
            // simulate a inline module hmr asset update manually, with right acceptPath and path
            server.ws.send({
              type: 'update',
              updates: [
                {
                  acceptedPath: module.url,
                  path: importer.url,
                  timestamp: timestamp,
                  type: 'js-update',
                },
              ],
            });
          });
        }
      });
    },

    async transform(code, id) {
      if (!filter(id)) {
        return;
      }

      try {
        return await transformShadowStyle.call(this, code, id, {
          isProduction,
          root,
        });
      } catch (error: unknown) {
        this.error(`[${name}]: ${error}`);
      }
    },
  };
};

export default vitePluginVueShadowStyle;
