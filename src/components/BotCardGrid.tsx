import React, { useState, useMemo } from 'react';
import { 
  Bot, 
  Menu, 
  Search, 
  ArrowUpDown, 
  MoreVertical, 
  Table, 
  Plus, 
  Grid, 
  Copy, 
  FileSpreadsheet, 
  Trash2, 
  Edit3, 
  Radio, 
  Sparkles,
  ExternalLink,
  ChevronDown,
  BarChart3,
  Folder
} from 'lucide-react';
import { BotTable, SyncStatus } from '../types';

interface BotCardGridProps {
  bots: BotTable[];
  onOpenDrawer: () => void;
  onOpenReports: () => void;
  onSelectBot: (botId: string) => void;
  onCreateBlankBot: () => void;
  onCreateNewBot: () => void;
  onDeleteBot: (botId: string) => void;
  onDuplicateBot: (botId: string) => void;
  onRenameBot: (botId: string) => void;
  onExportCsv: (bot: BotTable) => void;
  syncStatus: SyncStatus;
}

export const BotCardGrid: React.FC<BotCardGridProps> = ({
  bots,
  onOpenDrawer,
  onOpenReports,
  onSelectBot,
  onCreateBlankBot,
  onCreateNewBot,
  onDeleteBot,
  onDuplicateBot,
  onRenameBot,
  onExportCsv,
  syncStatus
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'online' | 'simulator' | 'favorites'>('all');
  const [selectedFolder, setSelectedFolder] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'recent' | 'name' | 'rows'>('recent');
  const [activeMenuBotId, setActiveMenuBotId] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Extract unique folders
  const allFolders = useMemo(() => {
    const set = new Set<string>();
    bots.forEach(b => {
      if (b.folder) set.add(b.folder);
      else set.add('General');
    });
    return Array.from(set);
  }, [bots]);

  // Filter & Sort
  const filteredBots = bots
    .filter(bot => {
      const folderName = bot.folder || 'General';
      if (selectedFolder !== 'all' && folderName !== selectedFolder) {
        return false;
      }
      const matchesSearch = bot.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            bot.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            folderName.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;
      if (filterType === 'favorites') return bot.isFavorite;
      if (filterType === 'online') return bot.botStatus === 'online';
      if (filterType === 'simulator') return bot.botStatus === 'simulator';
      return true;
    })
    .sort((a, b) => {
      if (sortOrder === 'name') return a.name.localeCompare(b.name);
      if (sortOrder === 'rows') return b.rows.length - a.rows.length;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

  const getSyncDot = () => {
    switch (syncStatus) {
      case 'synced':
        return <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" title="Supabase Synced" />;
      case 'syncing':
        return <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" title="Syncing..." />;
      case 'error':
        return <span className="w-2.5 h-2.5 rounded-full bg-red-400" title="Sync error" />;
      default:
        return <span className="w-2.5 h-2.5 rounded-full bg-blue-300" title="Local Storage Mode" />;
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    try {
      const diff = Date.now() - new Date(dateStr).getTime();
      const mins = Math.floor(diff / (1000 * 60));
      if (mins < 1) return 'Just now';
      if (mins < 60) return `${mins}m ago`;
      const hours = Math.floor(mins / 60);
      if (hours < 24) return `${hours}h ago`;
      return `${Math.floor(hours / 24)}d ago`;
    } catch {
      return 'Recently';
    }
  };

  return (
    <div className="min-h-screen pb-24 bg-[#F4F6F9] flex flex-col">
      {/* Top App Bar (Deep royal blue #0D47A1) */}
      <header className="sticky top-0 z-40 bg-[#0D47A1] text-white shadow-md">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={onOpenDrawer}
              className="p-2 -ml-2 rounded-full hover:bg-white/10 active:bg-white/20 transition"
              aria-label="Open Navigation Drawer"
            >
              <Menu size={22} className="text-white" />
            </button>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight">All Bots</span>
              <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-semibold">
                {filteredBots.length}
              </span>
              <div className="ml-1 flex items-center gap-1.5 bg-blue-900/60 px-2 py-0.5 rounded-full text-[11px] font-medium text-blue-100">
                {getSyncDot()}
                <span>{syncStatus === 'synced' ? 'Live Cloud' : syncStatus === 'syncing' ? 'Syncing...' : 'Local'}</span>
              </div>
            </div>
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center gap-1.5">
            {/* Quick Reports Button */}
            <button
              onClick={onOpenReports}
              className="px-2.5 py-1 rounded-lg bg-blue-800/80 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition active:scale-95 border border-blue-400/40"
              title="Daily, Weekly & Monthly Reports"
            >
              <BarChart3 size={15} className="text-amber-300" />
              <span className="hidden sm:inline">Reports</span>
            </button>

            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="p-2 rounded-full hover:bg-white/10 transition"
              title="Search bots"
            >
              <Search size={20} />
            </button>

            <button
              onClick={() => {
                setSortOrder(prev => prev === 'recent' ? 'name' : prev === 'name' ? 'rows' : 'recent');
              }}
              className="p-2 rounded-full hover:bg-white/10 transition flex items-center text-xs gap-1"
              title={`Sort by: ${sortOrder}`}
            >
              <ArrowUpDown size={18} />
              <span className="hidden sm:inline font-mono uppercase text-[10px] bg-white/20 px-1 rounded">
                {sortOrder === 'recent' ? 'Time' : sortOrder === 'name' ? 'A-Z' : 'Rows'}
              </span>
            </button>

            {/* Filter Dropdown */}
            <div className="relative">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="bg-[#1565C0] text-xs font-medium text-white px-2 py-1.5 rounded-md border-none outline-none cursor-pointer hover:bg-blue-600 transition"
              >
                <option value="all">All</option>
                <option value="online">Online</option>
                <option value="simulator">Simulator</option>
                <option value="favorites">Favorites</option>
              </select>
            </div>
          </div>
        </div>

        {/* Collapsible Search Input */}
        {isSearchOpen && (
          <div className="bg-[#1565C0] px-4 py-2 border-t border-blue-400/30 animate-in slide-in-from-top-2">
            <div className="max-w-6xl mx-auto flex items-center bg-white rounded-lg px-3 py-1.5 text-gray-800 shadow-inner">
              <Search size={18} className="text-gray-400 mr-2 shrink-0" />
              <input
                type="text"
                placeholder="Search bot name, command, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="w-full text-sm bg-transparent outline-none"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="text-xs text-gray-400 hover:text-gray-600 px-1 font-bold"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        )}

        {/* Folder Tabs Row */}
        <div className="bg-[#1565C0] px-4 py-2 border-t border-blue-400/20 overflow-x-auto scrollbar-none">
          <div className="max-w-6xl mx-auto flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-blue-200 uppercase tracking-wider mr-1 shrink-0 flex items-center gap-1">
              <Folder size={12} className="text-amber-300" />
              <span>Folders:</span>
            </span>

            <button
              onClick={() => setSelectedFolder('all')}
              className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition ${
                selectedFolder === 'all' 
                  ? 'bg-white text-[#0D47A1] shadow-xs' 
                  : 'bg-blue-800/60 text-blue-100 hover:bg-blue-800'
              }`}
            >
              All Folders ({bots.length})
            </button>

            {allFolders.map(f => {
              const count = bots.filter(b => (b.folder || 'General') === f).length;
              return (
                <button
                  key={f}
                  onClick={() => setSelectedFolder(f)}
                  className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                    selectedFolder === f 
                      ? 'bg-white text-[#0D47A1] shadow-xs' 
                      : 'bg-blue-800/60 text-blue-100 hover:bg-blue-800'
                  }`}
                >
                  <span>{f}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    selectedFolder === f ? 'bg-blue-100 text-[#0D47A1]' : 'bg-blue-900/80 text-blue-200'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Card Grid */}
      <main className="max-w-6xl mx-auto w-full px-4 pt-5 flex-1">
        
        {/* Banner summary */}
        <div className="flex items-center justify-between mb-4">
          <div className="text-xs uppercase tracking-wider font-bold text-gray-500">
            {filterType === 'all' ? 'All Bot Tables' : `${filterType.toUpperCase()} Bot Tables`} ({filteredBots.length})
          </div>
          <span className="text-xs text-gray-400">
            Tap a card to open spreadsheet
          </span>
        </div>

        {filteredBots.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center shadow-xs border border-gray-100 max-w-md mx-auto my-12">
            <div className="w-16 h-16 bg-blue-50 text-[#1976D2] rounded-full flex items-center justify-center mx-auto mb-4">
              <Bot size={32} />
            </div>
            <h3 className="font-bold text-lg text-gray-800 mb-1">No bot tables found</h3>
            <p className="text-xs text-gray-500 mb-6">
              {searchQuery ? 'Try clearing your search query' : 'Create a new Telegram bot table or connect your @BotFather token.'}
            </p>
            <div className="flex gap-2 justify-center">
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
                >
                  Clear Search
                </button>
              )}
              <button
                onClick={onCreateNewBot}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#1976D2] text-white hover:bg-blue-700 shadow-xs"
              >
                + Create Bot Table
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBots.map(bot => {
              const isSimulator = bot.botStatus === 'simulator';
              const isOnline = bot.botStatus === 'online';

              return (
                <div
                  key={bot.id}
                  onClick={() => onSelectBot(bot.id)}
                  className="bg-white rounded-[12px] p-4.5 mat-shadow-1 hover:mat-shadow-2 transition-all duration-200 cursor-pointer flex flex-col justify-between border border-gray-100 relative group"
                >
                  <div>
                    {/* Top row: Name & 3-dot menu */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          <h3 className="font-bold text-base text-[#0D47A1] truncate group-hover:text-[#1976D2] transition">
                            {bot.name}
                          </h3>
                        </div>
                        <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                          {bot.description || 'Telegram Bot Table'}
                        </p>
                      </div>

                      {/* 3-Dot Context Menu */}
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuBotId(activeMenuBotId === bot.id ? null : bot.id);
                          }}
                          className="p-1 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
                          aria-label="More options"
                        >
                          <MoreVertical size={18} />
                        </button>

                        {/* Dropdown Menu */}
                        {activeMenuBotId === bot.id && (
                          <div 
                            className="absolute right-0 top-7 w-44 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-30 animate-in fade-in zoom-in-95 duration-150"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => {
                                setActiveMenuBotId(null);
                                onRenameBot(bot.id);
                              }}
                              className="w-full px-3 py-2 text-xs font-medium text-gray-700 hover:bg-blue-50 hover:text-[#0D47A1] flex items-center gap-2 text-left"
                            >
                              <Edit3 size={14} />
                              <span>Rename Bot</span>
                            </button>
                            <button
                              onClick={() => {
                                setActiveMenuBotId(null);
                                onDuplicateBot(bot.id);
                              }}
                              className="w-full px-3 py-2 text-xs font-medium text-gray-700 hover:bg-blue-50 hover:text-[#0D47A1] flex items-center gap-2 text-left"
                            >
                              <Copy size={14} />
                              <span>Duplicate Table</span>
                            </button>
                            <button
                              onClick={() => {
                                setActiveMenuBotId(null);
                                onExportCsv(bot);
                              }}
                              className="w-full px-3 py-2 text-xs font-medium text-gray-700 hover:bg-blue-50 hover:text-[#0D47A1] flex items-center gap-2 text-left"
                            >
                              <FileSpreadsheet size={14} />
                              <span>Export CSV</span>
                            </button>
                            <div className="border-t border-gray-100 my-1" />
                            <button
                              onClick={() => {
                                setActiveMenuBotId(null);
                                onDeleteBot(bot.id);
                              }}
                              className="w-full px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 flex items-center gap-2 text-left"
                            >
                              <Trash2 size={14} />
                              <span>Delete Table</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bot Meta Info & Status Badges */}
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                        isOnline 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                          : isSimulator 
                          ? 'bg-blue-50 text-[#1565C0] border border-blue-200' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : isSimulator ? 'bg-blue-500' : 'bg-gray-400'}`} />
                        {isOnline ? 'ONLINE' : isSimulator ? 'SIMULATOR' : 'OFFLINE'}
                      </span>

                      {bot.folder && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                          <Folder size={11} className="text-amber-600" />
                          <span>{bot.folder}</span>
                        </span>
                      )}

                      {bot.botUsername && (
                        <span className="text-[11px] text-gray-500 font-mono bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">
                          {bot.botUsername}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Bottom Row of Card: Stats and Quick Edit Button */}
                  <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                    <div className="text-[11px] text-gray-400 flex items-center gap-3">
                      <span><strong>{bot.rows.length}</strong> rows</span>
                      <span><strong>{bot.columns.length}</strong> cols</span>
                      <span>{formatTimeAgo(bot.updatedAt)}</span>
                    </div>

                    {/* Quick-edit table icon in bottom-right corner */}
                    <div 
                      className="w-8 h-8 rounded-full bg-blue-50 text-[#1976D2] group-hover:bg-[#1976D2] group-hover:text-white transition flex items-center justify-center shadow-xs"
                      title="Open Table"
                    >
                      <Table size={16} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Floating Action Buttons (bottom right) */}
      <div className="fixed bottom-6 right-6 flex flex-col items-center gap-3 z-30">
        {/* Secondary white circular button (grid icon) for instant blank table */}
        <button
          onClick={onCreateBlankBot}
          className="w-12 h-12 rounded-full bg-white text-[#1565C0] mat-shadow-2 hover:mat-shadow-3 active:scale-95 transition flex items-center justify-center border border-gray-100"
          title="Quick-create Blank Bot Table"
          aria-label="Quick-create Blank Bot Table"
        >
          <Grid size={22} />
        </button>

        {/* Primary blue circular button (+ icon) to instantly create a new bot & table */}
        <button
          onClick={onCreateNewBot}
          className="w-14 h-14 rounded-full bg-[#1976D2] hover:bg-[#1565C0] text-white mat-shadow-3 active:scale-95 transition flex items-center justify-center"
          title="Create New Bot"
          aria-label="Create New Bot"
        >
          <Plus size={28} />
        </button>
      </div>
    </div>
  );
};
