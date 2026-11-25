/**
 * The web draws no field: Skia there would mean loading CanvasKit, and the ground is enough.
 * Same props as the native field, so the runner does not branch.
 */
export default function HangField(_props: {
  width: number;
  height: number;
  target: unknown;
  deep: string;
}) {
  return null;
}
