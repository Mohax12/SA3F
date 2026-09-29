import React from 'react';
import { 
  X, 
  CalendarCheck, 
  Clock, 
  RotateCw, 
  ChevronLeft, 
  Sparkles
} from 'lucide-react';
import { UserProgressData, ThumunItem, MemorizationStatus } from '../types/quran';
import { ALL_AHZAB } from '../data/warshAhzab';

interface DailyReviewModalProps {
  progress: UserProgressData;
  onClose: () => void;
  onOpenThumun: (thumun: ThumunItem) => void;
}

export const DailyReviewModal: React.FC<DailyReviewModalProps> = ({
  progress,
  onClose,
  onOpenThumun
}) => {
  const allThumuns: ThumunItem[] = [];
  ALL_AHZAB.forEach(h => {
    h.thumuns.forEach(t => allThumuns.push(t));
  });

  const today = new Date().toISOString().split('T')[0];

  const needsReviewThumuns: { thumun: ThumunItem; daysSince: number; status: MemorizationStatus }[] = [];
  const currentLearningThumuns: ThumunItem[] = [];

  allThumuns.forEach(t => {
    const p = progress.thumuns[t.id];
    if (!p) return;

    if (p.status === 'learning') {
      currentLearningThumuns.push(t);
    }

    if (p.status === 'memorized' || p.status === 'mastered') {
      if (!p.lastReviewedDate) {
        needsReviewThumuns.push({ thumun: t, daysSince: 99, status: p.status });
      } else {
        const last = new Date(p.lastReviewedDate);
        const cur = new Date(today);
        const diff = Math.floor((cur.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
        if (diff >= 3) {
          needsReviewThumuns.push({ thumun: t, daysSince: diff, status: p.status });
        }
      }
    }
  });

  const nextNewThumun = allThumuns.find(t => {
    const st = progress.thumuns[t.id]?.status;
    return !st || st === 'not_started';
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl bg-slate-900 border border-teal-900/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-950 border border-teal-500/40 text-teal-300 font-bold flex items-center justify-center">
              <CalendarCheck className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-base sm:text-lg">
                ورد اليوم المقترح (الحفظ والمراجعة)
              </h3>
              <p className="text-xs text-slate-400">
                منهجية التكرار والمراجعة المستمرة لضبط رواية ورش
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-400 hover:text-slate-100 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* Section 1: New Memorization */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/80 border border-emerald-900/40 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 uppercase">
                <Sparkles className="w-4 h-4" />
                <span>1. ورد الحفظ الجديد اليومي (اللوح الجديد)</span>
              </span>
              <span className="text-[11px] text-slate-400">حسب خطتك اليومية</span>
            </div>

            {nextNewThumun ? (
              <div 
                onClick={() => onOpenThumun(nextNewThumun)}
                className="p-4 rounded-xl bg-slate-900/90 border border-emerald-700/30 hover:border-emerald-500/60 transition cursor-pointer flex items-center justify-between"
              >
                <div>
                  <div className="text-xs text-slate-400 mb-1">
                    {nextNewThumun.label} · سورة {nextNewThumun.surahName} (الآية {nextNewThumun.ayahStart})
                  </div>
                  <p className="font-['Amiri'] sm:font-['Scheherazade_New'] text-lg text-slate-100 font-bold">
                    {nextNewThumun.ayahText}
                  </p>
                </div>
                <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 text-slate-950 font-bold text-xs">
                  <span>بدء الحفظ</span>
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <p className="text-xs text-slate-400">
                ما شاء الله! لقد قمت ببدء جميع الأثمان في المصحف.
              </p>
            )}
          </div>

          {/* Section 2: Active Learning */}
          {currentLearningThumuns.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  <span>2. أثمان قيد الحفظ والتكرار ({currentLearningThumuns.length})</span>
                </span>
                <span className="text-[11px] text-slate-400">أكمل تكرارها للوصول للهدف</span>
              </div>

              <div className="grid grid-cols-1 gap-2">
                {currentLearningThumuns.slice(0, 4).map(t => {
                  const rep = progress.thumuns[t.id]?.repeatCount || 0;
                  return (
                    <div
                      key={t.id}
                      onClick={() => onOpenThumun(t)}
                      className="p-3.5 rounded-xl bg-slate-950/60 border border-amber-800/30 hover:border-amber-600/50 transition cursor-pointer flex items-center justify-between"
                    >
                      <div className="min-w-0 flex-1">
                        <span className="text-xs text-amber-300/80 font-medium">
                          {t.label} · سورة {t.surahName} (الحزب {t.hizbNumber})
                        </span>
                        <p className="font-['Scheherazade_New'] text-base text-slate-100 font-semibold truncate">
                          {t.ayahText}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 mr-3">
                        <span className="text-xs font-mono font-bold text-slate-300 bg-slate-900 px-2 py-1 rounded border border-slate-800">
                          {rep} تكرار
                        </span>
                        <ChevronLeft className="w-4 h-4 text-slate-500" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section 3: Spaced Repetition Due Review */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-teal-400 flex items-center gap-1.5">
                <RotateCw className="w-4 h-4" />
                <span>3. أثمان تحتاج مراجعة وتثبيت ({needsReviewThumuns.length})</span>
              </span>
              <span className="text-[11px] text-slate-400">مرّ عليها أكثر من 3 أيام دون مراجعة</span>
            </div>

            {needsReviewThumuns.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-center text-xs text-slate-400">
                🎉 ممتاز! جميع محفوظاتك مراجعة حديثاً وضمن جدول التثبيت.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2">
                {needsReviewThumuns.slice(0, 5).map(({ thumun, daysSince }) => (
                  <div
                    key={thumun.id}
                    onClick={() => onOpenThumun(thumun)}
                    className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-teal-600/50 transition cursor-pointer flex items-center justify-between"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span>{thumun.label}</span>
                        <span>·</span>
                        <span className="text-slate-300 font-medium">سورة {thumun.surahName}</span>
                        <span>·</span>
                        <span className="text-amber-400/90">
                          {daysSince === 99 ? 'لم يُراجع بعد' : `منذ ${daysSince} أيام`}
                        </span>
                      </div>
                      <p className="font-['Scheherazade_New'] text-base text-slate-100 font-semibold truncate mt-0.5">
                        {thumun.ayahText}
                      </p>
                    </div>

                    <button className="flex items-center gap-1 px-3 py-1 rounded-lg bg-teal-600/20 text-teal-300 text-xs font-semibold shrink-0 mr-3">
                      <span>مراجعة</span>
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
