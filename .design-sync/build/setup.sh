#!/usr/bin/env sh
# Rebuilds the local `hangboard-ui` package that design-sync consumes.
# See ../NOTES.md for why each step exists. Run from the repo root.
set -e

ln -sfn ../.ds-sync/node_modules .design-sync/node_modules

mkdir -p .design-sync/build/pkg/dist .design-sync/build/pkg/fonts
cat > .design-sync/build/pkg/package.json <<'JSON'
{
  "name": "hangboard-ui",
  "version": "1.0.0",
  "private": true,
  "module": "dist/index.mjs",
  "main": "dist/index.mjs",
  "types": "dist/index.d.ts"
}
JSON

# Component bundle: react-native -> react-native-web, NativeWind JSX runtime.
node .design-sync/build/build.mjs
cp .design-sync/build/dist/index.mjs .design-sync/build/pkg/dist/index.mjs

# Type declarations, plus the hand-written barrel.
npx tsc -p .design-sync/build/tsconfig.dts.json
cp .design-sync/build/index.d.ts .design-sync/build/pkg/dist/index.d.ts

# Stylesheet (safelisted so the design agent has a real utility vocabulary).
npx tailwindcss -c .design-sync/build/tailwind.ds.js -i src/global.css \
  -o .design-sync/build/pkg/dist/styles.css

# Fonts: @font-face css rewritten to sit beside the copied .ttf files.
cp assets/fonts/*.ttf .design-sync/build/pkg/fonts/
sed 's#\.\./assets/fonts/#./fonts/#' .design-sync/fonts.css > .design-sync/build/pkg/fonts.css

ln -sfn ../.design-sync/build/pkg node_modules/hangboard-ui
echo "hangboard-ui ready at node_modules/hangboard-ui"
