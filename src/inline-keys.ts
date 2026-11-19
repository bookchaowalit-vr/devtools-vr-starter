// Keyboard look-around for the inline 3D preview. OrbitControls' own key
// handling pans with the arrows; for a "look around" preview the arrows rotate.

/** Radians turned per arrow-key press. */
export const KEY_ROTATE_STEP = Math.PI / 24;

/** Rotation for one key press as [left, up] radians, or null when the key is not a look key. */
export function keyRotation(key: string): [number, number] | null {
  switch (key) {
    case "ArrowLeft":
      return [KEY_ROTATE_STEP, 0];
    case "ArrowRight":
      return [-KEY_ROTATE_STEP, 0];
    case "ArrowUp":
      return [0, KEY_ROTATE_STEP];
    case "ArrowDown":
      return [0, -KEY_ROTATE_STEP];
    default:
      return null;
  }
}
