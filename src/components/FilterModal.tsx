import React, { useState } from 'react';
import { Filter, X, Check, RotateCcw } from 'lucide-react';
import { BotTable } from '../types';

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  bot: BotTable;
  onApplyFilter: (filteredBot: BotTable) => void;
  onResetFilter: () => void;
}

export const FilterModal: React.FC<FilterModalProps> = ({
  isOpen,
  onClose,
  bot,
  onApplyFilter,
  onResetFilter
}) => {
  if (!isOpen) return null;

  const [selectedColId, setSelectedColId] = useState<string>(bot.columns[0]?.id || '');
  const [filterCondition, setFilterCondition] = useState<'contains' | 'equals' | 'greater' | 'less'>('contains');
  const [filterValue, setFilterValue] = useState('');

  const handleApply = () => {
    if (!filterValue.trim()) {
      onResetFilter();
      onClose();
      return;
    }

    const filteredRows = bot.rows.filter(row => {
      const val = row[selectedColId];
      if (val === undefined || val === null) return false;
      const strVal = String(val).toLowerCase();
      const query = filterValue.toLowerCase();

      if (filterCondition === 'contains') return strVal.includes(query);
      if (filterCondition === 'equals') return strVal === query;
      if (filterCondition === 'greater') {
        const numVal = parseFloat(strVal.replace(/[^0-9.-]/g, ''));
        const queryNum = parseFloat(query);
        return !isNaN(numVal) && !isNaN(queryNum) && numVal > queryNum;
      }
      if (filterCondition === 'less') {
        const numVal = parseFloat(strVal.replace(/[^0-9.-]/g, ''));
        const queryNum = parseFloat(query);
        return !isNaN(numVal) && !isNaN(queryNum) && numVal < queryNum;
      }
      return true;
    });

    onApplyFilter({
      ...bot,
      rows: filteredRows
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <header className="bg-[#0D47A1] text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter size={18} />
            <h2 className="font-bold text-sm sm:text-base">Filter Spreadsheet Rows</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-white/80 hover:text-white">
            <X size={18} />
          </button>
        </header>

        {/* Body */}
        <div className="p-5 space-y-4 text-gray-800 text-xs sm:text-sm">
          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">
              Select Column
            </label>
            <select
              value={selectedColId}
              onChange={(e) => setSelectedColId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-300 font-semibold outline-none focus:border-[#1976D2]"
            >
              {bot.columns.map(col => (
                <option key={col.id} value={col.id}>{col.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">
              Condition
            </label>
            <select
              value={filterCondition}
              onChange={(e) => setFilterCondition(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl border border-gray-300 outline-none focus:border-[#1976D2]"
            >
              <option value="contains">Contains text</option>
              <option value="equals">Exact match</option>
              <option value="greater">Greater than (&gt;)</option>
              <option value="less">Less than (&lt;)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">
              Filter Value
            </label>
            <input
              type="text"
              placeholder="e.g. BTC, Triggered, 50.00"
              value={filterValue}
              onChange={(e) => setFilterValue(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-300 outline-none focus:border-[#1976D2]"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => { onResetFilter(); onClose(); }}
              className="flex-1 py-2 rounded-xl border border-gray-300 text-gray-700 font-bold hover:bg-gray-50 transition"
            >
              Reset All
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="flex-1 py-2 rounded-xl bg-[#0D47A1] hover:bg-blue-900 text-white font-bold transition shadow-xs"
            >
              Apply Filter
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
