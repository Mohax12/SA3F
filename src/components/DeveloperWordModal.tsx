import React, { useState, useEffect } from 'react';
import { 
  X, 
  Heart, 
  Sparkles, 
  BookOpen, 
  Award, 
  Mail, 
  Users, 
  Copy, 
  Check, 
  Download, 
  ExternalLink, 
  Shield, 
  Lock, 
  KeyRound, 
  AlertCircle,
  Crown
} from 'lucide-react';
import { 
  AuthUser, 
  fetchDeveloperHuffazList, 
  verifyDeveloperPasscode, 
  getAdminToken, 
  getDeveloperExportCsvUrl 
} from '../services/authService';

interface DeveloperWordModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: AuthUser | null;
  isDark?: boolean;
}

export const DeveloperWordModal: React.FC<DeveloperWordModalProps> = ({
  isOpen,
  onClose,
  currentUser = null,
  isDark = true
}) => {
  const [activeTab, setActiveTab] = useState<'word' | 'huffaz_emails'>('word');
  const [huffazList, setHuffazList] = useState<any[]>([]);
  const [loadingHuffaz, setLoadingHuffaz] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);
  
  // Developer Gate State
  const [passcode, setPasscode] = useState('');
  const [passcodeError, setPasscodeError] = useState<string | null>(null);
  const [verifyingPasscode, setVerifyingPasscode] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState<boolean>(() => {
    return Boolean(getAdminToken()) || currentUser?.role === 'admin' || currentUser?.email?.toLowerCase() === 'saafmohamed58@gmail.com';
  });

  // Check authorization on open or user change
  useEffect(() => {
    if (currentUser?.role === 'admin' || currentUser?.email?.toLowerCase() === 'saafmohamed58@gmail.com') {
      setIsAuthorized(true);
    }
  }, [currentUser]);

  const loadHuffazData = async () => {
    setLoadingHuffaz(true);
    setPasscodeError(null);
    try {
      const res = await fetchDeveloperHuffazList();
      if (res.success && res.huffaz) {
        setHuffazList(res.huffaz);
        setIsAuthorized(true);
      } else {
        if (res.error?.includes('إذن') || res.error?.includes('مطلوب')) {
          setIsAuthorized(false);
        }
      }
    } catch {
      setIsAuthorized(false);
    } finally {
      setLoadingHuffaz(false);
    }
  };

  useEffect(() => {
    if (isOpen && activeTab === 'huffaz_emails') {
      if (isAuthorized) {
        loadHuffazData();
      }
    }
  }, [isOpen, activeTab, isAuthorized]);

  const handleVerifyPasscode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcode.trim()) {
      setPasscodeError('يرجى إدخال رمز المرور السري للمطور.');
      return;
    }
    setVerifyingPasscode(true);
    setPasscodeError(null);

    try {
      const res = await verifyDeveloperPasscode(passcode.trim(), currentUser?.email);
      if (res.success && res.token) {
        setIsAuthorized(true);
        setPasscode('');
        // Load data immediately with token
        setLoadingHuffaz(true);
        const listRes = await fetchDeveloperHuffazList(res.token);
        if (listRes.success && listRes.huffaz) {
          setHuffazList(listRes.huffaz);
        }
        setLoadingHuffaz(false);
      } else {
        setPasscodeError(res.error || 'رمز المرور غير صحيح.');
      }
    } catch (err: any) {
      setPasscodeError('تعذر التحقق من الخادم. يرجى المحاولة لاحقاً.');
    } finally {
      setVerifyingPasscode(false);
    }
  };

  if (!isOpen) return null;

  const handleCopyAllEmails = () => {
    if (huffazList.length === 0) return;
    const emails = huffazList.map(h => h.email).join(', ');
    navigator.clipboard.writeText(emails);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div 
        className={`w-full max-w-2xl rounded-3xl border shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] ${
          isDark 
            ? 'bg-slate-950 text-slate-100 border-amber-900/50 shadow-amber-950/30' 
            : 'bg-white text-slate-900 border-slate-300 shadow-2xl'
        }`}
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Navigation Tabs */}
        <div className={`p-4 sm:p-5 border-b flex flex-col gap-3 ${
          isDark ? 'border-slate-800 bg-gradient-to-r from-amber-950/50 via-slate-900 to-emerald-950/40' : 'border-slate-200 bg-amber-50/70'
        }`}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 text-slate-950 flex items-center justify-center font-bold shadow-lg shadow-amber-950/40 shrink-0">
                <span className="font-['Amiri'] text-2xl font-bold text-slate-950">
                  م
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider block">
                  مطور المشروع: محمد ساعف
                </span>
                <h3 className="text-sm sm:text-base font-bold">
                  {activeTab === 'word' ? 'كلمة وتعريف بالمشروع' : 'سجل إيميلات الحفاظ للتواصل الفردي'}
                </h3>
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

          {/* Tabs */}
          <div className={`grid grid-cols-2 p-1 rounded-xl border ${
            isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-200/80 border-slate-300'
          }`}>
            <button
              onClick={() => setActiveTab('word')}
              className={`py-1.5 text-xs font-bold rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'word'
                  ? 'bg-amber-600 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Heart className="w-3.5 h-3.5" />
              <span>كلمة المطور</span>
            </button>

            <button
              onClick={() => setActiveTab('huffaz_emails')}
              className={`py-1.5 text-xs font-bold rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'huffaz_emails'
                  ? 'bg-emerald-600 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>إيميلات الحفاظ ({huffazList.length})</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        {activeTab === 'word' ? (
          <div className="p-5 sm:p-7 space-y-6 overflow-y-auto leading-relaxed">
            {/* Developer Card */}
            <div className={`p-4 sm:p-5 rounded-2xl border flex items-center gap-4 ${
              isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-800 border border-emerald-500/40 text-amber-300 flex items-center justify-center font-bold text-xl shadow-md shrink-0">
                ۞
              </div>
              <div>
                <h4 className="text-lg font-bold text-emerald-400">
                  محمد ساعف
                </h4>
                <p className="text-xs text-slate-300 leading-normal mt-1">
                  خريج شعبة الاقتصاد والتدبير، ومهتم بالقرآن الكريم، والتقنية، والذكاء الاصطناعي، وتطوير الأدوات الرقمية النافعة.
                </p>
              </div>
            </div>

            {/* Developer Message */}
            <div className="space-y-4 text-xs sm:text-sm text-slate-200 text-justify">
              <p className="leading-relaxed">
                جاءت فكرة هذا المشروع رغبةً في الجمع بين حب خدمة كتاب الله والاستفادة من التقنية الحديثة، بهدف تقديم وسيلة بسيطة تساعد على حفظ القرآن الكريم ومراجعته وإتقان تلاوته،
              </p>

              <p className="leading-relaxed">
                أسأل الله أن يجعل هذا العمل خالصاً لوجهه الكريم، وأن ينفع به كل من استخدمه، وأن يجعله صدقةً جاريةً لي ولوالديّ.
              </p>
            </div>

            {/* Quranic Ayah Quote */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/50 via-slate-900 to-emerald-950/50 border border-emerald-500/40 text-center space-y-2 shadow-inner">
              <span className="text-[11px] font-semibold text-emerald-400 block">
                قال الله تعالى:
              </span>
              <p className="font-['Amiri_Quran','Amiri',serif] text-base sm:text-lg text-amber-300 font-bold leading-loose">
                ﴿وَلَقَدْ يَسَّرْنَا الْقُرْآنَ لِلذِّكْرِ فَهَلْ مِنْ مُدَّكِرٍ﴾
              </p>
            </div>

            {/* Dua request */}
            <div className="flex items-center justify-center gap-2 text-center text-xs sm:text-sm font-bold text-amber-400">
              <Heart className="w-4 h-4 fill-amber-400 text-amber-400 animate-pulse" />
              <span>لا تنسونا من صالح دعائكم.</span>
            </div>
          </div>
        ) : !isAuthorized ? (
          /* Developer Protected Gate */
          <div className="p-6 sm:p-10 space-y-6 text-center max-w-md mx-auto overflow-y-auto">
            <div className="w-16 h-16 rounded-3xl bg-amber-500/20 border-2 border-amber-500 text-amber-400 flex items-center justify-center mx-auto shadow-lg shadow-amber-950/40">
              <Lock className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h4 className="text-base sm:text-lg font-bold text-slate-100">
                منطقة محمية · خاصة بمطور المشروع
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                هذا السجل محمي ومحفوظ على الخادم، وهو مخصص حصرياً للمطور (محمد ساعف) بهدف التواصل الفردي مع كل حافظ وتشجيعه.
              </p>
            </div>

            {passcodeError && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2 text-right">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{passcodeError}</span>
              </div>
            )}

            <form onSubmit={handleVerifyPasscode} className="space-y-3">
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="password"
                  required
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="أدخل رمز المرور السري للمطور..."
                  className={`w-full pr-10 pl-4 py-2.5 rounded-xl border text-xs text-right transition focus:outline-none focus:border-amber-500 ${
                    isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <button
                type="submit"
                disabled={verifyingPasscode}
                className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs transition cursor-pointer shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {verifyingPasscode ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin text-slate-950" />
                    <span>جارٍ التحقق...</span>
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4" />
                    <span>فتح سجل الحفاظ للمطور</span>
                  </>
                )}
              </button>
            </form>

            <span className="text-[11px] text-slate-500 block">
              نظام أمان جامع الحفظ · تشفير الخادم Scrypt + HMAC
            </span>
          </div>
        ) : (
          /* Huffaz Emails Tab (Developer Only View) */
          <div className="p-5 space-y-4 overflow-y-auto">
            {/* Header info bar */}
            <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <h4 className="font-bold text-emerald-300 flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <span>سجل إيميلات الحفاظ (ملف server_data/registered_huffaz.json)</span>
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  خاص بالمطور فقط للتواصل الفردي وتقديم الدعم والتشجيع لكل حافظ.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleCopyAllEmails}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border border-slate-700"
                  title="نسخ كافة الإيميلات المسجلة"
                >
                  {copiedAll ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedAll ? 'تم النسخ' : 'نسخ الإيميلات'}</span>
                </button>

                <a
                  href={getDeveloperExportCsvUrl()}
                  download="huffaz_emails.csv"
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                  title="تصدير كملف إكسل CSV"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>تصدير CSV</span>
                </a>
              </div>
            </div>

            {loadingHuffaz ? (
              <div className="p-10 text-center text-xs text-slate-400 space-y-2">
                <Sparkles className="w-6 h-6 text-emerald-400 animate-spin mx-auto" />
                <p>جارٍ تحميل بيانات الحفاظ المسجلين من الخادم...</p>
              </div>
            ) : huffazList.length === 0 ? (
              <div className="p-10 text-center rounded-2xl border border-dashed border-slate-800 text-slate-400 space-y-2">
                <Mail className="w-8 h-8 text-slate-600 mx-auto" />
                <h4 className="text-sm font-bold text-slate-300">لا يوجد حفاظ مسجلون بعد في السجل</h4>
                <p className="text-xs text-slate-500">
                  بمجرد أن يسجل أي حافظ عبر زر «تسجيل الدخول / إنشاء حساب» سيظهر إيميله وبياناته هنا فوراً للتواصل الفردي.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {huffazList.map((hafiz, idx) => (
                  <div
                    key={hafiz.id || idx}
                    className="p-3.5 rounded-2xl border border-slate-800 bg-slate-900/60 hover:border-emerald-500/40 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-sm border border-emerald-500/30 shrink-0">
                        {hafiz.name ? hafiz.name.slice(0, 1) : 'ح'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-100">{hafiz.name}</span>
                          <span className="text-[10px] px-2 py-0.2 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                            {hafiz.location || 'المغرب العربي'}
                          </span>
                        </div>
                        <div className="text-[11px] text-emerald-400 font-mono select-all">
                          {hafiz.email}
                        </div>
                        <span className="text-[10px] text-slate-500 block">
                          تاريخ التسجيل: {hafiz.registeredAt}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/60">
                      <a
                        href={`mailto:${hafiz.email}?subject=تواصل%20من%20مطور%20جامع%20الحفظ%20-%20محمد%20ساعف&body=السلام%20عليكم%20ورحمة%20الله%20وبركاته%20أخي%20الحافظ%20الكريم%20${encodeURIComponent(hafiz.name || '')}،%0A%0Aنسعد%20بتواصلك%20في%20تطبيق%20جامع%20الحفظ...`}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer"
                        title="إرسال رسالة بريد فردية لهذا الحافظ"
                      >
                        <Mail className="w-3.5 h-3.5 text-emerald-400" />
                        <span>مراسلة فردية</span>
                        <ExternalLink className="w-3 h-3 opacity-60" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Modal Footer */}
        <div className={`p-4 border-t flex items-center justify-between gap-3 ${
          isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-200 bg-slate-50'
        }`}>
          <span className="text-[11px] text-slate-500">
            مصحف ورش عن نافع · طريق الأزرق
          </span>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer transition"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};

