// Builds a web-renderable ESM bundle of the app's UI components for design-sync.
// Mirrors what `expo export --platform web` does: react-native resolves to
// react-native-web and JSX goes through NativeWind's runtime so className works.
import * as esbuild from 'esbuild';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

// react-native -> react-native-web, and react/react-dom -> the globals the
// design-sync bundle provides (window.React / window.ReactDOM). React must be a
// shim rather than an esbuild "external": NativeWind's CommonJS runtime calls
// require("react") at load time, which an external leaves unresolvable.
const SHIMS = {
  react: 'globalThis.React',
  'react-dom': 'globalThis.ReactDOM',
  'react-dom/client': 'globalThis.ReactDOM',
};

const rnwAndReact = {
  name: 'rnw-and-react',
  setup(build) {
    build.onResolve({ filter: /^react-native$/ }, () => ({
      path: path.join(root, 'node_modules/react-native-web/dist/index.js'),
    }));
    build.onResolve({ filter: /^(react|react-dom|react-dom\/client)$/ }, (args) => ({
      path: args.path,
      namespace: 'react-shim',
    }));
    build.onLoad({ filter: /.*/, namespace: 'react-shim' }, (args) => ({
      contents: `module.exports = ${SHIMS[args.path]};`,
      loader: 'js',
    }));
  },
};

await esbuild.build({
  entryPoints: [path.join(root, '.design-sync/build/entry.tsx')],
  outfile: path.join(root, '.design-sync/build/dist/index.mjs'),
  bundle: true,
  format: 'esm',
  platform: 'browser',
  target: 'es2020',
  jsx: 'automatic',
  jsxImportSource: 'nativewind',
  resolveExtensions: ['.web.tsx', '.web.ts', '.tsx', '.ts', '.web.js', '.js', '.json'],
  define: { 'process.env.NODE_ENV': '"development"', __DEV__: 'true' },
  // @rn-primitives ships JSX inside .mjs; the jsx loader is a superset of js.
  loader: { '.mjs': 'jsx' },
  tsconfig: path.join(root, 'tsconfig.json'),
  plugins: [rnwAndReact],
  logLevel: 'info',
});
