import { TelegramUpdate } from '../types';

export interface TelegramBotInfo {
  id: number;
  is_bot: boolean;
  first_name: string;
  username: string;
  can_join_groups?: boolean;
}

export async function checkTelegramToken(token: string): Promise<{ success: boolean; bot?: TelegramBotInfo; error?: string }> {
  const cleanToken = token.trim();
  if (!cleanToken) {
    return { success: false, error: 'Token is empty' };
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${cleanToken}/getMe`);
    const data = await res.json();
    if (data.ok && data.result) {
      return { success: true, bot: data.result };
    }
    return { success: false, error: data.description || 'Invalid Bot Token' };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Network error communicating with Telegram API' };
  }
}

export async function fetchTelegramUpdates(token: string, offset?: number): Promise<{ success: boolean; updates?: TelegramUpdate[]; error?: string }> {
  const cleanToken = token.trim();
  if (!cleanToken) {
    return { success: false, error: 'Token is empty' };
  }

  try {
    const url = new URL(`https://api.telegram.org/bot${cleanToken}/getUpdates`);
    if (offset) {
      url.searchParams.set('offset', String(offset));
    }
    url.searchParams.set('timeout', '5');

    const res = await fetch(url.toString());
    const data = await res.json();

    if (data.ok && Array.isArray(data.result)) {
      return { success: true, updates: data.result };
    }
    return { success: false, error: data.description || 'Could not fetch updates' };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to fetch Telegram updates' };
  }
}

export async function sendTelegramMessage(
  token: string,
  chatId: string | number,
  text: string
): Promise<{ success: boolean; messageId?: number; error?: string }> {
  const cleanToken = token.trim();
  if (!cleanToken) {
    return { success: false, error: 'Token is empty' };
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${cleanToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML'
      })
    });
    const data = await res.json();
    if (data.ok && data.result) {
      return { success: true, messageId: data.result.message_id };
    }
    return { success: false, error: data.description || 'Failed to deliver message' };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Network error sending message' };
  }
}

// Telegram Simulator Engine for offline/instant testing
export interface SimulatedInteraction {
  userMessage: string;
  botReply: string;
  extractedData: {
    userId: string;
    username: string;
    commandOrText: string;
    amount?: number;
    timestamp: string;
    status: string;
  };
}

export function simulateTelegramMessage(
  botName: string,
  userMessage: string,
  senderUsername: string = '@alex_tester'
): SimulatedInteraction {
  const cleanMsg = userMessage.trim();
  const userId = String(Math.floor(1000000 + Math.random() * 9000000));
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 16).replace('T', ' ');

  // Extract amount if present in message (e.g. 45.00 or $50 or 100)
  const amountMatch = cleanMsg.match(/(?:\$|£|€)?\s*([0-9]+(?:\.[0-9]{1,2})?)/);
  const detectedAmount = amountMatch ? parseFloat(amountMatch[1]) : undefined;

  let botReply = '';
  let status = 'Logged';

  if (cleanMsg.toLowerCase().startsWith('/start')) {
    botReply = `🤖 Welcome to <b>${botName}</b>!\nYour user ID has been recorded into our live database.\nTry commands:\n• <code>/alert BTC 98500</code>\n• <code>/order 49.99</code>\n• <code>/donate 25.00</code>`;
    status = 'Active';
  } else if (cleanMsg.toLowerCase().startsWith('/help')) {
    botReply = `📖 <b>${botName} Help Center</b>\nSend any message or payment command to log a record into the Table Notes spreadsheet.`;
    status = 'Info Sent';
  } else if (cleanMsg.toLowerCase().startsWith('/alert')) {
    botReply = `🔔 <b>Alert Created!</b>\nTarget threshold: ${detectedAmount ? `$${detectedAmount.toFixed(2)}` : 'Set'}\nWe will notify you immediately.`;
    status = 'Monitoring';
  } else if (cleanMsg.toLowerCase().startsWith('/order') || cleanMsg.toLowerCase().includes('order')) {
    botReply = `📦 <b>Order Received!</b>\nAmount: ${detectedAmount ? `$${detectedAmount.toFixed(2)}` : '$10.00'}\nInvoice saved to live database.`;
    status = 'Pending';
  } else if (cleanMsg.toLowerCase().startsWith('/donate') || cleanMsg.toLowerCase().includes('pay')) {
    botReply = `💖 <b>Thank you for your support!</b>\nReceived ${detectedAmount ? `$${detectedAmount.toFixed(2)}` : '$15.00'}. Transaction verified!`;
    status = 'Completed';
  } else {
    botReply = `✅ Received: "<i>${cleanMsg}</i>"\nLogged into <b>${botName}</b> database table.`;
    status = 'Received';
  }

  return {
    userMessage: cleanMsg,
    botReply,
    extractedData: {
      userId: `${userId} ${senderUsername}`,
      username: senderUsername,
      commandOrText: cleanMsg,
      amount: detectedAmount ?? 25.00,
      timestamp: dateStr,
      status
    }
  };
}
