import assert from 'node:assert/strict';
import { test } from 'node:test';
import { settingEntries } from './settings-index.ts';

test('the cozy rows (home, ambiance) are found only in cozy mode, where the dialog shows them', () => {
  for (const row of ['homeTheme', 'cozyAmbianceMode', 'cozyAmbiance']) {
    const found = (roomStyle?: string) => settingEntries(roomStyle).some((entry) => entry.row === row);
    assert.equal(found('office'), false, row);
    assert.equal(found(undefined), false, row);
    assert.equal(found('cozy'), true, row);
  }
});
