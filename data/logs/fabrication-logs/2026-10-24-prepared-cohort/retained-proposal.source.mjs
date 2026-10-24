import { formIssuerEvidencePacket } from '@red-cup-engineering/issuer-research-media-service';
import { reconcileIssuerRevenueFacts } from '@red-cup-engineering/issuer-research-media-service/revenue-reconciliation';
import { addressContent } from '@red-cup-engineering/computer-content-address-engineering-services-section/content-address';
import { isNiUri } from '@red-cup-engineering/uri-services-section/ni-uri';

/*
 * src/prepared-cohort.mjs — issuer-revenue-prepared-cohort, specification v2.
 * Source: specifications/prepared-cohort.work-order.md:1–63,
 * sha256:e75971efd344abd8b712d549f3b3a0c7185c8554ac0557c9f2a8a3990c2b4098;
 * specification NI: ni:///sha-256;zbn4SQ9WNdZOfYKUijH2WcQ_G-RV5xB3nLt4i4nqdEk.
 * Normative authority and applicability:
 * source-integrity (line 15): Data source custody, raw-carrier RFC6920,
 * https://www.rfc-editor.org/rfc/rfc6920, applies to raw-byte addressing and
 * packet citations: observation/reporting dates differ; original constructor IDs.
 * source-demand (17): Red Cup Engineering, a48f45313af1e7525041d17ac3ff9a7ccdf24580,
 * ./behavior.md, applies to this independent issuer owner/supplier. Science's paid
 * stale-SEC-tag study and scoped companyfacts observations ground the original
 * Group/Coesite annual AAPL/MSFT offer; no USD20/day forecast or earned revenue.
 * sec-source (18): US SEC, current API/fair-access docs,
 * https://www.sec.gov/search-filings/edgar-application-programming-interfaces,
 * applies to official acquisition: identifying User-Agent and aggregate fair
 * access; local spacing cannot establish fleet-global coordinator admission.
 * native-fabrication (19): Red Cup Engineering, computer-systems-fabrication-engine
 * v0.4.14; jsnode-package v0.5.1-dev.1 source d1e4905,
 * https://github.com/red-cup-engineering/computer-systems-fabrication-engineering-services-section,
 * applies to source-free fullmodule derivation/preassay: additional exports are
 * authorized; pure JSON examples certify no I/O effects; no fake fixture mode.
 * async-contract-1..7 (20–26): Issuer research Engineering, prepared-cohort design,
 * ./behavior.md; applies to additional named async interfaces and independent I/O
 * acceptance. Trusted background preparation validates config/clock, fixes UTC
 * day, uses sequential single GETs with completed-acquisition spacing, fixed
 * headers/origin, redirect:error and full acquisition timeout; no retry. Errors
 * preserve literal Retry-After; bounds apply to actual bytes; fatal UTF8/JSON.
 * Address actual raw bytes; reuse native kernel and packet supplier. Retain only
 * compact both-period outputs per source; preserve missing/stale/ambiguous states.
 * Complete bounded cohort only, no storage write. Existing controller owns
 * atomic publication, budgets, single EarningClock coordinator and settlement.
 * Storage consumer reads its trusted key once, bounds actual R2 bytes, never
 * falls back to SEC or reissues packets. Independent source/storage, deployment
 * CPU/edge/DO closure and outside customer receiving precede commercial promotion.
 * source-module-interfaces, source-supplier-closure, source-pure-effects,
 * source-no-substitutes (27–30): Issuer research Engineering, full module source
 * contract, ./design.md; mandatory generated-source constraints independently
 * received under io-receiving, outside JSON case-ID assay. Five named interfaces;
 * native self-reference is not self-dependency; declared suppliers only. Pure
 * plan/selector have no implicit clock, network, filesystem, env, credential,
 * inference, payment, mutation or writes. No duplicate parser/kernel/packet
 * identity/canonical JSON, broker/rate-limit platform, procurement, hidden retry,
 * copied raw facts, ranking, prediction, investment instruction or quote conversion.
 * Requirements v2: configuration(3), acquisition-plan(4), public-request(5),
 * selector-input(6), cohort-boundary(7), configured-cohort(8), financial-freshness(9),
 * prepared-packets(10), return-unchanged(11); prohibition no-request-override(13).
 * Each traces to ALL constraints above, jsnode-modules projection(46–48), and
 * pure-receiving(50–52): independent positive/counterexample plan/selector tests
 * for request/config, cache age/future/identity, missing/stale/ambiguity, period
 * age and packet citations, purity and exact unchanged ready-result return.
 * io-receiving(50–52) remains separately required: actual headers/URL/redirect/
 * signal, GET count/spacing, failures/malformed/oversize/timeout/midnight without
 * partial cache, original-byte NI, kernel/packet reuse, compact bound/private-byte
 * absence, R2 key/count/bounds, nonsettled unavailable, coordinator/budgets/atomic
 * storage, deployment closure and independent customer acceptance. No test or
 * acceptance result is asserted here.
 * Claims(34–44): bounded-operation; configured count 2..5 and interval >=100ms
 * are source-owned restrictions, not capacity/quota claims. Dependencies are
 * measured source candidates: issuer service 0.1.3-dev.1 at a48f453 (not registry
 * publication), content-address 0.2.0, uri 0.1.3. Received kernel digest
 * sha256:603fe0d654e3b899f785c51ad9d00c2ca028237ca16988f344aa39e749e9e298
 * fixes inclusive quarter 70..110 and annual 330..380 calendar days; actual dates,
 * never fy/fp. Concepts: Revenues, SalesRevenueNet,
 * RevenueFromContractWithCustomerExcludingAssessedTax under us-gaap USD; eligible
 * forms 10-Q,10-Q/A,10-K,10-K/A. Supplier implementations remain authoritative.
 */
const DAY = 86400000;
const kinds = ['quarter', 'annual'];
const record = x => x !== null && typeof x === 'object' && !Array.isArray(x);
const text = x => typeof x === 'string' && x.trim().length > 0;
const positive = x => Number.isSafeInteger(x) && x > 0;
const url = cik => 'https://data.sec.gov/api/xbrl/companyfacts/CIK' + cik + '.json';
function configurationCheck(c) {
  const bad = () => { throw new TypeError('Invalid trusted issuer revenue configuration'); };
  if (!record(c) || !Number.isInteger(c.maximumIssuers) || c.maximumIssuers < 2 || c.maximumIssuers > 5) bad();
  if (!Array.isArray(c.issuers) || c.issuers.length < 2 || c.issuers.length > c.maximumIssuers) bad();
  const seen = new Set();
  for (const i of c.issuers) {
    if (!record(i) || typeof i.cik !== 'string' || !/^\d{10}$/.test(i.cik) || seen.has(i.cik) || !text(i.ticker)) bad();
    seen.add(i.cik);
  }
  if (!text(c.userAgent) || /[\r\n]/.test(c.userAgent) || !c.userAgent.includes('@')) bad();
  for (const key of ['maximumBytes','timeoutMs','maximumSnapshotAgeMs','maximumCohortBytes']) if (!positive(c[key])) bad();
  if (!record(c.maximumAgeDays) || !positive(c.maximumAgeDays.quarter) || !positive(c.maximumAgeDays.annual)) bad();
  if (!Number.isInteger(c.minimumIntervalMs) || c.minimumIntervalMs < 100 || !text(c.cacheKey)) bad();
  if (!Array.isArray(c.allowedPeriodKinds) || !c.allowedPeriodKinds.length || new Set(c.allowedPeriodKinds).size !== c.allowedPeriodKinds.length || !c.allowedPeriodKinds.every(k => kinds.includes(k)) || typeof c.allowAmbiguousEvidence !== 'boolean') bad();
}
function instant(v) {
  if (typeof v === 'number' && Number.isFinite(v) && Number.isInteger(v) && Number.isFinite(new Date(v).getTime())) return v;
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(v)) {
    const n = Date.parse(v);
    if (Number.isFinite(n) && new Date(n).toISOString() === v) return n;
  }
  throw new TypeError('Invalid explicit UTC instant');
}
function stamp(n) {
  const s = new Date(n).toISOString();
  if (!/^\d{4}-/.test(s)) throw new TypeError('UTC instant outside supported calendar');
  return s;
}
function observed(v) {
  if (typeof v !== 'string') throw new Error('Invalid observation');
  return instant(v);
}
function date(v) {
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v)) throw new Error('Invalid date');
  const n = Date.parse(v + 'T00:00:00.000Z');
  if (!Number.isFinite(n) || new Date(n).toISOString().slice(0,10) !== v) throw new Error('Invalid date');
  return n;
}
function unavailable() {
  return Object.assign(new Error('Prepared issuer revenue comparison unavailable'), {code:'issuer-revenue-unavailable',status:503,retryable:true});
}
function sourceError(reason, retryable, retryAfter) {
  const e = Object.assign(new Error('Issuer revenue source unavailable: ' + reason), {code:'issuer-revenue-source-unavailable',status:503,retryable,reason});
  if (typeof retryAfter === 'string') e.retryAfter = retryAfter;
  return e;
}
function demand(v) { if (!v) throw new Error('Invalid prepared boundary'); }
function ni(v) { return text(v) && isNiUri(v); }
function comparability(issuers) {
  if (!issuers.every(i => i.status === 'current')) return 'unresolved';
  const p = issuers[0].period;
  return issuers.every(i => i.period && p && i.period.start === p.start && i.period.end === p.end) ? 'aligned-periods' : 'different-periods';
}
function periodCheck(p, kind, asOf, today, maximumAgeDays) {
  demand(record(p));
  const a = date(p.start), b = date(p.end);
  const days = (b-a)/DAY+1;
  const [lo,hi] = kind === 'quarter' ? [70,110] : [330,380];
  demand(a <= b && b <= asOf && b <= today && p.durationDays === days && days >= lo && days <= hi && (today-b)/DAY <= maximumAgeDays);
}
function samePeriod(a,b) { return a.start === b.start && a.end === b.end && a.durationDays === b.durationDays; }

/** Pure trusted configuration validation and bounded official SEC acquisition plan; grants no execution or quota.
 * @param {*} configuration Host-owned supplier configuration.
 * @returns {object} Fresh IssuerRevenueAcquisitionPlan.
 */
export function planIssuerRevenueAcquisition(configuration) {
  configurationCheck(configuration);
  const c = configuration;
  return {type:'IssuerRevenueAcquisitionPlan',version:1,minimumIntervalMs:c.minimumIntervalMs,maximumCohortBytes:c.maximumCohortBytes,requests:c.issuers.map(i => ({cik:i.cik,ticker:i.ticker,url:url(i.cik),headers:{'User-Agent':c.userAgent,Accept:'application/json'},timeoutMs:c.timeoutMs,maximumBytes:c.maximumBytes}))};
}

/** Validate the only public request field after complete trusted configuration validation; performs no I/O.
 * @param {*} body Public request record containing only periodKind.
 * @param {*} configuration Host-owned supplier configuration.
 * @returns {{periodKind:string}} Fresh admitted request.
 */
export function validateIssuerRevenueComparisonRequest(body, configuration) {
  configurationCheck(configuration);
  if (!record(body) || Reflect.ownKeys(body).length !== 1 || !Object.hasOwn(body,'periodKind') || !configuration.allowedPeriodKinds.includes(body.periodKind)) throw new TypeError('Only an explicitly allowed periodKind is admitted');
  return {periodKind:body.periodKind};
}

/** Pure typed cache-boundary and freshness admission; returns the exact selected received result without reissuing evidence.
 * @param {*} input Explicit body, configuration, cohort and now.
 * @returns {object} The unchanged admitted IssuerRevenueComparison; otherwise throws.
 */
export function selectPreparedIssuerRevenueComparison(input) {
  const {body,configuration:c,cohort,now} = input ?? {};
  const {periodKind:k} = validateIssuerRevenueComparisonRequest(body,c);
  const n = instant(now);
  const todayString = stamp(n).slice(0,10);
  try {
    const today = date(todayString);
    demand(record(cohort) && cohort.type === 'IssuerRevenuePreparedCohort' && cohort.version === 1);
    const t = observed(cohort.observedAt), asOf = date(cohort.asOf);
    demand(cohort.asOf === cohort.observedAt.slice(0,10) && t <= n && n-t <= c.maximumSnapshotAgeMs);
    demand(record(cohort.results) && Object.hasOwn(cohort.results,'quarter') && Object.hasOwn(cohort.results,'annual'));
    const r = cohort.results[k];
    demand(record(r) && r.type === 'IssuerRevenueComparison' && r.version === 1 && r.observedAt === cohort.observedAt && r.asOf === cohort.asOf && r.periodKind === k && r.datePolicy === 'filing-date-cutoff-on-received-sources');
    demand(Array.isArray(r.issuers) && Array.isArray(r.evidencePackets) && r.issuers.length === c.issuers.length && r.evidencePackets.length === c.issuers.length);
    for (let j=0;j<c.issuers.length;j++) {
      const configured = c.issuers[j], i = r.issuers[j], p = r.evidencePackets[j];
      demand(record(i) && i.type === 'IssuerRevenueReconciliation' && i.version === 1 && i.cik === configured.cik && i.ticker === configured.ticker && i.asOf === cohort.asOf && i.periodKind === k && text(i.issuer) && i.unit === 'USD');
      const s = i.source;
      demand(record(s) && s.uri === url(configured.cik) && ni(s.digest) && positive(s.bytes) && s.bytes <= c.maximumBytes);
      const st = observed(s.observedAt);
      demand(st <= t && n-st <= c.maximumSnapshotAgeMs);
      demand(i.status === 'current' || (i.status === 'ambiguous' && c.allowAmbiguousEvidence));
      demand(Array.isArray(i.witnesses) && i.witnesses.length > 0);
      for (const w of i.witnesses) {
        periodCheck(w,k,asOf,today,c.maximumAgeDays[k]);
        demand(Number.isFinite(w.value) && w.unit === 'USD' && ['10-Q','10-Q/A','10-K','10-K/A'].includes(w.form) && date(w.filed) <= asOf && text(w.accession) && text(w.concept));
      }
      if (i.status === 'current') demand(Number.isFinite(i.value) && i.period !== null);
      else demand(i.value === null && i.revision === 'ambiguous');
      if (i.period !== null) {
        periodCheck(i.period,k,asOf,today,c.maximumAgeDays[k]);
        demand(i.witnesses.every(w => samePeriod(w,i.period)));
      } else {
        demand(i.status === 'ambiguous' && new Set(i.witnesses.map(w => w.end)).size === 1 && new Set(i.witnesses.map(w => w.start)).size > 1);
      }
      demand(record(p) && p.type === 'IssuerEvidencePacket' && p.version === 1 && p.ticker === String(configured.ticker).toUpperCase() && p.issuer === i.issuer && p.asOf === r.asOf && ni(p.id) && p.brokerageEffect === false);
      demand(Array.isArray(p.sources) && p.sources.length === 1);
      const ps = p.sources[0];
      demand(record(ps) && ps.uri === s.uri && ps.digest === s.digest && ps.observedAt === s.observedAt);
      demand(Array.isArray(p.claims) && p.claims.length > 0 && p.claims.every(cl => record(cl) && text(cl.statement) && Array.isArray(cl.sourceDigests) && cl.sourceDigests.length > 0 && cl.sourceDigests.every(d => d === s.digest)));
    }
    demand(r.comparability === comparability(r.issuers));
    return r;
  } catch { throw unavailable(); }
}

async function boundedBytes(stream, limit, signal) {
  if (!stream || typeof stream.getReader !== 'function') throw new Error('invalid-stream');
  const reader = stream.getReader();
  const parts = [];
  let size = 0;
  let rejectAbort;
  const aborted = new Promise((_,reject) => { rejectAbort = reject; });
  const onAbort = () => {
    rejectAbort(signal.reason ?? new Error('timeout'));
    Promise.resolve().then(() => reader.cancel(signal.reason)).catch(() => {});
  };
  if (signal) {
    signal.addEventListener('abort',onAbort,{once:true});
    if (signal.aborted) onAbort();
  }
  try {
    while (true) {
      const item = await (signal ? Promise.race([reader.read(),aborted]) : reader.read());
      if (item.done) break;
      if (!(item.value instanceof Uint8Array)) throw new Error('invalid-stream');
      size += item.value.byteLength;
      if (size > limit) {
        Promise.resolve().then(() => reader.cancel('byte-overflow')).catch(() => {});
        throw new Error('byte-overflow');
      }
      parts.push(item.value.slice());
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const p of parts) { bytes.set(p,offset); offset += p.byteLength; }
    return bytes;
  } finally {
    if (signal) signal.removeEventListener('abort',onAbort);
    try { reader.releaseLock(); } catch {}
  }
}
function parseBytes(bytes) { return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes)); }
async function ordinarySleep(ms) {
  let remaining = ms;
  while (remaining > 0) {
    const part = Math.min(remaining,2147483647);
    await new Promise(resolve => setTimeout(resolve,part));
    remaining -= part;
  }
}
async function acquire(request, fetcher) {
  let retryAfter;
  let signal;
  try {
    signal = AbortSignal.timeout(request.timeoutMs);
    let response;
    const aborted = new Promise((_,reject) => {
      const rejectNow = () => reject(signal.reason);
      signal.addEventListener('abort',rejectNow,{once:true});
    });
    response = await Promise.race([Promise.resolve().then(() => fetcher(request.url,{method:'GET',headers:request.headers,redirect:'error',signal})),aborted]);
    retryAfter = response.headers?.get?.('Retry-After');
    if (response.status !== 200) {
      Promise.resolve().then(() => response.body?.cancel()).catch(() => {});
      throw sourceError('http-'+String(response.status),response.status === 429 || response.status >= 500,retryAfter);
    }
    const header = response.headers?.get?.('Content-Length');
    if (typeof header === 'string' && /^\d+$/.test(header) && BigInt(header) > BigInt(request.maximumBytes)) {
      Promise.resolve().then(() => response.body?.cancel()).catch(() => {});
      throw sourceError('byte-overflow',false,retryAfter);
    }
    const bytes = await boundedBytes(response.body,request.maximumBytes,signal);
    signal.throwIfAborted();
    return bytes;
  } catch (e) {
    if (e?.code === 'issuer-revenue-source-unavailable') throw e;
    if (signal?.aborted) throw sourceError('timeout',true,retryAfter);
    if (e?.message === 'byte-overflow' || e?.message === 'invalid-stream') throw sourceError(e.message,false,retryAfter);
    throw sourceError('network',true,retryAfter);
  }
}

/** Prepare one complete compact both-period cohort through trusted sequential official-source acquisition. No cache write or retry.
 * @param {*} configuration Host-owned supplier configuration.
 * @param {object} [adapters={}] Trusted fetch, now and sleep adapters.
 * @returns {Promise<object>} Complete bounded IssuerRevenuePreparedCohort; source refusals throw.
 */
export async function prepareIssuerRevenueCohort(configuration, adapters = {}) {
  const plan = planIssuerRevenueAcquisition(configuration);
  if (!record(adapters)) throw new TypeError('Invalid trusted adapters');
  const clock = adapters.now ?? Date.now;
  const fetcher = adapters.fetch ?? globalThis.fetch;
  const sleep = adapters.sleep ?? ordinarySleep;
  if (typeof clock !== 'function' || typeof fetcher !== 'function' || typeof sleep !== 'function') throw new TypeError('Invalid trusted adapters');
  const started = instant(clock());
  const asOf = stamp(started).slice(0,10);
  let last = started;
  function observation() {
    let n, s;
    try { n = instant(clock()); s = stamp(n); } catch { throw sourceError('invalid-clock',false); }
    if (s.slice(0,10) !== asOf) throw sourceError('utc-day-changed',true);
    if (n < last) throw sourceError('clock-regressed',false);
    last = n;
    return s;
  }
  const results = {quarter:{issuers:[],evidencePackets:[]},annual:{issuers:[],evidencePackets:[]}};
  for (let j=0;j<plan.requests.length;j++) {
    if (j > 0) {
      try { await sleep(plan.minimumIntervalMs); } catch { throw sourceError('spacing-failed',true); }
    }
    const request = plan.requests[j];
    await (async () => {
      const bytes = await acquire(request,fetcher);
      const observedAt = observation();
      let companyfacts;
      try { companyfacts = parseBytes(bytes); } catch { throw sourceError('malformed-source',false); }
      let address;
      try {
        address = await addressContent(bytes,{mediaType:'application/json'});
        demand(address.kind === 'semiotic-content.raw-carrier-address' && address.version === 1 && address.algorithm === 'sha-256' && address.size === bytes.byteLength && address.mediaType === 'application/json' && ni(address.ni));
      } catch { throw sourceError('invalid-source-address',false); }
      const source = {uri:request.url,digest:address.ni,bytes:address.size,observedAt};
      for (const periodKind of kinds) {
        let kernel;
        try { kernel = reconcileIssuerRevenueFacts({cik:request.cik,asOf,periodKind,maximumAgeDays:configuration.maximumAgeDays[periodKind],companyfacts}); } catch { throw sourceError('invalid-source-identity',false); }
        const result = {...kernel,ticker:request.ticker,source:{...source}};
        const statement = 'Received SEC companyfacts and reconciled '+periodKind+' USD revenue; status='+result.status+'; period='+(result.period ? result.period.start+'..'+result.period.end : 'none')+'; value='+String(result.value)+'; revision='+result.revision+'.';
        let packet;
        try { packet = await formIssuerEvidencePacket({ticker:request.ticker,issuer:result.issuer,asOf,sources:[{uri:source.uri,observedAt:source.observedAt,digest:source.digest}],claims:[{statement,sourceDigests:[source.digest]}]}); } catch { throw sourceError('packet-construction-failed',false); }
        results[periodKind].issuers.push(result);
        results[periodKind].evidencePackets.push(packet);
      }
    })();
  }
  const observedAt = observation();
  for (const periodKind of kinds) {
    const compact = results[periodKind];
    results[periodKind] = {type:'IssuerRevenueComparison',version:1,observedAt,asOf,periodKind,datePolicy:'filing-date-cutoff-on-received-sources',comparability:comparability(compact.issuers),issuers:compact.issuers,evidencePackets:compact.evidencePackets};
  }
  const cohort = {type:'IssuerRevenuePreparedCohort',version:1,observedAt,asOf,results};
  try {
    if (new TextEncoder().encode(JSON.stringify(cohort)).byteLength > configuration.maximumCohortBytes) throw new Error('overflow');
  } catch { throw sourceError('compact-output-overflow',false); }
  return cohort;
}

/** Read the trusted prepared cache once and admit its unchanged selected result; no source fallback or storage write.
 * @param {*} body Public periodKind-only request.
 * @param {*} env Host environment supplying ISSUER_EVIDENCE.get.
 * @param {*} configuration Host-owned supplier configuration.
 * @returns {Promise<object>} Unchanged ready comparison; unavailable cache throws retryable 503.
 */
export async function readPreparedIssuerRevenueComparison(body, env, configuration) {
  const request = validateIssuerRevenueComparisonRequest(body,configuration);
  let cohort;
  try {
    const binding = env?.ISSUER_EVIDENCE;
    if (!binding || typeof binding.get !== 'function') throw new Error('missing-binding');
    const object = await binding.get(configuration.cacheKey);
    if (!object) throw new Error('missing-cache');
    if (object.size !== undefined && (!Number.isSafeInteger(object.size) || object.size < 0 || object.size > configuration.maximumCohortBytes)) {
      Promise.resolve().then(() => object.body?.cancel()).catch(() => {});
      throw new Error('byte-overflow');
    }
    cohort = parseBytes(await boundedBytes(object.body,configuration.maximumCohortBytes));
  } catch { throw unavailable(); }
  return selectPreparedIssuerRevenueComparison({body:request,configuration,cohort,now:Date.now()});
}
