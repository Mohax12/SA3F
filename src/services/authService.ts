/**
 * نظام التحقق والأمان وحماية الحسابات
 * يطبق تشفير كلمات المرور عبر Web Crypto API (SHA-256 مع ملح Salt)
 * حماية من الهجمات والـ Spam و Rate Limiting
 */

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  createdAt: string;
  token: string;
  location?: string;
}

const USERS_STORAGE_KEY = 'warsh_secure_users';
const CURRENT_SESSION_KEY = 'warsh_current_session';
const RATE_LIMIT_KEY = 'warsh_rate_limits';
const DEVELOPER_ADMIN_TOKEN_KEY = 'warsh_developer_admin_token';

/**
 * دالة تشفير SHA-256 آمنة باستخدام Web Crypto
 */
async function hashPassword(password: string, salt: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(password + salt + 'warsh_secret_pepper_2026');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * تنظيف والتحقق من صحة المدخلات لمنع حقن الأكواد
 */
export function sanitizeInput(str: string): string {
  if (!str) return '';
  return str
    .replace(/[<>]/g, '') // remove HTML tags
    .trim()
    .slice(0, 500); // enforce maximum length
}

/**
 * فحص Rate Limit لمنع الـ Spam
 */
export function checkRateLimit(action: string, maxAttempts = 5, windowMs = 60000): { allowed: boolean; remainingSec: number } {
  try {
    const raw = sessionStorage.getItem(RATE_LIMIT_KEY);
    const store: Record<string, number[]> = raw ? JSON.parse(raw) : {};
    const now = Date.now();
    const timestamps = (store[action] || []).filter(t => now - t < windowMs);

    if (timestamps.length >= maxAttempts) {
      const oldest = timestamps[0];
      const remainingSec = Math.ceil((windowMs - (now - oldest)) / 1000);
      return { allowed: false, remainingSec };
    }

    timestamps.push(now);
    store[action] = timestamps;
    sessionStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(store));
    return { allowed: true, remainingSec: 0 };
  } catch {
    return { allowed: true, remainingSec: 0 };
  }
}

/**
 * جلب المستخدم المسجل حالياً
 */
export function getCurrentUser(): AuthUser | null {
  try {
    const session = localStorage.getItem(CURRENT_SESSION_KEY);
    return session ? JSON.parse(session) : null;
  } catch {
    return null;
  }
}

/**
 * تسجيل حساب جديد
 */
export async function registerUser(
  name: string, 
  email: string, 
  pass: string,
  location?: string,
  targetHizb?: string,
  memorizedAhzab?: number
): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
  // 1. Rate Limit
  const rate = checkRateLimit('register', 5, 60000);
  if (!rate.allowed) {
    return { success: false, error: `تجاوزت عدد المحاولات المسموح بها. يرجى الانتظار ${rate.remainingSec} ثانية.` };
  }

  // 2. Validate inputs
  const cleanName = sanitizeInput(name);
  const cleanEmail = sanitizeInput(email).toLowerCase();
  if (cleanName.length < 2) {
    return { success: false, error: 'الاسم يجب أن يحتوي على حرفين على الأقل.' };
  }
  if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
    return { success: false, error: 'البريد الإلكتروني غير صالح.' };
  }
  if (pass.length < 6) {
    return { success: false, error: 'كلمة المرور يجب أن لا تقل عن 6 أحرف أو أرقام.' };
  }

  // 3. Send to Server API to store in server_data/registered_huffaz.json
  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: cleanName,
        email: cleanEmail,
        password: pass,
        location: location || 'المغرب العربي',
        targetHizb: targetHizb || 'الحزب 1',
        memorizedAhzab: memorizedAhzab || 0
      })
    });

    const data = await response.json();
    if (response.ok && data.success && data.user) {
      localStorage.setItem(CURRENT_SESSION_KEY, JSON.stringify(data.user));
      return { success: true, user: data.user };
    } else if (!response.ok && data.error) {
      return { success: false, error: data.error };
    }
  } catch (err) {
    console.warn('Backend register fetch failed, falling back to local storage:', err);
  }

  // Fallback: Local offline registration
  const rawUsers = localStorage.getItem(USERS_STORAGE_KEY);
  const users: any[] = rawUsers ? JSON.parse(rawUsers) : [];
  if (users.some(u => u.email === cleanEmail)) {
    return { success: false, error: 'هذا البريد الإلكتروني مسجل مسبقاً.' };
  }

  // 4. Hash password
  const salt = Math.random().toString(36).slice(2);
  const passwordHash = await hashPassword(pass, salt);

  const newUser: AuthUser = {
    id: `usr_${Date.now()}`,
    name: cleanName,
    email: cleanEmail,
    role: 'student',
    createdAt: new Date().toISOString(),
    token: `jwt_sim_${Math.random().toString(36).substring(2)}`
  };

  users.push({
    ...newUser,
    salt,
    passwordHash
  });

  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  localStorage.setItem(CURRENT_SESSION_KEY, JSON.stringify(newUser));

  return { success: true, user: newUser };
}

/**
 * تسجيل الدخول
 */
export async function loginUser(email: string, pass: string): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
  // Rate Limit check
  const rate = checkRateLimit('login', 5, 60000);
  if (!rate.allowed) {
    return { success: false, error: `تم تقييد محاولات الدخول للحماية. يرجى الانتظار ${rate.remainingSec} ثانية.` };
  }

  const cleanEmail = sanitizeInput(email).toLowerCase();

  // Try server first
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, password: pass })
    });
    const data = await res.json();
    if (res.ok && data.success && data.user) {
      localStorage.setItem(CURRENT_SESSION_KEY, JSON.stringify(data.user));
      return { success: true, user: data.user };
    } else if (!res.ok && data.error) {
      return { success: false, error: data.error };
    }
  } catch (err) {
    console.warn('Backend login fetch failed, checking local storage:', err);
  }

  const rawUsers = localStorage.getItem(USERS_STORAGE_KEY);
  const users: any[] = rawUsers ? JSON.parse(rawUsers) : [];

  const found = users.find(u => u.email === cleanEmail);
  if (!found) {
    return { success: false, error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.' };
  }

  const computedHash = await hashPassword(pass, found.salt);
  if (computedHash !== found.passwordHash) {
    return { success: false, error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.' };
  }

  const sessionUser: AuthUser = {
    id: found.id,
    name: found.name,
    email: found.email,
    role: found.role || 'student',
    createdAt: found.createdAt,
    token: `jwt_sim_${Math.random().toString(36).substring(2)}`
  };

  localStorage.setItem(CURRENT_SESSION_KEY, JSON.stringify(sessionUser));
  return { success: true, user: sessionUser };
}

/**
 * إدارة رمز دخول المشرف/المطور
 */
export function getAdminToken(): string | null {
  try {
    return sessionStorage.getItem(DEVELOPER_ADMIN_TOKEN_KEY) || localStorage.getItem(DEVELOPER_ADMIN_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAdminToken(token: string): void {
  try {
    sessionStorage.setItem(DEVELOPER_ADMIN_TOKEN_KEY, token);
  } catch {}
}

export function clearAdminToken(): void {
  try {
    sessionStorage.removeItem(DEVELOPER_ADMIN_TOKEN_KEY);
  } catch {}
}

/**
 * التحقق من رمز المرور السري للمطور
 */
export async function verifyDeveloperPasscode(passcode: string, email?: string): Promise<{ success: boolean; token?: string; error?: string }> {
  try {
    const res = await fetch('/api/developer/verify-admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passcode, email })
    });
    const data = await res.json();
    if (res.ok && data.success && data.token) {
      setAdminToken(data.token);
      return { success: true, token: data.token };
    }
    return { success: false, error: data.error || 'رمز المرور غير صحيح' };
  } catch (err: any) {
    return { success: false, error: 'تعذر الاتصال بالخادم للتحقق من المطور' };
  }
}

/**
 * جلب قائمة الحفاظ المسجلين للمطور للتواصل الفردي (محمي بصلاحيات المشرف)
 */
export async function fetchDeveloperHuffazList(overrideToken?: string): Promise<{ success: boolean; huffaz: any[]; error?: string }> {
  const token = overrideToken || getAdminToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch('/api/developer/huffaz', { headers });
    if (res.status === 401 || res.status === 403) {
      clearAdminToken();
      return { success: false, huffaz: [], error: 'مطلوب إذن المطور للوصول إلى هذا السجل.' };
    }
    if (!res.ok) throw new Error('فشل جلب قائمة الحفاظ من الخادم');
    const data = await res.json();
    return { success: true, huffaz: data.huffaz || [] };
  } catch (e: any) {
    console.warn('Error fetching developer huffaz list:', e);
    return { success: false, huffaz: [], error: e?.message || 'تعذر تحميل القائمة' };
  }
}

/**
 * رابط تصدير ملف الإكسل CSV مع رمز التفويض
 */
export function getDeveloperExportCsvUrl(): string {
  const token = getAdminToken();
  return token ? `/api/developer/export-huffaz-csv?token=${encodeURIComponent(token)}` : '/api/developer/export-huffaz-csv';
}

/**
 * تسجيل الخروج
 */
export function logoutUser(): void {
  localStorage.removeItem(CURRENT_SESSION_KEY);
  clearAdminToken();
}
