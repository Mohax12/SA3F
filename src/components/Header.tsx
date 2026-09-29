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
  Moon
} from 'lucide-react';

interface HeaderProps {
  streakDays: number;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenQuiz: () => void;
  onOpenDailyReview: () => void;
  onOpenBackup: () => void;
  onOpenAudioSettings: () => void;
  onOpenChallenges: () => void;
  onOpenReminders: () => void;
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
  onOpenReminders,
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
        <div className="flex flex-col md:flex-row md:items-center justify-between py-3 gap-3">
          {/* Logo & Title */}
          <div className="flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-800 border border-emerald-500/30 flex items-center justify-center shadow-lg shadow-emerald-900/20 shrink-0">
                <span className="font-['Amiri'] font-bold text-amber-300 text-xl sm:text-2xl select-none">
                  ۞
                </span>
              </div>
              <div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <h1 className="text-sm sm:text-lg font-bold tracking-tight">
                    جامع الحفظ <span className="text-emerald-500 font-medium text-xs sm:text-sm">· مصحف ورش</span>
                  </h1>
                </div>
                <p className="text-[11px] sm:text-xs opacity-60 hidden xs:block">
                  الأحزاب والأثمان الكاملة (480 ثمناً) بطريق الأزرق
                </p>
              </div>
            </div>

            {/* Mobile Theme Toggle Button */}
            <div className="md:hidden flex items-center gap-1">
              <button
                onClick={onToggleTheme}
                className={`p-2 rounded-xl border transition cursor-pointer ${
                  isDark ? 'bg-slate-900 border-slate-800 text-amber-400 hover:bg-slate-800' : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
                }`}
                title={isDark ? 'التبديل إلى الوضع النهاري' : 'التبديل إلى الوضع الليلي'}
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Quick Actions & Navigation */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 justify-start md:justify-end">
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
              <span>التحديات والحلقة</span>
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
              <span className="hidden sm:inline">ورد المراجعة</span>
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
              <span className="hidden sm:inline">اختبار الحفظ</span>
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

            {/* Audio Reciter Settings */}
            <button
              onClick={onOpenAudioSettings}
              className={`p-2 rounded-xl border transition cursor-pointer ${
                isDark ? 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300 hover:text-slate-100' : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
              }`}
              title="اختيار القارئ والاستماع"
            >
              <Volume2 className="w-4 h-4 text-emerald-500" />
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
