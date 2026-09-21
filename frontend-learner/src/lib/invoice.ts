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
<style>
*{box-sizing:border-box}body{font-family:Inter,system-ui,-apple-system,sans-serif;margin:0;background:#eef0f6;color:#18181b}
.sheet{max-width:760px;margin:32px auto;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 20px 60px rgba(10,17,40,.18)}
.banner{background:linear-gradient(135deg,#0a1128,#16245c);color:#fff;padding:28px 32px;border-bottom:4px solid #fcd34d}
.brand{display:flex;align-items:center;gap:12px}.seal{width:44px;height:44px;border-radius:999px;background:linear-gradient(135deg,#fde68a,#f59e0b);color:#0a1128;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:20px}
.brand h1{font-size:18px;margin:0;letter-spacing:.14em}.brand p{margin:2px 0 0;font-size:11px;letter-spacing:.24em;color:#fcd34d;text-transform:uppercase}
.title{display:flex;justify-content:space-between;align-items:flex-end;margin-top:20px}
.title h2{margin:0;font-size:26px;letter-spacing:-.02em}.pill{display:inline-block;background:#10b981;color:#fff;font-size:11px;font-weight:800;padding:4px 12px;border-radius:999px;letter-spacing:.08em}
.meta{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-top:16px}
.meta div{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.14);border-radius:12px;padding:10px 12px}
.meta span{display:block;font-size:10px;text-transform:uppercase;letter-spacing:.14em;color:#c7d2fe}
.meta strong{font-size:12px;font-family:ui-monospace,monospace}
.body{padding:28px 32px}.card{background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:14px 16px}
.card span{display:block;font-size:10px;text-transform:uppercase;letter-spacing:.14em;color:#71717a}
.card strong{font-size:14px}table{width:100%;border-collapse:collapse;margin-top:20px;font-size:13px}
thead th{background:#0a1128;color:#fff;text-align:left;padding:12px;font-size:11px;text-transform:uppercase;letter-spacing:.1em}
thead th:first-child{border-radius:12px 0 0 0}thead th:last-child{border-radius:0 12px 0 0;text-align:right}
tbody td{border:1px solid #e4e4e7;border-top:0;padding:14px 12px}tbody td:last-child{text-align:right}
tfoot td{padding:14px 12px;border-top:2px solid #0a1128;font-weight:800;font-size:15px;text-align:right}
tfoot td:first-child{text-align:left;font-weight:600;color:#52525b;font-size:12px}
.mono{font-family:ui-monospace,monospace;font-size:11px}.foot{margin-top:20px;display:flex;justify-content:space-between;gap:16px;font-size:11px;color:#71717a}
.actions{padding:0 32px 28px}button{background:linear-gradient(135deg,#fde68a,#f59e0b);color:#0a1128;border:0;border-radius:999px;padding:12px 22px;font-weight:800;cursor:pointer;font-size:13px}
@media print{body{background:#fff}.sheet{box-shadow:none;margin:0;max-width:none;border-radius:0}button{display:none}@page{margin:12mm}}</style></head><body>
<div class="sheet"><div class="banner"><div class="brand"><div class="seal">Q</div><div><h1>QTNXT</h1><p>Academy &bull; Learn forward</p></div></div>
<div class="title"><h2>Tax Invoice</h2><span class="pill">PAID</span></div>
<div class="meta"><div><span>Invoice no</span><strong>${v.invoiceNo}</strong></div><div><span>Issued on</span><strong>${v.dateLabel}</strong></div><div><span>Payment ID</span><strong>${v.paymentId}</strong></div></div></div>
<div class="body"><div class="card"><span>Billed to</span><strong>${v.billedTo}</strong><span style="margin-top:6px">${v.email}</span></div>
<table><thead><tr><th>Course</th><th>Order ID</th><th style="text-align:right">Amount</th></tr></thead>
<tbody><tr><td><strong>${v.courseTitle}</strong></td><td class="mono">${v.orderId}</td><td><strong>${v.amountLabel}</strong></td></tr></tbody>
<tfoot><tr><td>Total paid (incl. taxes)</td><td colspan="2">${v.amountLabel}</td></tr></tfoot></table>
<div class="foot"><span>Thank you for learning with QTNXT.<br>Questions? support@qtnxt.com</span><span style="text-align:right">Verified receipt<br><strong class="mono">${v.invoiceNo}</strong></span></div></div>
<div class="actions"><button onclick="window.print()">Print / Save as PDF</button></div></div></body></html>`;
}
