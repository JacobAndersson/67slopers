const { AndroidConfig, withAndroidColors, withAndroidStyles } = require('expo/config-plugins');

const COLOR = 'rivetWindowBackground';
const NIGHT = '#141A2E';

/**
 * The launch window is Night from the first frame to the hand-off: the native splash is removed a
 * moment before React draws, and the activity's own window shows through in that gap. Left unset it
 * is the theme's default (black or white); Night makes it the same ground as the splash on either
 * side of it (src/components/rivet-splash.tsx). Every screen draws its own background over it.
 */
module.exports = function withNightWindow(config) {
  config = withAndroidColors(config, (c) => {
    c.modResults = AndroidConfig.Colors.assignColorValue(c.modResults, {
      name: COLOR,
      value: NIGHT,
    });
    return c;
  });
  return withAndroidStyles(config, (c) => {
    c.modResults = AndroidConfig.Styles.assignStylesValue(c.modResults, {
      add: true,
      parent: AndroidConfig.Styles.getAppThemeGroup(),
      name: 'android:windowBackground',
      value: `@color/${COLOR}`,
    });
    return c;
  });
};
