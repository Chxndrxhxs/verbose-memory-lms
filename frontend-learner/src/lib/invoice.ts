export type InvoiceData = {
  invoiceNo: string;
  dateLabel: string;
  billedTo: string;
  email: string;
  courseTitle: string;
  orderId: string;
  paymentId: string;
  amountLabel: string;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/* Standalone document, so the palette is inlined as the sRGB
 * approximations of the app's "quiet room" tokens (src/index.css):
 * room #f7f5ef · room-raised #fdfdfb · room-sunk #efeae0 ·
 * room-deep #1b1018 · ink #271924 · ink-muted #6b6168 ·
 * ink-faint #a79daa · ink-inverse #fbfaf6 · rule #e6e1d8 ·
 * rule-strong #d4ccbf · gold #ffbe49 · gold-deep #b86b0b ·
 * gold-wash #fdf1d0 · live #2a824a · live-soft #e7f2ea. */
export function buildInvoiceHtml(d: InvoiceData): string {
  const v = {
    invoiceNo: escapeHtml(d.invoiceNo),
    dateLabel: escapeHtml(d.dateLabel),
    billedTo: escapeHtml(d.billedTo),
    email: escapeHtml(d.email),
    courseTitle: escapeHtml(d.courseTitle),
    orderId: escapeHtml(d.orderId),
    paymentId: escapeHtml(d.paymentId),
    amountLabel: escapeHtml(d.amountLabel),
  };
  return `<!doctype html><html><head><meta charset="utf-8"><title>Invoice ${v.invoiceNo}</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=IBM+Plex+Mono:wght@500;600&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box}
body{font-family:Inter,system-ui,-apple-system,sans-serif;margin:0;background:#f7f5ef;color:#271924}
.sheet{max-width:760px;margin:32px auto;background:#fdfdfb;border:1px solid #d4ccbf;box-shadow:0 20px 60px rgba(27,16,24,.10)}
.head{background:#1b1018;color:#fbfaf6;padding:28px 32px;border-bottom:3px solid #ffbe49}
.brand{display:flex;align-items:center;gap:12px}
.seal{width:44px;height:44px;background:#ffbe49;color:#271924;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:20px}
.brand h1{font-size:16px;margin:0;letter-spacing:.18em}
.brand p{margin:2px 0 0;font-size:10px;letter-spacing:.28em;color:#ffbe49;text-transform:uppercase}
.title{display:flex;justify-content:space-between;align-items:flex-end;margin-top:20px}
.title h2{margin:0;font-size:26px;letter-spacing:-.02em}
.pill{display:inline-block;background:#e7f2ea;color:#2a824a;border:1px solid rgba(42,130,74,.25);font-size:11px;font-weight:600;padding:4px 12px;letter-spacing:.08em;text-transform:uppercase}
.meta{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-top:16px}
.meta div{background:rgba(251,250,246,.06);border:1px solid rgba(251,250,246,.14);padding:10px 12px}
.meta span{display:block;font-size:10px;text-transform:uppercase;letter-spacing:.14em;color:rgba(251,250,246,.55)}
.meta strong{font-size:12px;font-family:'IBM Plex Mono',ui-monospace,monospace}
.body{padding:28px 32px}
.card{background:#efeae0;border:1px solid #e6e1d8;padding:14px 16px}
.card span{display:block;font-size:10px;text-transform:uppercase;letter-spacing:.14em;color:#a79daa}
.card strong{font-size:14px}
table{width:100%;border-collapse:collapse;margin-top:20px;font-size:13px}
thead th{background:#f7f5ef;color:#6b6168;text-align:left;padding:12px;font-size:11px;text-transform:uppercase;letter-spacing:.1em;border-bottom:1px solid #d4ccbf}
thead th:last-child{text-align:right}
tbody td{border:1px solid #e6e1d8;border-top:0;padding:14px 12px}
tbody td:last-child{text-align:right}
tfoot td{padding:14px 12px;border-top:2px solid #271924;font-weight:700;font-size:15px;text-align:right}
tfoot td:first-child{text-align:left;font-weight:600;color:#6b6168;font-size:12px}
.mono{font-family:'IBM Plex Mono',ui-monospace,monospace;font-size:11px}
.foot{margin-top:20px;display:flex;justify-content:space-between;gap:16px;font-size:11px;color:#6b6168}
.actions{padding:0 32px 28px}
button{background:#ffbe49;color:#271924;border:1px solid #b86b0b;padding:12px 22px;font-weight:600;cursor:pointer;font-size:13px}
@media print{body{background:#fff}.sheet{box-shadow:none;margin:0;max-width:none;border:0}button{display:none}@page{margin:12mm}}
</style></head><body>
<div class="sheet"><div class="head"><div class="brand"><div class="seal">Q</div><div><h1>QTNXT</h1><p>Academy &bull; Learn forward</p></div></div>
<div class="title"><h2>Invoice</h2><span class="pill">Paid</span></div>
<div class="meta"><div><span>Invoice no</span><strong>${v.invoiceNo}</strong></div><div><span>Issued on</span><strong>${v.dateLabel}</strong></div><div><span>Payment ID</span><strong>${v.paymentId}</strong></div></div></div>
<div class="body"><div class="card"><span>Billed to</span><strong>${v.billedTo}</strong><span style="margin-top:6px">${v.email}</span></div>
<table><thead><tr><th>Course</th><th>Order ID</th><th style="text-align:right">Amount</th></tr></thead>
<tbody><tr><td><strong>${v.courseTitle}</strong></td><td class="mono">${v.orderId}</td><td><strong>${v.amountLabel}</strong></td></tr></tbody>
<tfoot><tr><td>Total paid</td><td colspan="2">${v.amountLabel}</td></tr></tfoot></table>
<div class="foot"><span>Thank you for learning with QTNXT.<br>Questions? support@qtnxt.com</span><span style="text-align:right">Verified receipt<br><strong class="mono">${v.invoiceNo}</strong></span></div></div>
<div class="actions"><button onclick="window.print()">Print / Save as PDF</button></div></div></body></html>`;
}
