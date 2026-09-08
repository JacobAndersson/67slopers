export { Text, TextClassContext } from '@/components/ui/text';
export { Button, buttonTextVariants, buttonVariants } from '@/components/ui/button';
export {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

// react-native-web injects `<style id="react-native-stylesheet">` into <head>.
// The design-sync render check picks a preview's root with
// `querySelectorAll('#root, [id^="r"]')` and takes the first match in document
// order — which would be that <style> in <head> rather than the preview root in
// <body>, making every preview look empty. RNW keeps its own reference to the
// element, so renaming it once mounted is inert for styling and keeps the
// render check pointed at the real root.
function renameRnwStyleTag() {
  if (typeof document === 'undefined') return;
  const sheet = document.getElementById('react-native-stylesheet');
  if (sheet) sheet.setAttribute('id', 'ds-react-native-stylesheet');
}
renameRnwStyleTag();
if (typeof queueMicrotask === 'function') queueMicrotask(renameRnwStyleTag);
if (typeof setTimeout === 'function') setTimeout(renameRnwStyleTag, 0);
