import React, { useState } from 'react';
import { 
  PieChart, 
  BarChart2, 
  X, 
  TrendingUp, 
  Check, 
  Layers,
  ChevronDown
} from 'lucide-react';
import { BotTable, ColumnDef } from '../types';

interface PivotGraphModalProps {
  isOpen: boolean;
  onClose: () => void;
  bot: BotTable;
  selectedColumn?: ColumnDef;
}

export const PivotGraphModal: React.FC<PivotGraphModalProps> = ({
  isOpen,
  onClose,
  bot,
  selectedColumn
}) => {
  if (!isOpen) return null;

  const availableCols = bot.columns.filter(c => c.includeInGraph !== false);
  const [activeColId, setActiveColId] = useState<string>(
    selectedColumn?.id || (availableCols[0]?.id || bot.columns[0]?.id || '')
  );
  const [chartType, setChartType] = useState<'bar' | 'pie'>('bar');

  const currentCol = bot.columns.find(c => c.id === activeColId) || bot.columns[0];
  if (!currentCol) return null;

  // Aggregate frequencies and numeric values
  const frequencies: Record<string, { count: number; sum: number }> = {};
  let totalRows = 0;
  let numericSum = 0;
  let validNumericCount = 0;

  bot.rows.forEach(row => {
    totalRows++;
    const rawVal = row[currentCol.id];
    const key = rawVal === undefined || rawVal === null || rawVal === '' ? '(Blank)' : String(rawVal);
    const num = typeof rawVal === 'number' ? rawVal : parseFloat(String(rawVal).replace(/[^0-9.-]/g, ''));
    const isNum = !isNaN(num);

    if (isNum) {
      numericSum += num;
      validNumericCount++;
    }

    if (!frequencies[key]) {
      frequencies[key] = { count: 0, sum: 0 };
    }
    frequencies[key].count++;
    if (isNum) frequencies[key].sum += num;
  });

  const sortedKeys = Object.keys(frequencies).sort((a, b) => frequencies[b].count - frequencies[a].count).slice(0, 8);
  const maxCount = Math.max(...sortedKeys.map(k => frequencies[k].count), 1);

  const colors = [
    '#0D47A1', '#1976D2', '#0288D1', '#0097A7', 
    '#2E7D32', '#E65100', '#D81B60', '#5E35B1'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <header className="bg-[#0D47A1] text-white px-5 py-3.5 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
              <PieChart size={18} className="text-white" />
            </div>
            <div>
              <h2 className="font-bold text-sm sm:text-base tracking-tight">Pivot Summary Analytics</h2>
              <span className="text-[10px] text-blue-200">{bot.name}</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition"
          >
            <X size={20} />
          </button>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-gray-800">
          
          {/* Column Selector & Chart Toggle */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="w-full sm:w-auto flex-1">
              <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">
                Summarize Column:
              </label>
              <select
                value={activeColId}
                onChange={(e) => setActiveColId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs sm:text-sm font-semibold outline-none focus:border-[#1976D2]"
              >
                {bot.columns.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.type})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex bg-gray-100 rounded-xl p-1 self-stretch sm:self-end">
              <button
                type="button"
                onClick={() => setChartType('bar')}
                className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                  chartType === 'bar' ? 'bg-white text-[#0D47A1] shadow-xs' : 'text-gray-600'
                }`}
              >
                <BarChart2 size={14} />
                <span>Bar</span>
              </button>
              <button
                type="button"
                onClick={() => setChartType('pie')}
                className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                  chartType === 'pie' ? 'bg-white text-[#0D47A1] shadow-xs' : 'text-gray-600'
                }`}
              >
                <PieChart size={14} />
                <span>Pie</span>
              </button>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
              <span className="text-[10px] text-gray-500 uppercase font-semibold">Total Rows</span>
              <div className="text-base font-bold text-[#0D47A1]">{totalRows}</div>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
              <span className="text-[10px] text-gray-500 uppercase font-semibold">Distinct</span>
              <div className="text-base font-bold text-[#2E7D32]">{Object.keys(frequencies).length}</div>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
              <span className="text-[10px] text-gray-500 uppercase font-semibold">Column Sum</span>
              <div className="text-base font-bold text-[#E65100] font-mono">
                {validNumericCount > 0 ? numericSum.toFixed(2) : '—'}
              </div>
            </div>
          </div>

          {/* Interactive Chart Container */}
          <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
            <h3 className="font-bold text-xs text-gray-700 uppercase tracking-wider mb-3">
              Distribution for "{currentCol.name}"
            </h3>

            {chartType === 'bar' ? (
              <div className="space-y-3">
                {sortedKeys.map((key, i) => {
                  const count = frequencies[key].count;
                  const pct = Math.round((count / (totalRows || 1)) * 100);
                  const barPct = Math.round((count / maxCount) * 100);
                  const color = colors[i % colors.length];

                  return (
                    <div key={key} className="space-y-1">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="truncate max-w-[200px] text-gray-800">{key}</span>
                        <span className="font-mono text-gray-500">
                          {count} ({pct}%)
                        </span>
                      </div>
                      <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${barPct}%`, backgroundColor: color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Pie / Donut SVG Chart */
              <div className="flex flex-col items-center justify-center py-2">
                <svg viewBox="0 0 100 100" className="w-40 h-40 transform -rotate-90">
                  {(() => {
                    let accumulatedPercent = 0;
                    return sortedKeys.map((key, i) => {
                      const count = frequencies[key].count;
                      const percent = count / (totalRows || 1);
                      const strokeDasharray = `${percent * 100} ${100 - percent * 100}`;
                      const strokeDashoffset = -accumulatedPercent * 100;
                      accumulatedPercent += percent;
                      const color = colors[i % colors.length];

                      return (
                        <circle
                          key={key}
                          cx="50"
                          cy="50"
                          r="40"
                          fill="transparent"
                          stroke={color}
                          strokeWidth="20"
                          strokeDasharray={strokeDasharray}
                          strokeDashoffset={strokeDashoffset}
                          pathLength="100"
                        />
                      );
                    });
                  })()}
                </svg>

                {/* Legend */}
                <div className="grid grid-cols-2 gap-2 mt-4 w-full">
                  {sortedKeys.map((key, i) => (
                    <div key={key} className="flex items-center gap-2 text-xs truncate">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: colors[i % colors.length] }}
                      />
                      <span className="truncate text-gray-700">{key}</span>
                      <span className="font-mono text-gray-400 text-[10px]">({frequencies[key].count})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
