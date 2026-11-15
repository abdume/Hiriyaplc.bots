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

const STATE_FILE = path.resolve(process.cwd(), '.tablebot-security.json');
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

function normalizeCode(raw: unknown): string {
  return String(raw === undefined || raw === null ? '' : raw)
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .trim();
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

let currentSecurityState: SharedSecurityState = loadPersistedSecurityState();
const sseClients = new Set<Response>();

function saveSecurityStateToDisk(next: SharedSecurityState): void {
  try {
    const tmpFile = `${STATE_FILE}.tmp`;
    fs.writeFileSync(tmpFile, JSON.stringify(next, null, 2), 'utf8');
    fs.renameSync(tmpFile, STATE_FILE);
  } catch (err) {
    try {
      fs.writeFileSync(STATE_FILE, JSON.stringify(next, null, 2), 'utf8');
    } catch (innerErr) {
      console.error('Failed to persist security state:', innerErr);
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

async function startServer(): Promise<void> {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  app.get('/api/security-state', (_req: Request, res: Response) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
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

    sseClients.add(res);
    res.write(`event: security_update\ndata: ${JSON.stringify(currentSecurityState)}\n\n`);

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
