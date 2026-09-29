import React from 'react';
import { HizbData, UserProgressData } from '../types/quran';

interface HizbGridOverviewProps {
  ahzab: HizbData[];
  progress: UserProgressData;
  activeHizbNumber: number | null;
  onSelectHizb: (hizbNumber: number) => void;
}

export const HizbGridOverview: React.FC<HizbGridOverviewProps> = ({
  ahzab,
  progress,
  activeHizbNumber,
  onSelectHizb
}) => {
  return (
    <div className="bg-slate-900/60 rounded-2xl border border-slate-800/80 p-4 sm:p-5 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-slate-200">
            خريطة الأحزاب الستين (فهرس المصحف كاملاً)
          </h3>
          <p className="text-xs text-slate-400">
            انقر على أي حزب للانتقال المباشر وعرض أثمانه الثمانية
          </p>
        </div>

        <div className="flex items-center gap-3 text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-blue-500"></span>
            <span>متقن (8/8)</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-emerald-500"></span>
            <span>محفوظ</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-amber-500"></span>
            <span>قيد الحفظ</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-slate-800 border border-slate-700"></span>
            <span>لم يبدأ</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-1.5 sm:gap-2 pt-2 w-full">
        {ahzab.map((h) => {
          let mastered = 0;
          let memorized = 0;
          let learning = 0;

          h.thumuns.forEach(t => {
            const p = progress.thumuns[t.id];
            if (p?.status === 'mastered') mastered++;
            else if (p?.status === 'memorized') memorized++;
            else if (p?.status === 'learning') learning++;
          });

          const totalDone = mastered + memorized;
          const isMastered = mastered === 8;
          const isCompleted = totalDone === 8;
          const isLearning = learning > 0 || totalDone > 0;
          const isSelected = activeHizbNumber === h.number;

          let bgClass = 'bg-slate-950/80 border-slate-800 text-slate-400 hover:border-slate-700';

          if (isMastered) {
            bgClass = 'bg-blue-600/30 border-blue-500 text-blue-200 font-bold';
          } else if (isCompleted) {
            bgClass = 'bg-emerald-600/30 border-emerald-500 text-emerald-200 font-bold';
          } else if (isLearning) {
            bgClass = 'bg-amber-600/20 border-amber-600/60 text-amber-200 font-semibold';
          }

          if (isSelected) {
            bgClass += ' ring-2 ring-emerald-400 ring-offset-2 ring-offset-slate-950';
          }

          return (
            <button
              key={h.number}
              onClick={() => onSelectHizb(h.number)}
              title={`الحزب ${h.number} (${h.surahsSummary}) - المحفوظ: ${totalDone}/8 أثمان`}
              className={`p-2 rounded-xl border text-xs flex flex-col items-center justify-center transition-all cursor-pointer ${bgClass}`}
            >
              <span className="font-mono text-sm leading-none font-bold">
                {h.number}
              </span>
              <span className="text-[9px] opacity-75 mt-0.5 leading-none">
                {totalDone}/8
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
