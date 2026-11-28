import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { MAX_SERVER_LOG, ServerLog } from './server-log.ts';

describe('the server’s lines in Settings > Logs', () => {
  it('keeps the last MAX_SERVER_LOG lines, dropping the oldest', () => {
    const log = new ServerLog({ known: () => [], home: '/srv/me' });
    for (let index = 0; index <= MAX_SERVER_LOG; index += 1) log.add('error', 'server', `line ${index}`);
    const kept = log.list();
    assert.equal(kept.length, MAX_SERVER_LOG);
    assert.equal(kept[0].text, 'line 1');
    assert.equal(kept.at(-1)?.text, `line ${MAX_SERVER_LOG}`);
  });

  it('masks the keys known when the line comes, before keeping it', () => {
    let known = ['first-key'];
    const log = new ServerLog({ known: () => known, home: '/srv/me' });
    known = ['later-key'];
    log.add('error', 'toast', 'refused later-key in /srv/me/app');
    assert.equal(log.list()[0].text, 'refused ••• in ~/app');
  });

  it('masks a key learnt after the line was kept, when the line leaves', () => {
    let known: string[] = [];
    const log = new ServerLog({ known: () => known, home: '/srv/me' });
    log.add('error', 'server', 'mods-env.json holds late-key');
    known = ['late-key'];
    assert.equal(log.list()[0].text, 'mods-env.json holds •••');
  });
});
