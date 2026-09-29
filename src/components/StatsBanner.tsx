import React from 'react';
import { 
  CheckCircle2, 
  Clock, 
  ChevronDown, 
  ChevronUp, 
  Trophy,
  Target
} from 'lucide-react';
import { UserProgressData } from '../types/quran';

interface StatsBannerProps {
  progress: UserProgressData;
  totalAhzab: number;
  allExpanded: boolean;
  onToggleExpandAll: () => void;
}

export const StatsBanner: React.FC<StatsBannerProps> = ({
  progress,
  totalAhzab,
  allExpanded,
  onToggleExpandAll
}) => {
  const totalThumuns = 480;
  
  let masteredCount = 0;
  let memorizedCount = 0;
  let learningCount = 0;
  let totalRepeatCount = 0;

  Object.values(progress.thumuns).forEach(p => {
    if (p.status === 'mastered') masteredCount++;
    else if (p.status === 'memorized') memorizedCount++;
    else if (p.status === 'learning') learningCount++;
    
    totalRepeatCount += (p.repeatCount || 0);
  });

  const totalCompleted = masteredCount + memorizedCount;
  const percentage = Math.round((totalCompleted / totalThumuns) * 100);
  const masteredPercent = Math.round((masteredCount / totalThumuns) * 100);
  const memorizedPercent = Math.round((memorizedCount / totalThumuns) * 100);
  const learningPercent = Math.round((learningCount / totalThumuns) * 100);
  const completedAhzabApprox = (totalCompleted / 8).toFixed(1);

  return (
    <div className="bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 border-b border-slate-800/80 pt-6 pb-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
        {/* Top summary row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1: Total Progress */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-emerald-900/40 relative overflow-hidden">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span>نسبة الحفظ الكلية</span>
              <Trophy className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-emerald-300 font-mono">
                {percentage}%
              </span>
              <span className="text-xs text-slate-400">
                ({totalCompleted} / {totalThumuns} ثمناً)
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              ما يعادل تقريباً {completedAhzabApprox} حزباً من أصل 60
            </p>
          </div>

          {/* Card 2: Mastered */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-blue-900/40 relative overflow-hidden">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span>أثمان متقنة ومثبتة</span>
              <CheckCircle2 className="w-4 h-4 text-blue-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-blue-300 font-mono">
                {masteredCount}
              </span>
              <span className="text-xs text-slate-400">ثمناً متقناً</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              أعلى درجات الرسوخ والثبات
            </p>
          </div>

          {/* Card 3: Memorized & Learning */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-amber-900/40 relative overflow-hidden">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span>قيد الحفظ والتكرار</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-amber-300 font-mono">
                {learningCount}
              </span>
              <span className="text-xs text-slate-400">
                (+{memorizedCount} تم حفظها)
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              تحتاج إلى مزيد من أوراد التثبيت
            </p>
          </div>

          {/* Card 4: Repetitions */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-teal-900/40 relative overflow-hidden">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span>مجموع التكرارات</span>
              <Target className="w-4 h-4 text-teal-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-teal-300 font-mono">
                {totalRepeatCount}
              </span>
              <span className="text-xs text-slate-400">تكراراً للوح</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              حسب منهجية الكتاتيب المغاربية
            </p>
          </div>
        </div>

        {/* Multi-segment progress bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span>
                <span>متقن ({masteredCount})</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                <span>تم الحفظ ({memorizedCount})</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
                <span>قيد الحفظ ({learningCount})</span>
              </span>
              <span className="flex items-center gap-1.5 hidden sm:inline-flex">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-700 inline-block"></span>
                <span>لم يبدأ ({totalThumuns - totalCompleted - learningCount})</span>
              </span>
            </div>

            <button
              onClick={onToggleExpandAll}
              className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer transition"
            >
              {allExpanded ? (
                <>
                  <ChevronUp className="w-3.5 h-3.5" />
                  <span>طي جميع الأحزاب</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-3.5 h-3.5" />
                  <span>فتح أثمان جميع الأحزاب</span>
                </>
              )}
            </button>
          </div>

          <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden flex">
            <div 
              style={{ width: `${masteredPercent}%` }} 
              className="bg-blue-500 transition-all duration-500"
              title={`متقن: ${masteredPercent}%`}
            />
            <div 
              style={{ width: `${memorizedPercent}%` }} 
              className="bg-emerald-500 transition-all duration-500"
              title={`محفوظ: ${memorizedPercent}%`}
            />
            <div 
              style={{ width: `${learningPercent}%` }} 
              className="bg-amber-500 transition-all duration-500"
              title={`قيد الحفظ: ${learningPercent}%`}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
