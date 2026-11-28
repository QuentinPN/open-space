import { useEffect, useRef, useState, type FocusEvent, type KeyboardEvent, type PointerEvent as ReactPointerEvent } from 'react';
import { FIELD, newGame, step, togglePause, type Controls, type Game } from '../arcade/game.ts';
import { paintGame } from '../arcade/paint.ts';
import { t } from '../i18n/index.ts';
import { readPreference, writePreference } from '../lib/preferences.ts';
import { closeArcade, useArcade } from '../state/arcade.ts';
import { placePip, PIP_HEAD, PIP_MARGIN } from '../state/pip.ts';
import type { Box } from '../state/room-frame.ts';
import { boxVariables, floatingSurface } from './boxes.ts';
import { ArcadeIcon, ChevronLeftIcon, ChevronRightIcon, CloseIcon, PauseIcon, PlayIcon, SprayIcon } from './Icons.tsx';
import { INTERACTIVE } from './useWindowDrag.ts';

/** how far a press on its title bar goes before it carries the window */
const CARRY_AFTER = 4;
/** the screen's frame round the field and the row of buttons under it, in CSS pixels (components.css .cp-arcade) */
const FRAME = 10, BUTTONS = 52;
/** the longest slice of time a frame plays (a tab come back, a slow frame): the game does not jump */
const MOST_MS = 50;
const BEST_KEY = 'arcade:best';
const PLACE_KEY = 'arcade-placement';

/** The field's CSS pixels per field pixel: as big as the page allows, up to 3. */
function zoomFor(surface: { width: number; height: number; top?: number }) {
  const room = { width: surface.width - 2 * PIP_MARGIN - 2 * FRAME, height: surface.height - (surface.top ?? PIP_MARGIN) - PIP_MARGIN - PIP_HEAD - BUTTONS - 2 * FRAME };
  return Math.max(1, Math.min(3, Math.floor(room.width / FIELD.width), Math.floor(room.height / FIELD.height)));
}

/** The keys that play: arrows or A/D (Q on a French keyboard) to move, Space to spray. */
const LEFT_KEYS = new Set(['ArrowLeft', 'a', 'A', 'q', 'Q']);
const RIGHT_KEYS = new Set(['ArrowRight', 'd', 'D']);
const FIRE_KEYS = new Set([' ', 'Spacebar', 'ArrowUp', 'Enter']);

/** Petal Patrol's window, while the cozy break room's arcade has it open (state/arcade.ts). */
export function ArcadeWindow() {
  const open = useArcade((s) => s.open);
  return open ? <Arcade /> : null;
}

/**
 * The game in a window floating over the office, like the floating browser: carried by its title bar, closed by its
 * cross or Escape. It plays while it has the focus (a click in it gives it back); it pauses when the focus goes
 * elsewhere, when the tab is hidden, on P or its pause button. Buttons under the screen play it by touch.
 */
function Arcade() {
  const words = t.room.cozy.arcade.game;
  const section = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [zoom] = useState(() => zoomFor(floatingSurface()));
  const size = { width: FIELD.width * zoom + 2 * FRAME, height: PIP_HEAD + FIELD.height * zoom + 2 * FRAME + BUTTONS };
  const [box, setBox] = useState<Box>(() => {
    const surface = floatingSurface(), kept = readPreference<{ left: number; top: number } | null>(PLACE_KEY, null);
    const at = kept ?? { left: (surface.width - size.width) / 2, top: (surface.top ?? 0) + 24 };
    return placePip({ ...at, ...size }, surface);
  });
  const [paused, setPaused] = useState(false);
  const game = useRef<Game>(newGame(Math.floor(Math.random() * 2 ** 31)));
  const held = useRef<Controls>({ left: false, right: false, fire: false });
  const best = useRef(readPreference<number>(BEST_KEY, 0));

  // stable: the frames' effect reads it
  const [pause] = useState(() => (on: boolean) => { togglePause(game.current, on); setPaused(game.current.paused); });

  // the frames: the game played and drawn while the window is open, the best score kept once a game ends
  useEffect(() => {
    const context = canvas.current!.getContext('2d')!;
    let frame = 0, last = performance.now();
    const tick = (now: number) => {
      const ms = Math.min(MOST_MS, now - last);
      last = now;
      const before = game.current.phase;
      step(game.current, ms, held.current);
      if (game.current.phase === 'over' && before !== 'over' && game.current.score > best.current) {
        best.current = game.current.score;
        writePreference(BEST_KEY, best.current);
      }
      paintGame(context, game.current, context.canvas.width / FIELD.width, best.current, words, now);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    const onVisibility = () => { if (document.hidden) pause(true); };
    document.addEventListener('visibilitychange', onVisibility);
    section.current?.focus();
    return () => { cancelAnimationFrame(frame); document.removeEventListener('visibilitychange', onVisibility); };
  }, [words, pause]);

  // a smaller page: it stays within reach
  useEffect(() => {
    const keep = () => setBox((now) => placePip(now, floatingSurface()));
    window.addEventListener('resize', keep);
    return () => window.removeEventListener('resize', keep);
  }, []);

  const onKey = (down: boolean) => (event: KeyboardEvent) => {
    const { key } = event, controls = held.current;
    if (LEFT_KEYS.has(key)) controls.left = down;
    else if (RIGHT_KEYS.has(key)) controls.right = down;
    else if (FIRE_KEYS.has(key)) { if ((event.target as HTMLElement).closest('button') && key === 'Enter') return; controls.fire = down; }
    else if (down && (key === 'p' || key === 'P')) pause(!game.current.paused);
    else if (down && key === 'Escape') closeArcade();
    else return;
    event.preventDefault();
    event.stopPropagation();
    // a key that plays takes the game out of its pause
    if (down && key !== 'p' && key !== 'P' && game.current.paused && key !== 'Escape') pause(false);
  };
  // the focus gone elsewhere in the page: the game waits, and nothing stays held
  const onBlur = (event: FocusEvent) => {
    if (section.current?.contains(event.relatedTarget as Node | null)) return;
    held.current = { left: false, right: false, fire: false };
    pause(true);
  };

  // carried by its title bar
  const carried = useRef<{ start: Box; x: number; y: number; started: boolean } | null>(null);
  const [moving, setMoving] = useState(false);
  const grab = (event: ReactPointerEvent<HTMLElement>) => {
    if (event.button !== 0 || (event.target as HTMLElement).closest(INTERACTIVE)) return;
    carried.current = { start: box, x: event.clientX, y: event.clientY, started: false };
  };
  const drag = (event: ReactPointerEvent<HTMLElement>) => {
    const from = carried.current;
    if (!from) return;
    const dx = event.clientX - from.x, dy = event.clientY - from.y;
    if (!from.started) {
      if (Math.hypot(dx, dy) < CARRY_AFTER) return;
      from.started = true;
      event.currentTarget.setPointerCapture(event.pointerId);
      setMoving(true);
    }
    setBox(placePip({ ...from.start, left: from.start.left + dx, top: from.start.top + dy }, floatingSurface()));
  };
  const drop = () => {
    const from = carried.current;
    carried.current = null;
    if (!from?.started) return;
    setMoving(false);
    setBox((now) => { writePreference(PLACE_KEY, { left: now.left, top: now.top }); return now; });
  };

  // the buttons under the screen: held down like the keys
  const hold = (control: keyof Controls) => ({
    onPointerDown: (event: ReactPointerEvent<HTMLButtonElement>) => {
      event.currentTarget.setPointerCapture(event.pointerId);
      held.current[control] = true;
      if (game.current.paused) pause(false);
    },
    onPointerUp: () => { held.current[control] = false; },
    onPointerCancel: () => { held.current[control] = false; },
    onLostPointerCapture: () => { held.current[control] = false; },
  });

  const device = Math.max(1, Math.round(window.devicePixelRatio || 1));
  return (
    <section
      ref={section} className="cp-arcade" aria-label={words.label} data-moving={moving} tabIndex={-1}
      style={boxVariables(box)}
      onKeyDown={onKey(true)} onKeyUp={onKey(false)} onBlur={onBlur} onPointerDown={() => section.current?.focus({ preventScroll: true })}
      onPointerMove={drag} onPointerUp={drop} onPointerCancel={drop}
    >
      <header className="cp-arcade__head" onPointerDown={grab}>
        <ArcadeIcon />
        <h2 className="cp-arcade__title">{words.title}</h2>
        <button type="button" className="cp-icon-button" data-size="small" aria-label={paused ? words.resume : words.pause} title={paused ? words.resume : words.pause} onClick={() => pause(!game.current.paused)}>
          {paused ? <PlayIcon /> : <PauseIcon />}
        </button>
        <button type="button" className="cp-icon-button" data-size="small" aria-label={words.close} title={words.close} onClick={closeArcade}><CloseIcon /></button>
      </header>
      <div className="cp-arcade__screen">
        <canvas
          ref={canvas} className="cp-arcade__canvas" width={FIELD.width * zoom * device} height={FIELD.height * zoom * device}
          role="img" aria-label={words.keys}
        />
      </div>
      <div className="cp-arcade__pad">
        <button type="button" className="cp-arcade__button" aria-label={words.left} title={words.left} tabIndex={-1} {...hold('left')}><ChevronLeftIcon /></button>
        <button type="button" className="cp-arcade__button" data-variant="fire" aria-label={words.fire} title={words.fire} tabIndex={-1} {...hold('fire')}><SprayIcon /></button>
        <button type="button" className="cp-arcade__button" aria-label={words.right} title={words.right} tabIndex={-1} {...hold('right')}><ChevronRightIcon /></button>
      </div>
    </section>
  );
}
