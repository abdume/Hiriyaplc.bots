import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Search, 
  Plus, 
  SlidersHorizontal, 
  Filter, 
  Send, 
  Share2, 
  MoreHorizontal, 
  Trash2, 
  Bot, 
  Sparkles,
  PieChart,
  RefreshCw,
  Check,
  Radio,
  FileSpreadsheet,
  BarChart3,
  Settings,
  Edit3
} from 'lucide-react';
import { BotTable, ColumnDef, BotRow } from '../types';

interface TableViewProps {
  bot: BotTable;
  onBack: () => void;
  onUpdateBot: (updatedBot: BotTable) => void;
  onOpenColumnProperties: (column: ColumnDef) => void;
  onOpenLiveTester: () => void;
  onOpenFilterModal: () => void;
  onOpenPivotGraph: () => void;
  onOpenReports?: () => void;
  onOpenBotSettings?: () => void;
  onExportCsv: () => void;
  onAddColumn: () => void;
}

export const TableView: React.FC<TableViewProps> = ({
  bot,
  onBack,
  onUpdateBot,
  onOpenColumnProperties,
  onOpenLiveTester,
  onOpenFilterModal,
  onOpenPivotGraph,
  onOpenReports,
  onOpenBotSettings,
  onExportCsv,
  onAddColumn
}) => {
  const [editingCell, setEditingCell] = useState<{ rowId: string; colId: string } | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(bot.name);

  // Compute live numeric sums for summary footer
  const columnSums: Record<string, number> = {};
  bot.columns.forEach(col => {
    if (col.type === 'amount' || col.type === 'number') {
      let sum = 0;
      bot.rows.forEach(row => {
        const raw = row[col.id];
        const val = typeof raw === 'number' ? raw : parseFloat(String(raw).replace(/[^0-9.-]/g, ''));
        if (!isNaN(val)) sum += val;
      });
      columnSums[col.id] = sum;
    }
  });

  // Filter rows based on search
  const visibleRows = bot.rows.filter(row => {
    if (!searchQuery.trim()) return true;
    return bot.columns.some(col => {
      const val = row[col.id];
      if (val === undefined || val === null) return false;
      return String(val).toLowerCase().includes(searchQuery.toLowerCase());
    });
  });

  const handleCellClick = (rowId: string, colId: string, currentValue: any) => {
    setEditingCell({ rowId, colId });
    setEditValue(currentValue !== undefined && currentValue !== null ? String(currentValue) : '');
  };

  const handleCellBlurOrSave = () => {
    if (!editingCell) return;
    const { rowId, colId } = editingCell;
    const targetCol = bot.columns.find(c => c.id === colId);

    let parsedVal: any = editValue;
    if (targetCol && (targetCol.type === 'amount' || targetCol.type === 'number')) {
      const cleanNum = parseFloat(editValue.replace(/[^0-9.-]/g, ''));
      parsedVal = isNaN(cleanNum) ? 0 : cleanNum;
    }

    const updatedRows = bot.rows.map(row => {
      if (row.id === rowId) {
        return { ...row, [colId]: parsedVal };
      }
      return row;
    });

    onUpdateBot({
      ...bot,
      rows: updatedRows,
      updatedAt: new Date().toISOString()
    });

    setEditingCell(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCellBlurOrSave();
    } else if (e.key === 'Escape') {
      setEditingCell(null);
    }
  };

  const handleCheckboxToggle = (rowId: string, colId: string, currentVal: any) => {
    const updatedRows = bot.rows.map(row => {
      if (row.id === rowId) {
        return { ...row, [colId]: !currentVal };
      }
      return row;
    });

    onUpdateBot({
      ...bot,
      rows: updatedRows,
      updatedAt: new Date().toISOString()
    });
  };

  const handleAddRow = () => {
    const newRowId = 'row_' + Date.now();
    const newRow: BotRow = { id: newRowId };

    bot.columns.forEach(col => {
      if (col.type === 'amount' || col.type === 'number') {
        newRow[col.id] = 0.00;
      } else if (col.type === 'checkbox') {
        newRow[col.id] = false;
      } else if (col.type === 'date') {
        newRow[col.id] = new Date().toISOString().slice(0, 16).replace('T', ' ');
      } else {
        newRow[col.id] = '';
      }
    });

    onUpdateBot({
      ...bot,
      rows: [...bot.rows, newRow],
      updatedAt: new Date().toISOString()
    });
  };

  const handleDeleteSelectedRows = () => {
    if (selectedRowIds.size === 0) return;
    const updatedRows = bot.rows.filter(r => !selectedRowIds.has(r.id));
    onUpdateBot({
      ...bot,
      rows: updatedRows,
      updatedAt: new Date().toISOString()
    });
    setSelectedRowIds(new Set());
  };

  const handleSelectAllRows = () => {
    if (selectedRowIds.size === visibleRows.length) {
      setSelectedRowIds(new Set());
    } else {
      setSelectedRowIds(new Set(visibleRows.map(r => r.id)));
    }
  };

  const formatCellValue = (val: any, col: ColumnDef) => {
    if (val === undefined || val === null || val === '') return '—';

    if (col.type === 'amount' || col.type === 'number') {
      const num = typeof val === 'number' ? val : parseFloat(String(val).replace(/[^0-9.-]/g, ''));
      if (isNaN(num)) return String(val);

      const symbol = col.currency && col.currency !== 'None' ? col.currency : '';
      const decimals = col.decimals !== undefined ? col.decimals : 2;
      const formattedNumber = col.thousandSeparator
        ? num.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
        : num.toFixed(decimals);

      return `${symbol}${formattedNumber}`;
    }

    if (col.type === 'checkbox') {
      return Boolean(val);
    }

    return String(val);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F6F9] select-none">
      
      {/* Top App Bar (Deep royal blue #0D47A1) */}
      <header className="sticky top-0 z-40 bg-[#0D47A1] text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={onBack}
              className="p-2 -ml-2 rounded-full hover:bg-white/10 active:bg-white/20 transition"
              aria-label="Back to All Bots"
            >
              <ArrowLeft size={22} className="text-white" />
            </button>
            
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                {isEditingTitle ? (
                  <input
                    type="text"
                    value={titleValue}
                    onChange={(e) => setTitleValue(e.target.value)}
                    onBlur={() => {
                      const trimmed = titleValue.trim();
                      if (trimmed && trimmed !== bot.name) {
                        onUpdateBot({ ...bot, name: trimmed, updatedAt: new Date().toISOString() });
                      } else {
                        setTitleValue(bot.name);
                      }
                      setIsEditingTitle(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const trimmed = titleValue.trim();
                        if (trimmed && trimmed !== bot.name) {
                          onUpdateBot({ ...bot, name: trimmed, updatedAt: new Date().toISOString() });
                        } else {
                          setTitleValue(bot.name);
                        }
                        setIsEditingTitle(false);
                      } else if (e.key === 'Escape') {
                        setTitleValue(bot.name);
                        setIsEditingTitle(false);
                      }
                    }}
                    autoFocus
                    className="bg-white/15 text-white font-bold text-base sm:text-lg px-2 py-0.5 rounded outline-none border border-white/40 max-w-[180px] sm:max-w-xs"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setTitleValue(bot.name);
                      setIsEditingTitle(true);
                    }}
                    className="flex items-center gap-1.5 group text-left hover:bg-white/10 px-1.5 py-0.5 -ml-1.5 rounded transition"
                    title="Click to rename bot"
                  >
                    <span className="font-bold text-base sm:text-lg tracking-tight truncate max-w-[180px] sm:max-w-md">
                      {bot.name}
                    </span>
                    <Edit3 size={13} className="text-blue-200 opacity-70 group-hover:opacity-100 shrink-0" />
                  </button>
                )}
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase ${
                  bot.botStatus === 'online' 
                    ? 'bg-emerald-500 text-white' 
                    : bot.botStatus === 'simulator' 
                    ? 'bg-blue-400 text-blue-950' 
                    : 'bg-gray-400 text-gray-900'
                }`}>
                  {bot.botStatus}
                </span>
              </div>
              <span className="text-[11px] text-blue-100/80 -mt-0.5">
                {bot.rows.length} records • Tap any header to edit properties
              </span>
            </div>
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center gap-1">
            {selectedRowIds.size > 0 ? (
              <button
                onClick={handleDeleteSelectedRows}
                className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-md text-xs font-semibold flex items-center gap-1.5 transition shadow-xs"
              >
                <Trash2 size={15} />
                <span>Delete ({selectedRowIds.size})</span>
              </button>
            ) : null}

            {onOpenReports && (
              <button
                onClick={onOpenReports}
                className="px-2.5 py-1 rounded-md bg-blue-800/80 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1 transition border border-blue-400/40"
                title="Daily, Weekly & Monthly Reports"
              >
                <BarChart3 size={15} className="text-amber-300" />
                <span className="hidden sm:inline">Reports</span>
              </button>
            )}

            <button
              onClick={() => setIsSearchVisible(!isSearchVisible)}
              className="p-2 rounded-full hover:bg-white/10 transition"
              title="Search table"
            >
              <Search size={20} />
            </button>

            <button
              onClick={onAddColumn}
              className="p-2 rounded-full hover:bg-white/10 transition"
              title="Add Column"
            >
              <Plus size={20} />
            </button>

            {onOpenBotSettings && (
              <button
                onClick={onOpenBotSettings}
                className="p-2 rounded-full hover:bg-white/10 transition"
                title="Bot Settings & Rename"
              >
                <Settings size={19} />
              </button>
            )}
          </div>
        </div>

        {/* Collapsible Search in table */}
        {isSearchVisible && (
          <div className="bg-[#1565C0] px-4 py-2 border-t border-blue-400/30">
            <div className="max-w-7xl mx-auto flex items-center bg-white rounded-lg px-3 py-1 text-gray-800 shadow-inner">
              <Search size={16} className="text-gray-400 mr-2 shrink-0" />
              <input
                type="text"
                placeholder="Filter row values..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="w-full text-xs sm:text-sm bg-transparent outline-none py-1"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-xs text-gray-400 hover:text-gray-600 font-bold px-1">
                  ✕
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Table Spreadsheet Container */}
      <div className="flex-1 overflow-x-auto overflow-y-auto pb-20 relative">
        <table className="w-full border-collapse text-xs sm:text-sm bg-white">
          {/* Sticky Column Headers */}
          <thead>
            <tr className="bg-[#F8FAFC] border-b border-gray-300 text-gray-700 select-none">
              {/* Frozen Left Row Number Header */}
              <th className="sticky left-0 z-30 bg-[#F1F5F9] w-12 min-w-[48px] max-w-[48px] border-r border-b border-gray-300 text-center font-bold text-gray-500 py-3">
                <input
                  type="checkbox"
                  checked={visibleRows.length > 0 && selectedRowIds.size === visibleRows.length}
                  onChange={handleSelectAllRows}
                  className="rounded text-[#1976D2] focus:ring-0 cursor-pointer"
                  title="Select all"
                />
              </th>

              {/* Data Column Headers (Tap to open Edit Column Properties) */}
              {bot.columns.map((col) => {
                const widthStyle = { minWidth: `${Math.round(130 * col.widthMultiplier)}px` };
                return (
                  <th
                    key={col.id}
                    onClick={() => onOpenColumnProperties(col)}
                    style={widthStyle}
                    className="border-r border-b border-gray-300 px-3 py-3 text-left font-bold text-gray-800 hover:bg-blue-50/70 transition cursor-pointer group"
                    title="Tap to Edit Column Properties"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="truncate group-hover:text-[#0D47A1]">
                        {col.name}
                      </span>
                      <span className="text-[10px] font-mono uppercase bg-gray-200/80 group-hover:bg-blue-200 text-gray-600 px-1 py-0.5 rounded">
                        {col.type}
                      </span>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody>
            {visibleRows.map((row, rowIndex) => {
              const isSelected = selectedRowIds.has(row.id);

              return (
                <tr 
                  key={row.id}
                  className={`border-b border-gray-200 hover:bg-blue-50/40 transition ${
                    isSelected ? 'bg-blue-50/90' : rowIndex % 2 === 1 ? 'bg-gray-50/40' : 'bg-white'
                  }`}
                >
                  {/* Frozen Row Number Column (1, 2, 3...) */}
                  <td className="sticky left-0 z-20 bg-[#F8FAFC] border-r border-gray-300 text-center font-bold text-gray-400 py-2.5 px-1">
                    <div className="flex items-center justify-center gap-1">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          const next = new Set(selectedRowIds);
                          if (e.target.checked) next.add(row.id);
                          else next.delete(row.id);
                          setSelectedRowIds(next);
                        }}
                        className="rounded text-[#1976D2] focus:ring-0 cursor-pointer"
                      />
                      <span className="text-[11px] text-gray-500 font-mono w-4">
                        {rowIndex + 1}
                      </span>
                    </div>
                  </td>

                  {/* Cell Values */}
                  {bot.columns.map((col) => {
                    const cellValue = row[col.id];
                    const isEditing = editingCell?.rowId === row.id && editingCell?.colId === col.id;
                    const isAmount = col.type === 'amount';
                    const isCheckbox = col.type === 'checkbox';

                    return (
                      <td
                        key={col.id}
                        onClick={() => !isCheckbox && handleCellClick(row.id, col.id, cellValue)}
                        className={`border-r border-gray-200 px-3 py-2 text-gray-800 transition ${
                          isEditing ? 'p-0 bg-blue-50' : 'cursor-text'
                        }`}
                        style={{
                          textAlign: col.style.align || 'left',
                          backgroundColor: isEditing ? '#EFF6FF' : (col.style.bgColor !== '#FFFFFF' ? col.style.bgColor : undefined)
                        }}
                      >
                        {isEditing ? (
                          <input
                            type={col.type === 'amount' || col.type === 'number' ? 'number' : 'text'}
                            step="any"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={handleCellBlurOrSave}
                            onKeyDown={handleKeyDown}
                            autoFocus
                            className="w-full h-full px-3 py-2 bg-white border-2 border-[#1976D2] outline-none text-xs sm:text-sm font-medium shadow-xs"
                          />
                        ) : isCheckbox ? (
                          <div className="flex items-center justify-center py-1">
                            <input
                              type="checkbox"
                              checked={Boolean(cellValue)}
                              onChange={() => handleCheckboxToggle(row.id, col.id, cellValue)}
                              className="w-4 h-4 text-[#1976D2] rounded border-gray-300 focus:ring-0 cursor-pointer"
                            />
                          </div>
                        ) : (
                          <span
                            className={`${isAmount ? 'cell-amount-highlight text-sm' : ''}`}
                            style={{
                              color: isAmount ? '#E65100' : (col.style.color || '#1E293B'),
                              fontWeight: col.style.bold || isAmount ? 700 : 400,
                              fontStyle: col.style.italic ? 'italic' : 'normal'
                            }}
                          >
                            {formatCellValue(cellValue, col)}
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Add Row Button: Blue square '+' button below last row */}
        <div className="p-3 bg-white border-b border-gray-200 flex items-center justify-between">
          <button
            onClick={handleAddRow}
            className="w-9 h-9 rounded-md bg-[#1976D2] hover:bg-[#1565C0] text-white flex items-center justify-center shadow-xs transition active:scale-95"
            title="Append Row"
            aria-label="Add new record"
          >
            <Plus size={20} />
          </button>
          
          <span className="text-xs text-gray-500 font-medium">
            {visibleRows.length} rows displayed
          </span>
        </div>
      </div>

      {/* Sticky Summary Footer (Σ): Automatically calculates and displays live sum of numeric columns */}
      <footer className="sticky bottom-14 z-30 bg-[#0D47A1] text-white shadow-lg border-t border-blue-900">
        <div className="px-4 py-2.5 flex items-center justify-between text-xs sm:text-sm font-semibold overflow-x-auto">
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-base font-bold text-amber-300">Σ Live Totals:</span>
          </div>

          <div className="flex items-center gap-4 divide-x divide-blue-400/40 pl-3">
            {bot.columns
              .filter(col => col.type === 'amount' || col.type === 'number')
              .map(col => {
                const total = columnSums[col.id] || 0;
                const symbol = col.currency && col.currency !== 'None' ? col.currency : '$';
                return (
                  <div key={col.id} className="pl-3 flex items-center gap-1.5 shrink-0">
                    <span className="text-blue-200 text-xs font-normal truncate max-w-[120px]">{col.name}:</span>
                    <span className="text-amber-300 font-mono font-bold text-sm tracking-wide">
                      {symbol}{total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      </footer>

      {/* Bottom Action Toolbar (5 evenly spaced icons) */}
      <div className="fixed bottom-0 left-0 right-0 h-14 bg-white border-t border-gray-200 flex items-center justify-around z-40 px-2 shadow-md">
        
        {/* 1. Column/Command Settings */}
        <button
          onClick={onAddColumn}
          className="flex flex-col items-center justify-center text-gray-600 hover:text-[#1976D2] transition py-1 px-3"
          title="Column & Command Settings"
        >
          <SlidersHorizontal size={20} />
          <span className="text-[10px] font-medium mt-0.5">Columns</span>
        </button>

        {/* 2. Filter Rows */}
        <button
          onClick={onOpenFilterModal}
          className="flex flex-col items-center justify-center text-gray-600 hover:text-[#1976D2] transition py-1 px-3"
          title="Filter Rows"
        >
          <Filter size={20} />
          <span className="text-[10px] font-medium mt-0.5">Filter</span>
        </button>

        {/* 3. Live Bot Tester / Broadcast Message */}
        <button
          onClick={onOpenLiveTester}
          className="flex flex-col items-center justify-center text-[#1976D2] hover:text-[#0D47A1] transition py-1 px-3 relative"
          title="Live Bot Tester & Broadcast"
        >
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-[#1976D2]">
            <Send size={16} />
          </div>
          <span className="text-[10px] font-bold mt-0.5">Tester</span>
        </button>

        {/* 4. Share / Export Table */}
        <button
          onClick={onExportCsv}
          className="flex flex-col items-center justify-center text-gray-600 hover:text-[#1976D2] transition py-1 px-3"
          title="Share / Export CSV"
        >
          <Share2 size={20} />
          <span className="text-[10px] font-medium mt-0.5">Export</span>
        </button>

        {/* 5. More Options (Pivot Summary Graph, Clear Data) */}
        <div className="relative">
          <button
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            className="flex flex-col items-center justify-center text-gray-600 hover:text-[#1976D2] transition py-1 px-3"
            title="More Options"
          >
            <MoreHorizontal size={20} />
            <span className="text-[10px] font-medium mt-0.5">More</span>
          </button>

          {showMoreMenu && (
            <div 
              className="absolute right-0 bottom-14 w-52 bg-white rounded-xl shadow-2xl border border-gray-200 py-1.5 z-50 animate-in fade-in zoom-in-95"
              onClick={(e) => e.stopPropagation()}
            >
              {onOpenBotSettings && (
                <button
                  onClick={() => { setShowMoreMenu(false); onOpenBotSettings(); }}
                  className="w-full px-3 py-2 text-xs font-medium text-gray-700 hover:bg-blue-50 hover:text-[#0D47A1] flex items-center gap-2 text-left"
                >
                  <Settings size={16} className="text-[#0D47A1]" />
                  <span>Bot Settings / Rename</span>
                </button>
              )}

              {onOpenReports && (
                <button
                  onClick={() => { setShowMoreMenu(false); onOpenReports(); }}
                  className="w-full px-3 py-2 text-xs font-medium text-gray-700 hover:bg-blue-50 hover:text-[#0D47A1] flex items-center gap-2 text-left"
                >
                  <BarChart3 size={16} className="text-[#0D47A1]" />
                  <span>Daily/Weekly/Monthly Reports</span>
                </button>
              )}

              <button
                onClick={() => { setShowMoreMenu(false); onOpenPivotGraph(); }}
                className="w-full px-3 py-2 text-xs font-medium text-gray-700 hover:bg-blue-50 hover:text-[#0D47A1] flex items-center gap-2 text-left"
              >
                <PieChart size={16} className="text-[#1976D2]" />
                <span>Pivot Summary Graph</span>
              </button>

              <button
                onClick={() => {
                  setShowMoreMenu(false);
                  if (confirm('Clear all data rows in this bot table?')) {
                    onUpdateBot({ ...bot, rows: [], updatedAt: new Date().toISOString() });
                  }
                }}
                className="w-full px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 flex items-center gap-2 text-left"
              >
                <Trash2 size={16} />
                <span>Clear All Rows</span>
              </button>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
