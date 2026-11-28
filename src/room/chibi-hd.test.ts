import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { BEARD_STYLES, BOTTOMS, EYES, GEAR, GEAR_SLOTS, HAIR_STYLES, HATS, SHOES, TOPS, type Look } from '../../shared/look.ts';
import { DEFAULT_LOOK } from '../design/people-palette.ts';
import { HD_ANCHOR, hdArt, hdHeight, hdKey } from './chibi-hd.ts';
import type { Outfit } from './outfits.ts';
import type { Pose } from './sprites.ts';

const FRONT: Pose = { direction: 'down-right', posture: 'stand', step: 0, blinking: false, smiling: false, gesture: 'none' };
const BACK: Pose = { ...FRONT, direction: 'up-right' };
const look = (part: Partial<Look>): Look => ({ ...DEFAULT_LOOK, ...part });
/** What a look shows from the front and from the back: two looks with the same picture are the same to the eye. */
const picture = (worn: Look, festive?: Outfit) => [FRONT, BACK].map((pose) => hdArt(worn, pose, festive).cells.join()).join('|');

function lowestRow(worn: Look, pose: Pose): number {
  const art = hdArt(worn, pose);
  const last = art.cells.findLastIndex((cell) => cell !== null);
  return art.y0 + Math.floor(last / art.width);
}

describe('the HD people of the cozy room', () => {
  // a trait with no HD drawing, or drawn like another, cannot be told apart in the cozy room
  it('draws every value of every trait, each its own way', () => {
    const traits: [string, readonly Partial<Look>[]][] = [
      ['hair', HAIR_STYLES.map((hair) => ({ hair }))],
      ['beard', BEARD_STYLES.map((beard) => ({ beard }))],
      ['eyes', EYES.map((eyes) => ({ eyes }))],
      ['hat', HATS.map((hat) => ({ hat }))],
      ['top', TOPS.map((top) => ({ top }))],
      ['bottom', BOTTOMS.map((bottom) => ({ bottom }))],
      ['shoes', SHOES.map((shoes) => ({ shoes }))],
      ...GEAR_SLOTS.map((slot): [string, Partial<Look>[]] => [slot, GEAR[slot].map((gear) => ({ [slot]: gear }))]),
      ['extras', [{}, { glasses: '#121419' }, { sunglasses: true }, { headphones: true }, { watch: true }]],
    ];
    for (const [trait, values] of traits) {
      const seen = new Map<string, string>();
      for (const value of values) {
        const drawn = picture(look(value)), name = JSON.stringify(value);
        assert.equal(seen.get(drawn), undefined, `${trait}: ${name} is drawn like ${seen.get(drawn)}`);
        seen.set(drawn, name);
      }
    }
  });

  it('draws what a festival puts on', () => {
    const outfits: Outfit[] = [{}, { hat: 'santa' }, { hat: 'crown' }, { headphones: true }, { sunglasses: true }, { swimwear: true }, { swimwear: true, waterGun: true }];
    const pictures = outfits.map((outfit) => picture(DEFAULT_LOOK, outfit));
    assert.equal(new Set(pictures).size, outfits.length);
  });

  // feet above or below the anchor float over the floor or sink into it (the outline under the soles is on the floor line)
  it('stands on its anchor whatever its shoes and bottom, from the front and the back', () => {
    for (const worn of [...SHOES.map((shoes) => look({ shoes })), ...BOTTOMS.map((bottom) => look({ bottom }))]) {
      for (const pose of [FRONT, BACK, { ...FRONT, posture: 'walk', step: 1 } as const]) {
        assert.equal(lowestRow(worn, pose), HD_ANCHOR.stand, `${worn.shoes} ${worn.bottom} ${pose.direction} ${pose.posture}`);
      }
    }
  });

  // the name tag and the bubbles sit on top of the height: a hat left out would be covered
  it('is as tall as its hat', () => {
    assert.ok(hdHeight(look({ hat: 'tophat' }), FRONT) > hdHeight(DEFAULT_LOOK, FRONT));
    assert.ok(hdHeight(DEFAULT_LOOK, { ...FRONT, posture: 'sit' }) < hdHeight(DEFAULT_LOOK, FRONT));
  });

  // a key that changes for the same picture fills the cache every frame; one that does not change shows an old picture
  it('keeps one sprite per picture', () => {
    const reordered = Object.fromEntries(Object.entries(DEFAULT_LOOK).reverse()) as Look;
    assert.equal(hdKey(reordered, FRONT), hdKey(DEFAULT_LOOK, FRONT));
    assert.equal(hdKey(DEFAULT_LOOK, { ...FRONT, step: 1 }), hdKey(DEFAULT_LOOK, FRONT), 'standing still has one step');
    assert.equal(hdKey(DEFAULT_LOOK, { ...BACK, blinking: true, smiling: true }), hdKey(DEFAULT_LOOK, BACK), 'the face is not seen from the back');
    assert.notEqual(hdKey(look({ hairColor: '#ff8ab4' }), FRONT), hdKey(DEFAULT_LOOK, FRONT));
    assert.notEqual(hdKey(DEFAULT_LOOK, { ...FRONT, direction: 'down-left' }), hdKey(DEFAULT_LOOK, FRONT));
    assert.notEqual(hdKey(DEFAULT_LOOK, FRONT, { hat: 'santa' }), hdKey(DEFAULT_LOOK, FRONT));
  });
});
