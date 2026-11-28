// The usage view's numbers, from the rows the server reads in Claude Code's transcripts (shared/usage.ts): totals,
// days, models, projects and the week's rewind. Pure functions; the view is src/command/UsagePanel.tsx.
import {
  addTokens, cacheSavingsOf, costOf, costParts, dayOf, HOUR_MS, NO_TOKENS, RECENT_HOURS, totalTokens, type CostReport, type ModelHour, type Tokens,
} from '../../shared/usage.ts';

export type Metric = 'cost' | 'tokens';
/** The colour slots of the charts: the four models that cost most over the whole report, then all the others. */
export const SERIES_SLOTS = 4;
export const OTHERS = 'others';

/** The periods the overview looks back over: the last 24 hours, or the last days (today among them). */
export type Period = '24h' | 7 | 30 | 90;
export const PERIODS: readonly Period[] = ['24h', 7, 30, 90];
/** Which rows to add up: those of a period back from the report's time, or those of the local days given. */
export type Span = Period | readonly string[];

/** A row the report spends on: a day or an hour of one model (and of one project, for the project rows). */
export interface SpendRow { model: string; fast?: true; tokens: Tokens; turns?: number }

export interface Spending { cost: number; tokens: Tokens; turns: number }
const NOTHING: Spending = { cost: 0, tokens: NO_TOKENS, turns: 0 };
const add = (sum: Spending, row: SpendRow): Spending => ({
  cost: sum.cost + costOf(row.model, row.tokens, row.fast), tokens: addTokens(sum.tokens, row.tokens), turns: sum.turns + (row.turns ?? 0),
});

/** Local days, oldest first: the `count` days that end with `last` ("YYYY-MM-DD"). */
export function daysUntil(last: string, count: number): string[] {
  const [year, month, day] = last.split('-').map(Number);
  return Array.from({ length: count }, (_, index) => dayOf(new Date(year, month - 1, day - (count - 1 - index), 12).getTime()));
}

/** The hours (their start, epoch ms) of the 24 hours view, oldest first: the report's current hour and the 23 before it. */
export function hoursOf(report: CostReport): number[] {
  const current = Math.floor(report.generatedAt / HOUR_MS) * HOUR_MS;
  return Array.from({ length: RECENT_HOURS }, (_, index) => current - (RECENT_HOURS - 1 - index) * HOUR_MS);
}

/** The hours of the last day; a server older than them sends none. */
const recentOf = (report: CostReport): readonly ModelHour[] => report.recent ?? [];

/** The local days of a span counted in days. */
const daysIn = (report: CostReport, span: Exclude<Span, '24h'>) => new Set(typeof span === 'number' ? daysUntil(dayOf(report.generatedAt), span) : span);

/** The rows of a span: by model (with their answers) and by project. */
export function rowsOf(report: CostReport, span: Span): { models: readonly SpendRow[]; projects: readonly (SpendRow & { project: string })[] } {
  if (span === '24h') return { models: recentOf(report), projects: recentOf(report) };
  const wanted = daysIn(report, span);
  return { models: report.models.filter((row) => wanted.has(row.day)), projects: report.projects.filter((row) => wanted.has(row.day)) };
}

/** Rows added up under a key each, the costliest first. */
function ranked<R extends SpendRow>(rows: readonly R[], keyOf: (row: R) => string): [string, Spending][] {
  const found = new Map<string, Spending>();
  for (const row of rows) found.set(keyOf(row), add(found.get(keyOf(row)) ?? NOTHING, row));
  return [...found].sort(([, a], [, b]) => b.cost - a.cost || totalTokens(b.tokens) - totalTokens(a.tokens));
}

/** The models of the report, those that cost most over all of it first: their order gives them their colour for good. */
export function seriesOf(report: CostReport): string[] {
  return ranked(report.models, (row) => row.model).map(([model]) => model);
}

/** The chart slot of a model: its rank in `series` when among the first four, else the others. */
export const slotOf = (series: readonly string[], model: string) => {
  const rank = series.indexOf(model);
  return rank >= 0 && rank < SERIES_SLOTS ? model : OTHERS;
};

/** What was spent in each of `keys` (a row's key: `keyOf`), by colour slot; a row of another key is left out. */
function bySlot<R extends SpendRow, K>(rows: readonly R[], keys: readonly K[], keyOf: (row: R) => K, series: readonly string[]): Record<string, Spending>[] {
  const index = new Map(keys.map((key, at) => [key, at]));
  const found: Record<string, Spending>[] = keys.map(() => ({}));
  for (const row of rows) {
    const at = index.get(keyOf(row));
    if (at === undefined) continue;
    const slot = slotOf(series, row.model);
    found[at][slot] = add(found[at][slot] ?? NOTHING, row);
  }
  return found;
}

/** What was spent on each of `days`, by colour slot. */
export function perDay(report: CostReport, days: readonly string[], series: readonly string[]): { day: string; values: Record<string, Spending> }[] {
  const values = bySlot(report.models, days, (row) => row.day, series);
  return days.map((day, at) => ({ day, values: values[at] }));
}

/** What was spent in each of the last 24 hours (`hour`: its start), oldest first, by colour slot. */
export function perHour(report: CostReport, series: readonly string[]): { hour: number; values: Record<string, Spending> }[] {
  const hours = hoursOf(report);
  const values = bySlot(recentOf(report), hours, (row) => row.hour, series);
  return hours.map((hour, at) => ({ hour, values: values[at] }));
}

export const measure = (spending: Spending | undefined, metric: Metric) => (!spending ? 0 : metric === 'cost' ? spending.cost : totalTokens(spending.tokens));

/** What was spent over a span, all models together. */
export const spentOn = (report: CostReport, span: Span): Spending => rowsOf(report, span).models.reduce(add, NOTHING);

/** A cost split by kind of tokens, in dollars. */
export type CostParts = ReturnType<typeof costParts>;
export const COST_PARTS = ['input', 'cacheWrite', 'cacheRead', 'output'] as const satisfies readonly (keyof CostParts)[];

/** The totals of a span: its spending, its cost by kind of tokens, what the cache saved, its tokens by kind. */
export interface Summary extends Spending {
  parts: CostParts;
  savings: number;
  processed: number;
  cachedInput: number;
  uncachedInput: number;
  cacheWrite: number;
  output: number;
}

/** The totals of some rows (those of `rowsOf(...).models`). */
export function summaryOf(rows: readonly SpendRow[]): Summary {
  const spending = rows.reduce(add, NOTHING);
  const parts: CostParts = { input: 0, cacheWrite: 0, cacheRead: 0, output: 0 };
  let savings = 0;
  for (const row of rows) {
    const cost = costParts(row.model, row.tokens, row.fast);
    for (const part of COST_PARTS) parts[part] += cost[part];
    savings += cacheSavingsOf(row.model, row.tokens, row.fast);
  }
  const { tokens } = spending;
  return {
    ...spending, parts, savings, processed: totalTokens(tokens), cachedInput: tokens.cacheRead, uncachedInput: tokens.input,
    cacheWrite: tokens.cacheWrite5m + tokens.cacheWrite1h, output: tokens.output,
  };
}

/** Each model's spending over a span, the costliest first (fast mode counted with its model). */
export function byModel(report: CostReport, span: Span): ({ model: string } & Spending)[] {
  return ranked(rowsOf(report, span).models, (row) => row.model).map(([model, spending]) => ({ model, ...spending }));
}

/** Each project's (folder's) spending over a span, the costliest first. */
export function byProject(report: CostReport, span: Span): ({ project: string } & Spending)[] {
  return ranked(rowsOf(report, span).projects, (row) => row.project).map(([project, spending]) => ({ project, ...spending }));
}

/** The conversations active in a span: on one of its days, or (24 hours) since the first hour of the chart. */
export function conversationsIn(report: CostReport, span: Span) {
  if (span === '24h') return report.conversations.filter((conversation) => conversation.end >= hoursOf(report)[0]);
  const wanted = daysIn(report, span);
  return report.conversations.filter((conversation) => conversation.days.some((day) => wanted.has(day)));
}

/** How many conversations were active in a period. */
export const sessionsIn = (report: CostReport, period: Period) => conversationsIn(report, period).length;

/** The Monday ("YYYY-MM-DD") of the week of a day. */
export function mondayOf(day: string): string {
  const [year, month, date] = day.split('-').map(Number);
  const noon = new Date(year, month - 1, date, 12);
  return dayOf(new Date(year, month - 1, date - ((noon.getDay() + 6) % 7), 12).getTime());
}

export interface Rewind {
  days: string[];
  minutes: number;
  sessions: number;
  cost: number;
  /** the three hours in a row with the most activity: its first hour, and its minutes (null for a quiet week) */
  peak: { from: number; minutes: number } | null;
  topProject: { project: string; sessions: number } | null;
  busiestDay: { day: string; minutes: number } | null;
  sessionsByDay: number[];
  costByDay: { day: string; values: Record<string, Spending> }[];
  /** minutes of activity, [day of the week][hour] */
  heatmap: number[][];
  models: ({ model: string } & Spending)[];
}

/** The week that starts on `monday`, told back: time, sessions, cost, when and where most happened. */
export function rewindOf(report: CostReport, monday: string, series: readonly string[]): Rewind {
  const days = daysAfter(monday, 7);
  const index = new Map(days.map((day, at) => [day, at]));
  const heatmap = days.map(() => Array.from({ length: 24 }, () => 0));
  for (const hour of report.hours) {
    const at = index.get(hour.day);
    if (at !== undefined) heatmap[at][hour.hour] += hour.minutes;
  }
  const minutesByDay = heatmap.map((hours) => hours.reduce((sum, minutes) => sum + minutes, 0));
  const minutes = minutesByDay.reduce((sum, value) => sum + value, 0);
  const conversations = conversationsIn(report, days);
  const sessionsByDay = days.map((day) => conversations.filter((conversation) => conversation.days.includes(day)).length);
  const byHour = Array.from({ length: 24 }, (_, hour) => heatmap.reduce((sum, row) => sum + row[hour], 0));
  let peak: Rewind['peak'] = null;
  for (let from = 0; from <= 21; from++) {
    const sum = byHour[from] + byHour[from + 1] + byHour[from + 2];
    if (sum > 0 && (!peak || sum > peak.minutes)) peak = { from, minutes: sum };
  }
  const projects = new Map<string, number>();
  for (const conversation of conversations) projects.set(conversation.project, (projects.get(conversation.project) ?? 0) + 1);
  const top = [...projects].sort((a, b) => b[1] - a[1])[0];
  const busiest = minutesByDay.reduce((best, value, at) => (value > (best?.minutes ?? 0) ? { day: days[at], minutes: value } : best), null as Rewind['busiestDay']);
  return {
    days, minutes, sessions: conversations.length, cost: spentOn(report, days).cost, peak,
    topProject: top ? { project: top[0], sessions: top[1] } : null, busiestDay: busiest, sessionsByDay,
    costByDay: perDay(report, days, series), heatmap, models: byModel(report, days),
  };
}

/** `count` local days starting with `first`. */
export function daysAfter(first: string, count: number): string[] {
  const [year, month, day] = first.split('-').map(Number);
  return Array.from({ length: count }, (_, index) => dayOf(new Date(year, month - 1, day + index, 12).getTime()));
}
