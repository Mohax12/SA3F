import React from 'react';
import { 
  CheckCircle2, 
  Clock, 
  Circle, 
  Sparkles, 
  RotateCw, 
  FileEdit, 
  ChevronLeft, 
  Bookmark,
  BookOpen
} from 'lucide-react';
import { ThumunItem, ThumunProgress, MemorizationStatus } from '../types/quran';
import { sanitizeAyahText } from '../utils/quranText';

interface ThumunRowProps {
  thumun: ThumunItem;
  progress?: ThumunProgress;
  onStatusChange: (status: MemorizationStatus) => void;
  onIncrementRepeat: () => void;
  onOpenDetail: () => void;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
}

export const ThumunRow: React.FC<ThumunRowProps> = ({
  thumun,
  progress,
  onStatusChange,
  onIncrementRepeat,
  onOpenDetail,
  isBookmarked,
  onToggleBookmark
}) => {
  const currentStatus: MemorizationStatus = progress?.status || 'not_started';
  const repeatCount = progress?.repeatCount || 0;
  const hasNotes = Boolean(progress?.notes && progress.notes.trim().length > 0);

  const statusConfig = {
    not_started: {
      label: 'لم يبدأ',
      border: 'border-slate-800/80',
      bg: 'bg-slate-900/30 hover:bg-slate-900/60',
      tagBg: 'bg-slate-800 text-slate-400',
      icon: Circle,
      iconColor: 'text-slate-600',
      nextStatus: 'learning' as MemorizationStatus
    },
    learning: {
      label: 'قيد الحفظ',
      border: 'border-amber-700/40',
      bg: 'bg-amber-950/15 hover:bg-amber-950/30',
      tagBg: 'bg-amber-900/50 text-amber-300 border border-amber-600/40',
      icon: Clock,
      iconColor: 'text-amber-400',
      nextStatus: 'memorized' as MemorizationStatus
    },
    memorized: {
      label: 'تم الحفظ',
      border: 'border-emerald-600/40',
      bg: 'bg-emerald-950/15 hover:bg-emerald-950/30',
      tagBg: 'bg-emerald-900/50 text-emerald-300 border border-emerald-600/40',
      icon: CheckCircle2,
      iconColor: 'text-emerald-400',
      nextStatus: 'mastered' as MemorizationStatus
    },
    mastered: {
      label: 'متقن ومثبت',
      border: 'border-blue-600/50',
      bg: 'bg-blue-950/20 hover:bg-blue-950/35',
      tagBg: 'bg-blue-900/60 text-blue-200 border border-blue-500/50 shadow-sm shadow-blue-900/30',
      icon: Sparkles,
      iconColor: 'text-blue-400',
      nextStatus: 'not_started' as MemorizationStatus
    }
  };

  const currentCfg = statusConfig[currentStatus];
  const StatusIcon = currentCfg.icon;

  const typeDecorations: Record<string, { label: string; textClass: string }> = {
    hizb: { label: '۞ مطلع الحزب', textClass: 'text-amber-400 font-bold' },
    half: { label: '۞ نصف الحزب', textClass: 'text-teal-400 font-semibold' },
    quarter: { label: '۞ الربع', textClass: 'text-emerald-400 font-medium' },
    three_quarters: { label: '۞ ثلاثة أرباع', textClass: 'text-cyan-400 font-medium' },
    thumun: { label: `۞ الثمن ${thumun.thumunInHizb}`, textClass: 'text-slate-400' }
  };

  const decor = typeDecorations[thumun.type] || typeDecorations.thumun;

  return (
    <div 
      className={`group relative p-3.5 sm:p-4 rounded-xl border transition-all duration-200 ${currentCfg.border} ${currentCfg.bg} flex flex-col md:flex-row md:items-center justify-between gap-3`}
    >
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <button
          onClick={() => onStatusChange(currentCfg.nextStatus)}
          className="mt-0.5 p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer shrink-0"
          title={`الحالة الحالية: ${currentCfg.label} (انقر للتغيير)`}
        >
          <StatusIcon className={`w-5 h-5 ${currentCfg.iconColor}`} />
        </button>

        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
            <span className={decor.textClass}>{decor.label}</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="text-slate-300 font-medium">سورة {thumun.surahName}</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span>الآية {thumun.ayahStart}</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="text-slate-500 font-mono">رقم {thumun.id} من 480</span>

            {hasNotes && (
              <span className="text-amber-400 flex items-center gap-1 text-[11px]" title="توجد ملاحظة أو متشابهات مسجلة">
                <FileEdit className="w-3 h-3" />
                <span>ملاحظة</span>
              </span>
            )}
          </div>

          <p 
            onClick={onOpenDetail}
            className="font-quran text-lg sm:text-xl text-slate-100 leading-relaxed font-semibold cursor-pointer hover:text-emerald-300 transition-colors"
          >
            {sanitizeAyahText(thumun.ayahText)}
          </p>

          {thumun.warshNote && (
            <p className="text-[11px] text-slate-500 line-clamp-1">
              <span className="text-emerald-500/80 font-medium">ورش: </span>
              {thumun.warshNote}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between md:justify-end gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800/60 max-w-full">
        <div className="flex items-center gap-1 bg-slate-950/80 border border-slate-800 rounded-lg px-2 py-1">
          <button
            onClick={onIncrementRepeat}
            className="p-1 rounded hover:bg-slate-800 text-teal-400 hover:text-teal-300 transition cursor-pointer"
            title="إضافة تكرار (طريقة اللوح)"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
          <span className="text-xs font-mono font-bold text-slate-200">
            {repeatCount}
          </span>
          <span className="text-[10px] text-slate-500">
            تكرار
          </span>
        </div>

        <button
          onClick={() => onStatusChange(currentCfg.nextStatus)}
          className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition ${currentCfg.tagBg}`}
          title="انقر لتغيير مرحلة الحفظ"
        >
          {currentCfg.label}
        </button>

        <button
          onClick={onToggleBookmark}
          className={`p-1.5 rounded-lg border transition cursor-pointer ${
            isBookmarked 
              ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' 
              : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
          }`}
          title={isBookmarked ? 'إزالة الإشارة المرجعية' : 'تحديد كآخر موضع توقفت عنده'}
        >
          <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-amber-400 text-amber-400' : ''}`} />
        </button>

        <button
          onClick={onOpenDetail}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/25 hover:bg-emerald-600/40 border border-emerald-500/40 text-emerald-300 text-xs font-semibold cursor-pointer transition shadow-sm shadow-emerald-950/40"
          title="قراءة نص الثمن كاملاً برواية ورش، الاستماع، وتكرار اللوح"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>قراءة الثمن كاملاً</span>
        </button>
      </div>
    </div>
  );
};
