// Moving someone to another seat by hand, in a room's scene (scene.ts): a long press on them picks them up (or moving
// the pointer while pressed, at once), they follow the pointer, and letting go puts them on the seat under them (a swap
// when someone sits there) or back on their own. ⌥ drags the room's frame instead (useRoomFrame.ts). Both room styles:
// the classic room (RoomView) and a cozy room opened big (cozy/CozyView).
import { useRef, useState, type PointerEvent } from 'react';
import type { Point } from './geometry.ts';
import type { Character, Scene, SceneFloor } from './scene.ts';

/** Held this long on someone, they are picked up; moved further than HOLD_SLOP canvas pixels while held, at once. */
const HOLD_MS = 250;
const HOLD_SLOP = 4;

type CanvasPointer = PointerEvent<HTMLCanvasElement>;

export interface Carry {
  /** someone is held up: the stage shows a closed hand */
  carrying: boolean;
  handlers: { onPointerDown: (event: CanvasPointer) => void; onPointerMove: (event: CanvasPointer) => void; onPointerUp: () => void; onPointerCancel: () => void };
  /** True once, for the click that ends a drop: it must not open the session. */
  consumeDrop: () => boolean;
}

/**
 * `sceneOf`: the scene people are picked up in now (null: none, the cozy rooms side by side); `pointOf`: the pointer's
 * point on its canvas; `onPickUp`: someone was just picked up; `onDrop`: someone was put on another seat.
 */
export function useCarry(sceneOf: () => Scene<SceneFloor> | null, pointOf: (event: CanvasPointer) => Point, { onPickUp, onDrop }: { onPickUp?: () => void; onDrop: (scene: Scene<SceneFloor>) => void }): Carry {
  const press = useRef<{ scene: Scene<SceneFloor>; character: Character; at: Point; pointer: number; timer: number } | null>(null);
  const [carrying, setCarrying] = useState(false);
  const dropped = useRef(false);

  const pickUp = (canvas: HTMLCanvasElement) => {
    const held = press.current;
    if (!held) return;
    window.clearTimeout(held.timer);
    press.current = null;
    if (!held.scene.pickUp(held.character)) return;
    canvas.setPointerCapture(held.pointer);
    held.scene.carryTo(held.at);
    onPickUp?.();
    setCarrying(true);
  };

  const onPointerDown = (event: CanvasPointer) => {
    const scene = sceneOf();
    if (!scene || event.button !== 0 || event.altKey || scene.carried) return;
    const point = pointOf(event);
    const character = scene.characterAt(point);
    if (!character) return;
    const canvas = event.currentTarget;
    press.current = { scene, character, at: point, pointer: event.pointerId, timer: window.setTimeout(() => pickUp(canvas), HOLD_MS) };
  };

  const onPointerMove = (event: CanvasPointer) => {
    const scene = sceneOf();
    if (!scene) return;
    const point = pointOf(event);
    if (scene.carried) { scene.carryTo(point); return; }
    const held = press.current;
    if (held && Math.hypot(point.x - held.at.x, point.y - held.at.y) > HOLD_SLOP) { held.at = point; pickUp(event.currentTarget); }
  };

  const onPointerUp = () => {
    if (press.current) { window.clearTimeout(press.current.timer); press.current = null; }
    const scene = sceneOf();
    if (!scene?.carried) return;
    dropped.current = true;
    setCarrying(false);
    if (scene.drop()) onDrop(scene);
  };

  const consumeDrop = () => {
    if (!dropped.current) return false;
    dropped.current = false;
    return true;
  };

  return { carrying, handlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp }, consumeDrop };
}
