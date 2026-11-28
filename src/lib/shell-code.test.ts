import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { commandOf, isShellLanguage, oneLine } from './shell-code.ts';

describe('the code blocks that run in a terminal', () => {
  it('are those in a shell language, whatever its case', () => {
    assert.deepEqual(['bash', 'SH', 'zsh', 'console', 'PowerShell', 'pwsh', 'cmd', 'bat'].map(isShellLanguage), [true, true, true, true, true, true, true, true]);
    assert.deepEqual(['js', 'ts', 'python', 'bashful', '', null, undefined].map(isShellLanguage), [false, false, false, false, false, false, false]);
  });

  it('give the command without the line break that would run it', () => {
    assert.equal(commandOf('npm install\nnpm test\n', 'bash'), 'npm install\nnpm test');
  });

  it('keep a shell block’s "$" as it is: only a console block has prompts', () => {
    assert.equal(commandOf('echo $ HOME\n$ ls', 'sh'), 'echo $ HOME\n$ ls');
  });

  it('keep only the commands of a console block, without their prompt', () => {
    assert.equal(commandOf('$ npm install\nadded 5 packages\n$ cat <<EOF\n> hello\n> EOF\nhello', 'console'), 'npm install\ncat <<EOF\nhello\nEOF');
  });

  it('keep a console block without any prompt whole', () => {
    assert.equal(commandOf('npm run build\nnpm start', 'console'), 'npm run build\nnpm start');
  });
});

describe('a block pasted into a shell that would run each line at once', () => {
  it('becomes one command line, each command separated as its shell separates them, blank lines dropped', () => {
    const block = 'npm install\n\nnpm test\n';
    assert.deepEqual([oneLine(block, 'cmd'), oneLine(block, 'powershell'), oneLine(block, 'posix')], ['npm install & npm test', 'npm install; npm test', 'npm install; npm test']);
  });

  it('joins a line that goes on to the next one, without its continuation', () => {
    assert.equal(oneLine('dir ^\r\n  /s\r\necho done', 'cmd'), 'dir /s & echo done');
    assert.equal(oneLine('Get-ChildItem `\n  -Recurse', 'powershell'), 'Get-ChildItem -Recurse');
    assert.equal(oneLine('docker run \\\n  -it ubuntu', 'posix'), 'docker run -it ubuntu');
  });

  // each expected line was checked by its shell: bash -n, PowerShell's parser, cmd run
  it('keeps a POSIX block valid: no separator right after then, do, else, in, an opened group or an operator', () => {
    const cases: [string, string][] = [
      ['if [ -f package.json ]; then\n  echo yes\nelse\n  echo no\nfi', 'if [ -f package.json ]; then echo yes; else echo no; fi'],
      ['if [ -f x ]\nthen\n  echo a\nelif [ -f y ]; then\n  echo b\nfi', 'if [ -f x ]; then echo a; elif [ -f y ]; then echo b; fi'],
      ['for f in *.ts; do\n  echo "$f"\ndone', 'for f in *.ts; do echo "$f"; done'],
      ['while read -r line\ndo\n  echo "$line"\ndone < list.txt', 'while read -r line; do echo "$line"; done < list.txt'],
      ['git log --oneline |\n  head -5 |\n  wc -l', 'git log --oneline | head -5 | wc -l'],
      ['npm ci &&\n  npm test ||\n  echo failed', 'npm ci && npm test || echo failed'],
      ['build() {\n  npm run build\n  echo done\n}\nbuild', 'build() { npm run build; echo done; }; build'],
      ['echo $(date)\necho next', 'echo $(date); echo next'],
    ];
    for (const [block, line] of cases) assert.equal(oneLine(block, 'posix'), line);
  });

  it('keeps a case statement valid, its patterns on their own lines or not', () => {
    const line = 'case "$1" in start) echo go ;; *) echo no ;; esac';
    assert.equal(oneLine('case "$1" in\n  start) echo go ;;\n  *) echo no ;;\nesac', 'posix'), line);
    assert.equal(oneLine('case "$1" in\n  start)\n    echo go\n    ;;\n  *)\n    echo no\n    ;;\nesac', 'posix'), line);
  });

  it('pastes a PowerShell block comment as it is, so its closing line is not taken for a comment', () => {
    assert.equal(oneLine('<#\nhelp\n#>\nGet-Date', 'powershell'), '<#\nhelp\n#>\nGet-Date');
  });

  it('keeps a PowerShell pipeline, script block, else and catch valid', () => {
    assert.equal(oneLine('Get-ChildItem -Recurse |\n  Where-Object {\n    $_.Length -gt 1kb\n  } |\n  Select-Object Name', 'powershell'), 'Get-ChildItem -Recurse | Where-Object { $_.Length -gt 1kb; } | Select-Object Name');
    assert.equal(oneLine('if ($x -eq 1) {\n  "one"\n}\nelse {\n  "other"\n}', 'powershell'), 'if ($x -eq 1) { "one"; } else { "other"; }');
    assert.equal(oneLine('try {\n  Get-Item nope\n}\ncatch {\n  "caught"\n}', 'powershell'), 'try { Get-Item nope; } catch { "caught"; }');
    assert.equal(oneLine('$ok = $true -and\n  $false\n$list = 1,\n  2', 'powershell'), '$ok = $true -and $false; $list = 1, 2');
  });

  it('keeps a cmd block in parentheses valid', () => {
    assert.equal(oneLine('if exist package.json (\n  echo yes\n  echo again\n) else (\n  echo no\n)', 'cmd'), 'if exist package.json ( echo yes & echo again ) else ( echo no )');
    assert.equal(oneLine('npm ci &&\n  npm test', 'cmd'), 'npm ci && npm test');
  });

  it('drops the lines that are only a comment, and gives a block with a comment after a command as it is', () => {
    assert.equal(oneLine('# install\nnpm i\nnpm test', 'posix'), 'npm i; npm test');
    assert.equal(oneLine('# install\nnpm i\nnpm test', 'powershell'), 'npm i; npm test');
    assert.equal(oneLine('REM go\n:: again\nrem more\ndir', 'cmd'), 'dir');
    assert.equal(oneLine('npm i # deps\nnpm test\n', 'posix'), 'npm i # deps\nnpm test');
    assert.equal(oneLine('dir & REM list\necho done', 'cmd'), 'dir & REM list\necho done');
    assert.equal(oneLine('echo "a # b"\necho c#d', 'posix'), 'echo "a # b"; echo c#d');
  });

  it('gives a block with a string left open at the end of a line as it is', () => {
    assert.equal(oneLine('echo "a\nb"', 'posix'), 'echo "a\nb"');
    assert.equal(oneLine("echo 'a\nb'\n", 'powershell'), "echo 'a\nb'");
    assert.equal(oneLine('echo "a\nb"', 'cmd'), 'echo "a\nb"');
  });

  it('does not take a command ending with a parenthesis in a case for a pattern', () => {
    assert.equal(oneLine('case $x in\n a)\n v=$(date)\n echo $v\n ;;\nesac', 'posix'), 'case $x in a) v=$(date); echo $v ;; esac');
  });

  it('gives a here-document as it is, only without its last line break', () => {
    const block = 'cat <<EOF > notes.txt\nhello\nEOF\n';
    assert.equal(oneLine(block, 'posix'), 'cat <<EOF > notes.txt\nhello\nEOF');
  });
});
