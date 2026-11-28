import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ansiFor, isLight, luminance, over, parseColor, type Rgba } from './terminal-palette.ts';

const WHITE: Rgba = { r: 255, g: 255, b: 255, a: 1 };
const BLACK: Rgba = { r: 0, g: 0, b: 0, a: 1 };
const NIGHT: Rgba = { r: 8, g: 11, b: 18, a: 1 };
const contrast = (a: Rgba, b: Rgba) => {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
};

describe('the terminal background', () => {
  it('reads the colours the canvas and the computed styles write', () => {
    assert.deepEqual(parseColor('#080b12'), NIGHT);
    assert.deepEqual(parseColor('rgb(8, 11, 18)'), NIGHT);
    assert.deepEqual(parseColor('rgba(154, 168, 255, 0.28)'), { r: 154, g: 168, b: 255, a: 0.28 });
    assert.deepEqual(parseColor('color(srgb 1 0.5 0 / 0.25)'), { r: 255, g: 128, b: 0, a: 0.25 });
    assert.deepEqual(parseColor('color(srgb 0.0314 0.0431 0.0706)'), NIGHT);
    assert.equal(parseColor('transparent'), null);
  });

  it('is a translucent token laid over what is behind it', () => {
    assert.deepEqual(over({ r: 255, g: 255, b: 255, a: 0.5 }, BLACK), { r: 128, g: 128, b: 128, a: 1 });
    assert.deepEqual(over({ ...WHITE, a: 0 }, NIGHT), NIGHT);
  });

  it('has the WCAG luminance, from black to white', () => {
    assert.equal(luminance(BLACK), 0);
    assert.equal(luminance(WHITE), 1);
    assert.equal(Math.round(luminance({ r: 128, g: 128, b: 128, a: 1 }) * 1000) / 1000, 0.216);
  });

  it('is light when dark text reads better on it, whatever shows through', () => {
    assert.deepEqual([WHITE, { r: 240, g: 236, b: 226, a: 1 }, NIGHT, { r: 60, g: 60, b: 60, a: 1 }].map(isLight), [true, true, false, false]);
    assert.equal(isLight(over({ ...WHITE, a: 0.9 }, NIGHT)), true);
    assert.equal(isLight(over({ ...WHITE, a: 0.1 }, NIGHT)), false);
  });
});

describe('the ANSI colours', () => {
  const hues = Object.keys(ansiFor(NIGHT)).filter((hue) => hue !== 'black') as (keyof ReturnType<typeof ansiFor>)[];
  const rgb = (color: string) => parseColor(color) as Rgba;

  it('on a light background stand out from it more than those made for a dark one', () => {
    for (const hue of hues) assert.ok(contrast(rgb(ansiFor(WHITE)[hue]), WHITE) > contrast(rgb(ansiFor(NIGHT)[hue]), WHITE), hue);
  });

  it('on a dark background stand out from it more than those made for a light one', () => {
    for (const hue of hues) assert.ok(contrast(rgb(ansiFor(NIGHT)[hue]), NIGHT) > contrast(rgb(ansiFor(WHITE)[hue]), NIGHT), hue);
  });
});
