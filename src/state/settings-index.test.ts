import assert from 'node:assert/strict';
import { test } from 'node:test';
import { settingEntries } from './settings-index.ts';

test('the home theme row is found only in cozy mode, where the dialog shows it', () => {
  const found = (roomStyle?: string) => settingEntries(roomStyle).some((entry) => entry.row === 'homeTheme');
  assert.equal(found('office'), false);
  assert.equal(found(undefined), false);
  assert.equal(found('cozy'), true);
});
