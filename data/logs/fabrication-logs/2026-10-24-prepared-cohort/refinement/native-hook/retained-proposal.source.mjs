import { formIssuerEvidencePacket } from '@red-cup-engineering/issuer-research-media-service';
import { reconcileIssuerRevenueFacts } from '@red-cup-engineering/issuer-research-media-service/revenue-reconciliation';
import { addressContent } from '@red-cup-engineering/computer-content-address-engineering-services-section/content-address';
import { isNiUri } from '@red-cup-engineering/uri-services-section/ni-uri';

/*
 * Artifact issuer-revenue-prepared-cohort; selected module src/prepared-cohort.mjs.
 * Governing carrier: specifications/prepared-cohort.work-order.md, lines 1–63,
 * sha256:440ffd4a2ab57731a33d0142fd3a2278704896c4b7a8792a178c3e0a2fb36e2b;
 * specification ni:///sha-256;2hHQSxd-NH9ewvXLAIsZXgpyDKJOXUaSSxvlP6b37f0.
 * Requirements configuration through return-unchanged (lines 3–11), prohibition
 * no-request-override (13), and all traceability edges govern these interfaces.
 * source-integrity: Data source custody, raw-carrier RFC6920,
 * https://www.rfc-editor.org/rfc/rfc6920; applies to raw addresses/citations.
 * source-demand: Red Cup Engineering, a48f45313af1e7525041d17ac3ff9a7ccdf24580,
 * ./behavior.md; applies to the independent issuer owner and supplier. The actual
 * annual AAPL/MSFT offer and paid stale-tag study do not establish USD20/day.
 * sec-source: US SEC, current API and fair access docs,
 * https://www.sec.gov/search-filings/edgar-application-programming-interfaces;
 * applies to official acquisition. Header structure does not prove identity or
 * deliverability. Local spacing does not prove aggregate fair-access admission.
 * native-fabrication: Red Cup Engineering, computer-systems-fabrication-engine
 * v0.4.14; jsnode-package v0.5.1-dev.1 source d1e4905,
 * https://github.com/red-cup-engineering/computer-systems-fabrication-engineering-services-section;
 * applies to source-free fullmodule derivation and scoped preassay.
 * async-contract-1..7: Issuer research Engineering, prepared-cohort design,
 * ./behavior.md; applies to additional async interfaces and independent I/O
 * acceptance. source-module-interfaces, source-supplier-closure,
 * source-pure-effects, source-no-substitutes: Issuer research Engineering,
 * full module source contract, ./design.md; mandatory under io-receiving.
 * All requirements/prohibition trace to those constraints, jsnode-modules and
 * pure-receiving. Pure receiving requires independent positive/counterexample
 * assays, no effects and unchanged selection. It does not discharge io-receiving:
 * actual URL/header/redirect/signal, sequential GET/spacing, timeout/midnight and
 * malformed/oversized failures, original-byte NI, kernel/packet reuse, compact
 * bounds/private-byte absence, R2 key/count/bytes and nonsettled unavailable,
 * controller atomic storage/budgets/global coordinator, deployment CPU/source
 * closure and independent customer acceptance remain receiving obligations.
 * No public procurement/configuration, retries, packet reissuance, raw-fact
 * selection kernel, rankings, prediction, investment instruction, quote
 * conversion, fleet quota or earned-revenue inference is supplied here.
 * Claims minimum/maximum issuers=2/5 and interval>=100 are source-owned bounds;
 * measured kernel inclusive day bounds are quarter 70..110, annual 330..380.
 * Dependencies are received source candidates, not registry-publication claims.
 */
const kinds = ['quarter', 'annual'];
const dayMs = 86400000;
const record = x => x !== null && typeof x === 'object' && !Array.isArray(x);
const text = x => typeof x === 'string' && x.trim().length > 0;
const positive = x => Number.isSafeInteger(x) && x > 0;
const url = cik => 'https://data.sec.gov/api/xbrl/companyfacts/CIK' + cik + '.json';
function insist(ok) { if (!ok) throw new TypeError('Invalid issuer revenue configuration or request'); }
function configurationCheck(c) {
  insist(record(c));
  insist(Number.isInteger(c.maximumIssuers) && c.maximumIssuers >= 2 && c.maximumIssuers <= 5);
  insist(Array.isArray(c.issuers) && c.issuers.length >= 2 && c.issuers.length <= c.maximumIssuers);
  const seen = new Set();
  for (const i of c.issuers) {
    insist(record(i) && typeof i.cik === 'string' && /^\d{10}$/.test(i.cik) && text(i.ticker) && !seen.has(i.cik));
    seen.add(i.cik);
  }
  insist(text(c.userAgent) && !/[\r\n]/.test(c.userAgent) && c.userAgent.includes('@'));
  for (const key of ['maximumBytes', 'timeoutMs', 'maximumSnapshotAgeMs', 'maximumCohortBytes']) insist(positive(c[key]));
  insist(record(c.maximumAgeDays) && kinds.every(k => positive(c.maximumAgeDays[k])));
  insist(Number.isInteger(c.minimumIntervalMs) && c.minimumIntervalMs >= 100);
  insist(text(c.cacheKey) && typeof c.allowAmbiguousEvidence === 'boolean');
  insist(Array.isArray(c.allowedPeriodKinds) && c.allowedPeriodKinds.length > 0 && c.allowedPeriodKinds.every(k => kinds.includes(k)) && new Set(c.allowedPeriodKinds).size === c.allowedPeriodKinds.length);
}
function instant(x) {
  const n = typeof x === 'number' ? x : typeof x === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(x) ? Date.parse(x) : NaN;
  if (!Number.isFinite(n) || !Number.isInteger(n) || !Number.isFinite(new Date(n).getTime())) throw new TypeError('Invalid explicit instant');
  if (typeof x === 'string' && new Date(n).toISOString() !== x) throw new TypeError('Invalid canonical instant');
  return n;
}
function date(x) {
  if (typeof x !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(x)) throw new Error('Invalid date');
  const n = Date.parse(x + 'T00:00:00.000Z');
  if (!Number.isFinite(n) || new Date(n).toISOString().slice(0, 10) !== x) throw new Error('Invalid date');
  return n;
}
function unavailable() { return Object.assign(new Error('Prepared issuer revenue unavailable'), {code:'issuer-revenue-unavailable', status:503, retryable:true}); }
function sourceError(reason, retryable, retryAfter) {
  const e = Object.assign(new Error('Issuer revenue source unavailable: ' + reason), {code:'issuer-revenue-source-unavailable', status:503, retryable, reason});
  if (retryAfter !== null && retryAfter !== undefined) e.retryAfter = String(retryAfter);
  return e;
}
function requireCache(ok) { if (!ok) throw unavailable(); }
function ni(x) { return text(x) && isNiUri(x); }
function statement(r) { return 'Received SEC companyfacts and reconciled ' + r.periodKind + ' USD revenue; status=' + r.status + '; period=' + (r.period ? r.period.start + '..' + r.period.end : 'none') + '; value=' + String(r.value) + '; revision=' + r.revision + '.'; }
function comparability(issuers) {
  if (!issuers.every(i => i.status === 'current')) return 'unresolved';
  return issuers.every(i => i.period.start === issuers[0].period.start && i.period.end === issuers[0].period.end) ? 'aligned-periods' : 'different-periods';
}
/** Pure complete host-configuration validation and official-source plan; grants no execution or quota.
 * @param {object} configuration Trusted host configuration.
 * @returns {object} Exact IssuerRevenueAcquisitionPlan.
 */
export function planIssuerRevenueAcquisition(configuration) {
  configurationCheck(configuration);
  const c = configuration;
  return {type:'IssuerRevenueAcquisitionPlan', version:1, minimumIntervalMs:c.minimumIntervalMs, maximumCohortBytes:c.maximumCohortBytes, requests:c.issuers.map(i => ({cik:i.cik, ticker:i.ticker, url:url(i.cik), headers:{'User-Agent':c.userAgent, Accept:'application/json'}, timeoutMs:c.timeoutMs, maximumBytes:c.maximumBytes}))};
}
/** Admit only the configured public period selector, without I/O.
 * @param {object} body Public request.
 * @param {object} configuration Trusted host configuration.
 * @returns {{periodKind:string}} Fresh admitted request.
 */
export function validateIssuerRevenueComparisonRequest(body, configuration) {
  configurationCheck(configuration);
  insist(record(body) && Reflect.ownKeys(body).length === 1 && Object.hasOwn(body, 'periodKind') && configuration.allowedPeriodKinds.includes(body.periodKind));
  return {periodKind:body.periodKind};
}
function validatePeriod(p, kind, asOf, today, maximumAgeDays) {
  requireCache(record(p));
  const start = date(p.start), end = date(p.end);
  const duration = (end - start) / dayMs + 1;
  const [min, max] = kind === 'quarter' ? [70, 110] : [330, 380];
  requireCache(start <= end && end <= date(asOf) && p.durationDays === duration && duration >= min && duration <= max && (today - end) / dayMs <= maximumAgeDays);
}
function financial(r, c, kind, asOf, today) {
  requireCache(r.status === 'current' || (r.status === 'ambiguous' && c.allowAmbiguousEvidence));
  requireCache(Array.isArray(r.witnesses) && r.witnesses.length > 0 && text(r.revision));
  const latest = new Map();
  for (const w of r.witnesses) {
    validatePeriod(w, kind, asOf, today, c.maximumAgeDays[kind]);
    requireCache(Number.isFinite(w.value) && w.unit === 'USD' && ['10-Q', '10-Q/A', '10-K', '10-K/A'].includes(w.form) && text(w.accession) && text(w.concept));
    requireCache(date(w.filed) <= date(asOf));
    const prev = latest.get(w.concept);
    if (!prev || w.filed > prev.filed) latest.set(w.concept, {filed:w.filed, values:[w.value]});
    else if (w.filed === prev.filed) prev.values.push(w.value);
  }
  const latestValues = [...latest.values()].flatMap(x => x.values);
  if (r.period !== null) {
    validatePeriod(r.period, kind, asOf, today, c.maximumAgeDays[kind]);
    requireCache(r.witnesses.every(w => w.start === r.period.start && w.end === r.period.end && w.durationDays === r.period.durationDays));
  }
  if (r.status === 'current') requireCache(r.period !== null && Number.isFinite(r.value) && latestValues.every(v => v === r.value));
  else {
    requireCache(r.value === null && r.revision === 'ambiguous');
    if (r.period === null) requireCache(new Set(r.witnesses.map(w => w.end)).size === 1 && new Set(r.witnesses.map(w => w.start)).size > 1);
    else requireCache(new Set(latestValues).size > 1);
  }
}
/** Validate received compact evidence and freshness, returning the exact selected result. No packet rehash or raw-fact reconciliation occurs.
 * @param {object} input Explicit body, configuration, cohort and now.
 * @returns {object} Unchanged ready IssuerRevenueComparison; otherwise throws.
 */
export function selectPreparedIssuerRevenueComparison(input) {
  const {body, configuration:c, cohort, now} = input ?? {};
  const {periodKind:kind} = validateIssuerRevenueComparisonRequest(body, c);
  const n = instant(now);
  try {
    requireCache(record(cohort) && cohort.type === 'IssuerRevenuePreparedCohort' && cohort.version === 1);
    const observed = instant(cohort.observedAt);
    requireCache(typeof cohort.observedAt === 'string' && date(cohort.asOf) === date(cohort.observedAt.slice(0, 10)) && observed <= n && n - observed <= c.maximumSnapshotAgeMs);
    requireCache(record(cohort.results) && Object.hasOwn(cohort.results, 'quarter') && Object.hasOwn(cohort.results, 'annual'));
    const r = cohort.results[kind];
    requireCache(record(r) && r.type === 'IssuerRevenueComparison' && r.version === 1 && r.asOf === cohort.asOf && r.observedAt === cohort.observedAt && r.periodKind === kind && r.datePolicy === 'filing-date-cutoff-on-received-sources');
    requireCache(Array.isArray(r.issuers) && Array.isArray(r.evidencePackets) && r.issuers.length === c.issuers.length && r.evidencePackets.length === c.issuers.length);
    const today = date(new Date(n).toISOString().slice(0, 10));
    for (let j = 0; j < c.issuers.length; j++) {
      const configured = c.issuers[j], i = r.issuers[j], p = r.evidencePackets[j];
      requireCache(record(i) && i.type === 'IssuerRevenueReconciliation' && i.version === 1 && i.cik === configured.cik && i.ticker === configured.ticker && i.asOf === r.asOf && i.periodKind === kind && text(i.issuer) && i.unit === 'USD');
      const s = i.source;
      requireCache(record(s) && s.uri === url(configured.cik) && ni(s.digest) && positive(s.bytes) && s.bytes <= c.maximumBytes && typeof s.observedAt === 'string');
      const sn = instant(s.observedAt);
      requireCache(sn <= observed && n - sn <= c.maximumSnapshotAgeMs);
      financial(i, c, kind, r.asOf, today);
      requireCache(record(p) && p.type === 'IssuerEvidencePacket' && p.version === 1 && p.ticker === String(configured.ticker).toUpperCase() && p.issuer === i.issuer && p.asOf === i.asOf && ni(p.id) && p.brokerageEffect === false);
      requireCache(Array.isArray(p.sources) && p.sources.length === 1 && record(p.sources[0]) && p.sources[0].uri === s.uri && p.sources[0].digest === s.digest && p.sources[0].observedAt === s.observedAt);
      requireCache(Array.isArray(p.claims) && p.claims.length === 1 && record(p.claims[0]) && p.claims[0].statement === statement(i) && Array.isArray(p.claims[0].sourceDigests) && p.claims[0].sourceDigests.length === 1 && p.claims[0].sourceDigests[0] === s.digest);
    }
    requireCache(r.comparability === comparability(r.issuers));
    return r;
  } catch { throw unavailable(); }
}
async function boundedRead(stream, limit, fail, signal) {
  if (!stream || typeof stream.getReader !== 'function') throw fail('invalid-stream');
  const reader = stream.getReader();
  let total = 0;
  const chunks = [];
  let rejectAbort;
  const aborted = signal ? new Promise((_, reject) => { rejectAbort = () => { void reader.cancel().catch(() => {}); reject(signal.reason); }; signal.addEventListener('abort', rejectAbort, {once:true}); if (signal.aborted) rejectAbort(); }) : null;
  try {
    for (;;) {
      const part = await (aborted ? Promise.race([reader.read(), aborted]) : reader.read());
      if (signal?.aborted) throw signal.reason;
      if (part.done) break;
      if (!(part.value instanceof Uint8Array)) throw fail('invalid-stream');
      total += part.value.byteLength;
      if (total > limit) { void reader.cancel().catch(() => {}); throw fail('byte-overflow'); }
      chunks.push(part.value.slice());
    }
    const bytes = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    return bytes;
  } catch (e) { void reader.cancel().catch(() => {}); throw e; }
  finally { if (signal) signal.removeEventListener('abort', rejectAbort); try { reader.releaseLock(); } catch {} }
}
async function sleepBounded(ms) {
  while (ms > 0) { const part = Math.min(ms, 2147483647); await new Promise(resolve => setTimeout(resolve, part)); ms -= part; }
}
async function acquire(req, fetcher) {
  let retryAfter;
  const signal = AbortSignal.timeout(req.timeoutMs);
  let abort;
  const aborted = new Promise((_, reject) => { abort = () => reject(sourceError('timeout', true, retryAfter)); signal.addEventListener('abort', abort, {once:true}); });
  try {
    const response = await Promise.race([Promise.resolve().then(() => fetcher(req.url, {method:'GET', headers:req.headers, redirect:'error', signal})), aborted]);
    retryAfter = response.headers?.get('Retry-After');
    if (response.status !== 200) {
      void response.body?.cancel().catch(() => {});
      throw sourceError('http-' + response.status, response.status === 429 || response.status >= 500, retryAfter);
    }
    const length = response.headers?.get('Content-Length');
    if (length !== null && length !== undefined && /^\d+$/.test(length) && Number(length) > req.maximumBytes) {
      void response.body?.cancel().catch(() => {});
      throw sourceError('byte-overflow', false, retryAfter);
    }
    return await Promise.race([boundedRead(response.body, req.maximumBytes, reason => sourceError(reason, false, retryAfter), signal), aborted]);
  } catch (e) {
    if (e?.code === 'issuer-revenue-source-unavailable') throw e;
    throw sourceError(signal.aborted ? 'timeout' : 'network', true, retryAfter);
  } finally { signal.removeEventListener('abort', abort); }
}
/** Prepare both compact periods sequentially from official raw source bytes. No storage write or fleet admission is performed.
 * @param {object} configuration Trusted background configuration.
 * @param {object} [adapters={}] Trusted fetch, now and sleep adapters.
 * @returns {Promise<object>} Complete bounded IssuerRevenuePreparedCohort.
 */
export async function prepareIssuerRevenueCohort(configuration, adapters = {}) {
  const plan = planIssuerRevenueAcquisition(configuration);
  insist(record(adapters));
  const fetcher = adapters.fetch === undefined ? globalThis.fetch : adapters.fetch;
  const clock = adapters.now === undefined ? Date.now : adapters.now;
  const sleep = adapters.sleep === undefined ? sleepBounded : adapters.sleep;
  insist(typeof fetcher === 'function' && typeof clock === 'function' && typeof sleep === 'function');
  const start = instant(clock());
  const asOf = new Date(start).toISOString().slice(0, 10);
  const observedClock = () => {
    let n;
    try { n = instant(clock()); } catch { throw sourceError('invalid-clock', false); }
    const iso = new Date(n).toISOString();
    if (iso.slice(0, 10) !== asOf) throw sourceError('utc-day-changed', true);
    return iso;
  };
  const compact = {quarter:{issuers:[], evidencePackets:[]}, annual:{issuers:[], evidencePackets:[]}};
  for (let j = 0; j < plan.requests.length; j++) {
    if (j > 0) { try { await sleep(plan.minimumIntervalMs); } catch { throw sourceError('spacing-failed', true); } }
    const req = plan.requests[j];
    {
      const bytes = await acquire(req, fetcher);
      const observedAt = observedClock();
      let companyfacts;
      try { companyfacts = JSON.parse(new TextDecoder('utf-8', {fatal:true}).decode(bytes)); } catch { throw sourceError('malformed-source', false); }
      let address;
      try {
        address = await addressContent(bytes, {mediaType:'application/json'});
        if (!address || address.kind !== 'semiotic-content.raw-carrier-address' || address.version !== 1 || address.algorithm !== 'sha-256' || address.mediaType !== 'application/json' || address.size !== bytes.byteLength || !positive(address.size) || !ni(address.ni)) throw new Error('Invalid raw address');
      } catch { throw sourceError('source-address', false); }
      const source = {uri:req.url, digest:address.ni, bytes:address.size, observedAt};
      for (const periodKind of kinds) {
        let result;
        try { result = {...reconcileIssuerRevenueFacts({cik:req.cik, asOf, periodKind, maximumAgeDays:configuration.maximumAgeDays[periodKind], companyfacts}), ticker:req.ticker, source:{...source}}; }
        catch { throw sourceError('invalid-source-identity', false); }
        let packet;
        try { packet = await formIssuerEvidencePacket({ticker:req.ticker, issuer:result.issuer, asOf, sources:[{uri:source.uri, observedAt:source.observedAt, digest:source.digest}], claims:[{statement:statement(result), sourceDigests:[source.digest]}]}); }
        catch { throw sourceError('packet-construction', false); }
        compact[periodKind].issuers.push(result);
        compact[periodKind].evidencePackets.push(packet);
      }
    }
  }
  const observedAt = observedClock();
  const results = {};
  for (const periodKind of kinds) {
    const {issuers, evidencePackets} = compact[periodKind];
    if (issuers.some(i => instant(i.source.observedAt) > instant(observedAt))) throw sourceError('clock-regressed', false);
    results[periodKind] = {type:'IssuerRevenueComparison', version:1, observedAt, asOf, periodKind, datePolicy:'filing-date-cutoff-on-received-sources', comparability:comparability(issuers), issuers, evidencePackets};
  }
  const cohort = {type:'IssuerRevenuePreparedCohort', version:1, observedAt, asOf, results};
  try { if (new TextEncoder().encode(JSON.stringify(cohort)).byteLength > configuration.maximumCohortBytes) throw new Error('Overflow'); }
  catch { throw sourceError('compact-output-overflow', false); }
  return cohort;
}
/** Read one host-owned R2 key and select unchanged compact evidence; no SEC fallback or storage write.
 * @param {object} body Public period request.
 * @param {object} env Trusted environment with ISSUER_EVIDENCE binding.
 * @param {object} configuration Trusted host configuration.
 * @returns {Promise<object>} Unchanged ready comparison or retryable unavailable error.
 */
export async function readPreparedIssuerRevenueComparison(body, env, configuration) {
  validateIssuerRevenueComparisonRequest(body, configuration);
  let cohort;
  try {
    const bucket = env?.ISSUER_EVIDENCE;
    if (!bucket || typeof bucket.get !== 'function') throw unavailable();
    const object = await bucket.get(configuration.cacheKey);
    if (!object) throw unavailable();
    if (object.size !== undefined && (!Number.isSafeInteger(object.size) || object.size < 0 || object.size > configuration.maximumCohortBytes)) {
      void object.body?.cancel().catch(() => {});
      throw unavailable();
    }
    const bytes = await boundedRead(object.body, configuration.maximumCohortBytes, unavailable);
    cohort = JSON.parse(new TextDecoder('utf-8', {fatal:true}).decode(bytes));
  } catch { throw unavailable(); }
  return selectPreparedIssuerRevenueComparison({body, configuration, cohort, now:Date.now()});
}
