/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  BotTable, 
  ColumnDef, 
  SupabaseConfig, 
  SyncStatus, 
  BotRow 
} from './types';
import { initialBots } from './data/initialBots';
import { BotCardGrid } from './components/BotCardGrid';
import { TableView } from './components/TableView';
import { NavigationDrawer } from './components/NavigationDrawer';
import { ColumnPropertiesModal } from './components/ColumnPropertiesModal';
import { SupabaseModal } from './components/SupabaseModal';
import { TelegramModal } from './components/TelegramModal';
import { PivotGraphModal } from './components/PivotGraphModal';
import { FilterModal } from './components/FilterModal';
import { BotSettingsModal } from './components/BotSettingsModal';
import { HelpModal } from './components/HelpModal';
import { ReportsModal } from './components/ReportsModal';
import { 
  getSavedSupabaseConfig, 
  syncBotToSupabase, 
  fetchBotsFromSupabase, 
  subscribeToRealtimeChanges, 
  saveSupabaseConfig,
  deleteBotFromSupabase
} from './services/supabase';
import { downloadStandaloneHtmlFile } from './utils/exportHtml';

const LOCAL_STORAGE_BOTS_KEY = 'tablebot_data_bots';

export default function App() {
  // Load initial bots from localStorage or fallback to initialBots
  const [bots, setBots] = useState<BotTable[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_BOTS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse local bots:', e);
    }
    return initialBots;
  });

  const [activeBotId, setActiveBotId] = useState<string | null>(null);
  const [supabaseConfig, setSupabaseConfig] = useState<SupabaseConfig>(getSavedSupabaseConfig);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(supabaseConfig.isConnected ? 'syncing' : 'local');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [isTelegramModalOpen, setIsTelegramModalOpen] = useState(false);
  const [telegramModalTab, setTelegramModalTab] = useState<'token' | 'broadcast' | 'simulator'>('token');
  const [botForSettings, setBotForSettings] = useState<BotTable | null>(null);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isPivotGraphOpen, setIsPivotGraphOpen] = useState(false);
  const [isReportsModalOpen, setIsReportsModalOpen] = useState(false);
  const [selectedColumnForEdit, setSelectedColumnForEdit] = useState<ColumnDef | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Save to localStorage whenever bots change
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_BOTS_KEY, JSON.stringify(bots));
    } catch (e) {
      console.error('Failed to save bots to localStorage', e);
    }
  }, [bots]);

  // Supabase Real-time Cloud Sync & initial fetch
  useEffect(() => {
    if (!supabaseConfig.isConnected) {
      setSyncStatus('local');
      return;
    }

    let unsubscribe = () => {};

    const initCloud = async () => {
      setSyncStatus('syncing');
      try {
        const cloudBots = await fetchBotsFromSupabase();
        if (cloudBots && cloudBots.length > 0) {
          setBots(cloudBots);
        } else {
          // If Supabase table is empty, upload current initial bots
          for (const b of bots) {
            await syncBotToSupabase(b);
          }
        }
        setSyncStatus('synced');

        // Subscribe to real-time changes from other tabs/devices
        unsubscribe = subscribeToRealtimeChanges(
          (upsertedBot) => {
            setBots(prev => {
              const idx = prev.findIndex(b => b.id === upsertedBot.id);
              if (idx >= 0) {
                const copy = [...prev];
                copy[idx] = upsertedBot;
                return copy;
              }
              return [upsertedBot, ...prev];
            });
            showToast(`Real-time update: ${upsertedBot.name}`);
          },
          (deletedBotId) => {
            setBots(prev => prev.filter(b => b.id !== deletedBotId));
          }
        );
      } catch (err) {
        console.error('Supabase init error:', err);
        setSyncStatus('error');
      }
    };

    initCloud();

    return () => {
      unsubscribe();
    };
  }, [supabaseConfig.isConnected, supabaseConfig.url, supabaseConfig.anonKey]);

  // Helper to sync single bot change to Supabase
  const pushBotToSupabase = useCallback(async (botToSync: BotTable) => {
    if (!supabaseConfig.isConnected) return;
    setSyncStatus('syncing');
    const success = await syncBotToSupabase(botToSync);
    setSyncStatus(success ? 'synced' : 'error');
  }, [supabaseConfig.isConnected]);

  // Bot updates handler
  const handleUpdateBot = (updatedBot: BotTable) => {
    setBots(prev => prev.map(b => b.id === updatedBot.id ? updatedBot : b));
    pushBotToSupabase(updatedBot);
  };

  const handleInstantCreateNewBot = () => {
    const existingNames = new Set(bots.map(b => b.name));
    let botName = 'New Bot';
    if (existingNames.has(botName)) {
      let counter = 2;
      while (existingNames.has(`New Bot ${counter}`)) {
        counter++;
      }
      botName = `New Bot ${counter}`;
    }

    const nowId = Date.now();
    const newBot: BotTable = {
      id: 'bot_' + nowId,
      name: botName,
      description: 'Telegram Bot & Live Table',
      folder: 'General',
      telegramToken: '',
      botStatus: 'simulator',
      isFavorite: false,
      updatedAt: new Date().toISOString(),
      columns: [
        {
          id: `col_uid_${nowId}`,
          name: 'User ID',
          type: 'text',
          widthMultiplier: 1.0,
          currency: 'None',
          thousandSeparator: false,
          decimals: 0,
          style: { bold: false, italic: false, align: 'left', color: '#1E293B', bgColor: '#FFFFFF' },
          includeInGraph: true
        },
        {
          id: `col_uname_${nowId}`,
          name: 'Username',
          type: 'text',
          widthMultiplier: 1.1,
          currency: 'None',
          thousandSeparator: false,
          decimals: 0,
          style: { bold: false, italic: false, align: 'left', color: '#0D47A1', bgColor: '#FFFFFF' },
          includeInGraph: true
        },
        {
          id: `col_msg_${nowId}`,
          name: 'Message',
          type: 'text',
          widthMultiplier: 1.5,
          currency: 'None',
          thousandSeparator: false,
          decimals: 0,
          style: { bold: false, italic: false, align: 'left', color: '#1E293B', bgColor: '#FFFFFF' },
          includeInGraph: false
        },
        {
          id: `col_amt_${nowId}`,
          name: 'Amount',
          type: 'amount',
          widthMultiplier: 1.1,
          currency: '$',
          thousandSeparator: true,
          decimals: 2,
          style: { bold: true, italic: false, align: 'right', color: '#E65100', bgColor: '#FFFFFF' },
          includeInGraph: true
        }
      ],
      rows: []
    };

    setBots(prev => [newBot, ...prev]);
    pushBotToSupabase(newBot);
    showToast(`Created "${botName}" — tap headers or settings to customize`);
    setActiveBotId(newBot.id);
  };

  const handleCreateBlankBot = () => {
    const existingNames = new Set(bots.map(b => b.name));
    let blankName = `Blank Table ${bots.length + 1}`;
    if (existingNames.has(blankName)) {
      blankName = `Blank Table ${Date.now().toString().slice(-4)}`;
    }

    const nowId = Date.now();
    const blankBot: BotTable = {
      id: 'bot_' + nowId,
      name: blankName,
      description: 'Quick-created blank spreadsheet table',
      folder: 'General',
      telegramToken: '',
      botStatus: 'simulator',
      isFavorite: false,
      updatedAt: new Date().toISOString(),
      columns: [
        {
          id: 'c_user',
          name: 'User ID',
          type: 'text',
          widthMultiplier: 1.1,
          currency: 'None',
          thousandSeparator: false,
          decimals: 0,
          style: { bold: false, italic: false, align: 'left', color: '#1E293B', bgColor: '#FFFFFF' },
          includeInGraph: true
        },
        {
          id: 'c_uname',
          name: 'Username',
          type: 'text',
          widthMultiplier: 1.1,
          currency: 'None',
          thousandSeparator: false,
          decimals: 0,
          style: { bold: false, italic: false, align: 'left', color: '#0D47A1', bgColor: '#FFFFFF' },
          includeInGraph: true
        },
        {
          id: 'c_msg',
          name: 'Message',
          type: 'text',
          widthMultiplier: 1.4,
          currency: 'None',
          thousandSeparator: false,
          decimals: 0,
          style: { bold: false, italic: false, align: 'left', color: '#1E293B', bgColor: '#FFFFFF' },
          includeInGraph: false
        },
        {
          id: 'c_amt',
          name: 'Amount',
          type: 'amount',
          widthMultiplier: 1.1,
          currency: '$',
          thousandSeparator: true,
          decimals: 2,
          style: { bold: true, italic: false, align: 'right', color: '#E65100', bgColor: '#FFFFFF' },
          includeInGraph: true
        }
      ],
      rows: []
    };

    setBots(prev => [blankBot, ...prev]);
    pushBotToSupabase(blankBot);
    showToast(`Created "${blankBot.name}"`);
    setActiveBotId(blankBot.id);
  };

  const handleDeleteBot = async (botId: string) => {
    const target = bots.find(b => b.id === botId);
    if (!target) return;
    if (confirm(`Are you sure you want to delete "${target.name}"?`)) {
      setBots(prev => prev.filter(b => b.id !== botId));
      if (activeBotId === botId) setActiveBotId(null);
      if (supabaseConfig.isConnected) {
        await deleteBotFromSupabase(botId);
      }
      showToast(`Deleted "${target.name}"`);
    }
  };

  const handleDuplicateBot = (botId: string) => {
    const target = bots.find(b => b.id === botId);
    if (!target) return;
    const duplicated: BotTable = {
      ...target,
      id: 'bot_' + Date.now(),
      name: `${target.name} (Copy)`,
      updatedAt: new Date().toISOString()
    };
    setBots(prev => [duplicated, ...prev]);
    pushBotToSupabase(duplicated);
    showToast(`Duplicated "${target.name}"`);
  };

  const handleRenameBot = (botId: string) => {
    const target = bots.find(b => b.id === botId);
    if (!target) return;
    setBotForSettings(target);
  };

  const handleAddColumnToActiveBot = () => {
    const activeBot = bots.find(b => b.id === activeBotId);
    if (!activeBot) return;

    const colName = `Column ${activeBot.columns.length + 1}`;

    const newCol: ColumnDef = {
      id: 'col_' + Date.now(),
      name: colName,
      type: 'text',
      widthMultiplier: 1.0,
      currency: 'None',
      thousandSeparator: false,
      decimals: 0,
      style: { bold: false, italic: false, align: 'left', color: '#1E293B', bgColor: '#FFFFFF' },
      includeInGraph: true
    };

    const updated: BotTable = {
      ...activeBot,
      columns: [...activeBot.columns, newCol],
      updatedAt: new Date().toISOString()
    };

    handleUpdateBot(updated);
    showToast(`Added "${colName}" — tap header to rename or edit`);
  };

  const handleSaveColumnProperties = (updatedCol: ColumnDef) => {
    const activeBot = bots.find(b => b.id === activeBotId);
    if (!activeBot) return;

    const updatedCols = activeBot.columns.map(c => c.id === updatedCol.id ? updatedCol : c);
    const updated: BotTable = {
      ...activeBot,
      columns: updatedCols,
      updatedAt: new Date().toISOString()
    };
    handleUpdateBot(updated);
    setSelectedColumnForEdit(null);
    showToast(`Updated properties for "${updatedCol.name}"`);
  };

  // CSV Export for bot table
  const handleExportCsv = (bot: BotTable) => {
    const headers = bot.columns.map(c => `"${c.name.replace(/"/g, '""')}"`).join(',');
    const rows = bot.rows.map(r => {
      return bot.columns.map(c => {
        const val = r[c.id];
        return `"${String(val !== undefined ? val : '').replace(/"/g, '""')}"`;
      }).join(',');
    }).join('\n');

    const csvContent = `${headers}\n${rows}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${bot.name.replace(/\s+/g, '_')}_data.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`Exported ${bot.name} to CSV`);
  };

  // Backup Bots as downloadable JSON
  const handleExportJsonBackup = () => {
    const jsonStr = JSON.stringify(bots, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TableBot_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Downloaded full bots JSON backup');
  };

  // Drawer Navigation router
  const handleDrawerNavigate = (view: string) => {
    switch (view) {
      case 'all_bots':
        setActiveBotId(null);
        break;
      case 'reports':
        setIsReportsModalOpen(true);
        break;
      case 'supabase':
        setIsSupabaseModalOpen(true);
        break;
      case 'telegram':
        setTelegramModalTab('token');
        setIsTelegramModalOpen(true);
        break;
      case 'backup':
        handleExportJsonBackup();
        break;
      case 'export_html':
        downloadStandaloneHtmlFile(bots);
        showToast('Exported Standalone Single-File HTML');
        break;
      case 'help':
        setIsHelpModalOpen(true);
        break;
      case 'settings': {
        const target = bots.find(b => b.id === activeBotId) || bots[0];
        if (target) {
          setBotForSettings(target);
        } else {
          showToast('Create a bot first to configure settings');
        }
        break;
      }
      default:
        break;
    }
  };

  const handleSignOut = () => {
    saveSupabaseConfig('', '', 'local-user@tablebot.app');
    setSupabaseConfig({
      url: '',
      anonKey: '',
      userEmail: 'local-user@tablebot.app',
      isConnected: false
    });
    setSyncStatus('local');
    showToast('Signed out. Local Storage mode active.');
  };

  const handleShareApp = () => {
    if (navigator.share) {
      navigator.share({
        title: 'TableBot - Telegram Bot Manager & Cloud Database',
        text: 'Manage Telegram bots with Table Notes spreadsheet view & Supabase sync!',
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToast('App link copied to clipboard!');
    }
  };

  const activeBot = bots.find(b => b.id === activeBotId);

  return (
    <div className="min-h-screen bg-[#F4F6F9] text-gray-900 font-sans antialiased">
      
      {/* Toast Banner */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-full shadow-2xl animate-in fade-in slide-in-from-top-4 duration-200 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Screen 1: Spreadsheet Table View */}
      {activeBot ? (
        <TableView
          bot={activeBot}
          onBack={() => setActiveBotId(null)}
          onUpdateBot={handleUpdateBot}
          onOpenColumnProperties={(col) => setSelectedColumnForEdit(col)}
          onOpenLiveTester={() => {
            setTelegramModalTab('simulator');
            setIsTelegramModalOpen(true);
          }}
          onOpenFilterModal={() => setIsFilterModalOpen(true)}
          onOpenPivotGraph={() => setIsPivotGraphOpen(true)}
          onOpenReports={() => setIsReportsModalOpen(true)}
          onOpenBotSettings={() => setBotForSettings(activeBot)}
          onExportCsv={() => handleExportCsv(activeBot)}
          onAddColumn={handleAddColumnToActiveBot}
        />
      ) : (
        /* Screen 2: Main Dashboard ("All Bots") */
        <BotCardGrid
          bots={bots}
          onOpenDrawer={() => setIsDrawerOpen(true)}
          onOpenReports={() => setIsReportsModalOpen(true)}
          onSelectBot={(id) => setActiveBotId(id)}
          onCreateBlankBot={handleCreateBlankBot}
          onCreateNewBot={handleInstantCreateNewBot}
          onDeleteBot={handleDeleteBot}
          onDuplicateBot={handleDuplicateBot}
          onRenameBot={handleRenameBot}
          onExportCsv={handleExportCsv}
          syncStatus={syncStatus}
        />
      )}

      {/* Left Slide-Out Navigation Drawer */}
      <NavigationDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        supabaseConfig={supabaseConfig}
        onNavigate={handleDrawerNavigate}
        onSignOut={handleSignOut}
        onShareApp={handleShareApp}
      />

      {/* Edit Column Properties Modal */}
      {selectedColumnForEdit && (
        <ColumnPropertiesModal
          column={selectedColumnForEdit}
          isOpen={Boolean(selectedColumnForEdit)}
          onClose={() => setSelectedColumnForEdit(null)}
          onSave={handleSaveColumnProperties}
          onOpenPivotGraph={() => {
            setSelectedColumnForEdit(null);
            setIsPivotGraphOpen(true);
          }}
        />
      )}

      {/* Supabase Cloud Sync Modal */}
      <SupabaseModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
        config={supabaseConfig}
        onConfigSaved={(updatedCfg) => {
          setSupabaseConfig(updatedCfg);
          setSyncStatus(updatedCfg.isConnected ? 'synced' : 'local');
          showToast(updatedCfg.isConnected ? 'Connected to Supabase Cloud!' : 'Operating in Local Mode');
        }}
        onTriggerSync={() => {
          if (bots.length > 0) {
            bots.forEach(b => pushBotToSupabase(b));
            showToast('Synchronized all bot tables to Supabase Cloud');
          }
        }}
      />

      {/* Telegram Bot Token, Broadcast & Simulator Modal */}
      {isTelegramModalOpen && (
        <TelegramModal
          isOpen={isTelegramModalOpen}
          onClose={() => setIsTelegramModalOpen(false)}
          bot={activeBot || bots[0]}
          onUpdateBot={handleUpdateBot}
          initialTab={telegramModalTab}
        />
      )}

      {/* Pivot Summary Graph Modal */}
      {isPivotGraphOpen && (activeBot || bots[0]) && (
        <PivotGraphModal
          isOpen={isPivotGraphOpen}
          onClose={() => setIsPivotGraphOpen(false)}
          bot={activeBot || bots[0]}
          selectedColumn={selectedColumnForEdit || undefined}
        />
      )}

      {/* Filter Rows Modal */}
      {isFilterModalOpen && activeBot && (
        <FilterModal
          isOpen={isFilterModalOpen}
          onClose={() => setIsFilterModalOpen(false)}
          bot={activeBot}
          onApplyFilter={handleUpdateBot}
          onResetFilter={() => {
            showToast('Filter reset to all rows');
          }}
        />
      )}

      {/* Bot Settings / Rename Modal */}
      {botForSettings && (
        <BotSettingsModal
          isOpen={Boolean(botForSettings)}
          onClose={() => setBotForSettings(null)}
          bot={botForSettings}
          existingFolders={Array.from(new Set(bots.map(b => b.folder || 'General')))}
          onSave={(updated) => {
            handleUpdateBot(updated);
            showToast(`Saved settings for "${updated.name}"`);
          }}
        />
      )}

      {/* Help Modal */}
      <HelpModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
      />

      {/* Daily, Weekly & Monthly Reports Modal */}
      <ReportsModal
        isOpen={isReportsModalOpen}
        onClose={() => setIsReportsModalOpen(false)}
        bots={bots}
        onSendTelegramReminder={(customerName, remainingBalance, quality) => {
          setIsReportsModalOpen(false);
          setTelegramModalTab('broadcast');
          setIsTelegramModalOpen(true);
          showToast(`Prepared payment reminder for ${customerName} ($${remainingBalance.toFixed(2)})`);
        }}
      />

    </div>
  );
}
