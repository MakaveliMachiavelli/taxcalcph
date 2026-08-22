/* TaxCalcPH — app logic. Vanilla JS, no dependencies, no server.
   Rates per R.A. 10963 (TRAIN), individual income tax. */
'use strict';

/* PRO unlock codes. OWNER: change before promoting (see PAYMENTS.md). */
const PRO_CODES = ['TAXCALC-PH-99', 'TCP-DEMO'];
const LS = { draft: 'tcp_draft', pro: 'tcp_pro' };

/* TRAIN graduated brackets (taxable income): [cap, base tax, rate over lower bound] */
const BRACKETS = [
  { upTo: 250000, base: 0, rate: 0, over: 0 },
  { upTo: 400000, base: 0, rate: 0.15, over: 250000 },
  { upTo: 800000, base: 22500, rate: 0.20, over: 400000 },
  { upTo: 2000000, base: 102500, rate: 0.25, over: 800000 },
  { upTo: 8000000, base: 402500, rate: 0.30, over: 2000000 },
  { upTo: Infinity, base: 2202500, rate: 0.35, over: 8000000 }
];
const EXEMPT = 250000;      // first ₱250k exempt in BOTH options
const OSD = 0.40;           // optional standard deduction for Option B
const EIGHT_PCT_CAP = 3000000; // 8% eligibility gross cap
const VAT_THRESHOLD = 3000000;

const SEASONS = {
  even: [0.25, 0.25, 0.25, 0.25],
  back: [0.10, 0.20, 0.30, 0.40],
  front: [0.40, 0.30, 0.20, 0.10]
};

let pro = localStorage.getItem(LS.pro) === '1';

const $ = (id) => document.getElementById(id);
const peso = (n) => '₱' + Math.round(n).toLocaleString('en-PH');
const pct = (n) => (n * 100).toFixed(2) + '%';

function gradTax(taxable) {
  for (const b of BRACKETS) {
    if (taxable <= b.upTo) return b.base + (taxable - b.over) * b.rate;
  }
  return 0;
}
function bracketOf(taxable) {
  return BRACKETS.find(b => taxable <= b.upTo) || BRACKETS[BRACKETS.length - 1];
}

function calc() {
  const rawGross = Number($('gross').value) || 0;
  const monthly = $('periodMonthly') && $('periodMonthly').classList.contains('active');
  const gross = monthly ? rawGross * 12 : rawGross;
  const mixed = $('mixMode').value === 'mixed';
  // Option A: 8% on gross over 250k (mixed earners: exemption sits on the salary side)
  const aBase = Math.max(0, gross - (mixed ? 0 : EXEMPT));
  const aTax = aBase * 0.08;
  // Option B: graduated on (gross − 40% OSD) + 3% percentage tax (non-VAT, ≤₱3M — 8% replaces it)
  const osdAmt = gross * OSD;
  const bTaxable = Math.max(0, gross - osdAmt);
  const bIncomeTax = gradTax(bTaxable);
  const bPt = gross > 0 && gross <= VAT_THRESHOLD ? gross * 0.03 : 0;
  const bTax = bIncomeTax + bPt;
  // Mixed: compensation taxed graduated after ₱90k 13th-month/benefits cap + mandatory contributions
  const comp = mixed ? (Number($('comp').value) || 0) : 0;
  const contribs = mixed ? (Number($('contribs').value) || 0) : 0;
  const compExempt = Math.min(90000, Math.max(0, comp));
  const compTaxable = Math.max(0, comp - compExempt - contribs);
  const compTax = gradTax(compTaxable);
  const cwt = Number(($('cwtCredits') ? $('cwtCredits').value : 0)) || 0;
  return {
    gross, rawGross, monthly, mixed, aBase, aTax, osdAmt, bTaxable, bIncomeTax, bPt, bTax,
    comp, contribs, compExempt, compTaxable, compTax, cwt,
    aPayable: Math.max(0, aTax - cwt), bPayable: Math.max(0, bTax - cwt),
    aTotal: aTax + compTax, bTotal: bTax + compTax
  };
}

function quarterly(c, method) {
  const shares = SEASONS[$('season').value] || SEASONS.even;
  const rows = [];
  let prevPay = 0;
  for (let q = 1; q <= 4; q++) {
    const cumGross = c.gross * shares.slice(0, q).reduce((s, v) => s + v, 0);
    let cumTax;
    if (method === 'A') cumTax = Math.max(0, cumGross - (c.mixed ? 0 : EXEMPT)) * 0.08;
    else cumTax = gradTax(Math.max(0, cumGross - cumGross * OSD)) + (cumGross > 0 && cumGross <= VAT_THRESHOLD ? cumGross * 0.03 : 0);
    rows.push({ q, cumGross, cumTax, pay: Math.max(0, cumTax - prevPay) });
    prevPay = cumTax;
  }
  return rows;
}

function exportCsv(qrows, method, c) {
  const head = ['Quarter', 'Cumulative gross', 'Cumulative tax due', 'Payable this quarter'];
  const rows = qrows.map(r => [`Q${r.q}`, r.cumGross.toFixed(2), r.cumTax.toFixed(2), r.pay.toFixed(2)]);
  const csv = [['TaxCalcPH export', `method=${method}`, `annual gross=${c.gross.toFixed(2)}`], head, ...rows]
    .map(r => r.map(v => `"${v}"`).join(',')).join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' }));
  a.download = 'taxcalcph-quarterly.csv';
  a.click();
}

function render() {
  const c = calc();
  $('monthlyEcho').textContent = c.monthly
    ? '₱' + Math.round(c.rawGross).toLocaleString() + '/mo → ' + peso(c.gross) + '/yr'
    : peso(c.gross / 12);
  $('compWrap').classList.toggle('hidden', !c.mixed);
  $('contribWrap').classList.toggle('hidden', !c.mixed);

  // option cards (mixed → totals incl. compensation tax)
  const aShown = c.mixed ? c.aTotal : c.aTax;
  const bShown = c.mixed ? c.bTotal : c.bTax;
  const baseInc = c.mixed ? c.gross + c.comp : c.gross;
  $('aTax').textContent = peso(aShown);
  $('aEr').textContent = (c.mixed ? 'incl. salary tax ' + peso(c.compTax) + ' · ' : '') +
    'effective ' + pct(baseInc > 0 ? aShown / baseInc : 0) + ' of income';
  $('bTax').textContent = peso(bShown);
  $('bEr').textContent = (c.mixed ? 'incl. salary tax ' + peso(c.compTax) + ' · ' : '') +
    'effective ' + pct(baseInc > 0 ? bShown / baseInc : 0) + ' of income';

  // winner
  const aWins = aShown < bShown, tie = aShown === bShown;
  document.querySelectorAll('.opt-card').forEach((el, i) => el.classList.toggle('win', tie ? false : (i === 0 ? aWins : !aWins)));
  const diff = Math.abs(aShown - bShown);
  $('verdict').textContent = c.gross <= 0 ? 'Enter your gross receipts to compare.'
    : tie ? 'Both options compute the same tax at this income level.'
    : (aWins ? `✓ Choose 8% — saves ${peso(diff)} vs graduated+OSD.`
             : `✓ Choose Graduated + OSD — saves ${peso(diff)} vs 8%.`);

  // warnings
  const warns = [];
  if (c.mixed) warns.push('Mixed income: your employer withholds the salary part monthly (substituted filing for compensation). The 8%-vs-graduated choice applies to your freelance income — you still file 1701/1701Q for it.');
  if (c.gross > EIGHT_PCT_CAP) warns.push('Freelance gross exceeds ₱3M — you are NOT eligible for the 8% option; graduated applies.');
  if (c.gross > VAT_THRESHOLD) warns.push('Above ₱3M you are generally required to register for VAT (12%) — separate from income tax.');
  if (c.gross > 0 && c.gross < 250000) warns.push('Below ₱250k freelance gross you owe ₱0 income tax on the freelance side — but graduated still owes 3% percentage tax on gross (8% replaces it).');
  if (c.bPt > 0) warns.push('Option B includes 3% percentage tax (BIR 2551Q) for non-VAT taxpayers on graduated rates; electing 8% replaces it.');
  $('warn').innerHTML = warns.map(w => `<div>${w}</div>`).join('');

  // comparison doc
  const p = (id, v) => $(id).textContent = v;
  p('cd_gross', `Gross receipts: ${peso(c.gross)}` + (c.mixed ? ` · compensation: ${peso(c.comp)}` : '') + ` · prepared ${new Date().toISOString().slice(0, 10)}`);
  p('d_grossA', peso(c.gross)); p('d_grossB', peso(c.gross));
  p('d_250A', '−' + peso(Math.min(EXEMPT, c.gross)));
  p('d_osd', '−' + peso(c.osdAmt));
  p('d_taxableA', peso(c.aBase)); p('d_taxableB', peso(c.bTaxable));
  p('d_taxA', peso(c.aTax)); p('d_taxB', peso(c.bTax));
  p('d_pt', c.bPt > 0 ? peso(c.bPt) : 'n/a');
  const showPay = c.cwt > 0;
  ['cwtRow','payRow'].forEach(id => { const el = $(id); if (el) el.style.display = showPay ? '' : 'none'; });
  if (showPay) {
    p('d_cwtA', '−' + peso(Math.min(c.cwt, c.aTax))); p('d_cwtB', '−' + peso(Math.min(c.cwt, c.bTax)));
    p('d_payA', peso(c.aPayable)); p('d_payB', peso(c.bPayable));
  }
  p('d_erA', pct(c.gross > 0 ? c.aTax / c.gross : 0)); p('d_erB', pct(c.gross > 0 ? c.bTax / c.gross : 0));
  document.querySelectorAll('.comp-rows').forEach(el => el.classList.toggle('hidden', !c.mixed));
  if (c.mixed) {
    p('d_comp', peso(c.comp)); p('d_comp2', peso(c.comp));
    const ded = '−' + peso(c.compExempt + c.contribs);
    p('d_compded', ded); p('d_compded2', ded);
    p('d_compTax', peso(c.compTax)); p('d_compTax2', peso(c.compTax));
    p('d_grandA', peso(c.aTotal)); p('d_grandB', peso(c.bTotal));
  }
  $('cd_verdict').textContent = c.gross <= 0 ? '' :
    tie ? 'Either option — identical tax.'
    : (aWins ? `8% saves ${peso(diff)} per year on your freelance tax.` : `Graduated + OSD saves ${peso(diff)} per year on your freelance tax.`);

  // bracket table with active row
  const tb = $('bracketTable').querySelector('tbody');
  tb.innerHTML = '';
  const fmtCap = (b) => b.upTo === Infinity ? 'over ₱8M' : 'up to ₱' + b.upTo.toLocaleString();
  BRACKETS.forEach(b => {
    const hit = c.bTaxable > (BRACKETS[BRACKETS.indexOf(b) - 1]?.upTo ?? -1) && c.bTaxable <= b.upTo && c.bTaxable > 0;
    tb.insertAdjacentHTML('beforeend',
      `<tr class="${hit ? 'hit' : ''}"><td>${fmtCap(b)}</td><td class="r">${(b.rate * 100).toFixed(0)}%${b.base ? ' + base' : ''}</td>` +
      `<td class="r">${b.rate === 0 ? 'exempt' : peso(gradTax(Math.min(c.bTaxable, b.upTo)) - gradTax(b.over))}</td></tr>`);
  });

  saveDraft();
}

function saveDraft() {
  try {
    localStorage.setItem(LS.draft, JSON.stringify({
      gross: $('gross').value, season: $('season').value,
      mixMode: $('mixMode').value, comp: $('comp').value, contribs: $('contribs').value,
      monthly: $('periodMonthly').classList.contains('active'), cwt: $('cwtCredits').value
    }));
  } catch (e) {}
}
function loadDraft() {
  try {
    const d = JSON.parse(localStorage.getItem(LS.draft) || 'null');
    if (!d) return;
    $('gross').value = d.gross ?? 600000;
    $('season').value = d.season ?? 'even';
    $('mixMode').value = d.mixMode ?? 'pure';
    $('comp').value = d.comp ?? 420000;
    $('contribs').value = d.contribs ?? 0;
    $('cwtCredits').value = d.cwt ?? 0;
    if (d.monthly) { $('periodMonthly').classList.add('active'); $('periodAnnual').classList.remove('active'); $('periodLabel').textContent = 'Monthly'; }
  } catch (e) {}
}

function applyPro() {
  $('proBadge').classList.toggle('hidden', !pro);
  $('quarterBtn').classList.toggle('hidden', !pro);
}

document.addEventListener('DOMContentLoaded', () => {
  loadDraft();
  applyPro();

  ['gross', 'season', 'mixMode', 'comp', 'contribs', 'cwtCredits'].forEach(id => $(id).addEventListener('input', render));
  const setPeriod = (mode) => {
    const isM = mode === 'monthly';
    if ($('periodMonthly').classList.contains('active') !== isM) {
      const v = Number($('gross').value) || 0;
      $('gross').value = v ? String(Math.round(isM ? v / 12 : v * 12)) : v;
    }
    $('periodMonthly').classList.toggle('active', isM);
    $('periodAnnual').classList.toggle('active', !isM);
    $('periodLabel').textContent = isM ? 'Monthly' : 'Annual';
    render();
  };
  $('periodMonthly').addEventListener('click', () => setPeriod('monthly'));
  $('periodAnnual').addEventListener('click', () => setPeriod('annual'));
  $('printBtn').addEventListener('click', () => window.print());

  const openPay = () => { $('payModal').classList.remove('hidden'); $('codeMsg').textContent = ''; };
  $('proBtn').addEventListener('click', openPay);
  $('proBtn2').addEventListener('click', openPay);
  $('payClose').addEventListener('click', () => $('payModal').classList.add('hidden'));
  $('codeBtn').addEventListener('click', () => {
    const code = $('codeInput').value.trim().toUpperCase();
    if (PRO_CODES.includes(code)) {
      pro = true; localStorage.setItem(LS.pro, '1'); applyPro();
      $('codeMsg').textContent = '✓ PRO unlocked — quarterly 1701Q view is now active.';
      $('codeMsg').className = 'code-msg ok';
      setTimeout(() => $('payModal').classList.add('hidden'), 1500);
    } else {
      $('codeMsg').textContent = 'Invalid code — check the code from your GCash confirmation.';
      $('codeMsg').className = 'code-msg bad';
    }
  });
  $('codeInput').addEventListener('keydown', e => { if (e.key === 'Enter') $('codeBtn').click(); });

  let lastQ = null;
  $('quarterBtn').addEventListener('click', () => {
    const c = calc();
    const method = c.aTax <= c.bTax ? 'A (8% flat)' : 'B (Graduated + OSD)';
    const rows = quarterly(c, c.aTax <= c.bTax ? 'A' : 'B');
    lastQ = { rows, method, c };
    $('qBest').textContent = method;
    $('qHint').textContent = c.mixed
      ? 'Freelance side only (your employer handles salary withholding). Cumulative method: each quarter pays the increment of cumulative tax due.'
      : 'Cumulative method (how BIR Form 1701Q actually computes): tax due grows with cumulative income; each quarter pays the increment.';
    $('qBody').innerHTML = rows.map(r =>
      `<tr><td>Q${r.q}</td><td class="r">${peso(r.cumGross)}</td><td class="r">${peso(r.cumTax)}</td><td class="r"><strong>${peso(r.pay)}</strong></td></tr>`).join('');
    $('qModal').classList.remove('hidden');
  });
  $('qClose').addEventListener('click', () => $('qModal').classList.add('hidden'));
  $('qExport').addEventListener('click', () => { if (lastQ) exportCsv(lastQ.rows, lastQ.method, lastQ.c); });

  document.querySelectorAll('.modal').forEach(m => m.addEventListener('click', e => { if (e.target === m) m.classList.add('hidden'); }));

  render();
});
