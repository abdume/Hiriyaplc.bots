export type ColumnType = 
  | 'text' 
  | 'amount' 
  | 'date' 
  | 'image' 
  | 'formula' 
  | 'number' 
  | 'button' 
  | 'checkbox';

export type CurrencySymbol = '$' | '£' | '€' | 'ETB' | 'None';

export interface ColumnStyle {
  bold: boolean;
  italic: boolean;
  align: 'left' | 'center' | 'right';
  color: string;
  bgColor: string;
}

export interface ColumnDef {
  id: string;
  name: string;
  type: ColumnType;
  widthMultiplier: number; // 0.5 to 3.0, default 1.0
  currency: CurrencySymbol;
  thousandSeparator: boolean;
  decimals: number; // 0, 2, 3
  style: ColumnStyle;
  includeInGraph: boolean;
}

export interface BotRow {
  id: string;
  [key: string]: any;
}

export interface BotTable {
  id: string;
  name: string;
  description: string;
  folder?: string; // e.g. 'Customer Ledger', 'Sales & Orders', 'Crypto Alerts'
  telegramToken: string;
  botUsername?: string;
  botStatus: 'online' | 'offline' | 'simulator';
  isFavorite: boolean;
  updatedAt: string;
  columns: ColumnDef[];
  rows: BotRow[];
}

export type ReportPeriod = 'daily' | 'weekly' | 'monthly';

export interface CustomerReportItem {
  id: string;
  botId: string;
  botName: string;
  folder: string;
  customerName: string;
  qualityOrQuantity: string;
  totalAmount: number;
  paidAmount: number;
  remainingBalance: number;
  status: 'Paid in Full' | 'Partial' | 'Unpaid';
  date: string;
  telegramChatId?: string;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  userEmail?: string;
  userId?: string;
  isConnected: boolean;
}

export type SyncStatus = 'synced' | 'syncing' | 'local' | 'error';

export interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from?: {
      id: number;
      is_bot: boolean;
      first_name: string;
      last_name?: string;
      username?: string;
    };
    chat: {
      id: number;
      first_name?: string;
      username?: string;
      type: string;
    };
    date: number;
    text?: string;
  };
}
