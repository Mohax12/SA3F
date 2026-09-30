import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  Lock, 
  Mail, 
  User, 
  CheckCircle2, 
  AlertCircle, 
  LogOut, 
  KeyRound,
  Sparkles,
  Eye,
  EyeOff,
  Shield,
  Crown
} from 'lucide-react';
import { AuthUser, registerUser, loginUser, logoutUser } from '../services/authService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AuthUser | null;
  onAuthChange: (u: AuthUser | null) => void;
  isDark?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onAuthChange,
  isDark = true
}) => {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [location, setLocation] = useState('');
  const [memorizedAhzab, setMemorizedAhzab] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      setError('يرجى إدخال عنوان بريد إلكتروني صحيح (مثال: name@example.com).');
      return;
    }

    if (!password || password.length < 6) {
      setError('كلمة المرور يجب أن لا تقل عن 6 أحرف أو أرقام.');
      return;
    }

    if (tab === 'register' && (!name.trim() || name.trim().length < 2)) {
      setError('يرجى كتابة الاسم الكامل (حرفين على الأقل).');
      return;
    }

    setLoading(true);

    try {
      if (tab === 'login') {
        const res = await loginUser(cleanEmail, password);
        if (res.success && res.user) {
          setSuccessMsg('تم تسجيل الدخول بنجاح! مرحباً بك في جامع الحفظ.');
          setTimeout(() => {
            onAuthChange(res.user!);
            onClose();
          }, 600);
        } else {
          setError(res.error || 'البريد الإلكتروني أو كلمة المرور غير صحيحة.');
        }
      } else {
        const res = await registerUser(name.trim(), cleanEmail, password, location.trim(), 'الحزب 1', memorizedAhzab);
        if (res.success && res.user) {
          setSuccessMsg('تم إنشاء حساب الحافظ بنجاح وحفظ بياناتك بأمان!');
          setTimeout(() => {
            onAuthChange(res.user!);
            onClose();
          }, 800);
        } else {
          setError(res.error || 'حدث خطأ أثناء إنشاء الحساب.');
        }
      }
    } catch (err: any) {
      setError(err?.message || 'تعذر إتمام العملية. يرجى التحقق من اتصالك.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logoutUser();
    onAuthChange(null);
    onClose();
  };

  const isUserAdmin = currentUser?.role === 'admin' || currentUser?.email.toLowerCase() === 'saafmohamed58@gmail.com';
  const cardBg = isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div 
        className={`w-full max-w-md rounded-3xl border shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 ${
          isDark 
            ? 'bg-slate-950 text-slate-100 border-emerald-900/50 shadow-emerald-950/40' 
            : 'bg-white text-slate-900 border-slate-300 shadow-xl'
        }`}
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`p-4 sm:p-5 border-b flex items-center justify-between gap-3 ${
          isDark ? 'border-slate-800 bg-slate-900/60' : 'border-slate-200 bg-emerald-50/70'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-800 border border-emerald-500/30 flex items-center justify-center shadow-md shrink-0">
              <ShieldCheck className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold">
                {currentUser ? 'حساب الحافظ الشخصي' : 'تسجيل الدخول والأمان'}
              </h3>
              <p className="text-xs text-slate-400">
                حماية البيانات ومزامنة مسيرة الحفظ
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition cursor-pointer ${
              isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-slate-200' : 'hover:bg-slate-200 text-slate-600'
            }`}
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-4">
          {currentUser ? (
            /* Logged in state */
            <div className="space-y-4 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400 flex items-center justify-center mx-auto text-xl font-bold shadow-lg">
                {currentUser.name.slice(0, 1)}
              </div>

              <div>
                <h4 className="text-lg font-bold text-slate-100 flex items-center justify-center gap-1.5">
                  <span>{currentUser.name}</span>
                  {isUserAdmin && (
                    <span title="مطور ومسؤول التطبيق">
                      <Crown className="w-4 h-4 text-amber-400" />
                    </span>
                  )}
                </h4>
                <p className="text-xs text-slate-400 font-mono">
                  {currentUser.email}
                </p>
                
                {isUserAdmin ? (
                  <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    👑 حساب المطور والمشرف العام (محمد ساعف)
                  </span>
                ) : (
                  <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    حافظ مسجل · مشفر وآمن
                  </span>
                )}
              </div>

              <div className={`p-4 rounded-2xl border text-right text-xs space-y-2.5 ${cardBg}`}>
                <div className="flex items-center justify-between text-slate-300">
                  <span>الرتبة:</span>
                  <span className="font-semibold text-emerald-400">
                    {isUserAdmin ? 'مطور المنصة' : 'حافظ في حلقة ورش'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>تشفير الحساب:</span>
                  <span className="font-mono text-emerald-400 font-bold">Node Scrypt + Salt</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>خصوصية البيانات:</span>
                  <span className="text-slate-400">محمية وخاصة بالمطور فقط للتواصل</span>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="w-full py-2.5 rounded-xl border border-rose-500/40 text-rose-400 hover:bg-rose-500/10 font-bold text-xs transition cursor-pointer flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span>تسجيل الخروج من هذا الجهاز</span>
              </button>
            </div>
          ) : (
            /* Login / Register tabs */
            <div className="space-y-4">
              <div className={`grid grid-cols-2 p-1 rounded-xl border ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-300'
              }`}>
                <button
                  type="button"
                  onClick={() => { setTab('login'); setError(null); setSuccessMsg(null); }}
                  className={`py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
                    tab === 'login' 
                      ? 'bg-emerald-600 text-slate-950 shadow-sm' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  تسجيل الدخول
                </button>
                <button
                  type="button"
                  onClick={() => { setTab('register'); setError(null); setSuccessMsg(null); }}
                  className={`py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
                    tab === 'register' 
                      ? 'bg-emerald-600 text-slate-950 shadow-sm' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  إنشاء حساب حافظ جديد
                </button>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3 text-xs">
                {tab === 'register' && (
                  <>
                    <div>
                      <label className="block mb-1 font-semibold text-slate-300">
                        الاسم الكامل:
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="مثال: يوسف العلوي"
                          className={`w-full pr-9 pl-3 py-2.5 rounded-xl border transition focus:outline-none focus:border-emerald-500 ${
                            isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                          }`}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block mb-1 font-semibold text-slate-300 text-[11px]">
                          المدينة أو البلد (اختياري):
                        </label>
                        <input
                          type="text"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          placeholder="مثال: فاس، المغرب"
                          className={`w-full px-3 py-2 rounded-xl border text-xs transition focus:outline-none focus:border-emerald-500 ${
                            isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                          }`}
                        />
                      </div>

                      <div>
                        <label className="block mb-1 font-semibold text-slate-300 text-[11px]">
                          كم حزباً تحفظ حالياً؟
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="60"
                          value={memorizedAhzab}
                          onChange={(e) => setMemorizedAhzab(Number(e.target.value))}
                          placeholder="0 - 60"
                          className={`w-full px-3 py-2 rounded-xl border text-xs transition focus:outline-none focus:border-emerald-500 ${
                            isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                          }`}
                        />
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <label className="block mb-1 font-semibold text-slate-300">
                    البريد الإلكتروني:
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className={`w-full pr-9 pl-3 py-2.5 rounded-xl border transition focus:outline-none focus:border-emerald-500 ${
                        isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block mb-1 font-semibold text-slate-300">
                    كلمة المرور:
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className={`w-full pr-9 pl-10 py-2.5 rounded-xl border transition focus:outline-none focus:border-emerald-500 ${
                        isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1 cursor-pointer transition"
                      title={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Privacy & Security Guarantee Banner */}
                <div className="p-3 rounded-2xl bg-emerald-950/30 border border-emerald-500/20 text-slate-400 text-[11px] leading-relaxed flex items-start gap-2">
                  <Shield className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>حماية وخصوصية مشفرة:</strong> تُشفر كلمات المرور بأعلى معايير الحماية (Scrypt + Salt)، ويُحفظ بريدك في مكان آمن لا يطّلع عليه إلا مطور المشروع للتواصل الفردي وتشجيعك.
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs transition cursor-pointer shadow-lg disabled:opacity-50 mt-1 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Sparkles className="w-4 h-4 animate-spin text-slate-950" />
                      <span>جارٍ التحقق وتأمين الحساب...</span>
                    </>
                  ) : tab === 'login' ? (
                    'تسجيل الدخول الآمن'
                  ) : (
                    'إنشاء الحساب وحفظ البيانات'
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
