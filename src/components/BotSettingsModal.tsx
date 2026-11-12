import React, { useState, useEffect } from 'react';
import { Bot, X, Folder, Key, FileText, Save, CheckCircle2 } from 'lucide-react';
import { BotTable } from '../types';

interface BotSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  bot: BotTable;
  existingFolders: string[];
  onSave: (updatedBot: BotTable) => void;
}

export const BotSettingsModal: React.FC<BotSettingsModalProps> = ({
  isOpen,
  onClose,
  bot,
  existingFolders,
  onSave
}) => {
  const [name, setName] = useState(bot.name);
  const [description, setDescription] = useState(bot.description);
  const [folder, setFolder] = useState(bot.folder || 'General');
  const [telegramToken, setTelegramToken] = useState(bot.telegramToken || '');

  useEffect(() => {
    if (isOpen) {
      setName(bot.name);
      setDescription(bot.description);
      setFolder(bot.folder || 'General');
      setTelegramToken(bot.telegramToken || '');
    }
  }, [isOpen, bot]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim() || 'New Bot';
    const trimmedToken = telegramToken.trim();

    onSave({
      ...bot,
      name: trimmedName,
      description: description.trim(),
      folder: folder.trim() || 'General',
      telegramToken: trimmedToken,
      botStatus: trimmedToken ? (bot.botStatus === 'online' ? 'online' : 'simulator') : 'simulator',
      updatedAt: new Date().toISOString()
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <header className="bg-[#0D47A1] text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Bot size={20} />
            <h2 className="font-bold text-base">Bot Settings & Properties</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </header>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-gray-800 text-xs sm:text-sm">
          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
              Bot / Table Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="New Bot"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 font-semibold outline-none focus:border-[#1976D2] focus:ring-2 focus:ring-blue-100"
              autoFocus
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
              Folder
            </label>
            <div className="relative flex items-center">
              <Folder size={15} className="absolute left-3 text-gray-400" />
              <input
                type="text"
                list="bot-folders-list"
                value={folder}
                onChange={(e) => setFolder(e.target.value)}
                placeholder="General"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-300 outline-none focus:border-[#1976D2]"
              />
              <datalist id="bot-folders-list">
                {existingFolders.map(f => (
                  <option key={f} value={f} />
                ))}
              </datalist>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
              Description
            </label>
            <div className="relative flex items-start">
              <FileText size={15} className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Telegram Bot & Live Table"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-300 outline-none focus:border-[#1976D2]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
              Telegram Bot Token (@BotFather)
            </label>
            <div className="relative flex items-center">
              <Key size={15} className="absolute left-3 text-gray-400" />
              <input
                type="password"
                value={telegramToken}
                onChange={(e) => setTelegramToken(e.target.value)}
                placeholder="Optional: paste @BotFather API token"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-300 font-mono text-xs outline-none focus:border-[#1976D2]"
              />
            </div>
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
              className="flex-1 py-2.5 rounded-xl bg-[#0D47A1] hover:bg-blue-900 text-white font-bold transition shadow-xs flex items-center justify-center gap-1.5"
            >
              <Save size={15} />
              <span>Save Settings</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
