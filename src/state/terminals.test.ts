import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { TerminalTab } from '../../shared/terminal.ts';
import { afterOpened, afterTabs, chunkInput, EMPTY_BOOK, openingFor, type TerminalBook } from './terminals.ts';

const tab = (id: string, sessionId = 's1'): TerminalTab => ({ id, sessionId, title: id });
const book = (over: Partial<TerminalBook>): TerminalBook => ({ ...EMPTY_BOOK, ...over });

describe('the tabs of the integrated terminal', () => {
  it('show a session’s first tab when none was shown', () => {
    assert.deepEqual(afterTabs(EMPTY_BOOK, [tab('a'), tab('b'), tab('c', 's2')]).active, { s1: 'a', s2: 'c' });
  });

  it('keep the shown tab while it is there, even when another page opens one', () => {
    const before = book({ tabs: [tab('a'), tab('b')], active: { s1: 'b' }, opening: { r1: { sessionId: 's1', paste: { text: 'ls', run: false } } } });
    const after = afterTabs(before, [tab('a'), tab('b'), tab('c')]);
    assert.equal(after.active.s1, 'b');
    assert.deepEqual([after.pastes, Object.keys(after.opening)], [{}, ['r1']]);
  });

  it('show the tab this page asked for once the server answers its request, with what waited to be pasted in it', () => {
    const paste = { text: 'npm test', run: false };
    const asked = book({ tabs: [tab('a')], active: { s1: 'a' }, opening: { r1: { sessionId: 's1', paste } } });
    // whichever comes first, the answer or the list
    for (const after of [afterTabs(afterOpened(asked, 'r1', 'b'), [tab('a'), tab('b')]), afterOpened(afterTabs(asked, [tab('a'), tab('b')]), 'r1', 'b')]) {
      assert.equal(after.active.s1, 'b');
      assert.deepEqual([after.pastes, after.opening], [{ b: paste }, {}]);
    }
  });

  it('forget a refused request, so the next one asks again', () => {
    const asked = book({ tabs: [tab('a')], active: { s1: 'a' }, opening: { r1: { sessionId: 's1', paste: { text: 'ls', run: true } } } });
    const after = afterOpened(asked, 'r1', null);
    assert.deepEqual([after.active, after.pastes], [{ s1: 'a' }, {}]);
    assert.equal(openingFor(after, 's1'), undefined);
  });

  it('give a closed shown tab’s place to the one after it, else the one before', () => {
    const before = book({ tabs: [tab('a'), tab('b'), tab('c')], active: { s1: 'b' } });
    assert.equal(afterTabs(before, [tab('a'), tab('c')]).active.s1, 'c');
    assert.equal(afterTabs({ ...before, active: { s1: 'c' } }, [tab('a'), tab('b')]).active.s1, 'b');
  });

  it('forget a session whose last tab closed, and the paste of a tab gone', () => {
    const before = book({ tabs: [tab('a'), tab('b', 's2')], active: { s1: 'a', s2: 'b' }, pastes: { a: { text: 'ls', run: true } } });
    const after = afterTabs(before, [tab('b', 's2')]);
    assert.deepEqual([after.active, after.pastes], [{ s2: 'b' }, {}]);
  });
});

describe('what is typed into a terminal', () => {
  it('goes in pieces the server takes, which put back together give it whole', () => {
    const text = 'x'.repeat(25);
    const chunks = chunkInput(text, 10);
    assert.deepEqual(chunks.map((chunk) => chunk.length), [10, 10, 5]);
    assert.equal(chunks.join(''), text);
  });

  it('never cuts a character in two', () => {
    const text = `${'x'.repeat(9)}\u{1F600}y`;
    const chunks = chunkInput(text, 10);
    assert.deepEqual(chunks, ['x'.repeat(9), '\u{1F600}y']);
  });

  it('sends nothing for nothing', () => {
    assert.deepEqual(chunkInput(''), []);
  });
});
