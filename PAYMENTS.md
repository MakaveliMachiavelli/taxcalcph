# PAYMENTS.md — TaxCalcPH monetization setup (Allen's ~4-minute step)

Same working mechanics as InvoicePH: GCash QR → code → PRO unlocks instantly in the buyer's browser.

## 1. GCash QR (2 min)
Save your GCash QR over `assets/gcash-qr.svg` (or use a .png and update the `<img src>` in `index.html`).

## 2. Unlock codes (1 min)
In `app.js` line ~7:
```js
const PRO_CODES = ['TAXCALC-PH-99', 'TCP-DEMO'];   // ← your codes
```

## 3. Optional: LemonSqueezy/Gumroad for card payments (5 min)
Create product "TaxCalcPH PRO — ₱99 / $2", content = unlock code, paste link near the QR in the modal.

## 4. Pricing rationale
₱99 = impulse zone for a freelancer staring at a quarterly deadline. The quarterly 1701Q sheet is the "painkiller" feature — pitch it in Apr/Aug/Nov/Jan windows when the deadline is close.

## 5. Fulfilment
GCash notification → message the code → done. Auto-delivery via LemonSqueezy when volume justifies it.

## 6. Cross-sell
TaxCalcPH's "Made for PH freelancers" card links to InvoicePH; InvoicePH's FAQ could link back. Same buyer, two products, one GCash flow.
