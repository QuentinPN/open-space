import assert from 'node:assert/strict';
import test from 'node:test';
import { HOUR_MS, NO_TOKENS, type CostReport } from '../../shared/usage.ts';
import { byModel, byProject, daysAfter, daysUntil, mondayOf, OTHERS, perDay, perHour, rewindOf, seriesOf, sessionsIn, slotOf, spentOn, summaryOf } from './usage.ts';

const million = (input: number) => ({ ...NO_TOKENS, input: input * 1_000_000 });
const report: CostReport = {
  generatedAt: 0, scanning: false, recent: [],
  models: [
    { day: '2026-10-19', model: 'claude-opus-5-5', tokens: million(1), turns: 3 },
    { day: '2026-10-20', model: 'claude-opus-5-5', tokens: million(2), turns: 2 },
    { day: '2026-10-20', model: 'claude-fable-5-1', tokens: million(1), turns: 1 },
    { day: '2026-10-12', model: 'claude-haiku-5-5', tokens: million(10), turns: 9 },
  ],
  projects: [
    { day: '2026-10-20', project: '/code/a', model: 'claude-opus-5-5', tokens: million(2) },
    { day: '2026-10-20', project: '/code/b', model: 'claude-fable-5-1', tokens: million(1) },
  ],
  hours: [{ day: '2026-10-19', hour: 13, minutes: 30 }, { day: '2026-10-19', hour: 14, minutes: 20 }, { day: '2026-10-20', hour: 9, minutes: 10 }],
  conversations: [
    { id: 'x', project: '/code/a', start: 0, end: 0, minutes: 50, days: ['2026-10-19', '2026-10-20'] },
    { id: 'y', project: '/code/b', start: 0, end: 0, minutes: 10, days: ['2026-10-20'] },
    { id: 'z', project: '/code/a', start: 0, end: 0, minutes: 5, days: ['2026-10-12'] },
  ],
};

test('days run across month ends, oldest first', () => {
  assert.deepEqual(daysUntil('2026-11-02', 3), ['2026-10-31', '2026-11-01', '2026-11-02']);
  assert.deepEqual(daysAfter('2026-10-30', 3), ['2026-10-30', '2026-10-31', '2026-11-01']);
  assert.equal(mondayOf('2026-10-25'), '2026-10-19');
  assert.equal(mondayOf('2026-10-19'), '2026-10-19');
});

test('spending is priced per model and added up over the days asked for', () => {
  assert.equal(spentOn(report, ['2026-10-20']).cost, 2 * 4 + 10);
  assert.deepEqual(byModel(report, ['2026-10-19', '2026-10-20']).map((row) => [row.model, row.cost, row.turns]), [['claude-opus-5-5', 12, 5], ['claude-fable-5-1', 10, 1]]);
  assert.deepEqual(byProject(report, ['2026-10-20']).map((row) => [row.project, row.cost]), [['/code/a', 8], ['/code/b', 10]].sort((a, b) => Number(b[1]) - Number(a[1])));
});

test('a model keeps its colour whatever the period: its rank over the whole report', () => {
  const series = seriesOf(report);
  assert.deepEqual(series, ['claude-opus-5-5', 'claude-fable-5-1', 'claude-haiku-5-5']);
  assert.equal(slotOf(['a', 'b', 'c', 'd', 'e'], 'e'), OTHERS);
  const days = perDay(report, ['2026-10-19', '2026-10-20', '2026-10-21'], series);
  assert.equal(days[1].values['claude-fable-5-1'].cost, 10);
  assert.deepEqual(days[2].values, {});
});

test('the rewind tells the week: time, sessions, peak, top project and busiest day', () => {
  const rewind = rewindOf(report, '2026-10-19', seriesOf(report));
  assert.equal(rewind.minutes, 60);
  assert.equal(rewind.sessions, 2);
  assert.deepEqual(rewind.sessionsByDay.slice(0, 3), [1, 2, 0]);
  assert.deepEqual(rewind.peak, { from: 12, minutes: 50 });
  assert.deepEqual(rewind.topProject, { project: '/code/a', sessions: 1 });
  assert.deepEqual(rewind.busiestDay, { day: '2026-10-19', minutes: 50 });
  assert.equal(rewind.heatmap[0][13], 30);
  assert.equal(rewind.cost, 4 + 18);
});

// 2026-10-20 15:20 local: the 24 hours run from yesterday's 16:00 hour to today's 15:00 hour
const now = new Date(2026, 9, 20, 15, 20).getTime();
const hourAt = (hours: number, date = 20) => new Date(2026, 9, date, hours).getTime();
const lastDay: CostReport = {
  ...report, generatedAt: now,
  recent: [
    { hour: hourAt(15), project: '/code/a', model: 'claude-opus-5-5', tokens: million(1), turns: 2 },
    { hour: hourAt(14), project: '/code/b', model: 'claude-fable-5-1', tokens: { ...million(1), cacheRead: 1_000_000 }, turns: 1 },
    { hour: hourAt(14), project: '/code/a', model: 'claude-opus-5-5', tokens: million(1), turns: 1 },
  ],
  conversations: [
    { id: 'late', project: '/code/a', start: 0, end: hourAt(17, 19), minutes: 5, days: ['2026-10-19'] },
    { id: 'early', project: '/code/a', start: 0, end: hourAt(14, 19), minutes: 5, days: ['2026-10-19'] },
    { id: 'old', project: '/code/a', start: 0, end: hourAt(9, 12), minutes: 5, days: ['2026-10-12'] },
  ],
};

test('the last 24 hours are ranked by model and by project from their hours', () => {
  assert.deepEqual(byModel(lastDay, '24h').map((row) => [row.model, row.cost, row.turns]), [['claude-fable-5-1', 10 + 0.25, 1], ['claude-opus-5-5', 8, 3]]);
  assert.deepEqual(byProject(lastDay, '24h').map((row) => [row.project, row.cost]), [['/code/b', 10.25], ['/code/a', 8]]);
  assert.equal(spentOn(lastDay, '24h').cost, 18.25);
});

test('a report from a server without the last hours has nothing in them', () => {
  const older: CostReport = { ...lastDay, recent: undefined };
  assert.equal(spentOn(older, '24h').cost, 0);
  assert.equal(perHour(older, seriesOf(older)).length, 24);
});

test('the hours run oldest first, from 23 hours before the current one to it', () => {
  const hours = perHour(lastDay, seriesOf(lastDay));
  assert.equal(hours.length, 24);
  assert.equal(hours[0].hour, hourAt(16, 19));
  assert.equal(hours[23].hour, hourAt(15));
  assert.equal(hours[23].values['claude-opus-5-5'].cost, 4);
  assert.equal(hours[22].values['claude-opus-5-5'].cost, 4);
  assert.equal(hours[22].values['claude-fable-5-1'].cost, 10.25);
  assert.equal(hours[23].hour - hours[22].hour, HOUR_MS);
});

test('a period\'s totals split its cost by kind of tokens and count what the cache saved', () => {
  const summary = summaryOf([
    { model: 'claude-opus-5-5', tokens: { input: 1_000_000, output: 1_000_000, cacheWrite5m: 1_000_000, cacheWrite1h: 0, cacheRead: 1_000_000 }, turns: 2 },
    { model: 'claude-opus-5-5', fast: true, tokens: { ...NO_TOKENS, cacheRead: 1_000_000 }, turns: 1 },
    { model: 'claude-unknown-9', tokens: million(1), turns: 1 },
  ]);
  assert.deepEqual(summary.parts, { input: 4, cacheWrite: 5, cacheRead: 0.2 + 0.4, output: 20 });
  assert.ok(Math.abs(summary.cost - (4 + 5 + 0.6 + 20)) < 1e-9);
  assert.ok(Math.abs(summary.savings - 3 * (4 - 0.2)) < 1e-9, 'fast reads saved twice as much');
  assert.deepEqual([summary.processed, summary.uncachedInput, summary.cachedInput, summary.cacheWrite, summary.output, summary.turns], [6_000_000, 2_000_000, 2_000_000, 1_000_000, 1_000_000, 4]);
});

test('sessions count in the last 24 hours by when they last wrote, in the days by the days they were active', () => {
  assert.equal(sessionsIn(lastDay, '24h'), 1, 'yesterday 14:19 is more than 24 hours before 15:20');
  assert.equal(sessionsIn(lastDay, 7), 2);
  assert.equal(sessionsIn(lastDay, 30), 3);
});
