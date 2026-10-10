const { withAppBuildGradle } = require('expo/config-plugins');

const MARK = 'with-bundle-inputs';

/**
 * The release build fingerprints every source file under the project root before bundling the
 * JavaScript. The design workspace keeps its Penpot database in `design/.local`, in folders
 * only Docker may read, and Gradle stops at the first one. Nothing in `design/` is part of
 * the app, so it is left out of the bundle task's inputs; the task stays cacheable.
 */
module.exports = function withBundleInputs(config) {
  return withAppBuildGradle(config, (gradle) => {
    if (!gradle.modResults.contents.includes(MARK)) {
      gradle.modResults.contents += `
// Added by plugins/${MARK}.js
tasks.configureEach { task ->
    if (task.name.startsWith('createBundle') && task.name.endsWith('JsAndAssets')) {
        task.sources.exclude('design/**')
    }
}
`;
    }
    return gradle;
  });
};
