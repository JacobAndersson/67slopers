import { Easing } from 'react-native-reanimated';

/** Strong ease-out for anything entering, leaving or answering a touch. */
export const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);

/** The dock's tile and anything that settles the same way: quick, no overshoot to speak of. */
export const SPRING_SETTLE = { stiffness: 360, damping: 32, mass: 0.6 };
