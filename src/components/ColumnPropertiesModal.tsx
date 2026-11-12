import React, { useState } from 'react';
import { 
  ArrowLeft, 
  X, 
  Minus, 
  Plus, 
  Bold, 
  Italic, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  RotateCcw, 
  PieChart, 
  Type, 
  DollarSign, 
  Calendar, 
  Image as ImageIcon, 
  Sigma, 
  Binary, 
  MousePointerClick, 
  CheckSquare,
  PaintBucket,
  Palette
} from 'lucide-react';
import { ColumnDef, ColumnType, CurrencySymbol } from '../types';

interface ColumnPropertiesModalProps {
  column: ColumnDef;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedColumn: ColumnDef) => void;
  onOpenPivotGraph: (column: ColumnDef) => void;
}

export const ColumnPropertiesModal: React.FC<ColumnPropertiesModalProps> = ({
  column,
  isOpen,
  onClose,
  onSave,
  onOpenPivotGraph
}) => {
  if (!isOpen) return null;

  const [name, setName] = useState(column.name);
  const [type, setType] = useState<ColumnType>(column.type);
  const [widthMultiplier, setWidthMultiplier] = useState(column.widthMultiplier || 1.0);
  const [currency, setCurrency] = useState<CurrencySymbol>(column.currency || '$');
  const [thousandSeparator, setThousandSeparator] = useState(column.thousandSeparator ?? true);
  const [decimals, setDecimals] = useState(column.decimals ?? 2);
  const [isBold, setIsBold] = useState(column.style.bold);
  const [isItalic, setIsItalic] = useState(column.style.italic);
  const [align, setAlign] = useState<'left' | 'center' | 'right'>(column.style.align || 'left');
  const [color, setColor] = useState(column.style.color || (column.type === 'amount' ? '#E65100' : '#1E293B'));
  const [bgColor, setBgColor] = useState(column.style.bgColor || '#FFFFFF');
  const [includeInGraph, setIncludeInGraph] = useState(column.includeInGraph ?? true);

  const columnTypes: { type: ColumnType; label: string; icon: React.ReactNode }[] = [
    { type: 'text', label: 'Text (TT)', icon: <Type size={18} /> },
    { type: 'amount', label: 'Amount ($)', icon: <DollarSign size={18} /> },
    { type: 'date', label: 'Date', icon: <Calendar size={18} /> },
    { type: 'image', label: 'Image', icon: <ImageIcon size={18} /> },
    { type: 'formula', label: 'Formula (Σ)', icon: <Sigma size={18} /> },
    { type: 'number', label: 'Number (123)', icon: <Binary size={18} /> },
    { type: 'button', label: 'Button', icon: <MousePointerClick size={18} /> },
    { type: 'checkbox', label: 'Checkbox', icon: <CheckSquare size={18} /> },
  ];

  const handleResetStyles = () => {
    setIsBold(type === 'amount');
    setIsItalic(false);
    setAlign(type === 'amount' || type === 'number' ? 'right' : 'left');
    setColor(type === 'amount' ? '#E65100' : '#1E293B');
    setBgColor('#FFFFFF');
  };

  const handleSave = () => {
    const updated: ColumnDef = {
      ...column,
      name: name.trim() || 'Untitled Column',
      type,
      widthMultiplier: Number(widthMultiplier.toFixed(2)),
      currency,
      thousandSeparator,
      decimals,
      style: {
        bold: isBold,
        italic: isItalic,
        align,
        color,
        bgColor
      },
      includeInGraph
    };
    onSave(updated);
    onClose();
  };

  // Preview formatted text
  const previewNumber = 1000000.00;
  const symbol = currency !== 'None' ? currency : '';
  const previewFormatted = thousandSeparator
    ? previewNumber.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
    : previewNumber.toFixed(decimals);
  const previewDisplay = `${symbol}${previewFormatted}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header: Back arrow (←), title, pill-shaped Save button */}
        <header className="bg-[#0D47A1] text-white px-4 py-3.5 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-white/10 active:bg-white/20 transition"
              aria-label="Back"
            >
              <ArrowLeft size={20} />
            </button>
            <h2 className="font-bold text-base tracking-tight">Edit Column Properties</h2>
          </div>

          <button
            onClick={handleSave}
            className="px-5 py-1.5 rounded-full bg-white text-[#0D47A1] font-bold text-xs hover:bg-blue-50 active:scale-95 transition shadow-xs"
          >
            Save
          </button>
        </header>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 text-gray-800">
          
          {/* Column / Command Name Input with clear button */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
              Column / Command Name
            </label>
            <div className="relative flex items-center">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. User ID / Name, Amount, Status"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:border-[#1976D2] focus:ring-2 focus:ring-blue-100 outline-none text-sm font-medium transition"
              />
              {name && (
                <button
                  type="button"
                  onClick={() => setName('')}
                  className="absolute right-3 p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Column / Feature Type Selector (Horizontal Icon Bar) */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Feature / Type Selector
            </label>
            <div className="grid grid-cols-4 gap-2.5">
              {columnTypes.map((item) => {
                const isSelected = type === item.type;
                return (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => {
                      setType(item.type);
                      if (item.type === 'amount') {
                        setIsBold(true);
                        setColor('#E65100');
                        setAlign('right');
                      }
                    }}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition ${
                      isSelected 
                        ? 'border-[#1976D2] bg-blue-50 text-[#0D47A1] font-bold shadow-xs' 
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center mb-1 transition ${
                      isSelected ? 'bg-[#1976D2] text-white' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {item.icon}
                    </div>
                    <span className="text-[11px] leading-tight truncate w-full">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Column / Response Width Slider: Green interactive slider (0.5 to 3.0) with - and + */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Column Width ({widthMultiplier.toFixed(1)}x)
              </label>
              <span className="text-xs font-mono text-[#2E7D32] font-bold">
                {Math.round(130 * widthMultiplier)}px
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setWidthMultiplier(prev => Math.max(0.5, prev - 0.1))}
                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 active:scale-95 transition"
              >
                <Minus size={16} />
              </button>

              <input
                type="range"
                min="0.5"
                max="3.0"
                step="0.1"
                value={widthMultiplier}
                onChange={(e) => setWidthMultiplier(parseFloat(e.target.value))}
                className="flex-1 accent-[#2E7D32] h-2 bg-gray-200 rounded-lg cursor-pointer"
              />

              <button
                type="button"
                onClick={() => setWidthMultiplier(prev => Math.min(3.0, prev + 0.1))}
                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 active:scale-95 transition"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          {/* Number / Response Format (Currency, Separator, Precision) */}
          {(type === 'amount' || type === 'number') && (
            <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
              <div className="font-bold text-xs text-gray-700 uppercase tracking-wider">
                Number & Currency Formatting
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Currency Symbol */}
                <div>
                  <span className="text-xs text-gray-500 block mb-1">Currency Symbol</span>
                  <div className="flex gap-1.5 flex-wrap">
                    {(['$', '£', '€', 'ETB', 'None'] as CurrencySymbol[]).map((sym) => (
                      <button
                        key={sym}
                        type="button"
                        onClick={() => setCurrency(sym)}
                        className={`px-2.5 py-1 text-xs rounded-md border font-semibold transition ${
                          currency === sym 
                            ? 'bg-[#1976D2] text-white border-[#1976D2]' 
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {sym}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Decimal Precision */}
                <div>
                  <span className="text-xs text-gray-500 block mb-1">Decimals</span>
                  <div className="flex gap-1.5">
                    {[0, 2, 3].map((dec) => (
                      <button
                        key={dec}
                        type="button"
                        onClick={() => setDecimals(dec)}
                        className={`px-2.5 py-1 text-xs rounded-md border font-semibold transition ${
                          decimals === dec 
                            ? 'bg-[#1976D2] text-white border-[#1976D2]' 
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {dec === 0 ? '0' : dec === 2 ? '0.01' : '0.001'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Thousand separator checkbox */}
              <label className="flex items-center gap-2 cursor-pointer pt-1 text-xs font-medium text-gray-700">
                <input
                  type="checkbox"
                  checked={thousandSeparator}
                  onChange={(e) => setThousandSeparator(e.target.checked)}
                  className="rounded text-[#1976D2] focus:ring-0"
                />
                <span>Thousand separator (,) e.g. 1,000.00</span>
              </label>
            </div>
          )}

          {/* Text Styles Toolbar: B, I, Align, Color, Fill, Reset */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Text Styles Toolbar
              </label>
              <button
                type="button"
                onClick={handleResetStyles}
                className="text-xs text-gray-500 hover:text-gray-800 flex items-center gap-1 font-medium"
              >
                <RotateCcw size={12} />
                <span>Reset</span>
              </button>
            </div>

            <div className="flex items-center gap-1.5 p-1.5 bg-gray-100 rounded-xl border border-gray-200">
              {/* Bold */}
              <button
                type="button"
                onClick={() => setIsBold(!isBold)}
                className={`p-2 rounded-lg transition ${isBold ? 'bg-white text-[#0D47A1] shadow-xs font-black' : 'text-gray-600 hover:bg-white/60'}`}
                title="Bold"
              >
                <Bold size={16} />
              </button>

              {/* Italic */}
              <button
                type="button"
                onClick={() => setIsItalic(!isItalic)}
                className={`p-2 rounded-lg transition ${isItalic ? 'bg-white text-[#0D47A1] shadow-xs' : 'text-gray-600 hover:bg-white/60'}`}
                title="Italic"
              >
                <Italic size={16} />
              </button>

              <div className="w-[1px] h-6 bg-gray-300 mx-1" />

              {/* Align Left */}
              <button
                type="button"
                onClick={() => setAlign('left')}
                className={`p-2 rounded-lg transition ${align === 'left' ? 'bg-white text-[#0D47A1] shadow-xs' : 'text-gray-600 hover:bg-white/60'}`}
                title="Align Left"
              >
                <AlignLeft size={16} />
              </button>

              {/* Align Center */}
              <button
                type="button"
                onClick={() => setAlign('center')}
                className={`p-2 rounded-lg transition ${align === 'center' ? 'bg-white text-[#0D47A1] shadow-xs' : 'text-gray-600 hover:bg-white/60'}`}
                title="Align Center"
              >
                <AlignCenter size={16} />
              </button>

              {/* Align Right */}
              <button
                type="button"
                onClick={() => setAlign('right')}
                className={`p-2 rounded-lg transition ${align === 'right' ? 'bg-white text-[#0D47A1] shadow-xs' : 'text-gray-600 hover:bg-white/60'}`}
                title="Align Right"
              >
                <AlignRight size={16} />
              </button>

              <div className="w-[1px] h-6 bg-gray-300 mx-1" />

              {/* Text Color Picker */}
              <label className="p-1.5 rounded-lg text-gray-600 hover:bg-white/60 transition cursor-pointer relative" title="Text Color">
                <Palette size={16} style={{ color }} />
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                />
              </label>

              {/* Fill / Background Color */}
              <label className="p-1.5 rounded-lg text-gray-600 hover:bg-white/60 transition cursor-pointer relative" title="Cell Background Color">
                <PaintBucket size={16} style={{ color: bgColor !== '#FFFFFF' ? bgColor : '#64748B' }} />
                <input
                  type="color"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                />
              </label>
            </div>

            {/* Live Preview Box */}
            <div className="mt-2.5 p-3 rounded-xl border border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center">
              <span className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Live Cell Preview</span>
              <div 
                className="px-4 py-2 rounded-md transition-all"
                style={{
                  backgroundColor: bgColor,
                  color: color,
                  fontWeight: isBold ? 700 : 400,
                  fontStyle: isItalic ? 'italic' : 'normal',
                  textAlign: align
                }}
              >
                <span className="font-mono text-base">{previewDisplay}</span>
              </div>
            </div>
          </div>

          {/* Bottom Links: Pivot summary graph & Summary on Graph */}
          <div className="pt-2 border-t border-gray-200 space-y-3">
            <button
              type="button"
              onClick={() => onOpenPivotGraph(column)}
              className="w-full py-2.5 px-4 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#0D47A1] font-bold text-xs flex items-center justify-center gap-2 transition"
            >
              <PieChart size={16} />
              <span>Open Pivot Summary Graph</span>
            </button>

            <label className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 border border-gray-200 cursor-pointer">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-gray-800">Summary on Graph</span>
                <span className="text-[11px] text-gray-500">Include this column in dashboard pivot visual analytics</span>
              </div>
              <input
                type="checkbox"
                checked={includeInGraph}
                onChange={(e) => setIncludeInGraph(e.target.checked)}
                className="w-4 h-4 text-[#2E7D32] rounded focus:ring-0"
              />
            </label>
          </div>

        </div>

      </div>
    </div>
  );
};
