import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it, mock } from 'node:test';
import type { ServerMessage } from '../shared/protocol.ts';
import type { TerminalChoice } from '../shared/terminal.ts';
import { appendScrollback, chooseShell, FLUSH_MS, MAX_TABS_PER_SESSION, TerminalManager, tabTitle, type Pty, type PtyModule } from './terminal.ts';

const WIN_CHOICES: TerminalChoice[] = [
  { id: 'cmd', name: 'cmd', path: 'C:\\Windows\\System32\\cmd.exe' },
  { id: 'powershell', name: 'PowerShell', path: 'C:\\Program Files\\PowerShell\\7\\pwsh.exe' },
  { id: 'git-bash', name: 'Git Bash', path: 'C:\\Program Files\\Git\\git-bash.exe' },
];
const BASH = 'C:\\Program Files\\Git\\bin\\bash.exe';

describe('the shell of a new tab', () => {
  const windows = (kind: Parameters<typeof chooseShell>[0]['kind'], choices = WIN_CHOICES, exists: (file: string) => boolean = (file) => file === BASH) =>
    chooseShell({ platform: 'win32', kind, choices, env: {}, exists });

  it('is the one picked in the settings on Windows, cmd when none', () => {
    assert.equal(windows('powershell').file, 'C:\\Program Files\\PowerShell\\7\\pwsh.exe');
    assert.deepEqual(windows('powershell').args, ['-NoLogo']);
    assert.equal(windows('powershell').title, 'PowerShell');
    assert.equal(windows(undefined).file, 'C:\\Windows\\System32\\cmd.exe');
    assert.equal(windows('cmd').title, 'cmd');
    assert.deepEqual([windows('powershell').family, windows('cmd').family, windows('git-bash').family], ['powershell', 'cmd', 'posix']);
  });

  it('runs Git’s bash.exe, not git-bash.exe which opens a window of its own, and stays in the folder', () => {
    const shell = windows('git-bash');
    assert.equal(shell.file, BASH);
    assert.deepEqual(shell.args, ['--login', '-i']);
    assert.equal(shell.env.CHERE_INVOKING, '1');
  });

  it('falls back to cmd when the picked shell is gone or has no bash.exe', () => {
    assert.deepEqual([windows('git-bash', WIN_CHOICES, () => false).title, windows('git-bash', WIN_CHOICES, () => false).family], ['cmd', 'cmd']);
    assert.equal(windows('powershell', WIN_CHOICES.filter((choice) => choice.id !== 'powershell')).title, 'cmd');
    assert.equal(chooseShell({ platform: 'win32', kind: 'cmd', choices: [], env: { ComSpec: 'D:\\x\\cmd.exe' } }).file, 'D:\\x\\cmd.exe');
  });

  it('is the login shell elsewhere, with a default per system', () => {
    const on = (platform: NodeJS.Platform, SHELL?: string) => chooseShell({ platform, kind: 'powershell', choices: WIN_CHOICES, env: { SHELL } });
    assert.deepEqual([on('darwin', '/opt/homebrew/bin/fish').file, on('darwin', '/opt/homebrew/bin/fish').title], ['/opt/homebrew/bin/fish', 'fish']);
    assert.deepEqual(on('darwin', '/bin/zsh').args, ['-l']);
    assert.equal(on('darwin').file, '/bin/zsh');
    assert.equal(on('linux').file, '/bin/bash');
    assert.equal(on('linux', 'zsh').file, '/bin/bash', 'a SHELL that is not an absolute path is not run');
  });
});

describe('tab titles', () => {
  it('number the shells of a session from the second, reusing a freed number', () => {
    assert.equal(tabTitle('zsh', []), 'zsh');
    assert.equal(tabTitle('zsh', ['zsh']), 'zsh 2');
    assert.equal(tabTitle('zsh', ['zsh', 'zsh 2', 'zsh 3']), 'zsh 4');
    assert.equal(tabTitle('zsh', ['zsh', 'zsh 3']), 'zsh 2');
  });
});

describe('the scrollback of a tab', () => {
  it('keeps the end of the output, up to the limit', () => {
    assert.equal(appendScrollback('abc', 'def', 10), 'abcdef');
    assert.equal(appendScrollback('abcdef', 'ghij', 5), 'fghij');
    assert.equal(appendScrollback('', 'x'.repeat(20), 5), 'xxxxx');
  });

  it('starts after a line break, not inside an escape sequence', () => {
    assert.equal(appendScrollback('\u001b[31mred\u001b[0m\nline two\n', 'tail', 20), 'line two\ntail');
    assert.equal(appendScrollback('x'.repeat(10_000), 'y'.repeat(10), 20).length, 20, 'a break too far away is not looked for');
  });

  it('never starts in the middle of an emoji', () => {
    // the cut falls between the two halves of the emoji: it goes whole or not at all
    const kept = appendScrollback('ab😀', 'cd', 3);
    assert.equal(kept, 'cd');
    assert.equal(appendScrollback('ab😀', 'cd', 4), '😀cd');
  });
});

/** A pty the test drives by hand. */
class FakePty implements Pty {
  pid = 4242;
  written: string[] = [];
  size: [number, number] | null = null;
  killed = 0;
  private dataListener: (data: string) => void = () => {};
  private exitListener: (event: { exitCode: number }) => void = () => {};
  onData(listener: (data: string) => void) { this.dataListener = listener; }
  onExit(listener: (event: { exitCode: number }) => void) { this.exitListener = listener; }
  write(data: string) { this.written.push(data); }
  resize(cols: number, rows: number) { this.size = [cols, rows]; }
  kill() { this.killed += 1; }
  output(data: string) { this.dataListener(data); }
  exit(exitCode: number) { this.exitListener({ exitCode }); }
}

describe('the terminal manager', () => {
  let spawned: { file: string; args: string[]; options: Parameters<PtyModule['spawn']>[2]; pty: FakePty }[];
  let broadcasts: ServerMessage[];
  let manager: TerminalManager;
  let killed: number[];
  const makeManager = async (platform: NodeJS.Platform = 'linux', load: () => Promise<PtyModule | null> = async () => ({
    spawn: (file, args, options) => { const pty = new FakePty(); spawned.push({ file, args, options, pty }); return pty; },
  })) => {
    manager = new TerminalManager({
      environment: { PATH: '/bin', LANG: 'fr_FR.UTF-8', CLAUDE_CODE_OAUTH_TOKEN: 'secret', CLAUDE_CODE_ARTIFACT: '1', ANTHROPIC_API_KEY: 'k', GH_TOKEN: 'mine' }, kind: () => undefined, broadcast: (message) => broadcasts.push(message),
      load, platform, choices: () => [], killTree: (pid) => killed.push(pid),
    });
    await manager.init();
  };
  const tabsOf = () => (broadcasts.filter((message) => message.t === 'terminalTabs').at(-1) as Extract<ServerMessage, { t: 'terminalTabs' }>).tabs;

  beforeEach(async () => {
    spawned = [];
    broadcasts = [];
    killed = [];
    mock.timers.enable({ apis: ['setTimeout'] });
    await makeManager();
  });
  afterEach(() => mock.timers.reset());

  it('opens no tab, with a message for the user, where node-pty does not load', async () => {
    await makeManager('linux', async () => null);
    assert.equal(manager.available, false);
    assert.deepEqual(manager.message(), { t: 'terminalTabs', available: false, tabs: [] });
    assert.throws(() => manager.open('s1', '/work', 80, 24));
  });

  it('starts the shell in the folder, with the user’s own environment and a terminal type, and announces the tab', () => {
    const tab = manager.open('s1', '/work/tree', 100, 30);
    const [{ file, args, options }] = spawned;
    assert.deepEqual([file, args, options.cwd, options.cols, options.rows], ['/bin/bash', ['-l'], '/work/tree', 100, 30]);
    assert.deepEqual(options.env, { PATH: '/bin', LANG: 'fr_FR.UTF-8', GH_TOKEN: 'mine', TERM: 'xterm-256color', COLORTERM: 'truecolor' }, 'nothing that is for Claude Code alone');
    assert.deepEqual(tabsOf(), [{ id: tab.id, sessionId: 's1', title: 'bash', shell: 'posix' }]);
    assert.equal(manager.open('s1', '/work', 80, 24).title, 'bash 2');
  });

  it('stops at a number of tabs per session, not for another session', () => {
    for (let n = 0; n < MAX_TABS_PER_SESSION; n += 1) manager.open('s1', '/work', 80, 24);
    assert.throws(() => manager.open('s1', '/work', 80, 24));
    assert.doesNotThrow(() => manager.open('s2', '/work', 80, 24));
  });

  it('sends output in one batch to the pages attached, after the earlier output as a replay', () => {
    const tab = manager.open('s1', '/work', 80, 24);
    const [{ pty }] = spawned;
    const attached: ServerMessage[] = [];
    pty.output('one ');
    manager.attach(tab.id, (message) => attached.push(message));
    assert.deepEqual(attached, [{ t: 'terminalOutput', terminalId: tab.id, data: 'one ', replay: true }], 'what was still waiting is in the replay');
    pty.output('two ');
    pty.output('three');
    assert.equal(attached.length, 1, 'held back for the batch');
    mock.timers.tick(FLUSH_MS);
    assert.deepEqual(attached.slice(1), [{ t: 'terminalOutput', terminalId: tab.id, data: 'two three' }]);
    const late: ServerMessage[] = [];
    manager.attach(tab.id, (message) => late.push(message));
    assert.deepEqual(late, [{ t: 'terminalOutput', terminalId: tab.id, data: 'one two three', replay: true }]);
  });

  it('sends a tab’s output only to the pages attached to that tab', () => {
    const first = manager.open('s1', '/work', 80, 24), second = manager.open('s1', '/work', 80, 24);
    const onFirst: ServerMessage[] = [], onSecond: ServerMessage[] = [];
    manager.attach(first.id, (message) => onFirst.push(message));
    manager.attach(second.id, (message) => onSecond.push(message));
    spawned[0].pty.output('for the first');
    mock.timers.tick(FLUSH_MS);
    assert.deepEqual(onFirst.map((message) => message.t === 'terminalOutput' && message.data), ['', 'for the first']);
    assert.deepEqual(onSecond.map((message) => message.t === 'terminalOutput' && message.data), ['']);
  });

  it('stops sending to a page that detached or went away', () => {
    const tab = manager.open('s1', '/work', 80, 24);
    const [{ pty }] = spawned;
    const detached: ServerMessage[] = [], gone: ServerMessage[] = [];
    const listenDetached = (message: ServerMessage) => detached.push(message);
    const listenGone = (message: ServerMessage) => gone.push(message);
    manager.attach(tab.id, listenDetached);
    manager.attach(tab.id, listenGone);
    manager.detach(tab.id, listenDetached);
    manager.detachAll(listenGone);
    pty.output('later');
    mock.timers.tick(FLUSH_MS);
    assert.deepEqual([detached.length, gone.length], [1, 1], 'the replay only');
  });

  it('gives the page’s keys and size to the shell, and ignores a tab it does not know', () => {
    const tab = manager.open('s1', '/work', 80, 24);
    manager.input(tab.id, 'echo hi\r');
    manager.resize(tab.id, 120, 40);
    manager.input('nope', 'x');
    manager.resize('nope', 1, 1);
    manager.attach('nope', () => assert.fail('no such tab'));
    manager.close('nope');
    assert.deepEqual(spawned[0].pty.written, ['echo hi\r']);
    assert.deepEqual(spawned[0].pty.size, [120, 40]);
  });

  it('keeps a tab whose shell ended, with its exit code and what it printed last', () => {
    const tab = manager.open('s1', '/work', 80, 24);
    const [{ pty }] = spawned;
    const page: ServerMessage[] = [];
    manager.attach(tab.id, (message) => page.push(message));
    pty.output('bye');
    pty.exit(3);
    assert.deepEqual(page.at(-1), { t: 'terminalOutput', terminalId: tab.id, data: 'bye' }, 'flushed before the exit is announced');
    assert.deepEqual(tabsOf(), [{ id: tab.id, sessionId: 's1', title: 'bash', shell: 'posix', exitCode: 3 }]);
    manager.input(tab.id, 'ignored');
    assert.deepEqual(pty.written, []);
  });

  it('kills the shell and removes the tab on close, and every tab of a session when it goes', () => {
    const first = manager.open('s1', '/work', 80, 24);
    manager.open('s1', '/work', 80, 24);
    manager.open('s2', '/work', 80, 24);
    manager.close(first.id);
    assert.equal(spawned[0].pty.killed, 1);
    assert.equal(tabsOf().length, 2);
    manager.closeSession('s1');
    assert.deepEqual(tabsOf().map((tab) => tab.sessionId), ['s2']);
    assert.equal(spawned[1].pty.killed, 1);
    assert.equal(spawned[2].pty.killed, 0);
    manager.shutdown();
    assert.equal(spawned[2].pty.killed, 1);
    assert.deepEqual(manager.list(), []);
  });

  it('ends the whole process tree of a shell on Windows, where node-pty leaves some, and not elsewhere', async () => {
    manager.open('s1', '/work', 80, 24);
    manager.closeSession('s1');
    assert.deepEqual(killed, [], 'a pty’s own kill is enough on a Unix');
    await makeManager('win32');
    manager.open('s1', 'C:/work', 80, 24);
    manager.close(manager.list()[0].id);
    assert.deepEqual(killed, [4242]);
  });

  it('says nothing more about a tab that was closed when its shell’s exit arrives', () => {
    const tab = manager.open('s1', '/work', 80, 24);
    manager.close(tab.id);
    const before = broadcasts.length;
    spawned[0].pty.exit(0);
    assert.equal(broadcasts.length, before);
  });
});
