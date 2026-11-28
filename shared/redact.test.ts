import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { MASK, MAX_LOG_TEXT, maskKnown, redact } from './redact.ts';

describe('what Settings > Logs may show', () => {
  it('masks every shape of key, keeping what surrounds it', () => {
    const cases: readonly [string, string, string][] = [
      ['a known value of any shape', 'login failed for hunter2!', 'hunter2'],
      ['a key in an address', 'GET http://127.0.0.1:4848/pair?secret=abc123def&next=/', 'abc123def'],
      ['a token in an address', 'https://example.com/cb?code=1&access_token=zzTop42', 'zzTop42'],
      ['a password in an address', 'https://example.com/?password=pa55word', 'pa55word'],
      ['an api_key in an address', 'https://example.com/?api_key=k9k9k9', 'k9k9k9'],
      ['the MCP address', 'fetch http://127.0.0.1:4848/mcp/3f1c-session/qwerty-key failed', 'qwerty-key'],
      ['the external MCP address', 'http://127.0.0.1:4848/mcp/external/abcd_efgh', 'abcd_efgh'],
      ['the os-secret address', 'POST /secrets/sess-1/deadbeefkey/get refused', 'deadbeefkey'],
      ['the browser address', 'ws://127.0.0.1:4848/browser/sess-1/cdp/cdpkey77/lane/1/devtools', 'cdpkey77'],
      ['a Bearer header', 'Authorization: Bearer abc.def.ghi-123', 'abc.def.ghi-123'],
      ['a Basic credential', 'sent Basic dXNlcjpwYXNz to the proxy', 'dXNlcjpwYXNz'],
      ['an Anthropic key', 'invalid x sk-ant-api03-AbCdEf0123456789xyz', 'sk-ant-api03-AbCdEf0123456789xyz'],
      ['an OpenAI key', 'key sk-proj-ABCDEFGH12345678 rejected', 'sk-proj-ABCDEFGH12345678'],
      ['a GitHub token', 'remote: ghp_ABCDEFGHIJKLMNOPQRSTuvwxyz0123 denied', 'ghp_ABCDEFGHIJKLMNOPQRSTuvwxyz0123'],
      ['a GitHub fine-grained token', 'github_pat_11ABCDEFG0abcdefghij_klmnop', 'github_pat_11ABCDEFG0abcdefghij_klmnop'],
      ['a Telegram bot token', 'POST https://api.telegram.org/bot123456789:AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsaw/sendMessage', '123456789:AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsaw'],
      ['an AWS key', 'using AKIAIOSFODNN7EXAMPLE', 'AKIAIOSFODNN7EXAMPLE'],
      ['a JWT', 'jwt eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.c2lnbmF0dXJl ok', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.c2lnbmF0dXJl'],
      ['a long hex', 'key 0123456789abcdef0123456789abcdef', '0123456789abcdef0123456789abcdef'],
      ['a long base64url run', 'secret is Zm9vYmFyQmF6UXV4MTIzNDU2Nzg5MGFiY2RlZmdoaWpr here', 'Zm9vYmFyQmF6UXV4MTIzNDU2Nzg5MGFiY2RlZmdoaWpr'],
      ['an environment assignment', 'spawn env GITHUB_TOKEN=tok3n MY_PASSWORD=p4ss', 'tok3n'],
      ['an environment password', 'spawn env MY_PASSWORD=p4ss', 'p4ss'],
      ['a cookie header', 'Cookie: office=abc; other=def', 'office=abc'],
      ['a password in a URL', 'cannot reach https://bob:s3cr3t@example.com/x', 's3cr3t'],
    ];
    for (const [name, text, secret] of cases) {
      const shown = redact(text, ['hunter2']);
      assert.ok(!shown.includes(secret), `${name}: ${shown}`);
      assert.ok(shown.includes(MASK), `${name}: ${shown}`);
    }
  });

  it('leaves an ordinary error as it is', () => {
    const texts = [
      'read ECONNRESET',
      'ECONNRESET: impossible de supprimer le dossier, réessaie dans un instant.',
      'Le journal de la session « Morgane » ne s’écrit plus : EPERM, operation not permitted',
      'cannot remove ./node_modules/.vite/deps: EBUSY',
      'session 0ec782ba-8f67-4561-96bc-bc7647995949 is not found',
      'webhooks port 4849 listen EADDRINUSE: address already in use 127.0.0.1:4849',
      'the branch feat/settings-log-viewer cannot merge into main',
      'Invalid token provided, basic settings kept, author=Morgane',
    ];
    for (const text of texts) assert.equal(redact(text), text);
  });

  it('writes the home folder as ~, with either slash and in any case on Windows', () => {
    assert.equal(redact('EPERM rmdir C:\\Users\\Alice\\project\\dist', [], 'C:\\Users\\Alice'), 'EPERM rmdir ~\\project\\dist');
    assert.equal(redact('open c:/users/alice/project', [], 'C:\\Users\\Alice'), 'open ~/project');
    assert.equal(redact('ENOENT /srv/me/notes.md', [], '/srv/me'), 'ENOENT ~/notes.md');
    assert.equal(redact('ENOENT /srv/meta/notes.md', [], '/srv/me'), 'ENOENT /srv/meta/notes.md');
  });

  it('writes any user’s home folder as ~, even without being told it', () => {
    assert.equal(redact("ENOENT: no such file '/Users/alice/Journal/a.md'"), "ENOENT: no such file '~/Journal/a.md'");
    assert.equal(redact('rmdir /home/bob/work failed'), 'rmdir ~/work failed');
    assert.equal(redact('http://example.com/home/page'), 'http://example.com/home/page');
  });

  it('cuts a very long text', () => {
    const shown = redact('a '.repeat(MAX_LOG_TEXT));
    assert.ok(shown.length <= MAX_LOG_TEXT + 1);
  });

  it('masks a known value however it is written', () => {
    const key = 'p@ss wörd"/+';
    const cases: readonly [string, string][] = [
      ['URL-encoded', `GET /?q=${encodeURIComponent(key)} failed`],
      ['JSON-escaped', `body {"value":${JSON.stringify(key)}} refused`],
      ['base64', `header ${Buffer.from(key).toString('base64')} refused`],
      ['base64url', `path /x/${Buffer.from(key).toString('base64url')} refused`],
    ];
    for (const [name, text] of cases) {
      const shown = redact(text, [key]);
      assert.ok(shown.includes(MASK), `${name}: ${shown}`);
      assert.ok(!shown.includes('ss'), `${name}: ${shown}`);
    }
  });

  it('masks a short known value only standing alone, and never a single character', () => {
    assert.equal(redact('pin x7q refused', ['x7q']), `pin ${MASK} refused`);
    assert.equal(redact('the prefix7queue stays', ['x7q']), 'the prefix7queue stays');
    assert.equal(redact('a b c', ['a']), 'a b c');
  });

  it('never splits a known key when a very long text is cut', () => {
    const key = 'longsecretvalue1234';
    // each key shrinks to MASK, so what follows the first cut still shows; the cut falls inside a key
    const text = `. . . . .${` ${key}`.repeat(400)}`;
    const shown = redact(text, [key]);
    assert.equal(shown.replace(/•••|\s|\./g, ''), '', shown.slice(-40));
  });

  it('never splits a known key of several lines when a very long text is cut', () => {
    const key = 'AAAAkeyline1\nBBBBkeyline2\nCCCCkeyline3';
    const shown = redact(` ${key}`.repeat(200), [key]);
    assert.equal(shown.replace(/•••|\s/g, ''), '', shown.slice(-60));
  });

  it('leaves a 2 or 3 character key in a toast on screen, and masks it in the logs', () => {
    assert.equal(maskKnown('Started dev server', ['dev'], { short: false }), 'Started dev server');
    assert.equal(maskKnown('refused long-key-1', ['long-key-1'], { short: false }), `refused ${MASK}`);
    assert.equal(redact('Started dev server', ['dev']), `Started ${MASK} server`);
  });

  it('stays fast on a huge text made to backtrack', () => {
    for (const unit of ['a-', '"token']) {
      const start = performance.now();
      redact(unit.repeat(50_000));
      assert.ok(performance.now() - start < 200, `${unit}: too slow`);
    }
  });
});
