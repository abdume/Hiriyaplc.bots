import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  Calendar, 
  ChevronRight, 
  Download, 
  Folder, 
  Printer, 
  Send, 
  Share2, 
  TrendingUp, 
  Users, 
  X, 
  DollarSign, 
  CheckCircle2, 
  AlertCircle, 
  ArrowUpRight, 
  Copy, 
  Filter,
  Layers,
  Sparkles,
  Clock,
  ChevronDown,
  FileDown,
  FileText,
  FileSpreadsheet
} from 'lucide-react';
import { BotTable, CustomerReportItem, ReportPeriod } from '../types';
import { downloadCsvReport, downloadPdfReportFile } from '../utils/reportExport';

interface ReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
  bots: BotTable[];
  onSendTelegramReminder?: (customerName: string, remainingBalance: number, quality: string) => void;
}

export const ReportsModal: React.FC<ReportsModalProps> = ({
  isOpen,
  onClose,
  bots,
  onSendTelegramReminder
}) => {
  if (!isOpen) return null;

  const [period, setPeriod] = useState<ReportPeriod>('daily');
  const [selectedFolder, setSelectedFolder] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'remaining'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);

  // Extract all folders from bots
  const folders = useMemo(() => {
    const list = new Set<string>();
    bots.forEach(b => {
      if (b.folder) list.add(b.folder);
      else list.add('General');
    });
    return Array.from(list);
  }, [bots]);

  // Normalize row data into unified CustomerReportItem format
  const allCustomerItems: CustomerReportItem[] = useMemo(() => {
    const items: CustomerReportItem[] = [];

    bots.forEach(bot => {
      const folderName = bot.folder || 'General';

      // Find column mappings
      const cnameCol = bot.columns.find(c => 
        c.name.toLowerCase().includes('customer') || 
        c.name.toLowerCase().includes('user') || 
        c.name.toLowerCase().includes('buyer') ||
        c.id === 'col_cname' || c.id === 'col_user' || c.id === 'col_buyer'
      );
      const qualityCol = bot.columns.find(c => 
        c.name.toLowerCase().includes('quality') || 
        c.name.toLowerCase().includes('quantity') || 
        c.name.toLowerCase().includes('item') ||
        c.name.toLowerCase().includes('pair') ||
        c.id === 'col_quality' || c.id === 'col_item'
      );
      const totalCol = bot.columns.find(c => 
        c.name.toLowerCase().includes('total') || 
        c.id === 'col_total'
      );
      const paidCol = bot.columns.find(c => 
        c.name.toLowerCase().includes('paid') || 
        c.name.toLowerCase().includes('amount') ||
        c.id === 'col_paid' || c.id === 'col_amount'
      );
      const balanceCol = bot.columns.find(c => 
        c.name.toLowerCase().includes('balance') || 
        c.id === 'col_balance'
      );
      const statusCol = bot.columns.find(c => 
        c.name.toLowerCase().includes('status') || 
        c.name.toLowerCase().includes('fulfillment') ||
        c.name.toLowerCase().includes('state')
      );
      const dateCol = bot.columns.find(c => 
        c.type === 'date' || 
        c.name.toLowerCase().includes('date') || 
        c.name.toLowerCase().includes('time')
      );

      bot.rows.forEach(row => {
        const cname = cnameCol ? String(row[cnameCol.id] || '') : 'Unknown Customer';
        const quality = qualityCol ? String(row[qualityCol.id] || '') : 'Standard Item';

        // Parse numeric values
        let totalVal = 0;
        let paidVal = 0;
        let balanceVal = 0;

        if (totalCol && row[totalCol.id] !== undefined) {
          totalVal = parseFloat(String(row[totalCol.id]).replace(/[^0-9.-]/g, '')) || 0;
        }
        if (paidCol && row[paidCol.id] !== undefined) {
          paidVal = parseFloat(String(row[paidCol.id]).replace(/[^0-9.-]/g, '')) || 0;
        }

        if (balanceCol && row[balanceCol.id] !== undefined) {
          balanceVal = parseFloat(String(row[balanceCol.id]).replace(/[^0-9.-]/g, '')) || 0;
        } else {
          // If total exists and paid exists, calculate remaining balance
          if (totalVal > 0) {
            balanceVal = Math.max(0, totalVal - paidVal);
          } else {
            // If only paid amount was tracked (e.g. sales tracker)
            totalVal = paidVal;
            balanceVal = 0;
          }
        }

        // Determine status
        let status: 'Paid in Full' | 'Partial' | 'Unpaid' = 'Paid in Full';
        if (balanceVal > 0 && paidVal > 0) status = 'Partial';
        else if (balanceVal > 0 && paidVal === 0) status = 'Unpaid';
        else status = 'Paid in Full';

        const dateStr = dateCol && row[dateCol.id] ? String(row[dateCol.id]) : '2026-11-12 10:00';

        items.push({
          id: row.id,
          botId: bot.id,
          botName: bot.name,
          folder: folderName,
          customerName: cname,
          qualityOrQuantity: quality,
          totalAmount: totalVal,
          paidAmount: paidVal,
          remainingBalance: balanceVal,
          status,
          date: dateStr
        });
      });
    });

    return items;
  }, [bots]);

  // Filter items by Period (Daily, Weekly, Monthly)
  const periodFilteredItems = useMemo(() => {
    // Current simulated date reference: 2026-11-12
    const now = new Date('2026-11-12T12:00:00');

    return allCustomerItems.filter(item => {
      // Folder filter
      if (selectedFolder !== 'all' && item.folder !== selectedFolder) {
        return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches = item.customerName.toLowerCase().includes(q) ||
                        item.qualityOrQuantity.toLowerCase().includes(q) ||
                        item.folder.toLowerCase().includes(q);
        if (!matches) return false;
      }

      // Status filter
      if (statusFilter === 'paid' && item.remainingBalance > 0) return false;
      if (statusFilter === 'remaining' && item.remainingBalance <= 0) return false;

      // Period filter logic
      try {
        const itemDate = new Date(item.date);
        if (isNaN(itemDate.getTime())) return true; // keep if date unparseable

        if (period === 'daily') {
          // Items from today (2026-11-12)
          return itemDate.toISOString().slice(0, 10) === '2026-11-12' || item.date.includes('2026-11-12');
        } else if (period === 'weekly') {
          // Items from this week (last 7 days from 2026-11-12)
          const diffDays = (now.getTime() - itemDate.getTime()) / (1000 * 3600 * 24);
          return diffDays >= -1 && diffDays <= 7;
        } else if (period === 'monthly') {
          // Items from this month (November 2026)
          return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
        }
      } catch {
        return true;
      }
      return true;
    });
  }, [allCustomerItems, period, selectedFolder, statusFilter, searchQuery]);

  // Aggregate KPI metrics
  const metrics = useMemo(() => {
    let totalInvoiced = 0;
    let totalPaid = 0;
    let totalRemaining = 0;
    let paidCustomerCount = 0;
    let balanceCustomerCount = 0;

    periodFilteredItems.forEach(item => {
      totalInvoiced += item.totalAmount;
      totalPaid += item.paidAmount;
      totalRemaining += item.remainingBalance;
      if (item.remainingBalance <= 0.01) {
        paidCustomerCount++;
      } else {
        balanceCustomerCount++;
      }
    });

    const collectionRate = totalInvoiced > 0 ? (totalPaid / totalInvoiced) * 100 : 100;

    return {
      totalInvoiced,
      totalPaid,
      totalRemaining,
      paidCustomerCount,
      balanceCustomerCount,
      totalCustomers: periodFilteredItems.length,
      collectionRate
    };
  }, [periodFilteredItems]);

  // Trend bars for period
  const trendData = useMemo(() => {
    if (period === 'daily') {
      return [
        { label: '08:00 AM', paid: 800, balance: 450 },
        { label: '10:00 AM', paid: 450, balance: 0 },
        { label: '12:00 PM', paid: 620, balance: 120 },
        { label: '03:00 PM', paid: 350, balance: 0 },
        { label: '06:00 PM', paid: 920, balance: 200 }
      ];
    } else if (period === 'weekly') {
      return [
        { label: 'Mon', paid: 620, balance: 0 },
        { label: 'Tue', paid: 920, balance: 420 },
        { label: 'Wed', paid: 875, balance: 0 },
        { label: 'Thu', paid: 1250, balance: 450 },
        { label: 'Fri', paid: 750, balance: 750 },
        { label: 'Sat', paid: 450, balance: 0 },
        { label: 'Sun', paid: 280, balance: 220 }
      ];
    } else {
      return [
        { label: 'Week 1', paid: 1420, balance: 220 },
        { label: 'Week 2', paid: 1850, balance: 750 },
        { label: 'Week 3', paid: 1795, balance: 420 },
        { label: 'Week 4', paid: 1250, balance: 450 }
      ];
    }
  }, [period]);

  const handleCopySummary = () => {
    const text = `📊 *TableBot ${period.toUpperCase()} REPORT*
📁 Folder: ${selectedFolder === 'all' ? 'All Folders' : selectedFolder}
━━━━━━━━━━━━━━━━━━
💰 Total Invoiced: $${metrics.totalInvoiced.toFixed(2)}
✅ Paid Amount: $${metrics.totalPaid.toFixed(2)} (${metrics.collectionRate.toFixed(1)}%)
⚠️ Remaining Balance: $${metrics.totalRemaining.toFixed(2)}
👥 Total Customers: ${metrics.totalCustomers} (${metrics.paidCustomerCount} settled, ${metrics.balanceCustomerCount} pending)
━━━━━━━━━━━━━━━━━━
Top Customer Balances:
${periodFilteredItems.filter(i => i.remainingBalance > 0).slice(0, 5).map(i => `• ${i.customerName}: $${i.remainingBalance.toFixed(2)} (${i.qualityOrQuantity})`).join('\n') || 'All accounts fully settled!'}
`;
    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  const handleDownloadCsv = () => {
    downloadCsvReport(period, selectedFolder, periodFilteredItems, metrics);
  };

  const handleDownloadPdf = () => {
    downloadPdfReportFile(period, selectedFolder, periodFilteredItems, metrics);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200 print-full-report">
        
        {/* Top Header: Deep Royal Blue #0D47A1 */}
        <header className="bg-[#0D47A1] text-white px-5 py-4 flex items-center justify-between shadow-sm no-print">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shadow-inner">
              <BarChart3 size={22} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-base sm:text-lg tracking-tight">
                  Financial & Customer Reports
                </h2>
                <span className="text-[11px] font-semibold bg-blue-500/40 text-blue-100 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  {period}
                </span>
              </div>
              <p className="text-xs text-blue-100/80">
                Paid Customers • Quality & Quantity • Amounts • Remaining Balance
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Download PDF/CSV Report Primary Button with Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition text-xs font-bold flex items-center gap-1.5 shadow-xs active:scale-95 border border-emerald-400/40"
                title="Download PDF or CSV Report of current view"
              >
                <FileDown size={15} className="text-white" />
                <span>Download PDF/CSV Report</span>
                <ChevronDown size={13} className={`transition-transform duration-200 ${showDownloadMenu ? 'rotate-180' : ''}`} />
              </button>

              {showDownloadMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-40 bg-transparent" 
                    onClick={() => setShowDownloadMenu(false)} 
                  />
                  <div 
                    className="absolute right-0 top-10 w-72 bg-white rounded-xl shadow-2xl border border-gray-200 py-1.5 z-50 text-gray-800 animate-in fade-in zoom-in-95 duration-150"
                    onClick={(e) => e.stopPropagation()}
                  >
                  <div className="px-3 py-1.5 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Export Current {period.toUpperCase()} View
                  </div>
                  
                  <button
                    onClick={() => {
                      setShowDownloadMenu(false);
                      handleDownloadPdf();
                    }}
                    className="w-full px-3.5 py-2.5 text-xs font-semibold text-gray-700 hover:bg-red-50 hover:text-red-900 flex items-center gap-3 text-left transition"
                  >
                    <div className="w-7 h-7 rounded-md bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                      <FileText size={16} />
                    </div>
                    <div>
                      <div className="font-bold text-gray-800">Download PDF Report</div>
                      <div className="text-[10px] text-gray-500">Executive summary & customer ledger</div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setShowDownloadMenu(false);
                      handleDownloadCsv();
                    }}
                    className="w-full px-3.5 py-2.5 text-xs font-semibold text-gray-700 hover:bg-emerald-50 hover:text-emerald-900 flex items-center gap-3 text-left transition"
                  >
                    <div className="w-7 h-7 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      <FileSpreadsheet size={16} />
                    </div>
                    <div>
                      <div className="font-bold text-gray-800">Download CSV Report</div>
                      <div className="text-[10px] text-gray-500">Spreadsheet data with column sums</div>
                    </div>
                  </button>

                  <div className="border-t border-gray-100 my-1" />

                  <button
                    onClick={() => {
                      setShowDownloadMenu(false);
                      handlePrint();
                    }}
                    className="w-full px-3.5 py-2 text-xs font-medium text-gray-700 hover:bg-blue-50 hover:text-[#0D47A1] flex items-center gap-3 text-left transition"
                  >
                    <Printer size={15} className="text-[#0D47A1]" />
                    <span>Print / Save as PDF (Direct)</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowDownloadMenu(false);
                      handleCopySummary();
                    }}
                    className="w-full px-3.5 py-2 text-xs font-medium text-gray-700 hover:bg-blue-50 hover:text-[#0D47A1] flex items-center gap-3 text-left transition"
                  >
                    <Copy size={15} className="text-gray-500" />
                    <span>Copy Summary for Telegram / Chat</span>
                  </button>
                </div>
              </>
            )}
          </div>

            <button
              onClick={handleCopySummary}
              className="p-1.5 rounded-lg text-white/90 hover:text-white hover:bg-white/10 transition text-xs font-semibold flex items-center gap-1"
              title="Copy formatted Telegram report text"
            >
              {copiedSummary ? <CheckCircle2 size={16} className="text-emerald-400" /> : <Copy size={16} />}
              <span className="hidden sm:inline">{copiedSummary ? 'Copied!' : 'Copy'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition ml-1"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>
        </header>

        {/* Sub-Header Toolbar: Period Switcher & Folder Selector */}
        <div className="bg-[#1565C0] px-5 py-2.5 flex flex-wrap items-center justify-between gap-3 text-white border-t border-blue-400/30">
          
          {/* Daily / Weekly / Monthly Switcher */}
          <div className="flex bg-blue-900/60 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setPeriod('daily')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                period === 'daily' ? 'bg-white text-[#0D47A1] shadow-xs' : 'text-blue-100 hover:text-white'
              }`}
            >
              <Clock size={13} />
              <span>Daily Report</span>
            </button>
            <button
              type="button"
              onClick={() => setPeriod('weekly')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                period === 'weekly' ? 'bg-white text-[#0D47A1] shadow-xs' : 'text-blue-100 hover:text-white'
              }`}
            >
              <Calendar size={13} />
              <span>Weekly Report</span>
            </button>
            <button
              type="button"
              onClick={() => setPeriod('monthly')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                period === 'monthly' ? 'bg-white text-[#0D47A1] shadow-xs' : 'text-blue-100 hover:text-white'
              }`}
            >
              <TrendingUp size={13} />
              <span>Monthly Report</span>
            </button>
          </div>

          {/* Folder & Status Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Folder Dropdown */}
            <div className="flex items-center gap-1.5 bg-blue-900/50 px-2.5 py-1 rounded-xl text-xs">
              <Folder size={14} className="text-amber-300" />
              <span className="text-blue-200 font-medium">Folder:</span>
              <select
                value={selectedFolder}
                onChange={(e) => setSelectedFolder(e.target.value)}
                className="bg-transparent text-white font-bold outline-none cursor-pointer text-xs"
              >
                <option value="all" className="text-gray-900">All Folders ({folders.length})</option>
                {folders.map(f => (
                  <option key={f} value={f} className="text-gray-900">{f}</option>
                ))}
              </select>
            </div>

            {/* Payment Filter */}
            <div className="flex items-center gap-1.5 bg-blue-900/50 px-2.5 py-1 rounded-xl text-xs">
              <Filter size={14} className="text-emerald-300" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="bg-transparent text-white font-bold outline-none cursor-pointer text-xs"
              >
                <option value="all" className="text-gray-900">All Statuses</option>
                <option value="paid" className="text-gray-900">Fully Paid</option>
                <option value="remaining" className="text-gray-900">Remaining Balance Due</option>
              </select>
            </div>
          </div>
        </div>

        {/* Scrollable Report Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-[#F4F6F9] text-gray-800">
          
          {/* Dedicated Download PDF/CSV Summary Banner */}
          <div className="bg-white rounded-2xl p-4 border border-emerald-200/80 bg-gradient-to-r from-emerald-50/60 via-white to-blue-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 mat-shadow-1 no-print">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <FileDown size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-gray-900">
                    Download {period.toUpperCase()} Summary Report
                  </span>
                  <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full uppercase">
                    Ready for Sharing
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  Export complete breakdown of {periodFilteredItems.length} customers, items, collected amounts, and remaining balances.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleDownloadPdf}
                className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition active:scale-95"
                title="Download formatted PDF report document"
              >
                <FileText size={15} />
                <span>Download PDF</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadCsv}
                className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition active:scale-95"
                title="Download CSV spreadsheet file"
              >
                <FileSpreadsheet size={15} />
                <span>Download CSV</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#0D47A1] font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 border border-blue-200"
                title="Print or Save to PDF via Browser"
              >
                <Printer size={15} />
                <span className="hidden md:inline">Print</span>
              </button>
            </div>
          </div>

          {/* Executive KPI Cards Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Total Invoiced */}
            <div className="bg-white rounded-xl p-4 border border-gray-200 mat-shadow-1 flex flex-col justify-between">
              <div className="flex items-center justify-between text-gray-500 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider">Total Invoiced</span>
                <DollarSign size={16} className="text-blue-600" />
              </div>
              <div className="text-xl sm:text-2xl font-bold font-mono text-gray-900">
                ${metrics.totalInvoiced.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-[11px] text-gray-500 mt-1 flex items-center gap-1">
                <Users size={12} />
                <span>{metrics.totalCustomers} orders / entries</span>
              </div>
            </div>

            {/* Total Paid Amount */}
            <div className="bg-white rounded-xl p-4 border border-gray-200 mat-shadow-1 flex flex-col justify-between">
              <div className="flex items-center justify-between text-gray-500 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider">Paid Amount</span>
                <CheckCircle2 size={16} className="text-emerald-600" />
              </div>
              <div className="text-xl sm:text-2xl font-bold font-mono text-[#2E7D32]">
                ${metrics.totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="mt-2">
                <div className="flex justify-between text-[10px] text-gray-500 font-semibold mb-0.5">
                  <span>Collection Progress</span>
                  <span>{metrics.collectionRate.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-[#2E7D32] h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, metrics.collectionRate)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Total Remaining Balance (Rominbalce) */}
            <div className="bg-white rounded-xl p-4 border border-orange-200 mat-shadow-1 flex flex-col justify-between bg-orange-50/20">
              <div className="flex items-center justify-between text-gray-500 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-[#E65100]">Remaining Balance</span>
                <AlertCircle size={16} className="text-[#E65100]" />
              </div>
              <div className="text-xl sm:text-2xl font-bold font-mono text-[#E65100]">
                ${metrics.totalRemaining.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-[11px] text-orange-800 font-medium mt-1 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                <span>{metrics.balanceCustomerCount} customers owe balance</span>
              </div>
            </div>

            {/* Fully Settled Customers */}
            <div className="bg-white rounded-xl p-4 border border-gray-200 mat-shadow-1 flex flex-col justify-between">
              <div className="flex items-center justify-between text-gray-500 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider">Settled Accounts</span>
                <Sparkles size={16} className="text-amber-500" />
              </div>
              <div className="text-xl sm:text-2xl font-bold font-mono text-[#0D47A1]">
                {metrics.paidCustomerCount} <span className="text-xs text-gray-400 font-normal">/ {metrics.totalCustomers}</span>
              </div>
              <div className="text-[11px] text-emerald-700 font-semibold mt-1 flex items-center gap-1">
                <span>{((metrics.paidCustomerCount / (metrics.totalCustomers || 1)) * 100).toFixed(0)}% fully settled</span>
              </div>
            </div>
          </div>

          {/* Visual Trend Chart: Paid vs Remaining Balance Comparison */}
          <div className="bg-white rounded-2xl p-4.5 border border-gray-200 mat-shadow-1">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-sm text-gray-800">
                  {period === 'daily' ? 'Today\'s Hourly Invoicing & Collections' : period === 'weekly' ? 'Weekly Collection Velocity (Mon-Sun)' : 'Monthly Revenue & Balance Breakdown'}
                </h3>
                <p className="text-xs text-gray-500">
                  Comparing Paid Amount vs Remaining Balance over time
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs font-semibold">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-[#2E7D32]" />
                  <span>Paid</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-[#E65100]" />
                  <span>Remaining</span>
                </div>
              </div>
            </div>

            {/* Bar Chart Display */}
            <div className="flex items-end justify-between gap-2 h-36 pt-4 pb-2 border-b border-gray-100">
              {trendData.map((d, i) => {
                const totalBar = d.paid + d.balance;
                const maxVal = Math.max(...trendData.map(t => t.paid + t.balance), 1);
                const paidHeight = Math.round((d.paid / maxVal) * 100);
                const balanceHeight = Math.round((d.balance / maxVal) * 100);

                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1.5 group">
                    <div className="w-full max-w-[42px] flex flex-col justify-end h-28 bg-gray-50 rounded-t overflow-hidden relative">
                      {/* Tooltip on hover */}
                      <div className="opacity-0 group-hover:opacity-100 transition absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] py-0.5 px-1.5 rounded pointer-events-none whitespace-nowrap z-10">
                        Paid: ${d.paid} | Due: ${d.balance}
                      </div>
                      <div
                        className="w-full bg-[#E65100] transition-all duration-300"
                        style={{ height: `${balanceHeight}%` }}
                      />
                      <div
                        className="w-full bg-[#2E7D32] transition-all duration-300"
                        style={{ height: `${paidHeight}%` }}
                      />
                    </div>
                    <span className="text-[11px] font-semibold text-gray-500 truncate">{d.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Paid Customers Detail Ledger Table */}
          <div className="bg-white rounded-2xl border border-gray-200 mat-shadow-1 overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50/70">
              <div>
                <h3 className="font-bold text-sm text-[#0D47A1] flex items-center gap-2">
                  <Users size={18} />
                  <span>Customer Ledger & Remaining Balance (Rominbalce)</span>
                </h3>
                <span className="text-xs text-gray-500">
                  Showing {periodFilteredItems.length} records matching current filter
                </span>
              </div>

              {/* Live Search inside report */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search customer or item..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="px-3 py-1.5 pl-8 rounded-lg border border-gray-300 text-xs bg-white focus:border-[#1976D2] outline-none w-56"
                />
                <span className="absolute left-2.5 top-2 text-gray-400 text-xs">🔍</span>
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1.5 text-xs text-gray-400">✕</button>
                )}
              </div>
            </div>

            {periodFilteredItems.length === 0 ? (
              <div className="p-10 text-center text-gray-400 text-xs">
                No customer ledger records found for this period and filter.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-gray-100/80 text-gray-600 font-bold border-b border-gray-200 select-none">
                      <th className="py-3 px-3 w-10 text-center">#</th>
                      <th className="py-3 px-3">Paid Customer Name</th>
                      <th className="py-3 px-3">Quality / Quantity</th>
                      <th className="py-3 px-3 text-right">Total Amount</th>
                      <th className="py-3 px-3 text-right">Paid Amount</th>
                      <th className="py-3 px-3 text-right text-[#E65100]">Remaining Balance</th>
                      <th className="py-3 px-3 text-center">Status</th>
                      <th className="py-3 px-3">Date</th>
                      <th className="py-3 px-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {periodFilteredItems.map((item, idx) => {
                      const hasBalance = item.remainingBalance > 0.01;

                      return (
                        <tr 
                          key={item.id}
                          className="hover:bg-blue-50/40 transition group"
                        >
                          <td className="py-2.5 px-3 text-center text-gray-400 font-mono font-medium">
                            {idx + 1}
                          </td>

                          {/* Customer Name */}
                          <td className="py-2.5 px-3">
                            <div className="font-bold text-gray-900 group-hover:text-[#0D47A1] transition">
                              {item.customerName}
                            </div>
                            <span className="text-[10px] text-gray-400 font-mono">
                              Folder: {item.folder}
                            </span>
                          </td>

                          {/* Quality / Quantity */}
                          <td className="py-2.5 px-3 text-gray-700 font-medium">
                            <span className="bg-gray-100 px-2 py-0.5 rounded-md text-gray-800">
                              {item.qualityOrQuantity}
                            </span>
                          </td>

                          {/* Total Amount */}
                          <td className="py-2.5 px-3 text-right font-mono font-semibold text-gray-800">
                            ${item.totalAmount.toFixed(2)}
                          </td>

                          {/* Paid Amount */}
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-[#2E7D32]">
                            ${item.paidAmount.toFixed(2)}
                          </td>

                          {/* Remaining Balance (Rominbalce) */}
                          <td className="py-2.5 px-3 text-right font-mono font-bold">
                            {hasBalance ? (
                              <span className="text-[#E65100] bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                                ${item.remainingBalance.toFixed(2)}
                              </span>
                            ) : (
                              <span className="text-[#2E7D32] flex items-center justify-end gap-1 font-semibold">
                                <CheckCircle2 size={13} />
                                $0.00
                              </span>
                            )}
                          </td>

                          {/* Status */}
                          <td className="py-2.5 px-3 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              !hasBalance 
                                ? 'bg-emerald-100 text-emerald-800' 
                                : item.paidAmount > 0 
                                ? 'bg-amber-100 text-amber-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {item.status}
                            </span>
                          </td>

                          {/* Date */}
                          <td className="py-2.5 px-3 text-gray-500 text-[11px] font-mono whitespace-nowrap">
                            {item.date}
                          </td>

                          {/* Action */}
                          <td className="py-2.5 px-3 text-center">
                            {hasBalance ? (
                              <button
                                onClick={() => {
                                  if (onSendTelegramReminder) {
                                    onSendTelegramReminder(item.customerName, item.remainingBalance, item.qualityOrQuantity);
                                  } else {
                                    const msg = `📢 Payment Reminder for ${item.customerName}: Remaining balance $${item.remainingBalance.toFixed(2)} on order ${item.qualityOrQuantity}`;
                                    navigator.clipboard.writeText(msg);
                                    alert(`Reminder copied to clipboard:\n\n${msg}`);
                                  }
                                }}
                                className="px-2.5 py-1 rounded bg-[#1976D2] hover:bg-[#0D47A1] text-white text-[10px] font-bold transition flex items-center gap-1 mx-auto shadow-xs active:scale-95"
                                title="Send Telegram Payment Reminder"
                              >
                                <Send size={11} />
                                <span>Remind</span>
                              </button>
                            ) : (
                              <span className="text-gray-300 text-xs">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Table Footer Summary */}
            <div className="bg-[#0D47A1] text-white px-4 py-3 flex flex-wrap items-center justify-between text-xs font-semibold gap-3">
              <div className="flex items-center gap-2">
                <span className="text-amber-300 font-bold text-sm">Σ Period Totals:</span>
                <span className="text-blue-100">({periodFilteredItems.length} customers)</span>
              </div>

              <div className="flex items-center gap-6 divide-x divide-blue-400/30">
                <div>
                  <span className="text-blue-200 text-[10px] uppercase block">Total Sales</span>
                  <span className="font-mono text-white text-sm font-bold">
                    ${metrics.totalInvoiced.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="pl-6">
                  <span className="text-emerald-300 text-[10px] uppercase block">Paid Collected</span>
                  <span className="font-mono text-emerald-300 text-sm font-bold">
                    ${metrics.totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="pl-6">
                  <span className="text-amber-300 text-[10px] uppercase block">Remaining Balance</span>
                  <span className="font-mono text-amber-300 text-sm font-bold">
                    ${metrics.totalRemaining.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
