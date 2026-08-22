# TaxCalcPH — 8% vs Graduated Tax Calculator (PH Freelancers)

**Live:** https://makavelimachiavelli.github.io/taxcalcph/

## What it is
The decision calculator Philippine freelancers actually need: **8% flat vs graduated + 40% OSD**, computed side-by-side under R.A. 10963 (TRAIN) tables, with the winner converted into **quarterly 1701Q payments** (cumulative method, the way BIR Form 1701Q actually computes).

**Free tier:** annual comparison, verdict + savings amount, bracket detail, warnings (8% ₱3M cap, VAT threshold, sub-₱250k ₱0 tax), printable computation.
**PRO (₱99 one-time, GCash):** quarterly 1701Q schedule with income-pattern shapes (even / back-loaded / front-loaded) + CSV export.

## Buyer persona
- **Who:** PH freelancers/self-employed deciding (or re-deciding) their tax rate — the single most-asked question in r/taxPH and PH freelancer FB groups; also VAs preparing quarterly filings.
- **Pain:** the 8%-vs-graduated comparison is non-obvious (crossover ~₱700k–1M with OSD); existing calculators are ad-covered pages without OSD or quarterly output; Taxumo/JuanTax are paid subscriptions built for filing, not deciding.
- **Why pay ₱99:** one wrong quarter costs more; the quarterly sheet maps directly to 1701Q deadlines (Apr/Aug/Nov/Jan 15).
- **Where they hang out:** r/taxPH, r/phinvest, PH freelancer Facebook groups, "8% vs graduated" Google searches.

## Demand evidence (per REVENUE GATES)
- Paid competitors: Taxumo (paid plans), JuanTax (paid), plus Refrens/QuickBooks adjacent = 3+ paid.
- Community: r/taxPH 8%-vs-graduated threads recur constantly; every PH freelancing guide covers the choice.
- Synergy: cross-linked with InvoicePH (same persona — invoice → sales book → tax computation funnel).

## Monetization
GCash QR + unlock code (see `PAYMENTS.md`), same working mechanics as the other products.

## Tech
Static HTML/CSS/vanilla JS, no build/backend/deps. Print CSS → computation sheet PDF.

## Deploy (GitHub Pages)
```bash
git init && git add -A && git commit -m "TaxCalcPH v1"
gh repo create taxcalcph --public --source=. --push
gh api -X POST repos/MakaveliMachiavelli/taxcalcph/pages -f "source[branch]=main" -f "source[path]=/"
```

## Owner TODO (Allen, ~5 min)
Same as InvoicePH: swap GCash QR, set `PRO_CODES` in `app.js`, optionally add LemonSqueezy link. Growth lever: r/taxPH answers + freelancer FB groups.
