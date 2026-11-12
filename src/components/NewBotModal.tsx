import React, { useState } from 'react';
import { Bot, X, Plus, Key, Sparkles, Layers, DollarSign, MessageSquare, Bell } from 'lucide-react';
import { BotTable, ColumnDef } from '../types';

interface NewBotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateBot: (newBot: BotTable) => void;
}

export const NewBotModal: React.FC<NewBotModalProps> = ({
  isOpen,
  onClose,
  onCreateBot
}) => {
  if (!isOpen) return null;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [telegramToken, setTelegramToken] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<'ledger' | 'sales' | 'alerts' | 'support' | 'blank'>('ledger');

  const templates = [
    {
      id: 'ledger',
      title: 'Customer Ledger & Balances',
      desc: 'Paid customer name, quality/quantity, amount & remaining balance',
      icon: <DollarSign size={18} className="text-amber-600" />
    },
    {
      id: 'sales',
      title: 'Sales & Checkout Bot',
      desc: 'Auto-calculate order sums, amounts ($), and payments',
      icon: <DollarSign size={18} className="text-emerald-600" />
    },
    {
      id: 'alerts',
      title: 'Price & Alert Monitor',
      desc: 'Telegram trigger alerts, pairs, and target thresholds',
      icon: <Bell size={18} className="text-[#0D47A1]" />
    },
    {
      id: 'support',
      title: 'Helpdesk & Support',
      desc: 'Tickets, inquiries, priority ratings, and user replies',
      icon: <MessageSquare size={18} className="text-purple-600" />
    },
    {
      id: 'blank',
      title: 'Blank Bot Table',
      desc: 'Empty table with User, Value, and Status columns',
      icon: <Layers size={18} className="text-gray-600" />
    }
  ];

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const botName = name.trim() || (
      selectedTemplate === 'ledger' ? 'CustomerAccounts_Bot' :
      selectedTemplate === 'sales' ? 'OrderTracker_Bot' : 
      selectedTemplate === 'alerts' ? 'PriceAlert_Bot' : 'NewBot_Table'
    );

    let columns: ColumnDef[] = [];
    let folder = 'General';

    if (selectedTemplate === 'ledger') {
      folder = 'Customer Ledger';
      columns = [
        {
          id: 'c_name',
          name: 'Customer Name',
          type: 'text',
          widthMultiplier: 1.4,
          currency: 'None',
          thousandSeparator: false,
          decimals: 0,
          style: { bold: true, italic: false, align: 'left', color: '#0D47A1', bgColor: '#FFFFFF' },
          includeInGraph: true
        },
        {
          id: 'c_quality',
          name: 'Quality / Quantity',
          type: 'text',
          widthMultiplier: 1.3,
          currency: 'None',
          thousandSeparator: false,
          decimals: 0,
          style: { bold: false, italic: false, align: 'left', color: '#1E293B', bgColor: '#FFFFFF' },
          includeInGraph: true
        },
        {
          id: 'c_total',
          name: 'Total Amount',
          type: 'amount',
          widthMultiplier: 1.1,
          currency: '$',
          thousandSeparator: true,
          decimals: 2,
          style: { bold: true, italic: false, align: 'right', color: '#1E293B', bgColor: '#FFFFFF' },
          includeInGraph: true
        },
        {
          id: 'c_paid',
          name: 'Paid Amount',
          type: 'amount',
          widthMultiplier: 1.1,
          currency: '$',
          thousandSeparator: true,
          decimals: 2,
          style: { bold: true, italic: false, align: 'right', color: '#2E7D32', bgColor: '#FFFFFF' },
          includeInGraph: true
        },
        {
          id: 'c_balance',
          name: 'Remaining Balance',
          type: 'amount',
          widthMultiplier: 1.2,
          currency: '$',
          thousandSeparator: true,
          decimals: 2,
          style: { bold: true, italic: false, align: 'right', color: '#E65100', bgColor: '#FFFFFF' },
          includeInGraph: true
        },
        {
          id: 'c_status',
          name: 'Status',
          type: 'text',
          widthMultiplier: 1.0,
          currency: 'None',
          thousandSeparator: false,
          decimals: 0,
          style: { bold: false, italic: false, align: 'center', color: '#0D47A1', bgColor: '#FFFFFF' },
          includeInGraph: true
        }
      ];
    } else {
      folder = selectedTemplate === 'sales' ? 'Sales & Orders' : selectedTemplate === 'alerts' ? 'Crypto Alerts' : selectedTemplate === 'support' ? 'Support Tickets' : 'General';
      columns = [
        {
          id: 'c_user',
          name: 'User ID / Name',
          type: 'text',
          widthMultiplier: 1.2,
          currency: 'None',
          thousandSeparator: false,
          decimals: 0,
          style: { bold: false, italic: false, align: 'left', color: '#1E293B', bgColor: '#FFFFFF' },
          includeInGraph: true
        },
        {
          id: 'c_val',
          name: selectedTemplate === 'sales' ? 'Amount Paid' : selectedTemplate === 'alerts' ? 'Target Price' : 'Value',
          type: 'amount',
          widthMultiplier: 1.1,
          currency: '$',
          thousandSeparator: true,
          decimals: 2,
          style: { bold: true, italic: false, align: 'right', color: '#E65100', bgColor: '#FFFFFF' },
          includeInGraph: true
        },
        {
          id: 'c_status',
          name: 'Status',
          type: 'text',
          widthMultiplier: 1.0,
          currency: 'None',
          thousandSeparator: false,
          decimals: 0,
          style: { bold: false, italic: false, align: 'center', color: '#2E7D32', bgColor: '#FFFFFF' },
          includeInGraph: true
        }
      ];

      if (selectedTemplate === 'sales') {
        columns.push({
          id: 'c_verified',
          name: 'Verified',
          type: 'checkbox',
          widthMultiplier: 0.8,
          currency: 'None',
          thousandSeparator: false,
          decimals: 0,
          style: { bold: false, italic: false, align: 'center', color: '#1E293B', bgColor: '#FFFFFF' },
          includeInGraph: false
        });
      }
    }

    const newBot: BotTable = {
      id: 'bot_' + Date.now(),
      name: botName,
      folder,
      description: description.trim() || (
        selectedTemplate === 'ledger' ? 'Customer ledger tracking quality, amount & remaining balance' :
        selectedTemplate === 'sales' ? 'Telegram automated orders and checkout log' : 'Telegram Bot spreadsheet database'
      ),
      telegramToken: telegramToken.trim(),
      botStatus: telegramToken.trim() ? 'online' : 'simulator',
      isFavorite: false,
      updatedAt: new Date().toISOString(),
      columns,
      rows: []
    };

    onCreateBot(newBot);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <header className="bg-[#0D47A1] text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Bot size={20} />
            <h2 className="font-bold text-base">Create New Bot Table</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-white/80 hover:text-white">
            <X size={18} />
          </button>
        </header>

        {/* Body */}
        <form onSubmit={handleCreate} className="p-5 space-y-4 text-gray-800 text-xs sm:text-sm">
          
          {/* Template Choice */}
          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase mb-2">
              Select Starting Template
            </label>
            <div className="grid grid-cols-2 gap-2">
              {templates.map(t => (
                <div
                  key={t.id}
                  onClick={() => setSelectedTemplate(t.id as any)}
                  className={`p-2.5 rounded-xl border cursor-pointer transition ${
                    selectedTemplate === t.id 
                      ? 'border-[#1976D2] bg-blue-50/70 shadow-xs' 
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {t.icon}
                    <span className="font-bold text-xs truncate">{t.title}</span>
                  </div>
                  <p className="text-[10px] text-gray-500 line-clamp-1">{t.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">
              Bot / Table Name *
            </label>
            <input
              type="text"
              placeholder="e.g. SalesTracker_Bot, CryptoAlert Bot"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 font-semibold outline-none focus:border-[#1976D2]"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">
              Description (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Incoming order transactions & receipts"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-gray-300 outline-none focus:border-[#1976D2]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">
              Telegram Bot Token (Optional - or use Simulator)
            </label>
            <input
              type="password"
              placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
              value={telegramToken}
              onChange={(e) => setTelegramToken(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-gray-300 font-mono text-xs outline-none focus:border-[#1976D2]"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-bold hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-[#0D47A1] hover:bg-blue-900 text-white font-bold transition shadow-xs"
            >
              Create Table
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
