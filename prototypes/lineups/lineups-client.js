/* Formazioni live: SOLO livello di lettura; non muta SERIES_A_DATA né localStorage. */
(function (root) {
  'use strict';

  const SOURCE = 'https://www.sosfanta.com/lista-formazioni/probabili-formazioni-serie-a/';
  const MAX_AGE_MS = 48 * 60 * 60 * 1000;
  const FUTURE_SKEW_MS = 5 * 60 * 1000;
  const FEED = 'prototypes/lineups/lineups-latest.json';
  const validName = v => typeof v === 'string' && !!v.trim() && v.length < 120;
  const key = v => [v.home, v.away, v.date, v.time].join('|');

  function validate(payload, data, at = Date.now()) {
    if (!payload || payload.source !== SOURCE || !Array.isArray(payload.lineups))
      throw new Error('Fonte o struttura non valida');
    const when = Date.parse(payload.generated_at_utc);
    if (!Number.isFinite(when) || when > at + FUTURE_SKEW_MS || at - when > MAX_AGE_MS)
      throw new Error('Aggiornamento non recente: continuo con Excel');

    // Il solo turno autorizzato è quello già pubblicato dallo snapshot Excel.
    const round = Number(data && data.betaSnapshot && data.betaSnapshot.predictionRound);
    if (!Number.isInteger(round) || round < 1 || round > 38)
      throw new Error('Giornata Excel non disponibile');
    const fixtures = (data.calendar || []).filter(x => Number(x.round) === round);
    if (fixtures.length !== 10 || payload.lineups.length !== fixtures.length)
      throw new Error('Numero partite non compatibile con Excel');

    const expected = new Map(fixtures.map(f => [key(f), f]));
    if (expected.size !== fixtures.length)
      throw new Error('Calendario Excel contiene doppioni');

    const uniqueTeams = new Set(), out = new Map();
    for (const l of payload.lineups) {
      if (!l || !expected.has(key(l)) || out.has(key(l)))
        throw new Error('Partita diversa o duplicata rispetto al calendario Excel');
      if (![l.home, l.away].every(validName))
        throw new Error('Squadra non valida');
      uniqueTeams.add(l.home); uniqueTeams.add(l.away);
      for (const side of ['home', 'away']) {
        const module = l[side + 'Module'];
        if (typeof module !== 'string' || !/^\d(?:-\d){2,4}$/.test(module) ||
            module.split('-').reduce((sum, n) => sum + Number(n), 0) !== 10)
          throw new Error('Modulo tattico non valido');
        const players = l[side + 'XI'];
        if (!Array.isArray(players) || players.length !== 11 ||
            players.some(p => !p || !validName(p.name) || typeof p.prob !== 'number' ||
                              !Number.isFinite(p.prob) || p.prob < 0 || p.prob > 1) ||
            new Set(players.map(p => p.name.toLocaleLowerCase('it-IT'))).size !== 11)
          throw new Error('Formazione incompleta, duplicata o con probabilita non valida');
        const outs = l[side + 'Out'];
        if (!Array.isArray(outs) || outs.some(x => !validName(x)))
          throw new Error('Indisponibili non validi');
      }
      out.set(key(l), l);
    }
    if (uniqueTeams.size !== 20 || out.size !== 10)
      throw new Error('Squadre o partite mancanti');
    return { round, byFixture: out, generatedAt: payload.generated_at_utc };
  }

  function create(data, io = {}) {
    let active = null;
    let status = 'excel';
    const getNow = io.now || (() => Date.now());
    const request = io.fetch || ((url, options) => root.fetch(url, options));
    const notify = io.notify || (() => {
      if (root.dispatchEvent && typeof root.Event === 'function')
        root.dispatchEvent(new root.Event('ribo:lineups-updated'));
    });
    const service = {
      get status() { return status; },
      get generatedAt() { return active ? active.generatedAt : null; },
      forMatch(fixture, excelLineup) {
        if (!fixture || !active || Number(fixture.round) !== active.round ||
            getNow() - Date.parse(active.generatedAt) > MAX_AGE_MS)
          return excelLineup;
        const found = active.byFixture.get(key(fixture));
        if (!found) return excelLineup;
        return {
          ...excelLineup, ...found, round: active.round,
          source: 'SOS Fanta • probabili formazioni • ' +
            new Date(active.generatedAt).toLocaleString('it-IT', {dateStyle: 'short', timeStyle: 'short'})
        };
      },
      loadValidated(payload) {
        const checked = validate(payload, data, getNow());
        active = checked;
        status = 'live';
        notify();
      },
      async refresh() {
        try {
          const resp = await request(FEED + '?t=' + getNow(), { cache: 'no-store' });
          if (!resp || !resp.ok) throw new Error('JSON non disponibile');
          const payload = await resp.json();
          service.loadValidated(payload);
          return true;
        } catch (err) {
          active = null;
          status = 'excel';
          notify();
          return false;
        }
      }
    };
    return service;
  }

  if (typeof module === 'object' && module.exports) module.exports = { validate, create };
  if (typeof window !== 'undefined' && window.SERIE_A_DATA) {
    window.RIBO_LINEUPS = create(window.SERIE_A_DATA);
    window.RIBO_LINEUPS.refresh();
  }
})(typeof window !== 'undefined' ? window : globalThis);
