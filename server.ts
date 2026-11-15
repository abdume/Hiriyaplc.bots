/// <reference types="node" />
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import type { Request, Response } from 'express';

interface FolderLockEntry {
  enabled: boolean;
  code: string;
  updatedAt?: string;
}

interface RevokedUserEntry {
  at?: string;
  reason?: string;
  expiresAt?: number | null;
  durationMins?: number;
}

interface KnownTelegramChat {
  chatId: string;
  botId?: string;
  label?: string;
  updatedAt?: string;
}

interface SharedSecurityState {
  accessCode: string;
  accessLockEnabled: boolean;
  cyberSecurityCode: string;
  cyberSecurityManager: string;
  cyberRequireCode: boolean;
  cyberAlwaysAsk: boolean;
  adminEmail: string;
  telegramDefaultFolder: string;
  folderLocks: Record<string, FolderLockEntry>;
  revokedUsers: Record<string, RevokedUserEntry>;
  telegramKnownChats: KnownTelegramChat[];
  forceLockAt: string | null;
  updatedAt: string | null;
  updatedBy: string;
  updatedBySession: string;
  source: string;
}

interface TrackedUserRecord {
  id: string;
  label: string;
  actor: string;
  role: string;
  source: string;
  platform: string;
  deviceId: string;
  deviceIds: string[];
  deviceLabel: string;
  telegramId: string;
  telegramUsername: string;
  ip: string;
  blocked: boolean;
  blockExpiresAt: number | null;
  blockDurationMins: number;
  blockedReason?: string;
  loggedOutAt?: string | null;
  unblockedAt?: string | null;
  opens: number;
  adds: number;
  edits: number;
  deletes: number;
  activeSeconds: number;
  firstSeen: string;
  lastSeen: string;
  lastAction?: string;
  lastBotName?: string;
}

interface ActivityLogRecord {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  source: string;
  deviceId?: string;
  deviceLabel?: string;
  telegramId?: string;
  telegramUsername?: string;
  platform?: string;
  botId?: string;
  botName?: string;
  summary: string;
}

interface ActivityStore {
  users: TrackedUserRecord[];
  logs: ActivityLogRecord[];
  updatedAt: string;
}

const STATE_FILE = path.resolve(process.cwd(), '.tablebot-security.json');
const ACTIVITY_FILE = path.resolve(process.cwd(), '.tablebot-activity.json');
function resolveAppPort(): number {
  const idx = process.argv.indexOf('--port');
  if (idx !== -1 && process.argv[idx + 1]) {
    const parsed = Number(process.argv[idx + 1]);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  const eqArg = process.argv.find((a) => a.startsWith('--port='));
  if (eqArg) {
    const parsed = Number(eqArg.split('=')[1]);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return 3000;
}
const PORT = resolveAppPort();

const DEFAULT_SECURITY_STATE: SharedSecurityState = {
  accessCode: '1234',
  accessLockEnabled: true,
  cyberSecurityCode: '1234',
  cyberSecurityManager: 'Abdulfeta',
  cyberRequireCode: true,
  cyberAlwaysAsk: true,
  adminEmail: 'umery1969@gmail.com',
  telegramDefaultFolder: '',
  folderLocks: {},
  revokedUsers: {},
  telegramKnownChats: [],
  forceLockAt: null,
  updatedAt: null,
  updatedBy: '',
  updatedBySession: '',
  source: 'server_default',
};

function createDefaultActivityStore(): ActivityStore {
  const nowIso = new Date().toISOString();
  return {
    users: [
      {
        id: 'umery1969@gmail.com',
        label: 'umery1969@gmail.com',
        actor: 'umery1969@gmail.com',
        role: 'admin',
        source: 'Admin',
        platform: 'Admin',
        deviceId: '',
        deviceIds: [],
        deviceLabel: 'Workspace Admin',
        telegramId: '',
        telegramUsername: '',
        ip: '',
        blocked: false,
        blockExpiresAt: null,
        blockDurationMins: 0,
        opens: 0,
        adds: 0,
        edits: 0,
        deletes: 0,
        activeSeconds: 0,
        firstSeen: nowIso,
        lastSeen: nowIso,
      },
      {
        id: 'abdulfeta',
        label: 'Abdulfeta (Manager of Cyber Security)',
        actor: 'abdulfeta',
        role: 'cyber_security_manager',
        source: 'Security',
        platform: 'Security',
        deviceId: '',
        deviceIds: [],
        deviceLabel: 'Cyber Security Control',
        telegramId: '',
        telegramUsername: '',
        ip: '',
        blocked: false,
        blockExpiresAt: null,
        blockDurationMins: 0,
        opens: 0,
        adds: 0,
        edits: 0,
        deletes: 0,
        activeSeconds: 0,
        firstSeen: nowIso,
        lastSeen: nowIso,
      },
    ],
    logs: [],
    updatedAt: nowIso,
  };
}

function normalizeCode(raw: unknown): string {
  return String(raw === undefined || raw === null ? '' : raw)
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .trim();
}

function normKey(raw: unknown): string {
  return String(raw === undefined || raw === null ? '' : raw).trim().toLowerCase();
}

function stripParens(raw: unknown): string {
  return normKey(raw).replace(/\s*\([^)]*\)\s*/g, '').trim();
}

function matchesIdentity(a: unknown, b: unknown): boolean {
  const na = normKey(a);
  const nb = normKey(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  const sa = stripParens(na);
  const sb = stripParens(nb);
  if (sa && sb && sa === sb) return true;
  return false;
}

function extractClientIp(req: Request): string {
  const fwd = req.headers['x-forwarded-for'];
  const raw = Array.isArray(fwd) ? fwd[0] : (fwd || req.socket.remoteAddress || '');
  return String(raw).split(',')[0].trim().replace(/^::ffff:/, '');
}

function parseUserAgent(uaRaw: unknown): { platform: string; deviceLabel: string; source: string } {
  const ua = String(uaRaw || '');
  const isTg = /telegram/i.test(ua);
  let os = 'Desktop';
  let platform = 'Browser';
  if (/iphone/i.test(ua)) {
    os = 'iPhone';
    platform = 'Phone';
  } else if (/ipad/i.test(ua)) {
    os = 'iPad';
    platform = 'Phone';
  } else if (/android/i.test(ua)) {
    os = 'Android Phone';
    platform = 'Phone';
  } else if (/windows/i.test(ua)) {
    os = 'Windows PC';
  } else if (/macintosh|mac os x/i.test(ua)) {
    os = 'Mac';
  } else if (/linux/i.test(ua)) {
    os = 'Linux';
  }

  let browser = 'Browser';
  if (isTg) {
    browser = /mobile|android|iphone/i.test(ua) ? 'Telegram Mobile' : 'Telegram Desktop';
    platform = 'Telegram';
  } else if (/edg\//i.test(ua)) {
    browser = 'Edge';
  } else if (/samsungbrowser/i.test(ua)) {
    browser = 'Samsung Browser';
  } else if (/opr\/|opera/i.test(ua)) {
    browser = 'Opera';
  } else if (/chrome|crios/i.test(ua)) {
    browser = 'Chrome';
  } else if (/firefox|fxios/i.test(ua)) {
    browser = 'Firefox';
  } else if (/safari/i.test(ua)) {
    browser = 'Safari';
  }

  const source = platform === 'Telegram' ? 'Telegram' : platform === 'Phone' ? 'Phone Browser' : 'Desktop Browser';
  return { platform, deviceLabel: `${os} · ${browser}`, source };
}

function loadPersistedSecurityState(): SharedSecurityState {
  try {
    if (fs.existsSync(STATE_FILE)) {
      const raw = fs.readFileSync(STATE_FILE, 'utf8');
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<SharedSecurityState>;
        return {
          ...DEFAULT_SECURITY_STATE,
          ...parsed,
          accessCode: normalizeCode(parsed.accessCode) || '1234',
          cyberSecurityCode: normalizeCode(parsed.cyberSecurityCode) || '1234',
          folderLocks: parsed.folderLocks && typeof parsed.folderLocks === 'object' ? parsed.folderLocks : {},
          revokedUsers: parsed.revokedUsers && typeof parsed.revokedUsers === 'object' ? parsed.revokedUsers : {},
          telegramKnownChats: Array.isArray(parsed.telegramKnownChats) ? parsed.telegramKnownChats : [],
        };
      }
    }
  } catch (err) {
    console.error('Failed to load security state file:', err);
  }
  return { ...DEFAULT_SECURITY_STATE };
}

function loadPersistedActivityStore(): ActivityStore {
  try {
    if (fs.existsSync(ACTIVITY_FILE)) {
      const raw = fs.readFileSync(ACTIVITY_FILE, 'utf8');
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<ActivityStore>;
        const defaults = createDefaultActivityStore();
        const users = Array.isArray(parsed.users) && parsed.users.length > 0 ? parsed.users : defaults.users;
        const logs = Array.isArray(parsed.logs) ? parsed.logs.slice(0, 400) : [];
        return {
          users,
          logs,
          updatedAt: parsed.updatedAt || new Date().toISOString(),
        };
      }
    }
  } catch (err) {
    console.error('Failed to load activity store file:', err);
  }
  return createDefaultActivityStore();
}

let currentSecurityState: SharedSecurityState = loadPersistedSecurityState();
let activityStore: ActivityStore = loadPersistedActivityStore();
const sseClients = new Set<Response>();
let lastHeartbeatBroadcastAt = 0;

function saveSecurityStateToDisk(next: SharedSecurityState): void {
  try {
    const tmpFile = `${STATE_FILE}.tmp`;
    fs.writeFileSync(tmpFile, JSON.stringify(next, null, 2), 'utf8');
    fs.renameSync(tmpFile, STATE_FILE);
  } catch {
    try {
      fs.writeFileSync(STATE_FILE, JSON.stringify(next, null, 2), 'utf8');
    } catch (innerErr) {
      console.error('Failed to persist security state:', innerErr);
    }
  }
}

function saveActivityStoreToDisk(next: ActivityStore): void {
  try {
    const tmpFile = `${ACTIVITY_FILE}.tmp`;
    fs.writeFileSync(tmpFile, JSON.stringify(next, null, 2), 'utf8');
    fs.renameSync(tmpFile, ACTIVITY_FILE);
  } catch {
    try {
      fs.writeFileSync(ACTIVITY_FILE, JSON.stringify(next, null, 2), 'utf8');
    } catch (innerErr) {
      console.error('Failed to persist activity store:', innerErr);
    }
  }
}

function broadcastSecurityUpdate(payload: SharedSecurityState): void {
  const data = `event: security_update\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(data);
    } catch {
      sseClients.delete(client);
    }
  }
}

function broadcastActivityUpdate(store: ActivityStore): void {
  const data = `event: activity_update\ndata: ${JSON.stringify({
    users: store.users,
    logs: store.logs.slice(0, 250),
    updatedAt: store.updatedAt,
  })}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(data);
    } catch {
      sseClients.delete(client);
    }
  }
}

function cleanupExpiredServerBlocks(): boolean {
  const now = Date.now();
  let changed = false;
  const expiredKeys: string[] = [];

  for (const key of Object.keys(currentSecurityState.revokedUsers || {})) {
    const entry = currentSecurityState.revokedUsers[key];
    if (entry && entry.expiresAt && now >= Number(entry.expiresAt)) {
      delete currentSecurityState.revokedUsers[key];
      expiredKeys.push(key);
      changed = true;
    }
  }

  for (const u of activityStore.users) {
    if (u.blocked) {
      const isExp =
        (u.blockExpiresAt && now >= Number(u.blockExpiresAt)) ||
        expiredKeys.some(
          (ek) =>
            matchesIdentity(u.id, ek) ||
            matchesIdentity(u.actor, ek) ||
            matchesIdentity(u.label, ek) ||
            (u.telegramId && matchesIdentity(u.telegramId, ek)) ||
            (u.telegramUsername && matchesIdentity(u.telegramUsername, ek)) ||
            (Array.isArray(u.deviceIds) && u.deviceIds.some((d) => matchesIdentity(d, ek))),
        );
      if (isExp) {
        u.blocked = false;
        u.blockExpiresAt = null;
        u.blockDurationMins = 0;
        u.blockedReason = '';
        u.unblockedAt = new Date().toISOString();
        changed = true;
      }
    }
  }

  if (changed) {
    const nowIso = new Date().toISOString();
    currentSecurityState.updatedAt = nowIso;
    activityStore.updatedAt = nowIso;
    if (expiredKeys.length > 0) {
      activityStore.logs.unshift({
        id: `log_exp_${Date.now()}`,
        timestamp: nowIso,
        actor: 'Security',
        action: 'AUTH',
        source: 'Security',
        platform: 'Security',
        botName: 'Workspace',
        summary: `Timed block expired — auto-unblocked: ${expiredKeys.join(', ')}`,
      });
      if (activityStore.logs.length > 400) activityStore.logs = activityStore.logs.slice(0, 400);
    }
    saveSecurityStateToDisk(currentSecurityState);
    saveActivityStoreToDisk(activityStore);
    broadcastSecurityUpdate(currentSecurityState);
    broadcastActivityUpdate(activityStore);
  }
  return changed;
}

function getBlockStatusForIdentity(query: {
  actor?: unknown;
  deviceId?: unknown;
  telegramId?: unknown;
  telegramUsername?: unknown;
}): {
  blocked: boolean;
  deviceBlocked: boolean;
  reason?: string;
  expiresAt?: number | null;
  blockedAt?: string;
} {
  cleanupExpiredServerBlocks();
  const candidates = [query.actor, query.deviceId, query.telegramId, query.telegramUsername]
    .map((v) => String(v || '').trim())
    .filter(Boolean);
  if (candidates.length === 0) return { blocked: false, deviceBlocked: false };

  const devId = normKey(query.deviceId);
  const tgId = normKey(query.telegramId);
  const tgU = normKey(query.telegramUsername);

  for (const k of Object.keys(currentSecurityState.revokedUsers || {})) {
    const entry = currentSecurityState.revokedUsers[k];
    if (!entry) continue;
    if (candidates.some((c) => matchesIdentity(c, k))) {
      const devBlocked = Boolean(
        (devId && matchesIdentity(devId, k)) ||
          (tgId && matchesIdentity(tgId, k)) ||
          (tgU && matchesIdentity(tgU, k)),
      );
      return {
        blocked: true,
        deviceBlocked: devBlocked,
        reason: entry.reason || 'Blocked & logged out by Admin / Cyber Control.',
        expiresAt: entry.expiresAt || null,
        blockedAt: entry.at || undefined,
      };
    }
  }

  for (const u of activityStore.users) {
    if (!u.blocked) continue;
    const matchUser = candidates.some(
      (c) =>
        matchesIdentity(c, u.id) ||
        matchesIdentity(c, u.actor) ||
        matchesIdentity(c, u.label) ||
        (u.telegramId && matchesIdentity(c, u.telegramId)) ||
        (u.telegramUsername && matchesIdentity(c, u.telegramUsername)) ||
        (u.deviceId && matchesIdentity(c, u.deviceId)) ||
        (Array.isArray(u.deviceIds) && u.deviceIds.some((d) => matchesIdentity(c, d))),
    );
    if (matchUser) {
      const devBlocked = Boolean(
        (devId && (matchesIdentity(devId, u.deviceId) || (u.deviceIds || []).some((d) => matchesIdentity(devId, d)))) ||
          (tgId && u.telegramId && matchesIdentity(tgId, u.telegramId)) ||
          (tgU && u.telegramUsername && matchesIdentity(tgU, u.telegramUsername)),
      );
      return {
        blocked: true,
        deviceBlocked: devBlocked,
        reason: u.blockedReason || 'Blocked & logged out by Admin / Cyber Control.',
        expiresAt: u.blockExpiresAt || null,
        blockedAt: u.loggedOutAt || undefined,
      };
    }
  }

  return { blocked: false, deviceBlocked: false };
}

function upsertServerTrackedUser(input: {
  actor?: string;
  label?: string;
  deviceId?: string;
  deviceLabel?: string;
  telegramId?: string;
  telegramUsername?: string;
  platform?: string;
  source?: string;
  ip?: string;
  action?: string;
  botName?: string;
  deltaSeconds?: number;
  timestamp?: string;
}): { user: TrackedUserRecord; isNew: boolean } {
  const nowIso = input.timestamp || new Date().toISOString();
  const actorRaw = String(input.actor || '').trim();
  const devId = String(input.deviceId || '').trim();
  const tgId = String(input.telegramId || '').trim();
  const tgUser = String(input.telegramUsername || '').trim();
  const primaryId = actorRaw || (tgId ? `tg_${tgId}` : devId ? `dev_${devId}` : '');
  const fallbackLabel = input.label || actorRaw || (tgUser ? `${tgUser} (${tgId})` : tgId || input.deviceLabel || devId || 'Unknown User');

  let existing: TrackedUserRecord | undefined;
  if (tgId) {
    existing = activityStore.users.find(
      (u) =>
        (u.telegramId && normKey(u.telegramId) === normKey(tgId)) ||
        matchesIdentity(u.id, primaryId) ||
        matchesIdentity(u.actor, actorRaw),
    );
  }
  if (!existing && primaryId) {
    existing = activityStore.users.find(
      (u) =>
        matchesIdentity(u.id, primaryId) ||
        matchesIdentity(u.actor, primaryId) ||
        matchesIdentity(u.label, primaryId),
    );
  }
  if (!existing && devId) {
    existing = activityStore.users.find(
      (u) =>
        (u.deviceId && normKey(u.deviceId) === normKey(devId)) ||
        (Array.isArray(u.deviceIds) && u.deviceIds.some((d) => normKey(d) === normKey(devId))),
    );
  }

  const isNew = !existing;
  if (!existing) {
    const lowerId = normKey(primaryId);
    const isAdm = lowerId === normKey(currentSecurityState.adminEmail);
    const isCy = lowerId === 'abdulfeta' || lowerId === normKey(currentSecurityState.cyberSecurityManager);
    existing = {
      id: primaryId || `user_${Date.now()}`,
      label: fallbackLabel,
      actor: actorRaw || primaryId,
      role: isAdm ? 'admin' : isCy ? 'cyber_security_manager' : 'editor',
      source: input.source || 'Browser',
      platform: input.platform || 'Browser',
      deviceId: devId,
      deviceIds: devId ? [devId] : [],
      deviceLabel: input.deviceLabel || '',
      telegramId: tgId,
      telegramUsername: tgUser,
      ip: input.ip || '',
      blocked: false,
      blockExpiresAt: null,
      blockDurationMins: 0,
      opens: 0,
      adds: 0,
      edits: 0,
      deletes: 0,
      activeSeconds: 0,
      firstSeen: nowIso,
      lastSeen: nowIso,
    };
    activityStore.users.push(existing);
  }

  if (devId) {
    existing.deviceId = devId;
    if (!Array.isArray(existing.deviceIds)) existing.deviceIds = [];
    if (!existing.deviceIds.some((d) => normKey(d) === normKey(devId))) {
      existing.deviceIds.push(devId);
    }
  }
  if (input.deviceLabel) existing.deviceLabel = input.deviceLabel;
  if (tgId) existing.telegramId = tgId;
  if (tgUser) existing.telegramUsername = tgUser;
  if (input.platform && existing.role !== 'admin' && existing.role !== 'cyber_security_manager') {
    existing.platform = input.platform;
  }
  if (input.source && existing.role !== 'admin' && existing.role !== 'cyber_security_manager') {
    existing.source = input.source;
  }
  if (input.ip) existing.ip = input.ip;
  if (input.label && input.label.length > existing.label.length && existing.role !== 'cyber_security_manager') {
    existing.label = input.label;
  }

  const seenMs = Date.parse(nowIso) || Date.now();
  const prevMs = Date.parse(existing.lastSeen || '') || 0;
  if (seenMs >= prevMs) existing.lastSeen = nowIso;
  if (!existing.firstSeen || seenMs < (Date.parse(existing.firstSeen) || Infinity)) {
    existing.firstSeen = nowIso;
  }

  const delta = Number(input.deltaSeconds) || 0;
  if (delta > 0 && delta <= 120) {
    existing.activeSeconds = (existing.activeSeconds || 0) + Math.round(delta);
  }

  if (input.action) existing.lastAction = input.action;
  if (input.botName) existing.lastBotName = input.botName;
  if (input.action === 'OPEN') existing.opens = (existing.opens || 0) + 1;
  else if (input.action === 'ADD') existing.adds = (existing.adds || 0) + 1;
  else if (input.action === 'EDIT') existing.edits = (existing.edits || 0) + 1;
  else if (input.action === 'DELETE') existing.deletes = (existing.deletes || 0) + 1;

  // Enforce any active block on actor / deviceId / telegramId
  const blk = getBlockStatusForIdentity({
    actor: existing.actor || existing.id,
    deviceId: existing.deviceId,
    telegramId: existing.telegramId,
    telegramUsername: existing.telegramUsername,
  });
  if (blk.blocked) {
    existing.blocked = true;
    existing.blockExpiresAt = blk.expiresAt || null;
    existing.blockedReason = blk.reason;
  }

  return { user: existing, isNew };
}

async function startServer(): Promise<void> {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  app.get('/api/security-state', (_req: Request, res: Response) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    cleanupExpiredServerBlocks();
    res.json({ ok: true, state: currentSecurityState });
  });

  app.post('/api/security-state', (req: Request, res: Response) => {
    res.setHeader('Cache-Control', 'no-store');
    const incoming = (req.body && typeof req.body === 'object' ? req.body : {}) as Partial<SharedSecurityState> & {
      force?: boolean;
    };

    const curTs = currentSecurityState.updatedAt ? Date.parse(currentSecurityState.updatedAt) || 0 : 0;
    const incTs = incoming.updatedAt ? Date.parse(incoming.updatedAt) || Date.now() : Date.now();

    if (!incoming.force && curTs > 0 && incTs < curTs) {
      res.json({ ok: true, staleIgnored: true, state: currentSecurityState });
      return;
    }

    const nextAccess = normalizeCode(incoming.accessCode);
    const nextCyber = normalizeCode(incoming.cyberSecurityCode);

    const nextState: SharedSecurityState = {
      accessCode: nextAccess || currentSecurityState.accessCode || '1234',
      accessLockEnabled:
        typeof incoming.accessLockEnabled === 'boolean'
          ? incoming.accessLockEnabled
          : currentSecurityState.accessLockEnabled,
      cyberSecurityCode: nextCyber || currentSecurityState.cyberSecurityCode || '1234',
      cyberSecurityManager:
        typeof incoming.cyberSecurityManager === 'string' && incoming.cyberSecurityManager.trim()
          ? incoming.cyberSecurityManager.trim()
          : currentSecurityState.cyberSecurityManager,
      cyberRequireCode:
        typeof incoming.cyberRequireCode === 'boolean'
          ? incoming.cyberRequireCode
          : currentSecurityState.cyberRequireCode,
      cyberAlwaysAsk:
        typeof incoming.cyberAlwaysAsk === 'boolean'
          ? incoming.cyberAlwaysAsk
          : currentSecurityState.cyberAlwaysAsk,
      adminEmail:
        typeof incoming.adminEmail === 'string' && incoming.adminEmail.trim()
          ? incoming.adminEmail.trim()
          : currentSecurityState.adminEmail,
      telegramDefaultFolder:
        typeof incoming.telegramDefaultFolder === 'string'
          ? incoming.telegramDefaultFolder
          : currentSecurityState.telegramDefaultFolder,
      folderLocks:
        incoming.folderLocks && typeof incoming.folderLocks === 'object'
          ? incoming.folderLocks
          : currentSecurityState.folderLocks,
      revokedUsers:
        incoming.revokedUsers && typeof incoming.revokedUsers === 'object'
          ? incoming.revokedUsers
          : currentSecurityState.revokedUsers,
      telegramKnownChats: Array.isArray(incoming.telegramKnownChats)
        ? incoming.telegramKnownChats
        : currentSecurityState.telegramKnownChats,
      forceLockAt:
        typeof incoming.forceLockAt === 'string' || incoming.forceLockAt === null
          ? incoming.forceLockAt
          : currentSecurityState.forceLockAt,
      updatedAt: incoming.updatedAt || new Date().toISOString(),
      updatedBy: typeof incoming.updatedBy === 'string' ? incoming.updatedBy : currentSecurityState.updatedBy,
      updatedBySession:
        typeof incoming.updatedBySession === 'string' ? incoming.updatedBySession : '',
      source: typeof incoming.source === 'string' ? incoming.source : 'browser',
    };

    currentSecurityState = nextState;
    saveSecurityStateToDisk(currentSecurityState);
    broadcastSecurityUpdate(currentSecurityState);
    res.json({ ok: true, state: currentSecurityState });
  });

  app.get('/api/security-events', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    if (typeof res.flushHeaders === 'function') res.flushHeaders();

    cleanupExpiredServerBlocks();
    sseClients.add(res);
    res.write(`event: security_update\ndata: ${JSON.stringify(currentSecurityState)}\n\n`);
    res.write(
      `event: activity_update\ndata: ${JSON.stringify({
        users: activityStore.users,
        logs: activityStore.logs.slice(0, 250),
        updatedAt: activityStore.updatedAt,
      })}\n\n`,
    );

    const heartbeat = setInterval(() => {
      try {
        res.write(': ping\n\n');
      } catch {
        clearInterval(heartbeat);
        sseClients.delete(res);
      }
    }, 25000);

    req.on('close', () => {
      clearInterval(heartbeat);
      sseClients.delete(res);
    });
  });

  app.get('/api/activity-state', (req: Request, res: Response) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    cleanupExpiredServerBlocks();
    const blockStatus = getBlockStatusForIdentity({
      actor: req.query.actor,
      deviceId: req.query.deviceId,
      telegramId: req.query.telegramId,
      telegramUsername: req.query.telegramUsername,
    });
    res.json({
      ok: true,
      users: activityStore.users,
      logs: activityStore.logs.slice(0, 250),
      updatedAt: activityStore.updatedAt,
      serverTime: new Date().toISOString(),
      blockStatus,
    });
  });

  app.post('/api/activity/heartbeat', (req: Request, res: Response) => {
    res.setHeader('Cache-Control', 'no-store');
    cleanupExpiredServerBlocks();
    const body = (req.body && typeof req.body === 'object' ? req.body : {}) as Record<string, unknown>;
    const uaInfo = parseUserAgent(req.headers['user-agent']);
    const ip = extractClientIp(req);
    const actor = String(body.actor || '').trim();
    const deviceId = String(body.deviceId || '').trim();
    const telegramId = String(body.telegramId || '').trim();
    const telegramUsername = String(body.telegramUsername || '').trim();
    const customDeviceLabel = String(body.deviceLabel || '').trim();
    const platform = telegramId ? 'Telegram' : String(body.platform || uaInfo.platform);
    const source = telegramId ? 'Telegram' : String(body.source || uaInfo.source);
    const deltaSeconds = Number(body.deltaSeconds) || 0;

    let isNew = false;
    if (actor || deviceId || telegramId) {
      const up = upsertServerTrackedUser({
        actor,
        label: String(body.label || actor || ''),
        deviceId,
        deviceLabel: customDeviceLabel || uaInfo.deviceLabel,
        telegramId,
        telegramUsername,
        platform,
        source,
        ip,
        deltaSeconds,
      });
      isNew = up.isNew;
      activityStore.updatedAt = new Date().toISOString();
      saveActivityStoreToDisk(activityStore);
    }

    const blockStatus = getBlockStatusForIdentity({ actor, deviceId, telegramId, telegramUsername });
    const nowMs = Date.now();
    if (isNew || nowMs - lastHeartbeatBroadcastAt > 8000) {
      lastHeartbeatBroadcastAt = nowMs;
      broadcastActivityUpdate(activityStore);
    }

    res.json({
      ok: true,
      blockStatus,
      users: activityStore.users,
      logs: activityStore.logs.slice(0, 250),
      securityState: currentSecurityState,
      serverTime: new Date().toISOString(),
    });
  });

  app.post('/api/activity/log', (req: Request, res: Response) => {
    res.setHeader('Cache-Control', 'no-store');
    cleanupExpiredServerBlocks();
    const body = (req.body && typeof req.body === 'object' ? req.body : {}) as Record<string, unknown>;
    const uaInfo = parseUserAgent(req.headers['user-agent']);
    const ip = extractClientIp(req);

    const rawEntries = Array.isArray(body.entries)
      ? body.entries
      : body.entry && typeof body.entry === 'object'
        ? [body.entry]
        : [body];

    let changed = false;
    for (const item of rawEntries) {
      if (!item || typeof item !== 'object') continue;
      const e = item as Record<string, unknown>;
      const action = String(e.action || '').trim().toUpperCase();
      if (!action) continue;
      const actor = String(e.actor || body.actor || '').trim();
      const deviceId = String(e.deviceId || body.deviceId || '').trim();
      const telegramId = String(e.telegramId || body.telegramId || '').trim();
      const telegramUsername = String(e.telegramUsername || body.telegramUsername || '').trim();
      const isTgSource = String(e.source || '').toLowerCase() === 'telegram' || Boolean(telegramId);
      const platform = isTgSource ? 'Telegram' : String(e.platform || body.platform || uaInfo.platform);
      const source = isTgSource ? 'Telegram' : String(e.source || body.source || uaInfo.source);
      const deviceLabel = String(e.deviceLabel || body.deviceLabel || (isTgSource ? 'Telegram App / Bot' : uaInfo.deviceLabel));
      const logId = String(e.id || `log_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`);
      const ts = String(e.timestamp || new Date().toISOString());
      const botName = String(e.botName || 'Workspace');

      if (!activityStore.logs.some((l) => l.id === logId)) {
        activityStore.logs.unshift({
          id: logId,
          timestamp: ts,
          actor: actor || deviceId || 'Unknown',
          action,
          source,
          deviceId,
          deviceLabel,
          telegramId,
          telegramUsername,
          platform,
          botId: String(e.botId || ''),
          botName,
          summary: String(e.summary || ''),
        });
        changed = true;
      }

      if (actor || deviceId || telegramId) {
        upsertServerTrackedUser({
          actor,
          deviceId,
          deviceLabel,
          telegramId,
          telegramUsername,
          platform,
          source,
          ip: isTgSource ? '' : ip,
          action,
          botName,
          timestamp: ts,
        });
        changed = true;
      }
    }

    if (changed) {
      if (activityStore.logs.length > 400) activityStore.logs = activityStore.logs.slice(0, 400);
      activityStore.updatedAt = new Date().toISOString();
      saveActivityStoreToDisk(activityStore);
      broadcastActivityUpdate(activityStore);
    }

    res.json({
      ok: true,
      users: activityStore.users,
      logs: activityStore.logs.slice(0, 250),
      updatedAt: activityStore.updatedAt,
    });
  });

  app.post('/api/activity/block', (req: Request, res: Response) => {
    res.setHeader('Cache-Control', 'no-store');
    const body = (req.body && typeof req.body === 'object' ? req.body : {}) as Record<string, unknown>;
    const mode = String(body.mode || 'block').toLowerCase();
    const target = String(body.target || body.actor || '').trim();
    const telegramId = String(body.telegramId || '').trim();
    const telegramUsername = String(body.telegramUsername || '').trim();
    const deviceIds = Array.isArray(body.deviceIds)
      ? body.deviceIds.map((d) => String(d || '').trim()).filter(Boolean)
      : [];
    const byActor = String(body.byActor || 'Admin').trim();
    const durationMins = Number(body.durationMins) || 0;
    const reason = String(body.reason || 'Blocked & logged out by Admin / Cyber Security. All app data hidden.').trim();
    const nowIso = new Date().toISOString();

    const keysToMatch = Array.from(new Set([target, telegramId, telegramUsername, ...deviceIds].filter(Boolean)));
    if (keysToMatch.length === 0) {
      res.status(400).json({ ok: false, error: 'Missing target user or device identifier' });
      return;
    }

    // Collect any linked deviceIds/telegramIds from matching tracked users
    const matchedUsers = activityStore.users.filter((u) =>
      keysToMatch.some(
        (k) =>
          matchesIdentity(u.id, k) ||
          matchesIdentity(u.actor, k) ||
          matchesIdentity(u.label, k) ||
          (u.telegramId && matchesIdentity(u.telegramId, k)) ||
          (u.telegramUsername && matchesIdentity(u.telegramUsername, k)) ||
          (u.deviceId && matchesIdentity(u.deviceId, k)) ||
          (Array.isArray(u.deviceIds) && u.deviceIds.some((d) => matchesIdentity(d, k))),
      ),
    );
    const expandedKeys = new Set<string>(keysToMatch);
    for (const mu of matchedUsers) {
      if (mu.id) expandedKeys.add(mu.id);
      if (mu.actor) expandedKeys.add(mu.actor);
      if (mu.telegramId) expandedKeys.add(mu.telegramId);
      if (mu.telegramUsername) expandedKeys.add(mu.telegramUsername);
      if (mu.deviceId) expandedKeys.add(mu.deviceId);
      if (Array.isArray(mu.deviceIds)) mu.deviceIds.forEach((d) => d && expandedKeys.add(d));
    }

    if (mode === 'block') {
      const expiresAt = durationMins > 0 ? Date.now() + Math.round(durationMins * 60000) : null;
      if (!currentSecurityState.revokedUsers || typeof currentSecurityState.revokedUsers !== 'object') {
        currentSecurityState.revokedUsers = {};
      }
      for (const ek of expandedKeys) {
        currentSecurityState.revokedUsers[normKey(ek)] = {
          at: nowIso,
          reason,
          expiresAt,
          durationMins,
        };
      }
      if (matchedUsers.length > 0) {
        for (const mu of matchedUsers) {
          mu.blocked = true;
          mu.loggedOutAt = nowIso;
          mu.blockExpiresAt = expiresAt;
          mu.blockDurationMins = durationMins;
          mu.blockedReason = reason;
        }
      } else {
        activityStore.users.unshift({
          id: target || keysToMatch[0],
          label: target || keysToMatch[0],
          actor: target || keysToMatch[0],
          role: 'blocked',
          source: telegramId || target.startsWith('@') || /^\d+$/.test(target) ? 'Telegram' : 'Manual',
          platform: telegramId || target.startsWith('@') || /^\d+$/.test(target) ? 'Telegram' : 'Browser',
          deviceId: deviceIds[0] || '',
          deviceIds,
          deviceLabel: '',
          telegramId,
          telegramUsername,
          ip: '',
          blocked: true,
          blockExpiresAt: expiresAt,
          blockDurationMins: durationMins,
          blockedReason: reason,
          loggedOutAt: nowIso,
          opens: 0,
          adds: 0,
          edits: 0,
          deletes: 0,
          activeSeconds: 0,
          firstSeen: nowIso,
          lastSeen: nowIso,
        });
      }
      activityStore.logs.unshift({
        id: `log_blk_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
        timestamp: nowIso,
        actor: byActor,
        action: 'BLOCK',
        source: 'Security',
        platform: 'Security',
        botName: 'Workspace',
        telegramId,
        summary: `Blocked & forced logout "${target || keysToMatch[0]}"${durationMins > 0 ? ` (${durationMins}m timed)` : ' (Permanent)'}`,
      });
    } else if (mode === 'unblock') {
      for (const rk of Object.keys(currentSecurityState.revokedUsers || {})) {
        if (Array.from(expandedKeys).some((ek) => matchesIdentity(rk, ek))) {
          delete currentSecurityState.revokedUsers[rk];
        }
      }
      for (const mu of matchedUsers) {
        mu.blocked = false;
        mu.blockExpiresAt = null;
        mu.blockDurationMins = 0;
        mu.blockedReason = '';
        mu.unblockedAt = nowIso;
      }
      activityStore.logs.unshift({
        id: `log_unblk_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
        timestamp: nowIso,
        actor: byActor,
        action: 'AUTH',
        source: 'Security',
        platform: 'Security',
        botName: 'Workspace',
        telegramId,
        summary: `Unblocked user "${target || keysToMatch[0]}"`,
      });
    } else if (mode === 'delete') {
      for (const rk of Object.keys(currentSecurityState.revokedUsers || {})) {
        if (Array.from(expandedKeys).some((ek) => matchesIdentity(rk, ek))) {
          delete currentSecurityState.revokedUsers[rk];
        }
      }
      activityStore.users = activityStore.users.filter(
        (u) =>
          !Array.from(expandedKeys).some(
            (ek) =>
              matchesIdentity(u.id, ek) ||
              matchesIdentity(u.actor, ek) ||
              (u.telegramId && matchesIdentity(u.telegramId, ek)),
          ),
      );
      activityStore.logs.unshift({
        id: `log_delu_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
        timestamp: nowIso,
        actor: byActor,
        action: 'DELETE',
        source: 'Security',
        platform: 'Security',
        botName: 'Workspace',
        summary: `Deleted user record "${target || keysToMatch[0]}"`,
      });
    }

    if (activityStore.logs.length > 400) activityStore.logs = activityStore.logs.slice(0, 400);
    currentSecurityState.updatedAt = nowIso;
    currentSecurityState.updatedBy = byActor;
    currentSecurityState.source = `server_${mode}`;
    activityStore.updatedAt = nowIso;

    saveSecurityStateToDisk(currentSecurityState);
    saveActivityStoreToDisk(activityStore);
    broadcastSecurityUpdate(currentSecurityState);
    broadcastActivityUpdate(activityStore);

    res.json({
      ok: true,
      state: currentSecurityState,
      users: activityStore.users,
      logs: activityStore.logs.slice(0, 250),
    });
  });

  app.post('/api/activity/clear-logs', (_req: Request, res: Response) => {
    activityStore.logs = [];
    activityStore.updatedAt = new Date().toISOString();
    saveActivityStoreToDisk(activityStore);
    broadcastActivityUpdate(activityStore);
    res.json({ ok: true });
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TableBot server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start TableBot server:', err);
  process.exit(1);
});
