import React from 'react';
import { HelpCircle, X, Bot, Cloud, CheckCircle, ExternalLink, ShieldCheck, Terminal, DollarSign } from 'lucide-react';
import { SQL_SETUP_SCRIPT } from '../services/supabase';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <header className="bg-[#0D47A1] text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <HelpCircle size={20} />
            <h2 className="font-bold text-base">Setup & User Guide</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-white/80 hover:text-white">
            <X size={18} />
          </button>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-gray-800 text-xs sm:text-sm">
          
          {/* Section 1: Telegram BotFather */}
          <div className="p-4 bg-blue-50/70 rounded-xl border border-blue-200">
            <div className="flex items-center gap-2 font-bold text-sm text-[#0D47A1] mb-2">
              <Bot size={18} />
              <span>1. How to get a Telegram Bot Token</span>
            </div>
            <ol className="list-decimal pl-5 space-y-1.5 text-gray-700 leading-relaxed text-xs">
              <li>Open your Telegram app and search for <strong>@BotFather</strong>.</li>
              <li>Send the command <code>/newbot</code>.</li>
              <li>Choose a display name for your bot and a unique username ending in <code>bot</code> (e.g. <code>MySalesTracker_bot</code>).</li>
              <li>BotFather will reply with an <strong>HTTP API token</strong>.</li>
              <li>Copy and paste the token into your bot table inside TableBot!</li>
            </ol>
          </div>

          {/* Section 2: Supabase Multi-Device Sync */}
          <div className="p-4 bg-emerald-50/70 rounded-xl border border-emerald-200">
            <div className="flex items-center gap-2 font-bold text-sm text-[#2E7D32] mb-2">
              <Cloud size={18} />
              <span>2. Setting up Supabase Cloud Sync</span>
            </div>
            <ol className="list-decimal pl-5 space-y-1.5 text-gray-700 leading-relaxed text-xs">
              <li>Create a free account or project at <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-emerald-700 font-bold underline">supabase.com</a>.</li>
              <li>Navigate to <strong>Project Settings → API</strong>.</li>
              <li>Copy your <strong>Project URL</strong> and <strong>anon public key</strong>.</li>
              <li>Go to <strong>SQL Editor</strong> in Supabase and run the provided SQL script to create the <code>user_bots</code> table with Row-Level Security (RLS).</li>
              <li>Now, every change you make on your phone will sync instantly in real-time to your laptop!</li>
            </ol>
          </div>

          {/* Section 3: Table Notes Signature Features */}
          <div className="p-4 bg-amber-50/70 rounded-xl border border-amber-200">
            <div className="flex items-center gap-2 font-bold text-sm text-[#E65100] mb-2">
              <DollarSign size={18} />
              <span>3. Table Notes Spreadsheet & Live Sums</span>
            </div>
            <ul className="list-disc pl-5 space-y-1 text-gray-700 text-xs">
              <li><strong>Frozen Row Column:</strong> Numbered rows (1, 2, 3...) stay frozen as you scroll horizontally.</li>
              <li><strong>Orange-Red Amounts:</strong> Currency and numeric columns appear in bold <code>#E65100</code> with formatted decimals.</li>
              <li><strong>Sticky Σ Footer:</strong> Calculates the live sum of all numeric columns in real time.</li>
              <li><strong>Inline Editing:</strong> Tap any cell to edit immediately.</li>
            </ul>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-[#0D47A1] text-white font-bold text-xs hover:bg-blue-900 transition"
          >
            Got it, Let's Build!
          </button>
        </div>

      </div>
    </div>
  );
};
