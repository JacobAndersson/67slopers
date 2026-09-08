const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('node:path');

const config = getDefaultConfig(__dirname);

// Keep Metro's file crawler out of tooling output. `.ds-sync` holds a second
// node_modules tree and `node_modules/hangboard-ui` symlinks into
// `.design-sync/build`, which otherwise stalls the initial crawl and the manifest.
const ignored = [
  '.ds-sync',
  '.design-sync',
  'ds-bundle',
  'dist',
  'competitors',
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
];

module.exports = withNativeWind(config, { input: './src/global.css', inlineRem: 16 });
