import { useEffect, useRef, type PropsWithChildren } from 'react';
import { ScrollView } from 'react-native';

/** Mouse dragging supplements the browser's touch, trackpad and keyboard scrolling. */
export function WorkoutRail({ children }: PropsWithChildren) {
  const ref = useRef<ScrollView>(null);

  useEffect(() => {
    const node = ref.current?.getScrollableNode() as HTMLElement | undefined;
    if (!node) return;
    let press: { x: number; y: number; left: number; dragged: boolean } | undefined;
    let blockClick = false;
    const originalCursor = node.style.cursor;
    node.style.cursor = 'grab';

    const down = (event: PointerEvent) => {
      blockClick = false;
      if (event.pointerType !== 'mouse' || event.button !== 0) return;
      press = { x: event.clientX, y: event.clientY, left: node.scrollLeft, dragged: false };
    };
    const move = (event: PointerEvent) => {
      if (!press) return;
      const dx = event.clientX - press.x;
      if (!press.dragged && (Math.abs(dx) < 6 || Math.abs(dx) < Math.abs(event.clientY - press.y)))
        return;
      press.dragged = true;
      blockClick = true;
      node.style.cursor = 'grabbing';
      node.scrollLeft = press.left - dx;
      event.preventDefault();
    };
    const release = () => {
      press = undefined;
      node.style.cursor = 'grab';
    };
    const click = (event: MouseEvent) => {
      if (!blockClick) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      blockClick = false;
    };
    const key = (event: KeyboardEvent) => {
      if (event.target !== node) return;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        node.scrollLeft += node.clientWidth * 0.8 * (event.key === 'ArrowRight' ? 1 : -1);
      } else if (event.key === 'Home') node.scrollLeft = 0;
      else if (event.key === 'End') node.scrollLeft = node.scrollWidth;
      else return;
      event.preventDefault();
    };

    node.addEventListener('pointerdown', down);
    node.addEventListener('click', click, true);
    node.addEventListener('keydown', key);
    window.addEventListener('pointermove', move, { passive: false });
    window.addEventListener('pointerup', release);
    window.addEventListener('pointercancel', release);
    window.addEventListener('blur', release);
    return () => {
      node.style.cursor = originalCursor;
      node.removeEventListener('pointerdown', down);
      node.removeEventListener('click', click, true);
      node.removeEventListener('keydown', key);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', release);
      window.removeEventListener('pointercancel', release);
      window.removeEventListener('blur', release);
    };
  }, []);

  return (
    <ScrollView
      ref={ref}
      horizontal
      className="grow-0 select-none"
      contentContainerClassName="gap-3"
      showsHorizontalScrollIndicator={false}
      role="region"
      tabIndex={0}
      accessibilityLabel="Saved workouts, drag or use arrow keys to browse">
      {children}
    </ScrollView>
  );
}
