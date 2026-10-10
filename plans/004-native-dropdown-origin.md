# 004 — Open native menus from their trigger, inside the dropdown budget

- **Status**: DONE — verified on Android (grows from the top-right corner) and web. Deviation: the `asChild` structure in Target fought the primitive's own positioning opacity and the menu did not show; the animation sits on an inner box inside `Content` instead, which carries the visual classes on native.
- **Commit**: ae82517 (written against a working tree with uncommitted changes on top of it; `src/components/ui/dropdown-menu.tsx` is one of the modified files, so match on the excerpts below, not on line numbers alone)
- **Severity**: MEDIUM
- **Category**: Physicality & origin / Easing & duration
- **Estimated scope**: 1 file (`src/components/ui/dropdown-menu.tsx`), about 35 lines; may create `src/lib/motion.ts` (4 lines)

## Problem

On iOS and Android every dropdown menu (the ⋮ step menu and "Add step" in the builder, the
settings menu in the timer) appears with Reanimated's default `FadeIn`: 300ms, no scale, no
connection to the button that opened it. 300ms is over the 150–250ms budget for dropdowns,
and a pure fade gives the menu no origin. The web build of the same component already scales
from 95% at the trigger's corner.

The fade is also on the wrong element: it sits on the full-window overlay, not on the menu.

```tsx
// src/components/ui/dropdown-menu.tsx:10-12 — current
import * as React from 'react';
import { Platform, type StyleProp, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { FadeIn, ReduceMotion } from 'react-native-reanimated';
```

```tsx
// src/components/ui/dropdown-menu.tsx:86-136 — current
function DropdownMenuContent({
  className,
  overlayClassName,
  overlayStyle,
  portalHost,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Content> & {
  overlayStyle?: StyleProp<ViewStyle>;
  overlayClassName?: string;
  portalHost?: string;
}) {
  return (
    <DropdownMenuPrimitive.Portal hostName={portalHost}>
      <FullWindowOverlay>
        <DropdownMenuPrimitive.Overlay
          style={Platform.select({
            web: overlayStyle ?? undefined,
            native: overlayStyle
              ? StyleSheet.flatten([
                  StyleSheet.absoluteFill,
                  overlayStyle as typeof StyleSheet.absoluteFill,
                ])
              : StyleSheet.absoluteFill,
          })}
          className={overlayClassName}
          asChild={Platform.OS !== 'web'}>
          <NativeOnlyAnimatedView
            entering={FadeIn.reduceMotion(ReduceMotion.System)}
            as="Pressable">
            <TextClassContext.Provider value="text-popover-foreground">
              <DropdownMenuPrimitive.Content
                className={cn(
                  'min-w-[8rem] overflow-hidden rounded-md border border-border bg-popover p-1 shadow-lg shadow-black/5',
                  Platform.select({
                    web: cn(
                      'max-h-(--radix-context-menu-content-available-height) origin-(--radix-context-menu-content-transform-origin) z-50 cursor-default animate-in fade-in-0 zoom-in-95',
                      props.side === 'bottom' && 'slide-in-from-top-2',
                      props.side === 'top' && 'slide-in-from-bottom-2'
                    ),
                  }),
                  className
                )}
                {...props}
              />
            </TextClassContext.Provider>
          </NativeOnlyAnimatedView>
        </DropdownMenuPrimitive.Overlay>
      </FullWindowOverlay>
    </DropdownMenuPrimitive.Portal>
  );
}
```

Facts about the primitive you need (from
`node_modules/@rn-primitives/dropdown-menu/dist/dropdown-menu.mjs:153-224`):

- Native `Content` renders a `Pressable` (or a `Slot` when `asChild` is true) with
  `style={[positionStyle, style]}` and its own `onLayout`.
- Its defaults are `align = "start"` and `side = "bottom"`.
- Until it has measured itself it is parked off-screen with `opacity: 0`; it jumps to its
  real position on the next render. So the menu becomes visible one or two frames after mount.

The app's three call sites pass `align="end"` (`workout-settings.tsx:24`, `step-list.tsx:438`)
or `align="start"` (`step-list.tsx:119`); none passes `side`, `overlayClassName` or
`overlayStyle`.

## Target

**Native only.** Web output must be byte-for-byte what it is today.

- The overlay no longer animates.
- The menu box itself enters with opacity 0→1 and scale 0.95→1 over `150ms` on
  `Easing.bezier(0.23, 1, 0.32, 1)`, respecting `ReduceMotion.System` (instant when the OS
  setting is on, which matches every other entering animation in the repo).
- It scales from the corner nearest its trigger:

  | `side` (default `bottom`) | `align` (default `start`) | `transformOrigin` |
  | ------------------------- | ------------------------- | ----------------- |
  | `bottom`                  | `start`                   | `'top left'`      |
  | `bottom`                  | `center`                  | `'top center'`    |
  | `bottom`                  | `end`                     | `'top right'`     |
  | `top`                     | `start`                   | `'bottom left'`   |
  | `top`                     | `center`                  | `'bottom center'` |
  | `top`                     | `end`                     | `'bottom right'`  |

- Closing stays instant (no `exiting`).

```tsx
// target — module scope in src/components/ui/dropdown-menu.tsx, below the imports
/** Menus grow out of the corner nearest their trigger. */
const MENU_ENTER = new Keyframe({
  0: { opacity: 0, transform: [{ scale: 0.95 }] },
  100: { opacity: 1, transform: [{ scale: 1 }], easing: EASE_OUT },
})
  .duration(150)
  .reduceMotion(ReduceMotion.System);
```

```tsx
// target — DropdownMenuContent
function DropdownMenuContent({
  className,
  overlayClassName,
  overlayStyle,
  portalHost,
  children,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Content> & {
  overlayStyle?: StyleProp<ViewStyle>;
  overlayClassName?: string;
  portalHost?: string;
}) {
  const vertical = props.side === 'top' ? 'bottom' : 'top';
  const horizontal = props.align === 'end' ? 'right' : props.align === 'center' ? 'center' : 'left';
  return (
    <DropdownMenuPrimitive.Portal hostName={portalHost}>
      <FullWindowOverlay>
        <DropdownMenuPrimitive.Overlay
          style={/* unchanged Platform.select(...) */}
          className={overlayClassName}>
          <TextClassContext.Provider value="text-popover-foreground">
            <DropdownMenuPrimitive.Content
              className={/* unchanged cn(...) */}
              {...props}
              asChild={Platform.OS !== 'web'}>
              <NativeOnlyAnimatedView
                as="Pressable"
                entering={MENU_ENTER}
                style={{ transformOrigin: `${vertical} ${horizontal}` }}>
                <>{children}</>
              </NativeOnlyAnimatedView>
            </DropdownMenuPrimitive.Content>
          </TextClassContext.Provider>
        </DropdownMenuPrimitive.Overlay>
      </FullWindowOverlay>
    </DropdownMenuPrimitive.Portal>
  );
}
```

How this works: with `asChild`, the primitive's `Slot` hands the menu's `className`, position
`style`, `onLayout`, `ref` and accessibility props to the animated `Pressable`, so the animated
element _is_ the positioned menu box and `transformOrigin` is relative to the box itself. On
web `asChild` is false and `NativeOnlyAnimatedView` returns its children unwrapped
(`src/components/ui/native-only-animated-view.tsx:22-24`), so nothing changes there.

## Repo conventions to follow

- The same `asChild={Platform.OS !== 'web'}` + `NativeOnlyAnimatedView as="Pressable"` +
  `<>{children}</>` pattern is already used for the dialog overlay. Imitate
  `src/components/ui/alert-dialog.tsx:28-44` exactly.
- The house curve is `Easing.bezier(0.23, 1, 0.32, 1)`, exported as `EASE_OUT` from
  `src/lib/motion.ts`. Every entering animation ends with `.reduceMotion(ReduceMotion.System)`.
- UI primitives in `src/components/ui/` are React Native Reusables files; keep edits minimal
  and local so a future re-add is easy to diff.

## Steps

1. If `src/lib/motion.ts` does not exist, create it with exactly:

   ```ts
   import { Easing } from 'react-native-reanimated';

   /** Strong ease-out for anything entering, leaving or answering a touch. */
   export const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);
   ```

2. In `src/components/ui/dropdown-menu.tsx`, change the Reanimated import to
   `import { FadeIn, Keyframe, ReduceMotion } from 'react-native-reanimated';` (keep `FadeIn`;
   `DropdownMenuSubContent` still uses it) and add `import { EASE_OUT } from '@/lib/motion';`
   next to the other `@/lib` import.
3. Add the `MENU_ENTER` constant from Target at module scope, above `const DropdownMenu = ...`.
4. In `DropdownMenuContent`: destructure `children` out of the props, and add the `vertical`
   and `horizontal` constants before the `return`.
5. On `DropdownMenuPrimitive.Overlay`: delete the `asChild={Platform.OS !== 'web'}` prop and
   remove the `NativeOnlyAnimatedView` that wraps `TextClassContext.Provider`, so the provider
   is the overlay's direct child. Keep the overlay's `style` and `className` props as they are.
6. On `DropdownMenuPrimitive.Content`: keep the `className` expression and `{...props}`
   unchanged, add `asChild={Platform.OS !== 'web'}` **after** `{...props}`, and give it the
   `NativeOnlyAnimatedView` child from Target.
7. Run the mechanical checks.

## Boundaries

- Do NOT change `DropdownMenuSubContent`, `DropdownMenuSubTrigger`, the item components, or
  any web class string. Sub-menus are unused in the app.
- Do NOT add an `exiting` animation; closing a menu stays instant.
- Do NOT edit `native-only-animated-view.tsx`, `alert-dialog.tsx`, or any call site
  (`step-list.tsx`, `workout-settings.tsx`).
- Do NOT add dependencies or patch `@rn-primitives`.
- If the file does not match the excerpts (drift), STOP and report instead of improvising.
- If after step 6 a menu on a device is mispositioned, unstyled (no border / background), or
  does not close on an outside tap, STOP, revert, and report which symptom you saw. Do not
  try alternative structures.

## Verification

- **Mechanical**: `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm test` all
  pass.
- **Feel check** (iOS and Android; a device or emulator for each if available):
  - Builder → ⋮ on a step: the menu grows from its top-right corner, next to the ⋮ button,
    and is fully settled almost immediately. It must not appear to grow from its centre or
    from the top-left.
  - Builder → Add step: the menu grows from its top-left corner.
  - Timer → settings (sliders icon): grows from the top-right. Toggle Sound; the checkbox
    item still works and the menu behaves as before.
  - The menu has its border, background, rounded corners and shadow, and is in the same
    position as before this change (compare against a screenshot taken beforehand).
  - Tap outside: it closes at once. Android hardware back closes it.
  - Open a ⋮ menu near the bottom of the screen so collision avoidance flips or shifts it.
    The origin is computed from the requested side, so it may be slightly off in this case;
    note what you see, do not fix it.
  - Because the primitive parks the menu off-screen until it has measured itself, the first
    one or two frames of the 150ms are not visible. Record the screen and step through it: if
    the menu first appears already close to full size with no perceptible growth, report that;
    do not lengthen the duration past 200ms.
  - TalkBack / VoiceOver: focus still lands inside the menu when it opens.
  - OS reduce-motion on: the menu appears with no scale or fade.
  - Web: open each menu and confirm it looks and animates exactly as before.
- **Done when**: checks pass; all three native menus scale from their trigger corner in 150ms;
  position, styling, dismissal and web behaviour are unchanged.
