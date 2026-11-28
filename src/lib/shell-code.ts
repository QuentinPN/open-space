// The code blocks of a conversation that are commands for a shell: they get a Run button (src/lib/markdown.ts) that
// pastes them into the session's terminal (src/state/terminals.ts). Pure functions.
import type { ShellFamily } from '../../shared/terminal.ts';

const SHELLS = new Set(['bash', 'sh', 'shell', 'zsh', 'fish', 'console', 'terminal', 'powershell', 'ps1', 'pwsh', 'cmd', 'bat']);

/** Whether a code block's language (what follows its ```) is a shell's: its commands can be run in a terminal. */
export const isShellLanguage = (language: string | null | undefined) => !!language && SHELLS.has(language.trim().toLowerCase());

const PROMPT = /^(?:\$|>) /;

/**
 * What a shell block gives the terminal: its text without the line break at its end (pasted, it would run the
 * command). A `console` block shows a session, commands after a prompt ("$ ", or "> " for a line that goes on) between
 * their outputs: only the commands are kept, without their prompt; a console block without any prompt is all command.
 */
export function commandOf(code: string, language: string | null | undefined): string {
  const text = code.replace(/\s+$/, '');
  if (language?.trim().toLowerCase() !== 'console') return text;
  const lines = text.split('\n');
  if (!lines.some((line) => PROMPT.test(line))) return text;
  return lines.filter((line) => PROMPT.test(line)).map((line) => line.replace(PROMPT, '')).join('\n');
}

/**
 * How each family writes several commands on one line: its separator, its line continuation (dropped when joining), the
 * lines after which no separator may come (`goesOn`: the command is not over, `inCase` inside a POSIX case), the lines
 * before which none may come (`leadsOn`), and what cannot be put on one line at all (`verbatim`).
 */
interface CommandLine {
  separator: string;
  continuation: string;
  goesOn: (line: string, inCase: boolean) => boolean;
  leadsOn: (next: string) => boolean;
  verbatim: RegExp | null;
}

// a case pattern on its own line: `a)`, `(a | b)`, `*)`; not a command that ends with a `)` (v=$(date))
const CASE_PATTERN = /^\(?\s*[^\s()]+(?:\s*\|\s*[^\s()]+)*\)$/;

const COMMAND_LINE: Record<ShellFamily, CommandLine> = {
  // ( opens a block, &, && and || and | wait for the next command; a block's ) and an else follow without one
  cmd: {
    separator: ' & ', continuation: '^',
    goesOn: (line) => /[(&|]$/.test(line),
    leadsOn: (next) => /^(?:\)|else\b)/i.test(next),
    verbatim: null,
  },
  // a pipe, an opened block or list, an operator waiting for its right side; else, catch and finally follow a } directly
  powershell: {
    separator: '; ', continuation: '`',
    goesOn: (line) => /(?:[|{(,=;]|-and|-or)$/i.test(line),
    leadsOn: (next) => /^(?:\||(?:else|elseif|catch|finally)\b)/i.test(next),
    // a here-string ends on a line of its own, and so may a block comment <# … #>
    verbatim: /@["']\s*$|<#/m,
  },
  // the keywords that open a body (then, do, else, case … in), an opened group, an operator waiting for its right side,
  // a line already ending its command (; or ;;), a case pattern; ;; follows its command directly
  posix: {
    separator: '; ', continuation: '\\',
    goesOn: (line, inCase) => /^(?:then|do|else)$|;\s*(?:then|do|else)$|^(?:if|elif|while|until|for|select)\b.*\s(?:then|do)$/.test(line)
      || /^(?:case|for|select)\b.*\sin$/.test(line)
      || /[{(|&;]$/.test(line)
      || (inCase && CASE_PATTERN.test(line)),
    leadsOn: (next) => next.startsWith(';;'),
    // a here-document reads the lines that follow it as they are
    verbatim: /(?:^|[^<])<<-?\s*['"]?[A-Za-z_]/,
  },
};

const COMMENT_LINE: Record<ShellFamily, RegExp> = { cmd: /^(?:rem(?:\s|$)|::)/i, powershell: /^#/, posix: /^#/ };

/** Whether a line ends a quote still open, or carries a comment after its command: joined, they would change meaning. */
function unsafeToJoin(line: string, family: ShellFamily): boolean {
  const quotes = family === 'cmd' ? '"' : `'"`;
  const skip = family === 'cmd' ? '^' : family === 'powershell' ? '`' : '\\';
  let quote = '';
  for (let at = 0; at < line.length; at++) {
    const char = line[at];
    if (quote) {
      if (char === quote) quote = '';
      else if (char === skip && quote === '"') at++;
    } else if (char === skip) at++;
    else if (quotes.includes(char)) quote = char;
    else if (family === 'cmd' ? /^&\s*rem(?:\s|$)/i.test(line.slice(at)) : char === '#' && /\s/.test(line[at - 1] ?? '')) return true;
  }
  return quote !== '';
}

/**
 * Several lines as one command line, for a shell that would run each pasted line at once (no bracketed paste: cmd):
 * commands are separated as their shell separates them, but a line whose command goes on (a continuation, which is
 * dropped, a pipe, then, do, an opened block…) joins the next with a space; blank lines are dropped. Nothing runs
 * before the user presses Enter. What cannot be one line (a here-document, a here-string) is given as it is, only
 * without its last line break: its first lines still run as they are pasted. So is a block with a comment after a command
 * or a string left open at the end of a line; a line that is only a comment is dropped.
 */
export function oneLine(text: string, family: ShellFamily): string {
  const rules = COMMAND_LINE[family];
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter((line) => line && !COMMENT_LINE[family].test(line));
  if (rules.verbatim?.test(text) || lines.some((line) => unsafeToJoin(line, family))) return text.replace(/\s+$/, '');
  let joined = '';
  let cases = 0;
  lines.forEach((line, at) => {
    const continued = line.endsWith(rules.continuation);
    joined += continued ? line.slice(0, -rules.continuation.length).trimEnd() : line;
    if (family === 'posix') {
      if (/^case\b.*\sin$/.test(line)) cases++;
      if (/^esac\b/.test(line)) cases = Math.max(0, cases - 1);
    }
    const next = lines[at + 1];
    if (next === undefined) return;
    joined += continued || rules.goesOn(line, cases > 0) || rules.leadsOn(next) ? ' ' : rules.separator;
  });
  return joined;
}
