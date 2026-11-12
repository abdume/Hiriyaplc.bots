import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { BotTable, SupabaseConfig, SyncStatus } from '../types';

const STORAGE_KEY_URL = 'tablebot_supabase_url';
const STORAGE_KEY_KEY = 'tablebot_supabase_anon_key';
const STORAGE_KEY_USER_EMAIL = 'tablebot_user_email';

export const SQL_SETUP_SCRIPT = `-- Run this in your Supabase SQL Editor:
create table if not exists user_bots (
  id text primary key,
  user_id uuid references auth.users not null,
  bot_data jsonb not null,
  updated_at timestamptz default now()
);

alter table user_bots enable row level security;

create policy "Users manage own bots" on user_bots
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
`;

let clientInstance: SupabaseClient | null = null;

export function getSavedSupabaseConfig(): SupabaseConfig {
  const url = localStorage.getItem(STORAGE_KEY_URL) || '';
  const anonKey = localStorage.getItem(STORAGE_KEY_KEY) || '';
  const userEmail = localStorage.getItem(STORAGE_KEY_USER_EMAIL) || 'umery1969@gmail.com';

  return {
    url,
    anonKey,
    userEmail: userEmail || 'umery1969@gmail.com',
    isConnected: Boolean(url && anonKey)
  };
}

export function saveSupabaseConfig(url: string, anonKey: string, userEmail?: string) {
  if (url) localStorage.setItem(STORAGE_KEY_URL, url.trim());
  else localStorage.removeItem(STORAGE_KEY_URL);

  if (anonKey) localStorage.setItem(STORAGE_KEY_KEY, anonKey.trim());
  else localStorage.removeItem(STORAGE_KEY_KEY);

  if (userEmail) localStorage.setItem(STORAGE_KEY_USER_EMAIL, userEmail.trim());

  // Reset cached client
  clientInstance = null;
}

export function getSupabaseClient(): SupabaseClient | null {
  if (clientInstance) return clientInstance;

  const config = getSavedSupabaseConfig();
  if (config.url && config.anonKey) {
    try {
      clientInstance = createClient(config.url, config.anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true
        }
      });
      return clientInstance;
    } catch (err) {
      console.warn('Failed to initialize Supabase client:', err);
      return null;
    }
  }
  return null;
}

export async function testSupabaseConnection(url: string, anonKey: string): Promise<{ success: boolean; message: string }> {
  try {
    const testClient = createClient(url.trim(), anonKey.trim());
    const { error } = await testClient.from('user_bots').select('id').limit(1);
    if (error && error.code !== 'PGRST116') {
      // If table doesn't exist yet, it's connected to Supabase but needs SQL setup
      if (error.message?.includes('relation "user_bots" does not exist') || error.code === '42P01') {
        return {
          success: true,
          message: 'Connected to Supabase! Note: Please run the SQL setup script to create the user_bots table.'
        };
      }
      return { success: false, message: error.message };
    }
    return { success: true, message: 'Successfully connected and verified table access!' };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Connection failed' };
  }
}

export async function syncBotToSupabase(bot: BotTable, userId?: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const currentUserId = userId || (await client.auth.getUser()).data.user?.id;
    if (!currentUserId) return false;

    const { error } = await client.from('user_bots').upsert({
      id: bot.id,
      user_id: currentUserId,
      bot_data: bot,
      updated_at: new Date().toISOString()
    });

    if (error) {
      console.error('Error syncing bot to Supabase:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Error syncing bot to Supabase:', err);
    return false;
  }
}

export async function deleteBotFromSupabase(botId: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client.from('user_bots').delete().eq('id', botId);
    return !error;
  } catch (err) {
    return false;
  }
}

export async function fetchBotsFromSupabase(): Promise<BotTable[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('user_bots')
      .select('bot_data')
      .order('updated_at', { ascending: false });

    if (error || !data) return null;
    return data.map(item => item.bot_data as BotTable);
  } catch (err) {
    return null;
  }
}

export function subscribeToRealtimeChanges(
  onUpsert: (bot: BotTable) => void,
  onDelete: (botId: string) => void
) {
  const client = getSupabaseClient();
  if (!client) return () => {};

  const channel = client
    .channel('user_bots_realtime')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'user_bots' },
      (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          if (payload.new && (payload.new as any).bot_data) {
            onUpsert((payload.new as any).bot_data);
          }
        } else if (payload.eventType === 'DELETE') {
          if (payload.old && (payload.old as any).id) {
            onDelete((payload.old as any).id);
          }
        }
      }
    )
    .subscribe();

  return () => {
    client.removeChannel(channel);
  };
}
