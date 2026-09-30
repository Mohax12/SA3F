import React from 'react';
import { 
  Flame, 
  CalendarCheck, 
  Search, 
  Download, 
  Volume2, 
  Award,
  Bell,
  Trophy,
  Sun,
  Moon,
  Mic,
  Sparkles,
  Smartphone,
  User,
  ShieldCheck,
  FileText,
  MessageSquare,
  Settings
} from 'lucide-react';
import { AuthUser } from '../services/authService';

interface HeaderProps {
  streakDays: number;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenQuiz: () => void;
  onOpenDailyReview: () => void;
  onOpenBackup: () => void;
  onOpenAudioSettings: () => void;
  onOpenChallenges: () => void;
  onOpenChat: () => void;
  onOpenReminders: () => void;
  onOpenRecitation?: () => void;
  onOpenInstallApp: () => void;
  isInstalled: boolean;
  onOpenDeveloperWord: () => void;
  onOpenAuth: () => void;
  currentUser: AuthUser | null;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  activeFilter: string;
  onFilterChange: (f: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  streakDays,
  searchQuery,
  onSearchChange,
  onOpenQuiz,
  onOpenDailyReview,
  onOpenBackup,
  onOpenAudioSettings,
  onOpenChallenges,
  onOpenChat,
  onOpenReminders,
  onOpenRecitation,
  onOpenInstallApp,
  isInstalled,
  onOpenDeveloperWord,
  onOpenAuth,
  currentUser,
  theme,
  onToggleTheme,
  activeFilter,
  onFilterChange
}) => {
  const isDark = theme === 'dark';

  return (
    <header className={`sticky top-0 z-40 backdrop-blur-md border-b transition-colors duration-200 ${
      isDark 
        ? 'bg-slate-950/90 border-emerald-950/80 shadow-lg shadow-black/40 text-slate-100' 
        : 'bg-white/90 border-slate-200 shadow-sm text-slate-800'
    }`}>
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between py-2.5 gap-2.5">
          {/* Logo & Title & Mobile Quick Actions */}
          <div className="flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-800 border border-emerald-500/30 flex items-center justify-center shadow-lg shadow-emerald-900/20 shrink-0">
                <span className="font-['Amiri'] font-bold text-amber-300 text-xl sm:text-2xl select-none">
                  ۞
                </span>
              </div>
              <div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <h1 className="text-sm sm:text-base font-bold tracking-tight">
                    جامع الحفظ <span className="text-emerald-500 font-medium text-xs">· مصحف ورش</span>
                  </h1>
                </div>
                <p className="text-[11px] opacity-60 hidden xs:block">
                  الأحزاب والأثمان الكاملة (480 ثمناً) بطريق الأزرق
                </p>
              </div>
            </div>

            {/* Mobile Actions: Chat, Install, Developer Word, Theme */}
            <div className="md:hidden flex items-center gap-1">
              {/* Mobile Install App Button - Only shown when NOT installed */}
              {!isInstalled && (
                <button
                  onClick={onOpenInstallApp}
                  className="p-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-xs font-bold flex items-center gap-1 cursor-pointer"
                  title="تحميل التطبيق للأندرويد والآيفون"
                >
                  <Smartphone className="w-4 h-4 text-amber-400" />
                  <span className="text-[10px]">تثبيت</span>
                </button>
              )}

              {/* Mobile Online Chat Button */}
              <button
                onClick={onOpenChat}
                className="p-1.5 rounded-xl border border-emerald-500/40 bg-emerald-950/40 text-emerald-300 text-xs font-bold flex items-center gap-1 cursor-pointer shadow-sm"
                title="المحادثة اونلاين بين الحفاظ"
              >
                <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[10px]">محادثة</span>
              </button>

              {/* Mobile Login Button */}
              <button
                onClick={onOpenAuth}
                className={`p-1.5 rounded-xl border text-xs font-bold flex items-center gap-1 cursor-pointer transition ${
                  currentUser
                    ? 'border-emerald-500/40 bg-emerald-500/20 text-emerald-400'
                    : isDark ? 'border-slate-700 bg-slate-900 text-slate-200 hover:border-emerald-500' : 'border-slate-300 bg-slate-100 text-slate-700'
                }`}
                title={currentUser ? `حساب: ${currentUser.name}` : 'تسجيل الدخول / حساب الحافظ'}
              >
                <User className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[10px]">{currentUser ? currentUser.name.split(' ')[0] : 'حسابي'}</span>
              </button>

              {/* Developer Word Button Mobile */}
              <button
                onClick={onOpenDeveloperWord}
                className={`p-1.5 rounded-xl border transition cursor-pointer text-xs font-semibold ${
                  isDark ? 'bg-slate-900 border-amber-500/40 text-amber-400' : 'bg-amber-50 border-amber-300 text-amber-800'
                }`}
                title="كلمة من مطور المشروع: محمد ساعف"
              >
                <span className="text-[10px] font-bold">المطور</span>
              </button>

              {/* Theme Toggle Mobile */}
              <button
                onClick={onToggleTheme}
                className={`p-1.5 rounded-xl border transition cursor-pointer ${
                  isDark ? 'bg-slate-900 border-slate-800 text-amber-400' : 'bg-slate-100 border-slate-300 text-slate-700'
                }`}
                title={isDark ? 'الوضع النهاري' : 'الوضع الليلي'}
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Quick Actions & Navigation Desktop / Tablet */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 justify-start md:justify-end">
            {/* Install App Button (Android & iPhone) - Only shown in website when NOT installed */}
            {!isInstalled && (
              <button
                onClick={onOpenInstallApp}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-slate-950 text-xs font-bold shadow-md shadow-emerald-950/30 transition cursor-pointer"
                title="تحميل التطبيق لهواتف الأندرويد والآيفون"
              >
                <Smartphone className="w-3.5 h-3.5 text-amber-300" />
                <span>تحميل التطبيق</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-slate-950/30 text-amber-300">
                  Android/iOS
                </span>
              </button>
            )}

            {/* Daily Streak */}
            <div 
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold shadow-inner ${
                isDark ? 'bg-amber-950/40 border-amber-500/30 text-amber-300' : 'bg-amber-50 border-amber-300 text-amber-800'
              }`}
              title="أيام الالتزام المتتالية بالحفظ والمراجعة"
            >
              <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse fill-amber-400" />
              <span>{streakDays} {streakDays === 1 ? 'يوم' : streakDays === 2 ? 'يومان' : 'أيام'}</span>
            </div>

            {/* Challenges & Community Circle */}
            <button
              onClick={onOpenChallenges}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer shadow-sm ${
                isDark 
                  ? 'bg-amber-950/40 hover:bg-amber-900/50 border-amber-600/40 text-amber-300 shadow-amber-950/30' 
                  : 'bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-800'
              }`}
              title="قسم التحديات وحلقة المتنافسين والتواصل"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden sm:inline">التحديات والحلقة</span>
              <span className="sm:hidden">الحلقة</span>
            </button>

            {/* Daily Review */}
            <button
              onClick={onOpenDailyReview}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-medium transition cursor-pointer ${
                isDark ? 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-200' : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
              }`}
              title="عرض ورد المراجعة اليومي المقترح"
            >
              <CalendarCheck className="w-3.5 h-3.5 text-teal-500" />
              <span className="hidden lg:inline">ورد المراجعة</span>
            </button>

            {/* Quiz Mode */}
            <button
              onClick={onOpenQuiz}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-medium transition cursor-pointer ${
                isDark ? 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-200' : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
              }`}
              title="اختبار تثبيت الأثمان والمطالع"
            >
              <Award className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden lg:inline">اختبار الحفظ</span>
            </button>

            {/* Reminders / Alarms */}
            <button
              onClick={onOpenReminders}
              className={`p-2 rounded-xl border transition cursor-pointer relative ${
                isDark ? 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-emerald-400' : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-emerald-600'
              }`}
              title="منبه وتذكيرات مواعيد الورد القرآني"
            >
              <Bell className="w-4 h-4" />
              <span className="w-2 h-2 rounded-full bg-emerald-400 absolute top-1.5 right-1.5 animate-ping" />
              <span className="w-2 h-2 rounded-full bg-emerald-500 absolute top-1.5 right-1.5" />
            </button>

            {/* Audio Reciter Settings / زر الإعدادات */}
            <button
              onClick={onOpenAudioSettings}
              className={`p-2 rounded-xl border transition cursor-pointer flex items-center justify-center ${
                isDark ? 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300 hover:text-slate-100' : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
              }`}
              title="الإعدادات واختيار القارئ"
            >
              <Settings className="w-4 h-4 text-emerald-500 hover:rotate-45 transition-transform duration-300" />
            </button>

            {/* زر الدخول للمحادثة الفورية بجانب زر الإعدادات مباشرة باستخدام CSS */}
            <button
              onClick={onOpenChat}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer shadow-md ${
                isDark 
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-slate-950 border-emerald-400/50 shadow-emerald-950/40' 
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-600 shadow-emerald-200'
              }`}
              title="الدخول للمحادثة الفورية بين الحفاظ"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>المحادثة الفورية</span>
              <span className="w-2 h-2 rounded-full bg-emerald-200 animate-ping" />
            </button>

            {/* Backup / Export */}
            <button
              onClick={onOpenBackup}
              className={`p-2 rounded-xl border transition cursor-pointer ${
                isDark ? 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-400 hover:text-slate-200' : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-600'
              }`}
              title="النسخ الاحتياطي واستيراد الحفظ"
            >
              <Download className="w-4 h-4" />
            </button>

            {/* حساب الحافظ الشخصي */}
            <button
              onClick={onOpenAuth}
              className={`hidden sm:flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer shadow-sm ${
                currentUser
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/30'
                  : isDark 
                    ? 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-200 hover:border-emerald-500' 
                    : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
              }`}
              title={currentUser ? `حساب: ${currentUser.name}` : 'تسجيل الدخول / حساب الحافظ'}
            >
              <User className="w-3.5 h-3.5 text-emerald-400" />
              <span>{currentUser ? currentUser.name.split(' ')[0] : 'حساب الحافظ'}</span>
            </button>

            {/* Developer Word Section (جانب الوضع الليلي أو النهاري كما طلب المستخدم) */}
            <button
              onClick={onOpenDeveloperWord}
              className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                isDark 
                  ? 'bg-amber-950/30 hover:bg-amber-900/40 border-amber-600/40 text-amber-300' 
                  : 'bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-800'
              }`}
              title="كلمة من مطور المشروع: محمد ساعف"
            >
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              <span>كلمة المطور</span>
            </button>

            {/* Desktop Theme Toggle (Day / Night) */}
            <button
              onClick={onToggleTheme}
              className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                isDark 
                  ? 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-amber-400' 
                  : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
              }`}
              title={isDark ? 'التبديل إلى الوضع النهاري' : 'التبديل إلى الوضع الليلي'}
            >
              {isDark ? (
                <>
                  <Sun className="w-3.5 h-3.5" />
                  <span>نهاري</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5" />
                  <span>ليلي</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className={`py-2.5 border-t flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 ${
          isDark ? 'border-slate-900' : 'border-slate-200'
        }`}>
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="ابحث برقم الحزب (1-60)، اسم السورة، أو مطلع الثمن..."
              className={`w-full border rounded-xl pr-10 pl-4 py-2 text-xs sm:text-sm transition focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 ${
                isDark 
                  ? 'bg-slate-900/90 border-slate-800/90 text-slate-200 placeholder:text-slate-500' 
                  : 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400'
              }`}
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                مسح
              </button>
            )}
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 text-xs">
            {[
              { id: 'all', label: 'كافة الأحزاب (60)' },
              { id: 'learning', label: 'قيد الحفظ' },
              { id: 'memorized', label: 'تم الحفظ' },
              { id: 'mastered', label: 'المتقن' },
              { id: 'not_started', label: 'لم يبدأ' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => onFilterChange(f.id)}
                className={`px-2.5 py-1.5 rounded-lg font-medium whitespace-nowrap transition cursor-pointer text-xs ${
                  activeFilter === f.id
                    ? isDark 
                      ? 'bg-emerald-600 text-slate-950 font-bold shadow' 
                      : 'bg-emerald-700 text-white font-bold shadow'
                    : isDark
                      ? 'bg-slate-900 hover:bg-slate-800 text-slate-400'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
};
