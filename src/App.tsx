import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  ALL_AHZAB, 
  getHizbByNumber, 
  getThumunById 
} from './data/warshAhzab';
import { 
  ThumunItem, 
  UserProgressData, 
  MemorizationStatus 
} from './types/quran';
import { 
  loadUserProgress, 
  saveUserProgress, 
  updateThumunStatus, 
  incrementThumunRepeat, 
  saveThumunNote 
} from './utils/storage';
import { Header } from './components/Header';
import { StatsBanner } from './components/StatsBanner';
import { HizbGridOverview } from './components/HizbGridOverview';
import { HizbCard } from './components/HizbCard';
import { ThumunDetailModal } from './components/ThumunDetailModal';
import { QuizModal } from './components/QuizModal';
import { DailyReviewModal } from './components/DailyReviewModal';
import { BackupModal } from './components/BackupModal';
import { AudioSettingsModal } from './components/AudioSettingsModal';
import { ChallengesModal } from './components/ChallengesModal';
import { RemindersModal, ReminderItem } from './components/RemindersModal';
import { RecitationModal } from './components/RecitationModal';
import { InstallAppModal } from './components/InstallAppModal';
import { DeveloperWordModal } from './components/DeveloperWordModal';
import { AuthModal } from './components/AuthModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { usePWAInstall } from './utils/usePWAInstall';
import { getCurrentUser, AuthUser } from './services/authService';
import { playIslamicChime, sendBrowserNotification } from './utils/reminderService';
import { sanitizeAyahText } from './utils/quranText';
import { Bookmark, Sparkles, FilterX, HelpCircle, ArrowUp, BellRing, Trophy, BookOpen, Smartphone, Mic } from 'lucide-react';

export default function App() {
  const [progress, setProgress] = useState<UserProgressData>(() => loadUserProgress());
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  
  // Set of expanded Ahzab numbers (default: Hizb 1 expanded for instant preview)
  const [expandedAhzab, setExpandedAhzab] = useState<Set<number>>(() => new Set([1]));
  
  // Modals state
  const [selectedThumun, setSelectedThumun] = useState<ThumunItem | null>(null);
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [isDailyReviewOpen, setIsDailyReviewOpen] = useState(false);
  const [isBackupOpen, setIsBackupOpen] = useState(false);
  const [isAudioSettingsOpen, setIsAudioSettingsOpen] = useState(false);
  const [isChallengesOpen, setIsChallengesOpen] = useState(false);
  const [challengesInitialTab, setChallengesInitialTab] = useState<'challenges' | 'leaderboard' | 'chat'>('chat');
  const [isRemindersOpen, setIsRemindersOpen] = useState(false);

  // New Modals: Recitation, Install App, Developer Word, Auth
  const [isRecitationOpen, setIsRecitationOpen] = useState(false);
  const [recitationTargetThumun, setRecitationTargetThumun] = useState<ThumunItem | null>(null);
  const [isDeveloperWordOpen, setIsDeveloperWordOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => getCurrentUser());

  // PWA install state
  const { showInstallBanner, dismissBanner, isInstalled } = usePWAInstall();
  const [isInstallAppOpen, setIsInstallAppOpen] = useState(false);

  // Trigger install app modal automatically on entrance if not installed and not dismissed
  useEffect(() => {
    if (showInstallBanner && !isInstalled) {
      setIsInstallAppOpen(true);
    }
  }, [showInstallBanner, isInstalled]);

  const [activeAlarmNotice, setActiveAlarmNotice] = useState<string | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Theme: Night (dark) or Day (light)
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem('warsh_theme');
      return (saved === 'light' || saved === 'dark') ? saved : 'dark';
    } catch {
      return 'dark';
    }
  });

  const toggleTheme = () => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem('warsh_theme', next);
      } catch (e) {}
      return next;
    });
  };

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    }
  }, [theme]);

  const hizbRefs = useRef<Record<number, HTMLDivElement | null>>({});

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Periodic Reminder / Alarm Checker
  useEffect(() => {
    let lastFiredMinute = '';

    const checkReminders = () => {
      try {
        const saved = localStorage.getItem('warsh_reminders');
        if (!saved) return;
        const reminders: ReminderItem[] = JSON.parse(saved);
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const currentHm = `${hours}:${minutes}`;

        if (currentHm === lastFiredMinute) return;

        const matched = reminders.find(r => r.enabled && r.time === currentHm);
        if (matched) {
          lastFiredMinute = currentHm;
          playIslamicChime();
          sendBrowserNotification('منبه الورد القرآني - مصحف ورش', `حان الآن موعد: ${matched.label}! استفتح بركة يومك بآيات من الذكر الحكيم.`);
          setActiveAlarmNotice(matched.label);
        }
      } catch (e) {
        console.warn('Error in reminder loop:', e);
      }
    };

    const intervalId = setInterval(checkReminders, 15000);
    checkReminders();
    return () => clearInterval(intervalId);
  }, []);

  // Filtered Ahzab
  const filteredAhzab = useMemo(() => {
    let list = ALL_AHZAB;

    // Search query filter
    const query = searchQuery.trim().toLowerCase();
    if (query) {
      // Check if it's a number (Hizb number or Juz number)
      const numQuery = parseInt(query);
      if (!isNaN(numQuery)) {
        list = list.filter(h => h.number === numQuery || h.juzNumber === numQuery);
      } else {
        list = list.filter(h => {
          const matchTitle = h.title.toLowerCase().includes(query);
          const matchSurahs = h.surahsSummary.toLowerCase().includes(query);
          const matchThumuns = h.thumuns.some(t => 
            t.surahName.toLowerCase().includes(query) || 
            t.ayahText.toLowerCase().includes(query)
          );
          return matchTitle || matchSurahs || matchThumuns;
        });
      }
    }

    // Status filter
    if (activeFilter !== 'all') {
      list = list.filter(h => {
        return h.thumuns.some(t => {
          const st = progress.thumuns[t.id]?.status || 'not_started';
          return st === activeFilter;
        });
      });
    }

    return list;
  }, [searchQuery, activeFilter, progress]);

  // Expand / Collapse single Hizb
  const toggleHizbExpand = (hizbNumber: number) => {
    setExpandedAhzab(prev => {
      const next = new Set(prev);
      if (next.has(hizbNumber)) {
        next.delete(hizbNumber);
      } else {
        next.add(hizbNumber);
      }
      return next;
    });
  };

  // Toggle all Ahzab expand
  const allExpanded = expandedAhzab.size >= ALL_AHZAB.length;
  const toggleExpandAll = () => {
    if (allExpanded) {
      setExpandedAhzab(new Set());
    } else {
      setExpandedAhzab(new Set(ALL_AHZAB.map(h => h.number)));
    }
  };

  // Select Hizb from Overview Grid and scroll to it
  const handleSelectHizbFromGrid = (hizbNumber: number) => {
    // Ensure it's expanded
    setExpandedAhzab(prev => new Set(prev).add(hizbNumber));
    // Scroll into view
    const el = hizbRefs.current[hizbNumber];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Status handler
  const handleStatusChange = (thumunId: number, status: MemorizationStatus) => {
    const updated = updateThumunStatus(thumunId, status, progress);
    setProgress(updated);
  };

  // Increment repeat handler
  const handleIncrementRepeat = (thumunId: number) => {
    const updated = incrementThumunRepeat(thumunId, progress);
    setProgress(updated);
  };

  // Reset repeat counter
  const handleResetRepeat = (thumunId: number) => {
    const current = progress.thumuns[thumunId] || { status: 'not_started', repeatCount: 0 };
    const updated: UserProgressData = {
      ...progress,
      thumuns: {
        ...progress.thumuns,
        [thumunId]: {
          ...current,
          repeatCount: 0
        }
      }
    };
    saveUserProgress(updated);
    setProgress(updated);
  };

  // Save note
  const handleSaveNote = (thumunId: number, note: string) => {
    const updated = saveThumunNote(thumunId, note, progress);
    setProgress(updated);
  };

  // Bulk mark all thumuns in a Hizb
  const handleMarkAllInHizb = (hizbNumber: number, status: MemorizationStatus) => {
    const hizb = getHizbByNumber(hizbNumber);
    if (!hizb) return;

    let updatedProgress = { ...progress };
    hizb.thumuns.forEach(t => {
      updatedProgress = updateThumunStatus(t.id, status, updatedProgress);
    });
    setProgress(updatedProgress);
  };

  // Bookmark toggle
  const handleToggleBookmark = (thumunId: number) => {
    const nextBookmark = progress.bookmarkedThumunId === thumunId ? null : thumunId;
    const updated: UserProgressData = {
      ...progress,
      bookmarkedThumunId: nextBookmark
    };
    saveUserProgress(updated);
    setProgress(updated);
  };

  // Jump to bookmarked thumun
  const handleJumpToBookmark = () => {
    if (!progress.bookmarkedThumunId) return;
    const thumun = getThumunById(progress.bookmarkedThumunId);
    if (thumun) {
      handleSelectHizbFromGrid(thumun.hizbNumber);
      setSelectedThumun(thumun);
    }
  };

  // Navigate thumun inside modal
  const handleNavigateThumun = (direction: 'prev' | 'next') => {
    if (!selectedThumun) return;
    const targetId = direction === 'next' ? selectedThumun.id + 1 : selectedThumun.id - 1;
    const nextThumun = getThumunById(targetId);
    if (nextThumun) {
      setSelectedThumun(nextThumun);
      // Also expand its parent Hizb
      setExpandedAhzab(prev => new Set(prev).add(nextThumun.hizbNumber));
    }
  };

  // Scroll to top
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const bookmarkedItem = progress.bookmarkedThumunId 
    ? getThumunById(progress.bookmarkedThumunId) 
    : null;

  return (
    <div 
      className={`min-h-screen flex flex-col font-['Cairo',sans-serif] antialiased transition-colors duration-200 w-full max-w-full overflow-x-hidden ${
        theme === 'dark' 
          ? 'bg-slate-950 text-slate-100 selection:bg-emerald-500 selection:text-slate-950' 
          : 'bg-slate-100 text-slate-900 selection:bg-emerald-600 selection:text-white'
      }`} 
      dir="rtl"
    >
      {/* Header with Install App, Chat between Huffaz, Developer Word, and Auth */}
      <Header
        streakDays={progress.streakDays || 1}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenQuiz={() => setIsQuizOpen(true)}
        onOpenDailyReview={() => setIsDailyReviewOpen(true)}
        onOpenBackup={() => setIsBackupOpen(true)}
        onOpenAudioSettings={() => setIsAudioSettingsOpen(true)}
        onOpenChallenges={() => {
          setChallengesInitialTab('challenges');
          setIsChallengesOpen(true);
        }}
        onOpenChat={() => {
          setChallengesInitialTab('chat');
          setIsChallengesOpen(true);
        }}
        onOpenReminders={() => setIsRemindersOpen(true)}
        onOpenInstallApp={() => setIsInstallAppOpen(true)}
        isInstalled={isInstalled}
        onOpenDeveloperWord={() => setIsDeveloperWordOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        currentUser={currentUser}
        theme={theme}
        onToggleTheme={toggleTheme}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
      />

      {/* Stats Banner */}
      <StatsBanner
        progress={progress}
        totalAhzab={ALL_AHZAB.length}
        allExpanded={allExpanded}
        onToggleExpandAll={toggleExpandAll}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-5 sm:py-7 flex-1 space-y-5 sm:space-y-6 w-full">
        {/* Entrance Install App Banner - Only shown on website when NOT installed, completely removed upon install */}
        {!isInstalled && (
          <div className="w-full p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 border border-emerald-500/40 shadow-xl shadow-black/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-slate-950 flex items-center justify-center font-bold text-2xl shadow-lg shadow-emerald-950/40 shrink-0">
                <Smartphone className="w-6 h-6 text-amber-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-bold text-slate-100">
                    تحميل تطبيق جامع الحفظ على هاتفك
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    أندرويد وآيفون
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  ثبّت التطبيق الآن للوصول السريع لـ 480 ثمناً بدون إنترنت والتسميع والتنبيهات اليومية.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
              <button
                onClick={() => setIsInstallAppOpen(true)}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-emerald-950/40 transition cursor-pointer flex items-center gap-2"
              >
                <Smartphone className="w-4 h-4" />
                <span>تحميل التطبيق الآن</span>
              </button>
            </div>
          </div>
        )}

        {/* Quick Recitation Banner Bar */}
        <div className="w-full">
          {/* Smart Recitation Card */}
          <div 
            onClick={() => {
              setRecitationTargetThumun(selectedThumun || bookmarkedItem || ALL_AHZAB[0].thumuns[0]);
              setIsRecitationOpen(true);
            }}
            className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/70 via-slate-900 to-teal-950/70 border border-emerald-500/40 hover:border-emerald-400 transition-all cursor-pointer shadow-lg shadow-black/20 flex items-center justify-between gap-3 group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Mic className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-100">
                    وضع التسميع الذكي والمصحح القرآني
                  </h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    رواية ورش
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  سجل تلاوتك بالميكروفون واكتشف الأخطاء والكلمات الناقصة والمستبدلة فوراً
                </p>
              </div>
            </div>

            <button 
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs shrink-0 transition shadow-md"
            >
              ابدأ التسميع
            </button>
          </div>
        </div>

        {/* 60 Ahzab Visual Index Grid */}
        <HizbGridOverview
          ahzab={ALL_AHZAB}
          progress={progress}
          activeHizbNumber={expandedAhzab.size === 1 ? Array.from(expandedAhzab)[0] : null}
          onSelectHizb={handleSelectHizbFromGrid}
        />

        {/* Ahzab List Header */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-slate-200">
              قائمة الأحزاب والأثمان ({filteredAhzab.length} حزباً معروضاً)
            </h2>
          </div>

          <span className="text-xs text-slate-400 hidden sm:block">
            اضغط على أي حزب لفتح أثمانه الثمانية وتحديد حالة حفظك
          </span>
        </div>

        {/* Ahzab Cards List */}
        {filteredAhzab.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-slate-900/40 border border-slate-800 space-y-3">
            <FilterX className="w-8 h-8 text-slate-500 mx-auto" />
            <h4 className="text-sm font-semibold text-slate-300">
              لا توجد أحزاب مطابقة لمعايير البحث الحالية
            </h4>
            <p className="text-xs text-slate-500">
              جرّب مسح مربع البحث أو تغيير التصفية لعرض جميع الأحزاب الستين.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setActiveFilter('all');
              }}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer transition"
            >
              عرض كافة الأحزاب
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredAhzab.map((hizb) => (
              <div
                key={hizb.number}
                ref={(el) => {
                  hizbRefs.current[hizb.number] = el;
                }}
              >
                <HizbCard
                  hizb={hizb}
                  progress={progress}
                  isExpanded={expandedAhzab.has(hizb.number)}
                  onToggleExpand={() => toggleHizbExpand(hizb.number)}
                  onStatusChange={handleStatusChange}
                  onIncrementRepeat={handleIncrementRepeat}
                  onOpenThumunDetail={(thumun) => setSelectedThumun(thumun)}
                  onMarkAllInHizb={handleMarkAllInHizb}
                  onToggleBookmark={handleToggleBookmark}
                />
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Floating Scroll to Top button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 left-6 p-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold shadow-xl shadow-black/50 z-30 transition cursor-pointer"
          title="العودة لأعلى الصفحة"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-8 text-center text-xs text-slate-500 space-y-3">
        <p className="font-['Amiri'] text-base text-slate-400">
          ﴿وَلَقَدْ يَسَّرْنَا الْقُرْآنَ لِلذِّكْرِ فَهَلْ مِن مُّدَّكِرٍ﴾
        </p>
        <p>
          جامع الحفظ · مصحف رواية ورش عن نافع من طريق الأزرق · مقسم بـ 60 حزباً و 480 ثمناً
        </p>
        <div className="flex items-center justify-center gap-3 pt-1">
          <button
            onClick={() => setIsDeveloperWordOpen(true)}
            className="text-amber-400 hover:underline cursor-pointer text-xs font-semibold"
          >
            كلمة من مطور المشروع: محمد ساعف
          </button>
        </div>
      </footer>

      {/* Offline Indicator Toast */}
      <OfflineIndicator />

      {/* Modal 1: Thumun Detailed Study & Repetition Counter */}
      {selectedThumun && (
        <ThumunDetailModal
          thumun={selectedThumun}
          progress={progress.thumuns[selectedThumun.id]}
          onClose={() => setSelectedThumun(null)}
          onStatusChange={(st) => handleStatusChange(selectedThumun.id, st)}
          onIncrementRepeat={() => handleIncrementRepeat(selectedThumun.id)}
          onResetRepeat={() => handleResetRepeat(selectedThumun.id)}
          onSaveNote={(note) => handleSaveNote(selectedThumun.id, note)}
          onNavigateThumun={handleNavigateThumun}
          canPrev={selectedThumun.id > 1}
          canNext={selectedThumun.id < 480}
          onOpenRecite={(thumun) => {
            setSelectedThumun(null);
            setRecitationTargetThumun(thumun);
            setIsRecitationOpen(true);
          }}
        />
      )}

      {/* Modal 2: Self-Testing & Quiz */}
      {isQuizOpen && (
        <QuizModal
          onClose={() => setIsQuizOpen(false)}
          onOpenThumun={(thumun) => {
            setIsQuizOpen(false);
            setSelectedThumun(thumun);
          }}
        />
      )}

      {/* Modal 3: Daily Review Planner */}
      {isDailyReviewOpen && (
        <DailyReviewModal
          progress={progress}
          onClose={() => setIsDailyReviewOpen(false)}
          onOpenThumun={(thumun) => {
            setIsDailyReviewOpen(false);
            setSelectedThumun(thumun);
          }}
        />
      )}

      {/* Modal 4: Backup & Restore */}
      {isBackupOpen && (
        <BackupModal
          progress={progress}
          onUpdateProgress={(newData) => setProgress(newData)}
          onClose={() => setIsBackupOpen(false)}
        />
      )}

      {/* Modal 5: Warsh Reciters & Audio */}
      {isAudioSettingsOpen && (
        <AudioSettingsModal
          onClose={() => setIsAudioSettingsOpen(false)}
        />
      )}

      {/* Modal 6: Challenges & Learners Circle */}
      {isChallengesOpen && (
        <ChallengesModal
          onClose={() => setIsChallengesOpen(false)}
          progress={progress}
          isDark={theme === 'dark'}
          initialTab={challengesInitialTab}
          currentUser={currentUser}
        />
      )}

      {/* Modal 7: Alarms & Reminders */}
      {isRemindersOpen && (
        <RemindersModal
          onClose={() => setIsRemindersOpen(false)}
          onTestChime={() => {
            playIslamicChime();
            sendBrowserNotification('تجربة المنبه الصوتي', 'رنة المنبه وتذكيرات الورد القرآني تعمل بنجاح!');
          }}
        />
      )}

      {/* Modal 8: Smart Recitation Mode (التسميع الذكي بالذكاء الاصطناعي برواية ورش) */}
      {isRecitationOpen && (
        <RecitationModal
          initialThumun={recitationTargetThumun}
          onClose={() => setIsRecitationOpen(false)}
          onMarkStatus={handleStatusChange}
          isDark={theme === 'dark'}
        />
      )}

      {/* Modal 9: Install App on Entrance / On-Demand for Android & iPhone */}
      <InstallAppModal
        isOpen={isInstallAppOpen}
        onClose={() => {
          setIsInstallAppOpen(false);
          dismissBanner();
        }}
        onInstalled={() => {
          setIsInstallAppOpen(false);
        }}
        isDark={theme === 'dark'}
      />

      {/* Modal 10: Word from Project Developer (محمد ساعف) */}
      <DeveloperWordModal
        isOpen={isDeveloperWordOpen}
        onClose={() => setIsDeveloperWordOpen(false)}
        currentUser={currentUser}
        isDark={theme === 'dark'}
      />

      {/* Modal 11: Authentication & Account Security */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        currentUser={currentUser}
        onAuthChange={setCurrentUser}
        isDark={theme === 'dark'}
      />

      {/* Floating Active Alarm Toast Notice */}
      {activeAlarmNotice && (
        <div className="fixed bottom-6 right-4 left-4 sm:left-auto sm:right-6 sm:max-w-md z-50 bg-gradient-to-r from-emerald-950 via-slate-900 to-amber-950 border-2 border-emerald-500 rounded-3xl p-4 sm:p-5 shadow-2xl shadow-black flex items-center justify-between gap-4 animate-in slide-in-from-bottom duration-300">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-600/30 border border-emerald-500 text-emerald-400 flex items-center justify-center shrink-0">
              <BellRing className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider block">
                تنبيه الورد القرآني الآن ⏰
              </span>
              <h4 className="text-xs sm:text-sm font-bold text-slate-100">
                {activeAlarmNotice}
              </h4>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setActiveAlarmNotice(null);
                const targetThumun = bookmarkedItem || ALL_AHZAB[0].thumuns[0];
                setSelectedThumun(targetThumun);
              }}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition cursor-pointer shrink-0"
            >
              ابدأ القراءة
            </button>
            <button
              onClick={() => setActiveAlarmNotice(null)}
              className="p-1.5 text-slate-400 hover:text-slate-200 rounded-xl bg-slate-800 transition cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
