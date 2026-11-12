import React, { useState } from 'react';
import { 
  Bot, 
  X, 
  Send, 
  Key, 
  RefreshCw, 
  Check, 
  AlertCircle, 
  Play, 
  Radio, 
  MessageSquare, 
  Sparkles, 
  Users,
  Copy,
  ExternalLink,
  Zap
} from 'lucide-react';
import { BotTable, BotRow } from '../types';
import { 
  checkTelegramToken, 
  fetchTelegramUpdates, 
  sendTelegramMessage, 
  simulateTelegramMessage,
  TelegramBotInfo 
} from '../services/telegram';

interface TelegramModalProps {
  isOpen: boolean;
  onClose: () => void;
  bot: BotTable;
  onUpdateBot: (updatedBot: BotTable) => void;
  initialTab?: 'token' | 'broadcast' | 'simulator';
}

export const TelegramModal: React.FC<TelegramModalProps> = ({
  isOpen,
  onClose,
  bot,
  onUpdateBot,
  initialTab = 'token'
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'token' | 'broadcast' | 'simulator'>(initialTab);
  const [tokenInput, setTokenInput] = useState(bot.telegramToken || '');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Broadcast state
  const [targetChatId, setTargetChatId] = useState<string>('all');
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [deliveryLogs, setDeliveryLogs] = useState<string[]>([]);

  // Simulator state
  const [simCommand, setSimCommand] = useState('/donate 35.00');
  const [simUsername, setSimUsername] = useState('@alex_tester');
  const [simChatHistory, setSimChatHistory] = useState<Array<{ sender: 'user' | 'bot'; text: string; time: string }>>([
    { sender: 'user', text: '/start', time: '10:00' },
    { sender: 'bot', text: `🤖 Welcome to <b>${bot.name}</b>! Real-time table logging is active.`, time: '10:00' }
  ]);

  // Extract unique chat IDs from bot rows
  const chatIds = Array.from(
    new Set(
      bot.rows
        .map(row => {
          // Look for chat id or user handle in row values
          for (const key of Object.keys(row)) {
            if (key === 'id') continue;
            const strVal = String(row[key]);
            const match = strVal.match(/^([0-9]{6,12})/);
            if (match) return match[1];
          }
          return null;
        })
        .filter(Boolean) as string[]
    )
  );

  const handleVerifyToken = async () => {
    if (!tokenInput.trim()) {
      setStatusMessage({ type: 'error', text: 'Please enter a Telegram Bot Token.' });
      return;
    }

    setIsVerifying(true);
    setStatusMessage(null);

    const res = await checkTelegramToken(tokenInput);
    setIsVerifying(false);

    if (res.success && res.bot) {
      const updatedBot: BotTable = {
        ...bot,
        telegramToken: tokenInput.trim(),
        botUsername: `@${res.bot.username}`,
        botStatus: 'online',
        updatedAt: new Date().toISOString()
      };
      onUpdateBot(updatedBot);
      setStatusMessage({
        type: 'success',
        text: `Connected to @${res.bot.username} (${res.bot.first_name})! Bot is now ONLINE.`
      });
    } else {
      setStatusMessage({
        type: 'error',
        text: res.error || 'Failed to verify token with Telegram API'
      });
    }
  };

  const handleSyncUpdates = async () => {
    if (!bot.telegramToken) {
      setStatusMessage({ type: 'error', text: 'Please connect a valid Bot Token first, or use the Simulator tab.' });
      return;
    }

    setIsSyncing(true);
    setStatusMessage(null);

    const res = await fetchTelegramUpdates(bot.telegramToken);
    setIsSyncing(false);

    if (res.success && res.updates) {
      if (res.updates.length === 0) {
        setStatusMessage({ type: 'info', text: 'No new incoming messages from Telegram. Send a message to your bot in Telegram and sync again!' });
        return;
      }

      // Convert updates to rows
      const newRows: BotRow[] = [];
      res.updates.forEach(u => {
        if (!u.message) return;
        const msg = u.message;
        const from = msg.from;
        const userIdStr = from ? `${from.id} ${from.username ? '@' + from.username : from.first_name}` : String(msg.chat.id);
        const textStr = msg.text || '[Media / Command]';
        const dateStr = new Date(msg.date * 1000).toISOString().slice(0, 16).replace('T', ' ');

        // Find amount if present
        const amtMatch = textStr.match(/(?:\$|£|€)?\s*([0-9]+(?:\.[0-9]{1,2})?)/);
        const numVal = amtMatch ? parseFloat(amtMatch[1]) : 10.00;

        const row: BotRow = {
          id: 'tg_msg_' + u.update_id
        };

        bot.columns.forEach(col => {
          if (col.type === 'amount' || col.type === 'number') {
            row[col.id] = numVal;
          } else if (col.type === 'date') {
            row[col.id] = dateStr;
          } else if (col.type === 'checkbox') {
            row[col.id] = true;
          } else if (col.name.toLowerCase().includes('user') || col.name.toLowerCase().includes('chat')) {
            row[col.id] = userIdStr;
          } else if (col.name.toLowerCase().includes('status')) {
            row[col.id] = 'Received';
          } else {
            row[col.id] = textStr;
          }
        });

        newRows.push(row);
      });

      if (newRows.length > 0) {
        onUpdateBot({
          ...bot,
          rows: [...newRows, ...bot.rows],
          updatedAt: new Date().toISOString()
        });
        setStatusMessage({
          type: 'success',
          text: `Synced ${newRows.length} incoming messages directly into table rows!`
        });
      }
    } else {
      setStatusMessage({ type: 'error', text: res.error || 'Failed to fetch updates from Telegram' });
    }
  };

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    if (!bot.telegramToken) {
      // In simulator mode, simulate broadcast
      setIsSending(true);
      setDeliveryLogs(prev => [
        `[SIMULATOR] Broadcast sent to ${targetChatId === 'all' ? 'All chat IDs' : targetChatId}: "${messageText}"`,
        ...prev
      ]);
      setTimeout(() => {
        setIsSending(false);
        setMessageText('');
        setStatusMessage({ type: 'success', text: 'Simulated broadcast message delivered successfully!' });
      }, 500);
      return;
    }

    setIsSending(true);
    setDeliveryLogs([]);
    const targetList = targetChatId === 'all' ? (chatIds.length > 0 ? chatIds : ['5561234']) : [targetChatId];

    let successCount = 0;
    for (const cid of targetList) {
      const res = await sendTelegramMessage(bot.telegramToken, cid, messageText);
      if (res.success) {
        successCount++;
        setDeliveryLogs(prev => [`✅ Delivered to Chat ID ${cid}`, ...prev]);
      } else {
        setDeliveryLogs(prev => [`❌ Failed to Chat ID ${cid}: ${res.error}`, ...prev]);
      }
    }

    setIsSending(false);
    setMessageText('');
    setStatusMessage({
      type: successCount > 0 ? 'success' : 'error',
      text: `Broadcast complete: ${successCount} / ${targetList.length} messages delivered.`
    });
  };

  const handleRunSimulator = () => {
    if (!simCommand.trim()) return;

    const interaction = simulateTelegramMessage(bot.name, simCommand, simUsername);
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setSimChatHistory(prev => [
      ...prev,
      { sender: 'user', text: interaction.userMessage, time: nowTime },
      { sender: 'bot', text: interaction.botReply, time: nowTime }
    ]);

    // Automatically append row into table!
    const newRow: BotRow = {
      id: 'sim_row_' + Date.now()
    };

    bot.columns.forEach(col => {
      if (col.type === 'amount' || col.type === 'number') {
        newRow[col.id] = interaction.extractedData.amount || 25.00;
      } else if (col.type === 'date') {
        newRow[col.id] = interaction.extractedData.timestamp;
      } else if (col.type === 'checkbox') {
        newRow[col.id] = true;
      } else if (col.name.toLowerCase().includes('user') || col.name.toLowerCase().includes('chat')) {
        newRow[col.id] = interaction.extractedData.userId;
      } else if (col.name.toLowerCase().includes('status')) {
        newRow[col.id] = interaction.extractedData.status;
      } else {
        newRow[col.id] = interaction.extractedData.commandOrText;
      }
    });

    onUpdateBot({
      ...bot,
      rows: [newRow, ...bot.rows],
      updatedAt: new Date().toISOString()
    });

    setSimCommand('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <header className="bg-[#0D47A1] text-white px-5 py-3.5 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
              <Bot size={18} className="text-white" />
            </div>
            <div>
              <h2 className="font-bold text-sm sm:text-base tracking-tight">{bot.name} • Telegram Bot API</h2>
              <span className="text-[10px] text-blue-200">Official REST API & Live Test Simulator</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition"
          >
            <X size={20} />
          </button>
        </header>

        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-200 bg-gray-50 text-xs font-bold text-gray-600">
          <button
            onClick={() => setActiveTab('token')}
            className={`flex-1 py-3 text-center border-b-2 transition flex items-center justify-center gap-1.5 ${
              activeTab === 'token' ? 'border-[#0D47A1] text-[#0D47A1] bg-white' : 'border-transparent hover:text-gray-900'
            }`}
          >
            <Key size={14} />
            <span>Bot Token</span>
          </button>

          <button
            onClick={() => setActiveTab('simulator')}
            className={`flex-1 py-3 text-center border-b-2 transition flex items-center justify-center gap-1.5 ${
              activeTab === 'simulator' ? 'border-[#0D47A1] text-[#0D47A1] bg-white' : 'border-transparent hover:text-gray-900'
            }`}
          >
            <Sparkles size={14} className="text-amber-500" />
            <span>Test Simulator</span>
          </button>

          <button
            onClick={() => setActiveTab('broadcast')}
            className={`flex-1 py-3 text-center border-b-2 transition flex items-center justify-center gap-1.5 ${
              activeTab === 'broadcast' ? 'border-[#0D47A1] text-[#0D47A1] bg-white' : 'border-transparent hover:text-gray-900'
            }`}
          >
            <Send size={14} />
            <span>Broadcast</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-gray-800">
          
          {/* Status Alert */}
          {statusMessage && (
            <div className={`p-3 rounded-xl text-xs font-medium flex items-start gap-2.5 ${
              statusMessage.type === 'success' 
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                : statusMessage.type === 'error'
                ? 'bg-red-50 text-red-800 border border-red-200'
                : 'bg-blue-50 text-blue-800 border border-blue-200'
            }`}>
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span className="flex-1 leading-relaxed">{statusMessage.text}</span>
            </div>
          )}

          {/* TAB 1: Bot Token & Fetch Updates */}
          {activeTab === 'token' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">
                  Telegram Bot API Token (from @BotFather)
                </label>
                <div className="relative flex items-center">
                  <Key size={16} className="absolute left-3 text-gray-400" />
                  <input
                    type="password"
                    placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ..."
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-300 font-mono text-xs sm:text-sm focus:border-[#1976D2] outline-none"
                  />
                </div>
                <p className="text-[11px] text-gray-500 mt-1">
                  Open Telegram, search for <strong>@BotFather</strong>, send <code>/newbot</code>, and paste the API token here.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleVerifyToken}
                  disabled={isVerifying}
                  className="flex-1 py-2.5 rounded-xl bg-[#1976D2] hover:bg-[#1565C0] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 disabled:opacity-50"
                >
                  {isVerifying ? <RefreshCw size={14} className="animate-spin" /> : <Zap size={14} />}
                  <span>{isVerifying ? 'Verifying Token...' : 'Connect & Verify Bot'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSyncUpdates}
                  disabled={isSyncing}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 disabled:opacity-50"
                  title="Pull incoming user messages into table"
                >
                  <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
                  <span>Sync Telegram Messages</span>
                </button>
              </div>

              {/* Bot Info Card */}
              {bot.botUsername && (
                <div className="p-3.5 bg-blue-50/70 rounded-xl border border-blue-200 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-[#0D47A1] uppercase">Linked Telegram Bot</span>
                    <div className="font-bold text-sm text-gray-800">{bot.botUsername}</div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                    ONLINE
                  </span>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Test Bot Simulator */}
          {activeTab === 'simulator' && (
            <div className="space-y-3">
              <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 leading-relaxed">
                💡 <strong>Instant Bot Simulator:</strong> Type a command or simulated message below. The simulator generates bot replies and automatically creates a new row in your spreadsheet!
              </div>

              {/* Chat Simulation Window */}
              <div className="h-52 bg-slate-900 rounded-xl p-3 overflow-y-auto space-y-2 border border-slate-800 flex flex-col">
                {simChatHistory.map((item, idx) => (
                  <div
                    key={idx}
                    className={`max-w-[85%] rounded-xl px-3 py-1.5 text-xs ${
                      item.sender === 'user' 
                        ? 'bg-[#1976D2] text-white self-end rounded-tr-none' 
                        : 'bg-slate-800 text-slate-100 self-start rounded-tl-none border border-slate-700'
                    }`}
                  >
                    <div dangerouslySetInnerHTML={{ __html: item.text }} />
                    <span className="text-[9px] opacity-60 block text-right mt-0.5">{item.time}</span>
                  </div>
                ))}
              </div>

              {/* Quick preset commands */}
              <div className="flex gap-1.5 flex-wrap">
                {['/start', '/help', '/donate 50.00', '/order 89.99', '/alert BTC 98000'].map((cmd) => (
                  <button
                    key={cmd}
                    type="button"
                    onClick={() => setSimCommand(cmd)}
                    className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-mono text-[11px] rounded-md transition"
                  >
                    {cmd}
                  </button>
                ))}
              </div>

              {/* Simulator Input Form */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type a command e.g. /order 49.99"
                  value={simCommand}
                  onChange={(e) => setSimCommand(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleRunSimulator()}
                  className="flex-1 px-3 py-2 rounded-xl border border-gray-300 text-xs sm:text-sm outline-none focus:border-[#1976D2]"
                />
                <button
                  type="button"
                  onClick={handleRunSimulator}
                  className="px-4 py-2 rounded-xl bg-[#0D47A1] hover:bg-blue-900 text-white font-bold text-xs flex items-center gap-1.5 transition active:scale-95"
                >
                  <Send size={14} />
                  <span>Send</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: Broadcast Message */}
          {activeTab === 'broadcast' && (
            <form onSubmit={handleBroadcast} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">
                  Target Recipient
                </label>
                <select
                  value={targetChatId}
                  onChange={(e) => setTargetChatId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-xs sm:text-sm font-medium outline-none focus:border-[#1976D2]"
                >
                  <option value="all">Broadcast to All Users in Table ({chatIds.length} detected)</option>
                  {chatIds.map(cid => (
                    <option key={cid} value={cid}>Chat ID: {cid}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">
                  Message Content (HTML supported)
                </label>
                <textarea
                  rows={4}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="e.g. 📢 Important Update: Your alert threshold has been reached!"
                  className="w-full p-3 rounded-xl border border-gray-300 text-xs sm:text-sm outline-none focus:border-[#1976D2]"
                />
              </div>

              <button
                type="submit"
                disabled={isSending || !messageText.trim()}
                className="w-full py-2.5 rounded-xl bg-[#0D47A1] hover:bg-blue-900 text-white font-bold text-xs flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-50"
              >
                {isSending ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                <span>{isSending ? 'Sending Broadcast...' : 'Send Broadcast Message'}</span>
              </button>

              {deliveryLogs.length > 0 && (
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs font-mono space-y-1 max-h-32 overflow-y-auto">
                  {deliveryLogs.map((log, i) => (
                    <div key={i} className="text-gray-700">{log}</div>
                  ))}
                </div>
              )}
            </form>
          )}

        </div>

      </div>
    </div>
  );
};
