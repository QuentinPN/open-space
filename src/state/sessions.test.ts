import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { ClientMessage, Preferences, ServerMessage, SessionInfo } from '../../shared/protocol.ts';

const stored = new Map<string, string>();
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: { getItem: (key: string) => stored.get(key) ?? null, setItem: (key: string, value: string) => stored.set(key, value), removeItem: (key: string) => stored.delete(key) },
});
const { useSessions } = await import('./sessions.ts');

const session = (id: string): SessionInfo => ({
  id, name: id, cwd: `/work/${id}`, model: '', activeModel: '', permissionMode: 'auto', state: 'wait', stateSince: 1000, createdAt: 0, turns: 1, permissions: [],
  subagents: [], command: '', lastMessage: '', resumable: true, lastSeq: 5,
});

const hello = (sessions: SessionInfo[]) => ({
  t: 'hello', claude: {}, roots: [], sessions, commands: [], folderCommands: {}, models: [], quota: null, build: '', crew: [],
  preferences: { language: 'fr' } as Preferences, onboarded: true, rootsLocked: false, claudeDefaults: {}, appUpdate: null, browsers: {}, browserAvailable: false,
}) as unknown as ServerMessage;

describe('the windows a reload brings back', () => {
  it('ask the server for the conversation of each of them, not only of the one with the keyboard', () => {
    stored.set('poste:layout', JSON.stringify({ columns: [['ines'], ['alice']], selectedId: 'alice' }));
    const sent: ClientMessage[] = [];
    useSessions.setState({ send: (message) => { sent.push(message); return true; } });

    useSessions.getState().receive(hello([session('ines'), session('alice')]));

    assert.deepEqual(useSessions.getState().openIds, ['ines', 'alice']);
    const asked = sent.flatMap((message) => (message.t === 'log' ? [message.sessionId] : []));
    assert.deepEqual(asked.sort(), ['alice', 'ines']);
  });
});

describe('the toasts of Settings > Logs', () => {
  it('keeps the toasts the page raised, not those the server sent and keeps itself', () => {
    useSessions.setState({ shownToasts: [] });
    useSessions.getState().receive({ t: 'toast', kind: 'error', text: 'read ECONNRESET' });
    useSessions.getState().toast('info', 'copied');
    assert.deepEqual(useSessions.getState().shownToasts.map((toast) => toast.text), ['copied']);
  });

  it('empties them when the server says the logs were cleared, not on an empty list alone', () => {
    useSessions.setState({ shownToasts: [{ at: 1, level: 'info', source: 'toast', text: 'copied' }] });
    useSessions.getState().receive({ t: 'logs', entries: [] });
    assert.equal(useSessions.getState().shownToasts.length, 1);
    useSessions.getState().receive({ t: 'logs', entries: [], cleared: true });
    assert.deepEqual(useSessions.getState().shownToasts, []);
  });
});
