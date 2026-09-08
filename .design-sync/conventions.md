## What these components are

The real UI of the Hangboard app: React Native components (Expo + NativeWind),
compiled for the browser with react-native-web. They render as ordinary DOM,
need **no provider and no wrapper** — link `styles.css`, load `_ds_bundle.js`,
and use `window.HangboardUI.*` directly.

## Three rules that silently break the output if missed

1. **Every string must be inside `Text`.** React Native cannot render a bare
   string. `<Card>Repeaters</Card>` renders nothing;
   `<Card><Text>Repeaters</Text></Card>` is correct. Button labels included:
   `Button` takes children, not a label prop —
   `<Button><Text>Start session</Text></Button>`.
2. **`className` works on every component but is absent from the `.d.ts`.**
   The generated types are React Native's inherited props (mostly
   accessibility); the design-system API on top of them is `variant`, `size`,
   `asChild` and `className`. Style with `className` — never invent style props.
3. **Only the classes listed below exist.** `styles.css` is a compiled Tailwind
   build, not a runtime. Arbitrary values (`p-7`, `text-[13px]`,
   `bg-[#ff0000]`) do not resolve and render unstyled.

## Styling idiom: NativeWind utility classes

Tailwind classes on `className`, resolving to the theme's HSL custom
properties. The shipped vocabulary:

| Family                                                               | Values                                                                                                                                                                                                                                                                                         |
| -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Color (`bg-`, `text-`, `border-`)                                    | `background` `foreground` `card` `card-foreground` `popover` `popover-foreground` `primary` `primary-foreground` `secondary` `secondary-foreground` `muted` `muted-foreground` `accent` `accent-foreground` `destructive` `destructive-foreground` `border` `input` `ring` `chart-1`…`chart-5` |
| Spacing (`p- px- py- pt- pb- pl- pr- m- mx- my- mt- mb- gap- w- h-`) | `0 0.5 1 1.5 2 2.5 3 4 5 6 8 10 12 16 20 24`                                                                                                                                                                                                                                                   |
| Type size                                                            | `text-xs` … `text-6xl`                                                                                                                                                                                                                                                                         |
| Weight                                                               | `font-normal` `font-medium` `font-semibold` `font-bold` `font-extrabold`                                                                                                                                                                                                                       |
| Radius                                                               | `rounded-none sm md lg xl full`                                                                                                                                                                                                                                                                |
| Layout                                                               | `flex` `flex-row` `flex-col` `flex-1` `items-*` `justify-*` `self-*` `w-full` `max-w-sm…max-w-3xl` `text-center` `tracking-tight` `opacity-50` `shadow-sm`                                                                                                                                     |

**Weights are font families here.** Each Geist Mono weight is registered under
its own family name, and the `font-*` utilities select the matching family —
so `font-semibold` is how you get semibold, and a raw CSS `font-weight` will
not work.

## Component API

- `Text` — `variant`: `default h1 h2 h3 h4 p blockquote code lead large small muted`
- `Button` — `variant`: `default secondary outline ghost link destructive`; `size`: `default sm lg icon`
- `Card` with `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`

There is no `View` export. For your own layout glue use a plain `<div>` with
the utility classes above — the classes are real CSS and apply normally.
Note that `Card` stacks its children in a column and `CardFooter` lays them
out in a row, matching the components' own source.

## Where the truth lives

- `styles.css` and its imports (`_ds_bundle.css`, `fonts/fonts.css`) — every
  token and every class that actually ships. Read it before styling.
- `components/general/<Name>/<Name>.prompt.md` — per-component props and usage.

## Idiomatic example

```jsx
const { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Button, Text } =
  window.HangboardUI;

<div className="flex max-w-md flex-col gap-4">
  <Text variant="h3">Today</Text>
  <Card>
    <CardHeader>
      <CardTitle>Repeaters 7:3</CardTitle>
      <CardDescription>6 sets, 18 minutes</CardDescription>
    </CardHeader>
    <CardContent>
      <Text variant="muted">20 mm edge, half crimp</Text>
    </CardContent>
    <CardFooter>
      <Button>
        <Text>Start session</Text>
      </Button>
    </CardFooter>
  </Card>
</div>;
```
