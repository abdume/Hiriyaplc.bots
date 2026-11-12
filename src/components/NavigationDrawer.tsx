import React from 'react';
import { 
  Bot, 
  Cloud, 
  KeyRound, 
  Download, 
  Settings, 
  Share2, 
  HelpCircle, 
  LogOut, 
  FileCode, 
  User, 
  X,
  ExternalLink,
  ShieldCheck,
  BarChart3
} from 'lucide-react';
import { SupabaseConfig } from '../types';

interface NavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  supabaseConfig: SupabaseConfig;
  onNavigate: (view: 'all_bots' | 'reports' | 'supabase' | 'telegram' | 'backup' | 'settings' | 'help' | 'export_html') => void;
  onSignOut: () => void;
  onShareApp: () => void;
}

export const NavigationDrawer: React.FC<NavigationDrawerProps> = ({
  isOpen,
  onClose,
  supabaseConfig,
  onNavigate,
  onSignOut,
  onShareApp
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Drawer Content */}
      <div className="relative w-80 max-w-[85vw] bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-300">
        
        {/* Geometric Header Banner */}
        <div className="drawer-geometric-bg p-5 text-white flex flex-col justify-end min-h-[168px] relative">
          <button 
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition"
            aria-label="Close drawer"
          >
            <X size={20} />
          </button>

          {/* User Avatar Circle */}
          <div className="w-16 h-16 rounded-full bg-white shadow-md flex items-center justify-center mb-3 border-2 border-white/50">
            <User size={32} className="text-[#0D47A1]" />
          </div>

          <div className="text-xs uppercase tracking-wider text-amber-200 font-semibold mb-0.5 flex items-center gap-1.5">
            <ShieldCheck size={14} />
            {supabaseConfig.isConnected ? 'Cloud Sync Active' : 'Local Storage Mode'}
          </div>
          
          <div className="text-xs text-white/80">Signed In as</div>
          <div className="font-bold text-sm text-white truncate drop-shadow-xs">
            {supabaseConfig.userEmail || 'umery1969@gmail.com'}
          </div>
        </div>

        {/* Drawer Menu Items */}
        <div className="flex-1 overflow-y-auto py-3 space-y-1">
          <button
            onClick={() => { onNavigate('all_bots'); onClose(); }}
            className="w-full flex items-center gap-4 px-5 py-3 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-[#0D47A1] transition text-left"
          >
            <Bot size={20} className="text-[#0D47A1]" />
            <span>Manage Bots</span>
          </button>

          <button
            onClick={() => { onNavigate('reports'); onClose(); }}
            className="w-full flex items-center justify-between px-5 py-3 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-[#0D47A1] transition text-left"
          >
            <div className="flex items-center gap-4">
              <span className="p-1 rounded-md bg-amber-100 text-[#E65100]">
                <BarChart3 size={16} />
              </span>
              <div>
                <div className="font-semibold text-gray-900">Daily, Weekly & Monthly Reports</div>
                <div className="text-[11px] text-gray-500">Customer ledger, paid & balances</div>
              </div>
            </div>
            <span className="text-[10px] bg-blue-100 text-[#0D47A1] font-bold px-1.5 py-0.5 rounded">NEW</span>
          </button>

          <button
            onClick={() => { onNavigate('supabase'); onClose(); }}
            className="w-full flex items-center justify-between px-5 py-3 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-[#0D47A1] transition text-left"
          >
            <div className="flex items-center gap-4">
              <Cloud size={20} className="text-[#1976D2]" />
              <span>Cloud Sync / Supabase</span>
            </div>
            {supabaseConfig.isConnected ? (
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-200" />
            ) : (
              <span className="text-[11px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-normal">Offline</span>
            )}
          </button>

          <button
            onClick={() => { onNavigate('telegram'); onClose(); }}
            className="w-full flex items-center gap-4 px-5 py-3 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-[#0D47A1] transition text-left"
          >
            <KeyRound size={20} className="text-[#0288D1]" />
            <span>Connect Telegram Token</span>
          </button>

          <button
            onClick={() => { onNavigate('backup'); onClose(); }}
            className="w-full flex items-center gap-4 px-5 py-3 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-[#0D47A1] transition text-left"
          >
            <Download size={20} className="text-[#00897B]" />
            <span>Backup Bots (JSON)</span>
          </button>

          <button
            onClick={() => { onNavigate('export_html'); onClose(); }}
            className="w-full flex items-center gap-4 px-5 py-3 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-[#0D47A1] transition text-left"
          >
            <FileCode size={20} className="text-[#E65100]" />
            <span>Export Standalone HTML</span>
          </button>

          <div className="border-t border-gray-100 my-2 pt-2">
            <button
              onClick={() => { onNavigate('settings'); onClose(); }}
              className="w-full flex items-center gap-4 px-5 py-3 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-[#0D47A1] transition text-left"
            >
              <Settings size={20} className="text-gray-500" />
              <span>Bot Settings</span>
            </button>

            <button
              onClick={() => { onShareApp(); onClose(); }}
              className="w-full flex items-center gap-4 px-5 py-3 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-[#0D47A1] transition text-left"
            >
              <Share2 size={20} className="text-gray-500" />
              <span>Share App</span>
            </button>

            <button
              onClick={() => { onNavigate('help'); onClose(); }}
              className="w-full flex items-center gap-4 px-5 py-3 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-[#0D47A1] transition text-left"
            >
              <HelpCircle size={20} className="text-gray-500" />
              <span>Help & Setup Guide</span>
            </button>
          </div>
        </div>

        {/* Footer / Sign Out */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={() => { onSignOut(); onClose(); }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-sm font-medium transition"
          >
            <LogOut size={18} />
            <span>{supabaseConfig.isConnected ? 'Sign Out / Disconnect' : 'Switch User / Reset'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
