import { CustomerReportItem, ReportPeriod } from '../types';

export interface ReportSummaryMetrics {
  totalInvoiced: number;
  totalPaid: number;
  totalRemaining: number;
  paidCustomerCount: number;
  balanceCustomerCount: number;
  totalCustomers: number;
  collectionRate: number;
}

export function downloadCsvReport(
  period: ReportPeriod,
  folder: string,
  items: CustomerReportItem[],
  metrics: ReportSummaryMetrics
) {
  const dateStr = new Date().toISOString().slice(0, 10);
  const timeStr = new Date().toLocaleTimeString();

  const lines: string[] = [];

  // Metadata headers
  lines.push(`"TableBot - Executive Financial & Customer Report"`);
  lines.push(`"Period:","${period.toUpperCase()} REPORT"`);
  lines.push(`"Generated:","${dateStr} ${timeStr}"`);
  lines.push(`"Folder:","${folder === 'all' ? 'All Folders' : folder}"`);
  lines.push(`"Total Invoiced:","$${metrics.totalInvoiced.toFixed(2)}"`);
  lines.push(`"Total Paid:","$${metrics.totalPaid.toFixed(2)}"`);
  lines.push(`"Total Remaining Balance:","$${metrics.totalRemaining.toFixed(2)}"`);
  lines.push(`"Collection Rate:","${metrics.collectionRate.toFixed(1)}%"`);
  lines.push(`"Customers:","${metrics.totalCustomers} total (${metrics.paidCustomerCount} settled, ${metrics.balanceCustomerCount} with balance due)"`);
  lines.push(''); // blank row

  // Table header
  const headers = [
    '#',
    'Customer Name',
    'Folder',
    'Quality / Quantity',
    'Total Amount ($)',
    'Paid Amount ($)',
    'Remaining Balance ($)',
    'Payment Status',
    'Date / Time'
  ];
  lines.push(headers.map(h => `"${h}"`).join(','));

  // Data rows
  items.forEach((item, index) => {
    const row = [
      index + 1,
      `"${item.customerName.replace(/"/g, '""')}"`,
      `"${item.folder}"`,
      `"${item.qualityOrQuantity.replace(/"/g, '""')}"`,
      item.totalAmount.toFixed(2),
      item.paidAmount.toFixed(2),
      item.remainingBalance.toFixed(2),
      `"${item.status}"`,
      `"${item.date}"`
    ];
    lines.push(row.join(','));
  });

  // Summary row at bottom
  lines.push('');
  lines.push([
    '"TOTALS"',
    '""',
    '""',
    `"${items.length} records"`,
    `"${metrics.totalInvoiced.toFixed(2)}"`,
    `"${metrics.totalPaid.toFixed(2)}"`,
    `"${metrics.totalRemaining.toFixed(2)}"`,
    '""',
    '""'
  ].join(','));

  const csvContent = lines.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `TableBot_${period}_Report_${dateStr}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function generatePrintablePdfHtml(
  period: ReportPeriod,
  folder: string,
  items: CustomerReportItem[],
  metrics: ReportSummaryMetrics
): string {
  const dateStr = new Date().toLocaleDateString(undefined, { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>TableBot ${period.toUpperCase()} Report - ${dateStr}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #1E293B;
      background: #FFFFFF;
      padding: 32px;
      line-height: 1.4;
    }
    .header {
      border-bottom: 2px solid #0D47A1;
      padding-bottom: 16px;
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .title-group h1 {
      font-size: 24px;
      font-weight: 800;
      color: #0D47A1;
      margin-bottom: 4px;
    }
    .badge {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      background: #E3F2FD;
      color: #0D47A1;
      margin-bottom: 6px;
    }
    .meta-text {
      font-size: 12px;
      color: #64748B;
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-bottom: 24px;
    }
    .kpi-card {
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 8px;
      padding: 12px 14px;
    }
    .kpi-label {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      color: #64748B;
      margin-bottom: 4px;
    }
    .kpi-value {
      font-size: 20px;
      font-weight: 800;
      font-family: monospace;
      color: #0F172A;
    }
    .kpi-sub {
      font-size: 10px;
      color: #94A3B8;
      margin-top: 2px;
    }
    .amount-paid { color: #2E7D32; }
    .amount-due { color: #E65100; }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
      margin-top: 16px;
    }
    th, td {
      border: 1px solid #CBD5E1;
      padding: 8px 10px;
      text-align: left;
    }
    th {
      background: #F1F5F9;
      font-weight: 700;
      color: #334155;
    }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .status-badge {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 700;
    }
    .status-paid { background: #E8F5E9; color: #2E7D32; }
    .status-partial { background: #FFF3E0; color: #E65100; }
    .footer {
      margin-top: 32px;
      padding-top: 12px;
      border-top: 1px solid #E2E8F0;
      font-size: 10px;
      color: #94A3B8;
      display: flex;
      justify-content: space-between;
    }
    @media print {
      body { padding: 16px; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body onload="window.print()">
  <div class="no-print" style="background:#0D47A1; color:white; padding:10px 16px; border-radius:8px; margin-bottom:20px; display:flex; justify-content:space-between; align-items:center;">
    <span>📄 <strong>Print to PDF Preview:</strong> Click Print or Save as PDF in the browser dialog.</span>
    <button onclick="window.print()" style="background:#FFFFFF; color:#0D47A1; border:none; padding:6px 14px; border-radius:6px; font-weight:700; cursor:pointer;">Print / Save PDF</button>
  </div>

  <div class="header">
    <div class="title-group">
      <span class="badge">TableBot Executive Report</span>
      <h1>${period.toUpperCase()} FINANCIAL & CUSTOMER REPORT</h1>
      <p class="meta-text">Folder: <strong>${folder === 'all' ? 'All Folders' : folder}</strong> • Generated on ${dateStr} at ${timeStr}</p>
    </div>
    <div style="text-align: right;">
      <div style="font-weight: 800; font-size: 16px; color: #0D47A1;">TableBot Cloud Database</div>
      <div class="meta-text">Multi-Device Supabase Sync</div>
    </div>
  </div>

  <div class="kpi-grid">
    <div class="kpi-card">
      <div class="kpi-label">Total Invoiced</div>
      <div class="kpi-value">$${metrics.totalInvoiced.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
      <div class="kpi-sub">${metrics.totalCustomers} customer entries</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Paid Amount</div>
      <div class="kpi-value amount-paid">$${metrics.totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
      <div class="kpi-sub">${metrics.collectionRate.toFixed(1)}% collection rate</div>
    </div>
    <div class="kpi-card" style="border-color: #FFCC80; background: #FFF8E1;">
      <div class="kpi-label" style="color: #E65100;">Remaining Balance</div>
      <div class="kpi-value amount-due">$${metrics.totalRemaining.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
      <div class="kpi-sub" style="color: #E65100;">${metrics.balanceCustomerCount} customers pending</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Settled Accounts</div>
      <div class="kpi-value">${metrics.paidCustomerCount} <span style="font-size:12px; color:#94A3B8;">/ ${metrics.totalCustomers}</span></div>
      <div class="kpi-sub">${((metrics.paidCustomerCount / (metrics.totalCustomers || 1)) * 100).toFixed(0)}% fully settled</div>
    </div>
  </div>

  <h3 style="font-size: 13px; font-weight: 700; color: #0D47A1; margin-bottom: 8px;">Customer Ledger & Payment Breakdown</h3>
  <table>
    <thead>
      <tr>
        <th style="width: 30px; text-align: center;">#</th>
        <th>Customer Name</th>
        <th>Folder</th>
        <th>Quality / Quantity</th>
        <th class="text-right">Total ($)</th>
        <th class="text-right">Paid ($)</th>
        <th class="text-right">Balance ($)</th>
        <th class="text-center">Status</th>
        <th>Date</th>
      </tr>
    </thead>
    <tbody>
      ${items.map((item, idx) => `
        <tr>
          <td class="text-center">${idx + 1}</td>
          <td><strong>${item.customerName}</strong></td>
          <td>${item.folder}</td>
          <td>${item.qualityOrQuantity}</td>
          <td class="text-right">$${item.totalAmount.toFixed(2)}</td>
          <td class="text-right amount-paid">$${item.paidAmount.toFixed(2)}</td>
          <td class="text-right ${item.remainingBalance > 0 ? 'amount-due' : ''}" style="font-weight: 700;">$${item.remainingBalance.toFixed(2)}</td>
          <td class="text-center">
            <span class="status-badge ${item.remainingBalance <= 0 ? 'status-paid' : 'status-partial'}">
              ${item.status}
            </span>
          </td>
          <td>${item.date}</td>
        </tr>
      `).join('')}
    </tbody>
    <tfoot>
      <tr style="background: #F1F5F9; font-weight: 800;">
        <td colspan="4" style="text-align: right;">TOTALS:</td>
        <td class="text-right">$${metrics.totalInvoiced.toFixed(2)}</td>
        <td class="text-right amount-paid">$${metrics.totalPaid.toFixed(2)}</td>
        <td class="text-right amount-due">$${metrics.totalRemaining.toFixed(2)}</td>
        <td colspan="2"></td>
      </tr>
    </tfoot>
  </table>

  <div class="footer">
    <span>TableBot Management System • Official Customer Ledger Report</span>
    <span>Page 1 of 1</span>
  </div>
</body>
</html>`;
}

export function downloadPdfReportFile(
  period: ReportPeriod,
  folder: string,
  items: CustomerReportItem[],
  metrics: ReportSummaryMetrics
) {
  const htmlContent = generatePrintablePdfHtml(period, folder, items, metrics);
  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `TableBot_${period}_Report_Summary_${new Date().toISOString().slice(0, 10)}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
