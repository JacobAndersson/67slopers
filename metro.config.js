const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('node:path');

const config = getDefaultConfig(__dirname);

// Keep Metro's file crawler out of tooling output. `.ds-sync` holds a second
// node_modules tree and `node_modules/hangboard-ui` symlinks into
// `.design-sync/build`, which otherwise stalls the initial crawl and the manifest.
const ignored = [
  '.media-work',
  '.ds-sync',
  '.design-sync',
  'ds-bundle',
  'dist',
  'competitors',
  'design',
  'node_modules/hangboard-ui',
];
config.resolver.blockList = [
  ...(Array.isArray(config.resolver.blockList)
    ? config.resolver.blockList
    : [config.resolver.blockList]
  ).filter(Boolean),
  ...ignored.map(
    (dir) =>
      new RegExp(`^${path.resolve(__dirname, dir).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(/.*)?$`)
  ),
  // Native build output, in the app and in every library: a Gradle build churns these folders
  // and crashed the file watcher while Metro was running.
  /[/\\]android[/\\](app[/\\])?build[/\\].*/,
  /[/\\]android[/\\]\.(gradle|cxx)[/\\].*/,
];

module.exports = withNativeWind(config, { input: './src/global.css', inlineRem: 16 });
