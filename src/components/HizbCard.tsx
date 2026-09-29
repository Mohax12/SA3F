import React from 'react';
import { 
  ChevronDown, 
  CheckCircle2, 
  CheckCheck,
  Award
} from 'lucide-react';
import { HizbData, UserProgressData, MemorizationStatus, ThumunItem } from '../types/quran';
import { ThumunRow } from './ThumunRow';
import { sanitizeAyahText } from '../utils/quranText';

interface HizbCardProps {
  hizb: HizbData;
  progress: UserProgressData;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onStatusChange: (thumunId: number, status: MemorizationStatus) => void;
  onIncrementRepeat: (thumunId: number) => void;
  onOpenThumunDetail: (thumun: ThumunItem) => void;
  onMarkAllInHizb: (hizbNumber: number, status: MemorizationStatus) => void;
  onToggleBookmark: (thumunId: number) => void;
}

export const HizbCard: React.FC<HizbCardProps> = ({
  hizb,
  progress,
  isExpanded,
  onToggleExpand,
  onStatusChange,
  onIncrementRepeat,
  onOpenThumunDetail,
  onMarkAllInHizb,
  onToggleBookmark
}) => {
  let mastered = 0;
  let memorized = 0;
  let learning = 0;

  hizb.thumuns.forEach(t => {
    const p = progress.thumuns[t.id];
    if (p?.status === 'mastered') mastered++;
    else if (p?.status === 'memorized') memorized++;
    else if (p?.status === 'learning') learning++;
  });

  const totalDone = mastered + memorized;
  const isHizbCompleted = totalDone === 8;
  const isAllMastered = mastered === 8;

  return (
    <div 
      className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
        isAllMastered
          ? 'border-blue-500/50 bg-slate-900/60 shadow-lg shadow-blue-950/20'
          : isHizbCompleted
          ? 'border-emerald-500/50 bg-slate-900/60 shadow-lg shadow-emerald-950/20'
          : 'border-slate-800 bg-slate-900/40 hover:border-slate-700/80'
      }`}
    >
      {/* Hizb Header Bar - Clickable to expand/collapse */}
      <div
        onClick={onToggleExpand}
        className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer select-none bg-gradient-to-r from-slate-900/70 via-slate-900/40 to-slate-900/70 hover:bg-slate-800/40 transition-colors"
      >
        <div className="flex items-center gap-3.5">
          <div 
            className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-base border shrink-0 transition-transform ${
              isAllMastered 
                ? 'bg-blue-600/20 border-blue-500/60 text-blue-300'
                : isHizbCompleted
                ? 'bg-emerald-600/20 border-emerald-500/60 text-emerald-300'
                : 'bg-slate-800 border-slate-700/80 text-amber-300 font-[\'Amiri\']'
            }`}
          >
            {isHizbCompleted ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            ) : (
              <span className="font-mono text-base">{hizb.number}</span>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-slate-100">
                {hizb.title}
              </h3>
              <span className="text-xs text-slate-400">
                (الجزء {hizb.juzNumber})
              </span>
              {isAllMastered && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-400 bg-blue-950/80 border border-blue-600/50 px-2 py-0.5 rounded-full">
                  <Award className="w-3 h-3" />
                  <span>متقن بالكامل</span>
                </span>
              )}
              {isHizbCompleted && !isAllMastered && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-600/50 px-2 py-0.5 rounded-full">
                  <CheckCheck className="w-3 h-3" />
                  <span>محفوظ بالكامل</span>
                </span>
              )}
            </div>

            <p className="text-xs text-slate-400 mt-0.5">
              السور: <span className="text-slate-300 font-medium">{hizb.surahsSummary}</span>
              <span className="mx-2 text-slate-600">·</span>
              <span className="text-slate-400 font-quran text-sm">
                مطلع: {sanitizeAyahText(hizb.thumuns[0]?.ayahText).slice(0, 45)}...
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between md:justify-end gap-4 shrink-0">
          <div className="flex flex-col items-end gap-1.5">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-mono text-slate-300 font-semibold">
                {totalDone} / 8
              </span>
              <span className="text-[11px] text-slate-400">أثمان</span>
            </div>

            <div className="flex items-center gap-1">
              {hizb.thumuns.map((t) => {
                const st = progress.thumuns[t.id]?.status || 'not_started';
                const bg = 
                  st === 'mastered' ? 'bg-blue-500' :
                  st === 'memorized' ? 'bg-emerald-500' :
                  st === 'learning' ? 'bg-amber-500' :
                  'bg-slate-700/70';

                return (
                  <div
                    key={t.id}
                    title={`${t.label}: ${
                      st === 'mastered' ? 'متقن' :
                      st === 'memorized' ? 'محفوظ' :
                      st === 'learning' ? 'قيد الحفظ' : 'لم يبدأ'
                    }`}
                    className={`w-3.5 h-1.5 rounded-sm transition-colors ${bg}`}
                  />
                );
              })}
            </div>
          </div>

          <button
            type="button"
            className={`p-2 rounded-xl border border-slate-800 bg-slate-900/80 text-slate-300 hover:text-emerald-400 hover:border-slate-700 transition cursor-pointer ${
              isExpanded ? 'rotate-180 bg-slate-800 text-emerald-400' : ''
            }`}
            title={isExpanded ? 'طي الأثمان' : 'عرض الأثمان الثمانية لهذا الحزب'}
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expanded 8 Thumuns */}
      {isExpanded && (
        <div className="p-4 sm:p-5 border-t border-slate-800/80 bg-slate-950/40 space-y-3 animate-in fade-in-50 duration-200">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800/60 text-xs text-slate-400">
            <span className="font-medium text-slate-300">
              أثمان {hizb.title} برواية ورش عن نافع (8 أثمان):
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkAllInHizb(hizb.number, 'memorized');
                }}
                className="px-2.5 py-1 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-700/40 text-emerald-300 font-medium transition cursor-pointer"
                title="تحديد كافة أثمان هذا الحزب كمحفوظة"
              >
                تحديد الكل كمحفوظ
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkAllInHizb(hizb.number, 'mastered');
                }}
                className="px-2.5 py-1 rounded-lg bg-blue-950/60 hover:bg-blue-900/60 border border-blue-700/40 text-blue-300 font-medium transition cursor-pointer"
                title="تحديد كافة أثمان هذا الحزب كمتقنة"
              >
                تحديد الكل كمتقن
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkAllInHizb(hizb.number, 'not_started');
                }}
                className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 transition cursor-pointer"
                title="إعادة ضبط أثمان هذا الحزب"
              >
                إعادة ضبط
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {hizb.thumuns.map((thumun) => (
              <ThumunRow
                key={thumun.id}
                thumun={thumun}
                progress={progress.thumuns[thumun.id]}
                onStatusChange={(status) => onStatusChange(thumun.id, status)}
                onIncrementRepeat={() => onIncrementRepeat(thumun.id)}
                onOpenDetail={() => onOpenThumunDetail(thumun)}
                isBookmarked={progress.bookmarkedThumunId === thumun.id}
                onToggleBookmark={() => onToggleBookmark(thumun.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
