import React, { useState } from 'react';
import { 
  Cloud, 
  X, 
  Copy, 
  Check, 
  Key, 
  Link, 
  ShieldCheck, 
  Database, 
  Lock, 
  Mail, 
  Sparkles,
  RefreshCw,
  Terminal
} from 'lucide-react';
import { SupabaseConfig } from '../types';
import { 
  SQL_SETUP_SCRIPT, 
  testSupabaseConnection, 
  saveSupabaseConfig,
  getSupabaseClient 
} from '../services/supabase';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: SupabaseConfig;
  onConfigSaved: (config: SupabaseConfig) => void;
  onTriggerSync: () => void;
}

export const SupabaseModal: React.FC<SupabaseModalProps> = ({
  isOpen,
  onClose,
  config,
  onConfigSaved,
  onTriggerSync
}) => {
  if (!isOpen) return null;

  const [url, setUrl] = useState(config.url || '');
  const [anonKey, setAnonKey] = useState(config.anonKey || '');
  const [email, setEmail] = useState(config.userEmail || 'umery1969@gmail.com');
  const [password, setPassword] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [authTab, setAuthTab] = useState<'signin' | 'signup' | 'offline'>('signin');
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  const handleCopySql = () => {
    navigator.clipboard.writeText(SQL_SETUP_SCRIPT);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handleTestAndSave = async () => {
    if (!url.trim() || !anonKey.trim()) {
      setStatusMessage({ type: 'error', text: 'Please enter both Supabase URL and Anon Public Key.' });
      return;
    }

    setIsTesting(true);
    setStatusMessage(null);

    const res = await testSupabaseConnection(url, anonKey);
    setIsTesting(false);

    if (res.success) {
      saveSupabaseConfig(url, anonKey, email);
      onConfigSaved({
        url: url.trim(),
        anonKey: anonKey.trim(),
        userEmail: email.trim(),
        isConnected: true
      });
      setStatusMessage({ type: 'success', text: res.message });
      onTriggerSync();
    } else {
      setStatusMessage({ type: 'error', text: res.message });
    }
  };

  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url || !anonKey) {
      setStatusMessage({ type: 'error', text: 'Please configure and save Supabase URL and Key first.' });
      return;
    }

    setIsAuthLoading(true);
    setStatusMessage(null);

    const client = getSupabaseClient();
    if (!client) {
      setIsAuthLoading(false);
      setStatusMessage({ type: 'error', text: 'Supabase client not initialized.' });
      return;
    }

    try {
      if (authTab === 'signup') {
        const { data, error } = await client.auth.signUp({
          email: email.trim(),
          password
        });
        if (error) throw error;
        setStatusMessage({ 
          type: 'success', 
          text: data.session ? 'Account created and signed in!' : 'Sign up email sent. Please check your inbox or sign in.' 
        });
        saveSupabaseConfig(url, anonKey, email);
        onConfigSaved({ url, anonKey, userEmail: email, isConnected: true });
      } else if (authTab === 'signin') {
        const { data, error } = await client.auth.signInWithPassword({
          email: email.trim(),
          password
        });
        if (error) throw error;
        setStatusMessage({ type: 'success', text: `Welcome back! Signed in as ${email}` });
        saveSupabaseConfig(url, anonKey, email);
        onConfigSaved({ url, anonKey, userEmail: email, isConnected: true });
        onTriggerSync();
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Authentication error' });
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleContinueOffline = () => {
    saveSupabaseConfig('', '', email || 'offline-user@local.app');
    onConfigSaved({
      url: '',
      anonKey: '',
      userEmail: email || 'offline-user@local.app',
      isConnected: false
    });
    setStatusMessage({ type: 'info', text: 'Now operating in Local Storage Mode.' });
    setTimeout(onClose, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <header className="bg-[#0D47A1] text-white px-5 py-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
              <Cloud size={20} className="text-white" />
            </div>
            <div>
              <h2 className="font-bold text-base tracking-tight">Supabase Cloud Sync & RLS</h2>
              <p className="text-[11px] text-blue-100/80">Multi-Device Real-Time Synchronization</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition"
          >
            <X size={20} />
          </button>
        </header>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 text-gray-800">
          
          {/* Status Alert Banner */}
          {statusMessage && (
            <div className={`p-3.5 rounded-xl text-xs font-medium flex items-start gap-2.5 ${
              statusMessage.type === 'success' 
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                : statusMessage.type === 'error'
                ? 'bg-red-50 text-red-800 border border-red-200'
                : 'bg-blue-50 text-blue-800 border border-blue-200'
            }`}>
              <ShieldCheck size={16} className="shrink-0 mt-0.5" />
              <span className="flex-1 leading-relaxed">{statusMessage.text}</span>
            </div>
          )}

          {/* Supabase URL & Anon Key Inputs */}
          <div className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">
                Supabase Project URL
              </label>
              <div className="relative flex items-center">
                <Link size={16} className="absolute left-3 text-gray-400" />
                <input
                  type="url"
                  placeholder="https://xyzcompany.supabase.co"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-300 focus:border-[#1976D2] focus:ring-2 focus:ring-blue-100 text-xs sm:text-sm font-mono outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">
                Supabase Anon Public Key
              </label>
              <div className="relative flex items-center">
                <Key size={16} className="absolute left-3 text-gray-400" />
                <input
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={anonKey}
                  onChange={(e) => setAnonKey(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-300 focus:border-[#1976D2] focus:ring-2 focus:ring-blue-100 text-xs sm:text-sm font-mono outline-none"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleTestAndSave}
              disabled={isTesting}
              className="w-full py-2.5 rounded-xl bg-[#1976D2] hover:bg-[#1565C0] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition active:scale-95 disabled:opacity-50"
            >
              {isTesting ? <RefreshCw size={14} className="animate-spin" /> : <Database size={14} />}
              <span>{isTesting ? 'Verifying Supabase Connection...' : 'Save & Test Cloud Connection'}</span>
            </button>
          </div>

          {/* Copy SQL Setup Script Button */}
          <div className="p-4 bg-slate-900 text-slate-100 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                <Terminal size={14} className="text-emerald-400" />
                <span>SQL Database Setup Script</span>
              </div>
              <button
                type="button"
                onClick={handleCopySql}
                className="px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1.5 transition active:scale-95"
              >
                {isCopied ? <Check size={12} /> : <Copy size={12} />}
                <span>{isCopied ? 'Copied SQL!' : 'Copy SQL Setup Script'}</span>
              </button>
            </div>
            <pre className="text-[11px] font-mono text-slate-400 overflow-x-auto p-2 bg-slate-950 rounded-lg max-h-24">
              {SQL_SETUP_SCRIPT}
            </pre>
            <p className="text-[10px] text-slate-400 mt-2">
              Runs with Row-Level Security (RLS) so each user securely manages only their own bots.
            </p>
          </div>

          {/* Authentication Flow (Sign In / Sign Up / Continue Offline) */}
          <div className="pt-2 border-t border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                User Authentication & Session
              </span>
              <div className="flex bg-gray-100 rounded-lg p-0.5 text-[11px] font-semibold">
                <button
                  type="button"
                  onClick={() => setAuthTab('signin')}
                  className={`px-2.5 py-1 rounded-md transition ${authTab === 'signin' ? 'bg-white text-[#0D47A1] shadow-xs' : 'text-gray-500'}`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setAuthTab('signup')}
                  className={`px-2.5 py-1 rounded-md transition ${authTab === 'signup' ? 'bg-white text-[#0D47A1] shadow-xs' : 'text-gray-500'}`}
                >
                  Sign Up
                </button>
              </div>
            </div>

            <form onSubmit={handleAuthAction} className="space-y-3">
              <div>
                <label className="block text-[11px] text-gray-500 mb-1">Email Address</label>
                <div className="relative flex items-center">
                  <Mail size={16} className="absolute left-3 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="you@domain.com"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-300 text-xs sm:text-sm outline-none focus:border-[#1976D2]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-gray-500 mb-1">Password</label>
                <div className="relative flex items-center">
                  <Lock size={16} className="absolute left-3 text-gray-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-300 text-xs sm:text-sm outline-none focus:border-[#1976D2]"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  disabled={isAuthLoading}
                  className="flex-1 py-2 rounded-xl bg-[#0D47A1] hover:bg-blue-900 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 disabled:opacity-50"
                >
                  {isAuthLoading ? <RefreshCw size={14} className="animate-spin" /> : null}
                  <span>{authTab === 'signin' ? 'Sign In with Supabase' : 'Create Supabase Account'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleContinueOffline}
                  className="px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs transition"
                  title="Work purely locally without cloud sync"
                >
                  Continue Offline (Local Mode)
                </button>
              </div>
            </form>
          </div>

        </div>

      </div>
    </div>
  );
};
