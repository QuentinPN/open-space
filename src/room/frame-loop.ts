// The rooms' clock: about 15 frames a second, none while the tab is hidden (both room styles, RoomView.tsx and cozy/).

export const FRAME_MS = 1000 / 15;

/**
 * Runs `frame` every FRAME_MS while the page is shown, from now on; `resume` runs just before the first frame of each
 * run, so a clock can pick up from there. Returns what stops it.
 */
export function runFrames(frame: () => void, resume: () => void = () => {}): () => void {
  let timer: number | undefined;
  const start = () => {
    if (timer !== undefined || document.hidden) return;
    resume();
    frame();
    timer = window.setInterval(frame, FRAME_MS);
  };
  const stop = () => { window.clearInterval(timer); timer = undefined; };
  const onVisibility = () => (document.hidden ? stop() : start());
  document.addEventListener('visibilitychange', onVisibility);
  start();
  return () => { stop(); document.removeEventListener('visibilitychange', onVisibility); };
}
