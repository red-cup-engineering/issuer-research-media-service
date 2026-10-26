import assert from "node:assert/strict";
import test from "node:test";
import { issuerConceptCoherence, readIssuerConceptCoherence, SEC_USER_AGENT } from "../src/issuer-concept-coherence.mjs";

// Apple's accrued liabilities as SEC reports them: the 2010 10-K/A restated FY2008, and later filings carried FY2009 at
// its restated value. The last two facts are constructed to exercise damage: one filing reporting two values for one
// period, and two filings made the same day that disagree.
const document = {
  cik: 320193,
  taxonomy: "us-gaap",
  tag: "AccruedLiabilitiesCurrent",
  label: "Accrued Liabilities, Current",
  entityName: "Apple Inc.",
  units: {
    USD: [
      { end: "2008-09-27", val: 3719000000, accn: "0001193125-09-214859", form: "10-K", filed: "2009-10-27" },
      { end: "2008-09-27", val: 4224000000, accn: "0001193125-10-012091", form: "10-K/A", filed: "2010-01-25" },
      { end: "2009-09-26", val: 3376000000, accn: "0001193125-09-214859", form: "10-K", filed: "2009-10-27" },
      { end: "2009-09-26", val: 3852000000, accn: "0001193125-10-238044", form: "10-K", filed: "2010-10-27" },
      { end: "2010-09-25", val: 5723000000, accn: "0001193125-10-238044", form: "10-K", filed: "2010-10-27" },
      { end: "2010-09-25", val: 5723000000, accn: "0001193125-11-282113", form: "10-K", filed: "2011-10-26" },
      { end: "2011-09-24", val: 9247000000, accn: "0001193125-11-282113", form: "10-K", filed: "2011-10-26" },
      { end: "2011-09-24", val: 9248000000, accn: "0001193125-11-282113", form: "10-K", filed: "2011-10-26" },
      { end: "2012-09-29", val: 11414000000, accn: "0001193125-12-444068", form: "10-K", filed: "2012-10-31" },
      { end: "2012-09-29", val: 11415000000, accn: "0001193125-12-444070", form: "10-K/A", filed: "2012-10-31" },
    ],
  },
};

test("a later filing that reports a different value is a border, kept and certified", async () => {
  const sheet = await issuerConceptCoherence(document);
  const amendment = sheet.certificates.find((certificate) => certificate.cell === "USD|..2008-09-27");
  assert.equal(amendment.kind, "border");
  assert.equal(amendment.revision, "amendment");
  assert.equal(amendment.repair, null);
  assert.equal(amendment.left.value, 3719000000);
  assert.equal(amendment.right.value, 4224000000);
  assert.equal(sheet.certificates.find((certificate) => certificate.cell === "USD|..2009-09-26").revision, "later report");
});

test("filings that agree raise no obstruction", async () => {
  const sheet = await issuerConceptCoherence(document);
  assert.equal(sheet.certificates.some((certificate) => certificate.cell === "USD|..2010-09-25"), false);
  assert.equal(sheet.sharedCells, 4);
});

test("a filing that disagrees with itself, and same-day filings that disagree, are damage with a priced repair", async () => {
  const sheet = await issuerConceptCoherence(document);
  const self = sheet.certificates.find((certificate) => certificate.cell === "USD|..2011-09-24");
  assert.equal(self.kind, "damage");
  assert.equal(self.erasure, 1);
  const sameDay = sheet.certificates.find((certificate) => certificate.cell === "USD|..2012-09-29");
  assert.equal(sameDay.kind, "damage");
  assert.match(sameDay.repair, /amendment 0001193125-12-444070/);
  assert.equal(sheet.damage, 2);
  assert.equal(sheet.borders, 2);
  assert.equal(sheet.erasureCost, 2);
  assert.equal(sheet.erasureIfCollapsed, 4);
});

test("the sheet is content-addressed and its largest revisions are ranked by relative change", async () => {
  const [first, second] = [await issuerConceptCoherence(document), await issuerConceptCoherence(document)];
  assert.match(first.id, /^ni:\/\/\/sha-256;[A-Za-z0-9_-]{43}$/);
  assert.equal(first.id, second.id);
  assert.equal(first.largestRevisions[0].cell, "USD|..2009-09-26");
  assert.equal(first.issuer.cik, "0000320193");
});

test("reading resolves a ticker through SEC's list and reads the concept with the Group's user agent", async () => {
  const seen = [];
  const fetch = async (url, init) => {
    seen.push([url, init.headers["user-agent"]]);
    if (url.endsWith("company_tickers.json")) return Response.json({ 0: { cik_str: 320193, ticker: "AAPL", title: "Apple Inc." } });
    return Response.json(document);
  };
  const sheet = await readIssuerConceptCoherence({ ticker: "aapl", concept: "AccruedLiabilitiesCurrent", fetch });
  assert.equal(sheet.source, "https://data.sec.gov/api/xbrl/companyconcept/CIK0000320193/us-gaap/AccruedLiabilitiesCurrent.json");
  assert.deepEqual(seen.map(([, agent]) => agent), [SEC_USER_AGENT, SEC_USER_AGENT]);
});

test("unreported concepts and malformed requests are refused before any sale", async () => {
  const fetch = async () => new Response("", { status: 404 });
  await assert.rejects(readIssuerConceptCoherence({ cik: "320193", concept: "NoSuchConcept", fetch }), { code: "concept-not-reported", status: 404 });
  await assert.rejects(readIssuerConceptCoherence({ cik: "320193", concept: "bad concept", fetch }), { code: "invalid-request" });
  await assert.rejects(readIssuerConceptCoherence({ concept: "Revenues", fetch }), { code: "invalid-request" });
  await assert.rejects(readIssuerConceptCoherence({ cik: "320193", concept: "Revenues", taxonomy: "made-up", fetch }), { code: "invalid-request" });
});
