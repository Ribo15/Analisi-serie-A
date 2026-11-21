const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { test } = require('node:test');
const { validate, create } = require('./lineups-client.js');

const ctx = { window: {} };
for (const path of [
  'data.js',
  'beta/data-meta-g9.js',
  'beta/data-bands-v12.js',
  'beta/data-predictions-g10.js',
  'beta/data-lineups-g10.js',
  'beta/data-v12.js',
]) {
  vm.runInNewContext(fs.readFileSync(path, 'utf8'), ctx, {filename: path});
}
const data = ctx.window.SERIE_A_DATA;
const payload = JSON.parse(fs.readFileSync('lineups-preview.json', 'utf8'));
const now = Date.parse(payload.generated_at_utc) + 1000;
const clone = value => JSON.parse(JSON.stringify(value));
const fixture = data.calendar.find(x => +x.round === +data.betaSnapshot.predictionRound);
const excel = data.lineups.find(x => x.home === fixture.home && x.away === fixture.away);

test('all 10 matches match the frozen Excel schedule', () => {
  const result = validate(payload, data, now);
  assert.equal(result.byFixture.size, 10);
  assert.equal(result.round, 12);
});
test('valid external lineups overlay does not mutate Excel data', () => {
  const original = JSON.stringify(data);
  const service = create(data, {now: () => now, notify: () => {}});
  service.loadValidated(payload);
  const updated = service.forMatch(fixture, excel);
  assert.equal(updated.home, fixture.home);
  assert.equal(updated.source.startsWith('SOS Fanta'), true);
  assert.equal(updated.homeXI.length, 11);
  assert.notEqual(updated, excel);
  assert.equal(JSON.stringify(data), original);
});
test('unrelated fixtures and historical rounds keep Excel data', () => {
  const service = create(data, {now: () => now, notify: () => {}});
  service.loadValidated(payload);
  assert.equal(service.forMatch({...fixture, round: 11}, excel), excel);
  assert.equal(service.forMatch({...fixture, date: '2026-12-31'}, excel), excel);
});
test('reject wrong fixture instead of contaminating current round', () => {
  const p = clone(payload);
  p.lineups[0].home = 'Squadra errata';
  assert.throws(() => validate(p, data, now));
});
test('reject incomplete or duplicate starting XI', () => {
  const p = clone(payload);
  p.lineups[0].homeXI.pop();
  assert.throws(() => validate(p, data, now));
  const q = clone(payload);
  q.lineups[0].awayXI[1].name = q.lineups[0].awayXI[0].name;
  assert.throws(() => validate(q, data, now));
});
test('reject invalid probability and module', () => {
  const p = clone(payload);
  p.lineups[0].awayXI[0].prob = 5;
  assert.throws(() => validate(p, data, now));
  const q = clone(payload);
  q.lineups[0].homeModule = '7-7-7';
  assert.throws(() => validate(q, data, now));
});
test('reject old, future and missing timestamps', () => {
  assert.throws(() => validate(payload, data, now + 49 * 60 * 60 * 1000));
  assert.throws(() => validate(payload, data, now - 10 * 60 * 1000));
  const p = clone(payload); delete p.generated_at_utc;
  assert.throws(() => validate(p, data, now));
});
test('fetch failure restores Excel without touching saved data', async () => {
  const original = JSON.stringify(data);
  const service = create(data, {
    now: () => now,
    notify: () => {},
    fetch: async () => ({ok: false})
  });
  service.loadValidated(payload);
  assert.equal(service.status, 'live');
  assert.equal(await service.refresh(), false);
  assert.equal(service.status, 'excel');
  assert.equal(service.forMatch(fixture, excel), excel);
  assert.equal(JSON.stringify(data), original);
});
test('online fetch loads only validated JSON into memory', async () => {
  const service = create(data, {
    now: () => now,
    notify: () => {},
    fetch: async () => ({ok: true, json: async () => payload})
  });
  assert.equal(await service.refresh(), true);
  assert.equal(service.status, 'live');
  assert.equal(service.forMatch(fixture, excel).homeXI.length, 11);
});
