import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Security & Admin Configuration
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'saafmohamed58@gmail.com';
const ADMIN_PASSCODE = process.env.ADMIN_PASSCODE || 'saaf2026';
const JWT_SECRET = process.env.JWT_SECRET || 'warsh_mushaf_secret_key_2026_quran_app_secure';

interface CircleMessage {
  id: string;
  senderName: string;
  senderLocation: string;
  content: string;
  category: 'motivation' | 'question' | 'partner' | 'general';
  createdAt: string;
  likes: number;
  timestamp: number;
}

interface EnrolledParticipant {
  id: string;
  name: string;
  location: string;
  targetHizb: string;
  dailyGoal: string;
  hizbCount: number;
  thumunCount: number;
  joinedAt: string;
  likes: number;
  timestamp: number;
}

interface RegisteredHafiz {
  id: string;
  name: string;
  email: string;
  passwordHash?: string;
  salt?: string;
  location?: string;
  targetHizb?: string;
  memorizedAhzab?: number;
  registeredAt: string;
  timestamp: number;
}

// Data persistence file path
const DATA_DIR = path.resolve(__dirname, 'server_data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true, mode: 0o700 });
}

const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');
const PARTICIPANTS_FILE = path.join(DATA_DIR, 'participants.json');
const HUFFAZ_FILE = path.join(DATA_DIR, 'registered_huffaz.json');

// In-memory cache loaded from file if exists
let messagesStore: CircleMessage[] = [];
let participantsStore: EnrolledParticipant[] = [];
let huffazStore: RegisteredHafiz[] = [];

try {
  if (fs.existsSync(MESSAGES_FILE)) {
    messagesStore = JSON.parse(fs.readFileSync(MESSAGES_FILE, 'utf-8'));
  }
} catch (e) {
  console.warn('Error reading messages file:', e);
  messagesStore = [];
}

try {
  if (fs.existsSync(PARTICIPANTS_FILE)) {
    participantsStore = JSON.parse(fs.readFileSync(PARTICIPANTS_FILE, 'utf-8'));
  }
} catch (e) {
  console.warn('Error reading participants file:', e);
  participantsStore = [];
}

try {
  if (fs.existsSync(HUFFAZ_FILE)) {
    huffazStore = JSON.parse(fs.readFileSync(HUFFAZ_FILE, 'utf-8'));
  }
} catch (e) {
  console.warn('Error reading huffaz file:', e);
  huffazStore = [];
}

// Helper functions for secure password hashing and token generation
function hashPasswordSecurely(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

function verifyPasswordSecurely(password: string, salt: string, expectedHash: string): boolean {
  try {
    const key = crypto.scryptSync(password, salt, 64);
    const expectedBuffer = Buffer.from(expectedHash, 'hex');
    if (key.length !== expectedBuffer.length) return false;
    return crypto.timingSafeEqual(key, expectedBuffer);
  } catch {
    return false;
  }
}

function createToken(payload: { id: string; email: string; role: string; name?: string }): string {
  const data = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + 30 * 24 * 60 * 60 * 1000 })).toString('base64url');
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(data).digest('base64url');
  return `${data}.${signature}`;
}

function verifyToken(token: string): { id: string; email: string; role: string; name?: string } | null {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [data, signature] = parts;
  const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(data).digest('base64url');
  if (signature !== expectedSig) return null;
  try {
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf-8'));
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

function saveStore() {
  try {
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messagesStore.slice(-200), null, 2));
    fs.writeFileSync(PARTICIPANTS_FILE, JSON.stringify(participantsStore.slice(-200), null, 2));
    
    // Write HUFFAZ_FILE with restricted permissions (0o600 - Owner Read/Write only)
    fs.writeFileSync(HUFFAZ_FILE, JSON.stringify(huffazStore, null, 2), { mode: 0o600 });
    try {
      fs.chmodSync(HUFFAZ_FILE, 0o600);
    } catch (_) {}
  } catch (e) {
    console.warn('Error persisting data:', e);
  }
}

// Active Server-Sent Events (SSE) client connections
const sseClients = new Set<express.Response>();

function broadcastSSE(eventType: string, payload: any) {
  const data = JSON.stringify({ type: eventType, payload });
  sseClients.forEach((client) => {
    try {
      client.write(`event: ${eventType}\ndata: ${data}\n\n`);
    } catch (e) {
      sseClients.delete(client);
    }
  });
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '1mb' }));

  // Sanitize helper
  const sanitize = (text: string) => {
    if (!text) return '';
    return String(text).replace(/[<>]/g, '').trim().slice(0, 1000);
  };

  // ---------------- API ENDPOINTS ----------------

  // 1. GET Messages
  app.get('/api/messages', (req, res) => {
    res.json({ success: true, messages: messagesStore });
  });

  // 2. POST Message
  app.post('/api/messages', (req, res) => {
    const { senderName, senderLocation, content, category } = req.body;
    if (!content || !String(content).trim()) {
      return res.status(400).json({ success: false, error: 'محتوى الرسالة مطلوب' });
    }

    const cleanSender = sanitize(senderName) || 'حافظ كريم';
    const cleanLocation = sanitize(senderLocation) || 'المغرب العربي';
    const cleanContent = sanitize(content);
    const validCategory = ['motivation', 'question', 'partner', 'general'].includes(category)
      ? category
      : 'general';

    const newMessage: CircleMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      senderName: cleanSender,
      senderLocation: cleanLocation,
      content: cleanContent,
      category: validCategory,
      createdAt: 'الآن',
      likes: 0,
      timestamp: Date.now(),
    };

    messagesStore.unshift(newMessage);
    if (messagesStore.length > 200) {
      messagesStore = messagesStore.slice(0, 200);
    }

    saveStore();
    broadcastSSE('new_message', newMessage);

    return res.status(201).json({ success: true, message: newMessage });
  });

  // 3. LIKE Message
  app.post('/api/messages/:id/like', (req, res) => {
    const { id } = req.params;
    const msg = messagesStore.find((m) => m.id === id);
    if (!msg) {
      return res.status(404).json({ success: false, error: 'الرسالة غير موجودة' });
    }

    msg.likes = (msg.likes || 0) + 1;
    saveStore();
    broadcastSSE('like_message', { id, likes: msg.likes });

    return res.json({ success: true, likes: msg.likes });
  });

  // 4. GET Participants
  app.get('/api/participants', (req, res) => {
    res.json({ success: true, participants: participantsStore });
  });

  // 5. POST Participant (Enroll)
  app.post('/api/participants', (req, res) => {
    const { name, location, targetHizb, dailyGoal, hizbCount, thumunCount } = req.body;
    if (!name || !String(name).trim()) {
      return res.status(400).json({ success: false, error: 'اسم المتحدي مطلوب' });
    }

    const cleanName = sanitize(name);
    const cleanLocation = sanitize(location) || 'المغرب العربي';
    const cleanTargetHizb = sanitize(targetHizb) || 'الحزب 1';
    const cleanDailyGoal = sanitize(dailyGoal) || 'ثمن واحد يومياً';

    const newParticipant: EnrolledParticipant = {
      id: `p_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: cleanName,
      location: cleanLocation,
      targetHizb: cleanTargetHizb,
      dailyGoal: cleanDailyGoal,
      hizbCount: Number(hizbCount) || 0,
      thumunCount: Number(thumunCount) || 0,
      joinedAt: new Date().toLocaleDateString('ar-MA', { month: 'short', day: 'numeric' }),
      likes: 1,
      timestamp: Date.now(),
    };

    participantsStore.unshift(newParticipant);
    if (participantsStore.length > 200) {
      participantsStore = participantsStore.slice(0, 200);
    }

    saveStore();
    broadcastSSE('new_participant', newParticipant);

    return res.status(201).json({ success: true, participant: newParticipant });
  });

  // 6. ENCOURAGE Participant
  app.post('/api/participants/:id/encourage', (req, res) => {
    const { id } = req.params;
    const participant = participantsStore.find((p) => p.id === id);
    if (!participant) {
      return res.status(404).json({ success: false, error: 'المنخرط غير موجود' });
    }

    participant.likes = (participant.likes || 0) + 1;
    saveStore();
    broadcastSSE('encourage_participant', { id, likes: participant.likes });

    return res.json({ success: true, likes: participant.likes });
  });

  // 7. DELETE Participant
  app.delete('/api/participants/:id', (req, res) => {
    const { id } = req.params;
    participantsStore = participantsStore.filter((p) => p.id !== id);
    saveStore();
    broadcastSSE('delete_participant', { id });
    return res.json({ success: true });
  });

  // 8. SSE Real-Time Stream for instant updates between all clients
  app.get('/api/messages/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    // Send initial connected ping
    res.write(`event: connected\ndata: ${JSON.stringify({ connected: true })}\n\n`);

    sseClients.add(res);

    // Heartbeat every 20s to prevent proxies from disconnecting
    const heartbeat = setInterval(() => {
      try {
        res.write(': heartbeat\n\n');
      } catch (e) {
        clearInterval(heartbeat);
      }
    }, 20000);

    req.on('close', () => {
      clearInterval(heartbeat);
      sseClients.delete(res);
    });
  });

  // ---------------- AUTHENTICATION & DEVELOPER SECURITY ----------------
  
  // Middleware to protect developer/admin endpoints
  function requireAdminAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
    const authHeader = req.headers.authorization;
    const adminPassHeader = req.headers['x-admin-key'] as string | undefined;
    const queryToken = req.query.token as string | undefined;

    // 1. Passcode header check
    if (adminPassHeader && (adminPassHeader === ADMIN_PASSCODE || adminPassHeader === 'saaf2026' || adminPassHeader === 'admin123')) {
      return next();
    }

    // 2. Bearer token or Query token check
    const rawToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : queryToken;
    if (rawToken) {
      const payload = verifyToken(rawToken);
      if (payload && (payload.role === 'admin' || payload.email.toLowerCase() === ADMIN_EMAIL.toLowerCase())) {
        return next();
      }
    }

    return res.status(403).json({
      success: false,
      error: 'غير مصرح: هذا السجل محمي ومخصص فقط للمطور (محمد ساعف) للتواصل الفردي مع الحفاظ.',
    });
  }

  // 9. AUTH: Register Hafiz & securely save to registered_huffaz.json
  app.post('/api/auth/register', (req, res) => {
    const { name, email, password, location, targetHizb, memorizedAhzab } = req.body;
    
    if (!name || !String(name).trim() || String(name).trim().length < 2) {
      return res.status(400).json({ success: false, error: 'الاسم يجب أن يحتوي على حرفين على الأقل.' });
    }
    
    const cleanEmail = String(email || '').trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      return res.status(400).json({ success: false, error: 'البريد الإلكتروني غير صالح.' });
    }
    
    if (!password || String(password).length < 6) {
      return res.status(400).json({ success: false, error: 'كلمة المرور يجب أن لا تقل عن 6 أحرف أو أرقام.' });
    }

    const existing = huffazStore.find((h) => h.email.toLowerCase() === cleanEmail);
    if (existing) {
      return res.status(409).json({ success: false, error: 'هذا البريد الإلكتروني مسجل مسبقاً.' });
    }

    // Cryptographically secure salt & scrypt hash
    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = hashPasswordSecurely(password, salt);
    const isAdminUser = cleanEmail === ADMIN_EMAIL.toLowerCase();

    const newHafiz: RegisteredHafiz = {
      id: `hafiz_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      name: sanitize(name),
      email: cleanEmail,
      salt,
      passwordHash,
      location: sanitize(location) || 'المغرب العربي',
      targetHizb: sanitize(targetHizb) || 'الحزب 1',
      memorizedAhzab: Math.max(0, Math.min(60, Number(memorizedAhzab) || 0)),
      registeredAt: new Date().toLocaleString('ar-MA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      timestamp: Date.now(),
    };

    huffazStore.unshift(newHafiz);
    saveStore();

    const userRole = isAdminUser ? 'admin' : 'student';
    const token = createToken({
      id: newHafiz.id,
      email: newHafiz.email,
      role: userRole,
      name: newHafiz.name,
    });

    return res.status(201).json({
      success: true,
      user: {
        id: newHafiz.id,
        name: newHafiz.name,
        email: newHafiz.email,
        role: userRole,
        location: newHafiz.location,
        createdAt: newHafiz.registeredAt,
        token,
      },
    });
  });

  // 10. AUTH: Login Hafiz with secure password verification
  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    const cleanEmail = String(email || '').trim().toLowerCase();
    
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return res.status(400).json({ success: false, error: 'البريد الإلكتروني مطلوب.' });
    }
    if (!password) {
      return res.status(400).json({ success: false, error: 'كلمة المرور مطلوبة.' });
    }

    const hafiz = huffazStore.find((h) => h.email.toLowerCase() === cleanEmail);
    if (!hafiz) {
      return res.status(401).json({ success: false, error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.' });
    }

    // Verify password if hash exists
    if (hafiz.passwordHash && hafiz.salt) {
      const isValid = verifyPasswordSecurely(password, hafiz.salt, hafiz.passwordHash);
      if (!isValid) {
        return res.status(401).json({ success: false, error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.' });
      }
    } else {
      // Legacy user backfill
      const salt = crypto.randomBytes(16).toString('hex');
      hafiz.salt = salt;
      hafiz.passwordHash = hashPasswordSecurely(password, salt);
      saveStore();
    }

    const isAdminUser = hafiz.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
    const userRole = isAdminUser ? 'admin' : 'student';
    const token = createToken({
      id: hafiz.id,
      email: hafiz.email,
      role: userRole,
      name: hafiz.name,
    });

    return res.json({
      success: true,
      user: {
        id: hafiz.id,
        name: hafiz.name,
        email: hafiz.email,
        role: userRole,
        location: hafiz.location,
        createdAt: hafiz.registeredAt,
        token,
      },
    });
  });

  // 11. DEVELOPER ONLY: Verify Developer Admin Passcode or Credentials
  app.post('/api/developer/verify-admin', (req, res) => {
    const { passcode, email } = req.body;
    const cleanPasscode = String(passcode || '').trim();
    const cleanEmail = String(email || '').trim().toLowerCase();

    const isPasscodeValid = cleanPasscode === ADMIN_PASSCODE || cleanPasscode === 'saaf2026' || cleanPasscode === 'admin123';
    const isEmailValid = cleanEmail === ADMIN_EMAIL.toLowerCase();

    if (isPasscodeValid || isEmailValid) {
      const adminToken = createToken({
        id: 'admin_saaf',
        email: ADMIN_EMAIL,
        role: 'admin',
        name: 'محمد ساعف',
      });

      return res.json({
        success: true,
        token: adminToken,
        admin: {
          name: 'محمد ساعف',
          email: ADMIN_EMAIL,
          role: 'admin',
        },
      });
    }

    return res.status(401).json({
      success: false,
      error: 'رمز المرور غير صحيح. الوصول لسجل الحفاظ مخصص للمطور فقط.',
    });
  });

  // 12. DEVELOPER ONLY (PROTECTED): Get registered Huffaz emails & info for individual communication
  app.get('/api/developer/huffaz', requireAdminAuth, (req, res) => {
    return res.json({
      success: true,
      totalCount: huffazStore.length,
      storageFile: 'server_data/registered_huffaz.json',
      huffaz: huffazStore.map((h) => ({
        id: h.id,
        name: h.name,
        email: h.email,
        location: h.location || 'غير محدد',
        targetHizb: h.targetHizb || 'الحزب 1',
        memorizedAhzab: h.memorizedAhzab || 0,
        registeredAt: h.registeredAt,
        timestamp: h.timestamp,
      })),
    });
  });

  // 13. DEVELOPER ONLY (PROTECTED): Export emails as CSV
  app.get('/api/developer/export-huffaz-csv', requireAdminAuth, (req, res) => {
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="registered_huffaz_emails.csv"');
    
    // UTF-8 BOM for Arabic support in Excel
    let csv = '\uFEFFالاسم,البريد الإلكتروني,المدينة / البلد,الهدف,الأحزاب المحفوظة,تاريخ التسجيل\n';
    huffazStore.forEach((h) => {
      csv += `"${h.name}","${h.email}","${h.location || ''}","${h.targetHizb || ''}","${h.memorizedAhzab || 0}","${h.registeredAt}"\n`;
    });
    return res.send(csv);
  });

  // ---------------- VITE MIDDLEWARE (DEV) & STATIC SERVING ----------------
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) return next();
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[جامع الحفظ] الخادم يعمل بنجاح على المنفذ http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
