import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { addressContent } from '@red-cup-engineering/computer-content-address-engineering-services-section/content-address';
import { formIssuerEvidencePacket } from '../src/evidence-packet.mjs';
const originalFetch = globalThis.fetch;
globalThis.fetch = async () => { throw new Error('unexpected-live-network-during-consumer-receiving'); };
after(() => { globalThis.fetch = originalFetch; });
const {
  prepareIssuerRevenueCohort,
  readPreparedIssuerRevenueComparison,
  selectPreparedIssuerRevenueComparison,
  validateIssuerRevenueComparisonRequest,
} = await import('../src/prepared-cohort.mjs');

// Original consumer receiving cases were declared before source derivation in
// data/records/native-consumer-assay-records/2026-10-24-prepared-cohort.json.
// These fixture streams perform no network, cache write, settlement or live clock change.
const instant = '2026-10-24T12:00:00.000Z';
const configuration = () => ({
  issuers: [{ cik: '0000000001', ticker: 'ONE' }, { cik: '0000000002', ticker: 'TWO' }],
  userAgent: 'Consumer receiving test@example.invalid', maximumIssuers: 5,
  maximumBytes: 8388608, timeoutMs: 100, minimumIntervalMs: 1000,
  maximumAgeDays: { quarter: 150, annual: 550 }, cacheKey: 'issuer-research/current.json',
  maximumSnapshotAgeMs: 3600000, maximumCohortBytes: 524288,
  allowedPeriodKinds: ['annual'], allowAmbiguousEvidence: true,
});
const bytes = cik => new TextEncoder().encode(JSON.stringify({
  cik: Number(cik), entityName: 'Consumer fixture ' + cik,
  facts: { 'us-gaap': { Revenues: { units: { USD: [
    { start: '2025-01-01', end: '2025-12-31', val: Number(cik) * 100,
      form: '10-K', filed: '2026-02-01', accn: 'fixture-annual-' + cik },
    { start: '2026-04-01', end: '2026-06-30', val: Number(cik) * 30,
      form: '10-Q', filed: '2026-07-01', accn: 'fixture-quarter-' + cik },
  ] } } } },
}));
function fixtureAdapters(overrides = {}) {
  const calls = [], sleeps = [];
  return {
    calls, sleeps,
    now: () => instant,
    sleep: async ms => { sleeps.push(ms); },
    fetch: async (url, init) => {
      calls.push({ url, init });
      return new Response(bytes(configuration().issuers[calls.length - 1].cik));
    },
    ...overrides,
  };
}
async function cohort() { return prepareIssuerRevenueCohort(configuration(), fixtureAdapters()); }
function unavailable(code = 'issuer-revenue-source-unavailable') {
  return error => { assert.equal(error.code, code); assert.equal(error.status, 503); return true; };
}
function streamed(payload, { advertisedLength, cancel = () => {} } = {}) {
  return new Response(new ReadableStream({
    start(controller) { controller.enqueue(payload); }, cancel,
  }), { headers: advertisedLength ? { 'Content-Length': String(advertisedLength) } : {} });
}
async function read(value, body = { periodKind: 'annual' }, config = configuration(), object) {
  let gets = 0;
  const oldNow = Date.now;
  Date.now = () => Date.parse(instant);
  try {
    const result = await readPreparedIssuerRevenueComparison(body, {
      ISSUER_EVIDENCE: { get: async key => {
        gets++; assert.equal(key, config.cacheKey);
        return object === undefined ? { body: new Response(JSON.stringify(value)).body } : object;
      } },
    }, config);
    return { result, gets };
  } finally { Date.now = oldNow; }
}

test('complete background acquisition has exact fixed HTTP effects and original source/packet identities', async () => {
  const config = configuration(), adapters = fixtureAdapters();
  config.hostControlMetadata = { fixture: 'trusted extra metadata is not a public override' };
  const originalConfiguration = structuredClone(config);
  const prepared = await prepareIssuerRevenueCohort(config, adapters);
  assert.deepEqual(config, originalConfiguration);
  assert.equal(prepared.type, 'IssuerRevenuePreparedCohort');
  assert.equal(prepared.asOf, '2026-10-24');
  assert.deepEqual(adapters.sleeps, [1000]);
  assert.equal(adapters.calls.length, 2);
  for (let index = 0; index < 2; index++) {
    const { cik, ticker } = config.issuers[index];
    const call = adapters.calls[index];
    assert.equal(call.url, 'https://data.sec.gov/api/xbrl/companyfacts/CIK' + cik + '.json');
    assert.equal(call.init.method ?? 'GET', 'GET');
    assert.equal(call.init.redirect, 'error');
    assert.ok(call.init.signal instanceof AbortSignal);
    assert.equal(new Headers(call.init.headers).get('User-Agent'), config.userAgent);
    assert.equal(new Headers(call.init.headers).get('Accept'), 'application/json');
    const digest = (await addressContent(bytes(cik), { mediaType: 'application/json' })).ni;
    for (const kind of ['quarter', 'annual']) {
      const result = prepared.results[kind], issuer = result.issuers[index];
      assert.equal(issuer.cik, cik); assert.equal(issuer.ticker, ticker);
      assert.equal(issuer.source.digest, digest); assert.equal(issuer.source.bytes, bytes(cik).length);
      const statement = 'Received SEC companyfacts and reconciled ' + kind + ' USD revenue; status=' + issuer.status + '; period=' + (issuer.period ? issuer.period.start + '..' + issuer.period.end : 'none') + '; value=' + String(issuer.value) + '; revision=' + issuer.revision + '.';
      const expected = await formIssuerEvidencePacket({ ticker, issuer: issuer.issuer,
        asOf: prepared.asOf, sources: [issuer.source].map(({ uri, observedAt, digest }) => ({ uri, observedAt, digest })),
        claims: [{ statement, sourceDigests: [digest] }],
      });
      assert.deepEqual(result.evidencePackets[index], expected);
    }
  }
  assert.ok(new TextEncoder().encode(JSON.stringify(prepared)).length <= config.maximumCohortBytes);
  assert.equal(JSON.stringify(prepared).includes('"companyfacts"'), false);
  assert.equal(JSON.stringify(prepared).includes('"facts"'), false);
});

test('invalid configuration refuses before any source effect', async () => {
  for (const change of [c => { c.issuers[1].cik = c.issuers[0].cik; }, c => { c.issuers.length = 1; }, c => { c.userAgent = ''; }, c => { c.maximumBytes = 1.5; }]) {
    const config = configuration(); change(config); const adapters = fixtureAdapters();
    await assert.rejects(() => prepareIssuerRevenueCohort(config, adapters), TypeError);
    assert.equal(adapters.calls.length, 0);
  }
});

test('second source 429 preserves unbounded Retry-After and yields no partial report', async () => {
  let count = 0;
  await assert.rejects(() => prepareIssuerRevenueCohort(configuration(), fixtureAdapters({ fetch: async () => {
    count++; return count === 1 ? new Response(bytes('0000000001')) : new Response('', { status: 429, headers: { 'Retry-After': '172800' } });
  } })), error => { unavailable()(error); assert.equal(error.retryable, true); assert.equal(error.retryAfter, '172800'); return true; });
  assert.equal(count, 2);
});

test('malformed JSON and wrong issuer identity stop at the first source', async () => {
  const prefix = new TextEncoder().encode('{"cik":1,"entityName":"');
  const suffix = new TextEncoder().encode('","facts":{}}');
  const invalidUtf8 = new Uint8Array(prefix.length + 1 + suffix.length);
  invalidUtf8.set(prefix); invalidUtf8[prefix.length] = 255; invalidUtf8.set(suffix, prefix.length + 1);
  for (const payload of [new TextEncoder().encode('{'), bytes('0000000009'), invalidUtf8]) {
    let count = 0;
    await assert.rejects(() => prepareIssuerRevenueCohort(configuration(), fixtureAdapters({ fetch: async () => { count++; return new Response(payload); } })), unavailable());
    assert.equal(count, 1);
  }
});

test('actual source byte overflow cancels a misleading stream', async () => {
  let cancelled = false;
  const config = configuration(); config.maximumBytes = 8;
  await assert.rejects(() => prepareIssuerRevenueCohort(config, fixtureAdapters({ fetch: async () => streamed(new Uint8Array(9), { advertisedLength: 1, cancel: () => { cancelled = true; } }) })), unavailable());
  assert.equal(cancelled, true);
});

test('source timeout aborts fetch and remains retryable', async () => {
  const config = configuration(); config.timeoutMs = 5;
  const keeper = setTimeout(() => {}, 100);
  try {
    await assert.rejects(() => prepareIssuerRevenueCohort(config, fixtureAdapters({ fetch: async (_, { signal }) => new Promise((_, reject) => {
      signal.addEventListener('abort', () => reject(signal.reason), { once: true });
    }) })), error => { unavailable()(error); assert.equal(error.retryable, true); return true; });
  } finally { clearTimeout(keeper); }
});

test('source timeout also bounds a body that stalls after successful headers', async () => {
  const config = configuration(); config.timeoutMs = 5;
  let controller, deadline;
  const stalled = new ReadableStream({ start(value) { controller = value; } });
  try {
    await assert.rejects(() => Promise.race([
      prepareIssuerRevenueCohort(config, fixtureAdapters({ fetch: async () => new Response(stalled) })),
      new Promise((_, reject) => { deadline = setTimeout(() => reject(new Error('body-timeout-was-not-enforced')), 200); }),
    ]), error => { unavailable()(error); assert.equal(error.retryable, true); return true; });
  } finally {
    clearTimeout(deadline);
    try { controller.error(new Error('consumer-fixture-cleanup')); } catch {}
  }
});

test('UTC midnight observed during preparation refuses the whole cohort', async () => {
  let clocks = 0;
  await assert.rejects(() => prepareIssuerRevenueCohort(configuration(), fixtureAdapters({ now: () => clocks++ === 0 ? '2026-10-24T23:59:59.000Z' : '2026-10-25T00:00:01.000Z' })), error => { unavailable()(error); assert.equal(error.reason, 'utc-day-changed'); return true; });
});

test('actual compact output ceiling refuses a completed oversized result', async () => {
  const config = configuration(); config.maximumCohortBytes = 100;
  await assert.rejects(() => prepareIssuerRevenueCohort(config, fixtureAdapters()), unavailable());
});

test('reader uses one configured cache read and preserves source and packet values', async () => {
  const prepared = await cohort();
  assert.equal(selectPreparedIssuerRevenueComparison({ body: { periodKind: 'annual' }, configuration: configuration(), cohort: prepared, now: instant }), prepared.results.annual);
  const { result, gets } = await read(prepared);
  assert.equal(gets, 1); assert.deepEqual(result, prepared.results.annual);
});

test('reader validates public input before storage', async () => {
  let gets = 0;
  for (const body of [{ periodKind: 'quarter' }, { periodKind: 'annual', cacheKey: 'other' }, { periodKind: 'annual', issuers: [] }]) {
    assert.throws(() => validateIssuerRevenueComparisonRequest(body, configuration()), TypeError);
    await assert.rejects(() => readPreparedIssuerRevenueComparison(body, { ISSUER_EVIDENCE: { get: async () => { gets++; } } }, configuration()), TypeError);
  }
  assert.equal(gets, 0);
});

test('reader missing, failed, expired and oversized cache refuse without source fallback', async () => {
  const prepared = await cohort();
  await assert.rejects(() => read(prepared, undefined, undefined, null), unavailable('issuer-revenue-unavailable'));
  const expired = structuredClone(prepared); expired.observedAt = '2026-10-24T10:00:00.000Z';
  await assert.rejects(() => read(expired), unavailable('issuer-revenue-unavailable'));
  let cancelled = false;
  const config = configuration(); config.maximumCohortBytes = 8;
  const body = streamed(new Uint8Array(9), { cancel: () => { cancelled = true; } }).body;
  await assert.rejects(() => read(prepared, undefined, config, { body }), unavailable('issuer-revenue-unavailable'));
  assert.equal(cancelled, true);
});

test('reader refuses stale, missing and contradictory packet readiness', async () => {
  for (const modify of [c => { c.results.annual.issuers[0].status = 'stale'; }, c => { c.results.annual.issuers[0].status = 'missing'; }, c => { c.results.annual.evidencePackets[0].claims[0].sourceDigests = ['ni:///sha-256;AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA']; }]) {
    const prepared = await cohort(); modify(prepared);
    await assert.rejects(() => read(prepared), unavailable('issuer-revenue-unavailable'));
  }
});

test('selector refuses a current number that contradicts all selected source witnesses', async () => {
  const prepared = await cohort();
  prepared.results.annual.issuers[0].value = 999;
  assert.throws(() => selectPreparedIssuerRevenueComparison({ body: { periodKind: 'annual' }, configuration: configuration(), cohort: prepared, now: instant }), unavailable('issuer-revenue-unavailable'));
});

test('selector refuses current status when latest witnesses conflict', async () => {
  const prepared = await cohort(), issuer = prepared.results.annual.issuers[0];
  issuer.witnesses.push({ ...issuer.witnesses[0], accession: 'fixture-conflicting-latest', value: 200 });
  assert.throws(() => selectPreparedIssuerRevenueComparison({ body: { periodKind: 'annual' }, configuration: configuration(), cohort: prepared, now: instant }), unavailable('issuer-revenue-unavailable'));
});

test('legitimate changed-value rereports retain earlier witnesses while admitting the latest value', async () => {
  const prepared = await prepareIssuerRevenueCohort(configuration(), fixtureAdapters({ fetch: async url => {
    const cik = /CIK(\d{10})\.json$/.exec(url)[1];
    const fact = JSON.parse(new TextDecoder().decode(bytes(cik)));
    const observations = fact.facts['us-gaap'].Revenues.units.USD;
    observations.push({ ...observations[0], val: Number(cik) * 125, filed: '2026-03-01', accn: 'fixture-later-value-' + cik });
    return new Response(JSON.stringify(fact));
  } }));
  const selected = selectPreparedIssuerRevenueComparison({ body: { periodKind: 'annual' }, configuration: configuration(), cohort: prepared, now: instant });
  assert.equal(selected.issuers[0].value, 125);
  assert.equal(selected.issuers[0].revision, 'changed-reported-value');
  assert.deepEqual(selected.issuers[0].witnesses.map(w => w.value), [100, 125]);
});

test('selector refuses a packet statement that contradicts structured reconciliation metadata', async () => {
  const prepared = await cohort();
  prepared.results.annual.evidencePackets[0].claims[0].statement = prepared.results.annual.evidencePackets[0].claims[0].statement.replace('value=100;', 'value=999;');
  assert.throws(() => selectPreparedIssuerRevenueComparison({ body: { periodKind: 'annual' }, configuration: configuration(), cohort: prepared, now: instant }), unavailable('issuer-revenue-unavailable'));
});

test('genuine same-period conflict remains an explicitly allowed unresolved report', async () => {
  const prepared = await prepareIssuerRevenueCohort(configuration(), fixtureAdapters({ fetch: async url => {
    const cik = /CIK(\d{10})\.json$/.exec(url)[1];
    const fact = JSON.parse(new TextDecoder().decode(bytes(cik)));
    const observations = fact.facts['us-gaap'].Revenues.units.USD;
    observations.push({ ...observations[0], val: Number(cik) * 200, accn: 'fixture-conflicting-value-' + cik });
    return new Response(JSON.stringify(fact));
  } }));
  const selected = selectPreparedIssuerRevenueComparison({ body: { periodKind: 'annual' }, configuration: configuration(), cohort: prepared, now: instant });
  assert.equal(selected.comparability, 'unresolved');
  assert.equal(selected.issuers[0].status, 'ambiguous');
  assert.equal(selected.issuers[0].value, null);
  assert.deepEqual(selected.issuers[0].witnesses.map(w => w.value).sort((a, b) => a - b), [100, 200]);
});


test('configured lowercase tickers preserve report spelling and original packet normalization', async () => {
  const config = configuration();
  config.issuers = config.issuers.map(issuer => ({ ...issuer, ticker: issuer.ticker.toLowerCase() }));
  const prepared = await prepareIssuerRevenueCohort(config, fixtureAdapters());
  const result = selectPreparedIssuerRevenueComparison({ body: { periodKind: 'annual' }, configuration: config, cohort: prepared, now: instant });
  assert.equal(result, prepared.results.annual);
  assert.deepEqual(result.issuers.map(issuer => issuer.ticker), ['one', 'two']);
  assert.deepEqual(result.evidencePackets.map(packet => packet.ticker), ['ONE', 'TWO']);
});
