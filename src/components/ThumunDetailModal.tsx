import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  RotateCcw, 
  Volume2, 
  Play, 
  Pause, 
  CheckCircle2, 
  Sparkles, 
  Clock, 
  Circle, 
  FileEdit, 
  ChevronRight, 
  ChevronLeft, 
  BookOpen,
  Copy,
  Check,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Mic
} from 'lucide-react';
import { ThumunItem, ThumunProgress, MemorizationStatus } from '../types/quran';
import { WARSH_RECITERS, getSurahAudioUrl } from '../data/reciters';
import { fetchFullThumun, FullThumunContent } from '../services/quranReader';
import { sanitizeAyahText, formatAyahNumber } from '../utils/quranText';

interface ThumunDetailModalProps {
  thumun: ThumunItem;
  progress?: ThumunProgress;
  onClose: () => void;
  onStatusChange: (status: MemorizationStatus) => void;
  onIncrementRepeat: () => void;
  onResetRepeat: () => void;
  onSaveNote: (note: string) => void;
  onNavigateThumun: (direction: 'prev' | 'next') => void;
  canPrev: boolean;
  canNext: boolean;
  onOpenRecite?: (thumun: ThumunItem) => void;
}

export const ThumunDetailModal: React.FC<ThumunDetailModalProps> = ({
  thumun,
  progress,
  onClose,
  onStatusChange,
  onIncrementRepeat,
  onResetRepeat,
  onSaveNote,
  onNavigateThumun,
  canPrev,
  canNext,
  onOpenRecite
}) => {
  const [activeTab, setActiveTab] = useState<'read_full' | 'repeat' | 'notes'>('read_full');
  const [selectedReciterId, setSelectedReciterId] = useState(WARSH_RECITERS[0].id);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [audioError, setAudioError] = useState(false);
  const [localNote, setLocalNote] = useState(progress?.notes || '');
  const [isSavedNote, setIsSavedNote] = useState(false);
  const [targetRepeats, setTargetRepeats] = useState(20);

  // Full Thumun reader state
  const [fullThumun, setFullThumun] = useState<FullThumunContent | null>(null);
  const [isLoadingFullText, setIsLoadingFullText] = useState(false);
  const [fontSizeClass, setFontSizeClass] = useState<'text-xl' | 'text-2xl' | 'text-3xl' | 'text-4xl'>('text-2xl');
  const [isCopied, setIsCopied] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentStatus: MemorizationStatus = progress?.status || 'not_started';
  const repeatCount = progress?.repeatCount || 0;

  const currentReciter = WARSH_RECITERS.find(r => r.id === selectedReciterId) || WARSH_RECITERS[0];
  const audioUrl = getSurahAudioUrl(currentReciter.audioServer, thumun.surahNumber);

  // Fetch full thumun ayahs whenever thumun changes
  useEffect(() => {
    let isCancelled = false;
    setIsLoadingFullText(true);

    fetchFullThumun(thumun)
      .then(res => {
        if (!isCancelled) {
          setFullThumun(res);
          setIsLoadingFullText(false);
        }
      })
      .catch(err => {
        console.error('Error fetching full thumun:', err);
        if (!isCancelled) {
          setIsLoadingFullText(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [thumun.id]);

  useEffect(() => {
    setLocalNote(progress?.notes || '');
    setIsPlaying(false);
    setIsLoadingAudio(false);
    setAudioError(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.load();
    }
  }, [thumun.id, selectedReciterId]);

  const toggleAudio = async () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }

    try {
      setAudioError(false);
      setIsLoadingAudio(true);
      await audioRef.current.play();
      setIsPlaying(true);
      setIsLoadingAudio(false);
    } catch (e: any) {
      if (e?.name !== 'AbortError') {
        console.warn('Audio play error:', e);
        setAudioError(true);
      }
      setIsPlaying(false);
      setIsLoadingAudio(false);
    }
  };

  const handleSaveNote = () => {
    onSaveNote(localNote);
    setIsSavedNote(true);
    setTimeout(() => setIsSavedNote(false), 2000);
  };

  const handleCopyText = async () => {
    if (!fullThumun) return;
    const textToCopy = fullThumun.ayahs
      .map(a => `${a.text} ${formatAyahNumber(a.numberInSurah)}`)
      .join(' ');
    try {
      await navigator.clipboard.writeText(textToCopy);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (e) {
      console.warn('Could not copy text:', e);
    }
  };

  const increaseFontSize = () => {
    if (fontSizeClass === 'text-xl') setFontSizeClass('text-2xl');
    else if (fontSizeClass === 'text-2xl') setFontSizeClass('text-3xl');
    else if (fontSizeClass === 'text-3xl') setFontSizeClass('text-4xl');
  };

  const decreaseFontSize = () => {
    if (fontSizeClass === 'text-4xl') setFontSizeClass('text-3xl');
    else if (fontSizeClass === 'text-3xl') setFontSizeClass('text-2xl');
    else if (fontSizeClass === 'text-2xl') setFontSizeClass('text-xl');
  };

  const repeatPercent = Math.min(100, Math.round((repeatCount / targetRepeats) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-3xl bg-slate-900 border border-emerald-900/60 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-500/40 text-amber-300 font-bold flex items-center justify-center font-['Amiri'] text-xl">
              ۞
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-100 text-base sm:text-lg">
                  {thumun.label} · الحزب {thumun.hizbNumber}
                </h3>
              </div>
              <p className="text-xs text-slate-400">
                سورة {thumun.surahName} (الآية {thumun.ayahStart}) · الجزء {thumun.juzNumber} · الثمن {thumun.id} من 480
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Smart Recitation for this Thumun */}
            {onOpenRecite && (
              <button
                onClick={() => onOpenRecite(thumun)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-bold transition cursor-pointer shadow-md"
                title="تسميع هذا الثمن عبر الميكروفون"
              >
                <Mic className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">تسميع الثمن</span>
              </button>
            )}

            <div className="flex items-center gap-1 border border-slate-800 rounded-xl p-0.5 bg-slate-950">
              <button
                onClick={() => onNavigateThumun('prev')}
                disabled={!canPrev}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
                title="الثمن السابق"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => onNavigateThumun('next')}
                disabled={!canNext}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
                title="الثمن التالي"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-400 hover:text-slate-100 transition cursor-pointer"
              title="إغلاق"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-slate-800 bg-slate-950/40 px-4 sm:px-6">
          <button
            onClick={() => setActiveTab('read_full')}
            className={`py-3 px-4 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'read_full'
                ? 'border-emerald-500 text-emerald-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>قراءة الثمن كاملاً</span>
            {fullThumun && (
              <span className="text-[11px] font-mono bg-emerald-950 text-emerald-400 px-1.5 py-0.5 rounded-full border border-emerald-600/30">
                {fullThumun.ayahs.length} آية
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('repeat')}
            className={`py-3 px-4 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'repeat'
                ? 'border-teal-500 text-teal-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            <span>التكرار والتثبيت ({repeatCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('notes')}
            className={`py-3 px-4 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'notes'
                ? 'border-amber-500 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileEdit className="w-4 h-4" />
            <span>الملاحظات والمتشابهات</span>
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* TAB 1: READ FULL THUMUN */}
          {activeTab === 'read_full' && (
            <div className="space-y-4">
              {/* Toolbar: Font Size & Copy */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">حجم الخط:</span>
                  <div className="flex items-center gap-1 border border-slate-700 rounded-lg p-0.5 bg-slate-900">
                    <button
                      onClick={decreaseFontSize}
                      className="p-1 rounded text-slate-300 hover:text-white transition cursor-pointer"
                      title="تصغير الخط"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={increaseFontSize}
                      className="p-1 rounded text-slate-300 hover:text-white transition cursor-pointer"
                      title="تكبير الخط"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyText}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 transition cursor-pointer"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400 font-medium">تم نسخ الثمن!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                        <span>نسخ نص الثمن</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Full Thumun Reading Box */}
              <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-slate-950 via-slate-950/90 to-emerald-950/20 border border-emerald-900/40 relative shadow-inner">
                {isLoadingFullText ? (
                  <div className="py-12 text-center space-y-3">
                    <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-xs text-slate-400">جاري تحميل نص الثمن كاملاً برواية ورش...</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Surah Header Banner */}
                    <div className="text-center pb-4 border-b border-emerald-900/30 space-y-2">
                      <span className="inline-block text-xs font-bold text-emerald-400 bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-600/40">
                        {fullThumun?.surahs.map(s => `سورة ${s}`).join(' - ')}
                      </span>
                      <h4 className="text-sm font-semibold text-slate-300">
                        {thumun.label} · الحزب {thumun.hizbNumber} (الجزء {thumun.juzNumber})
                      </h4>
                    </div>

                    {/* Verses Flow */}
                    <div className={`font-quran ${fontSizeClass} text-slate-100 leading-[2.4] text-justify select-text`}>
                      {fullThumun?.ayahs.map((ayah) => (
                        <span key={ayah.id} className="hover:text-emerald-200 transition-colors">
                          {ayah.isFirstInSurah && (
                            <div className="block my-4 py-2 text-center text-lg sm:text-xl font-bold text-amber-300 border-y border-amber-900/30">
                              بِسْمِ اَللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                            </div>
                          )}
                          <span>{ayah.text}</span>
                          <span className="inline-block mx-1.5 text-amber-400 font-normal font-sans text-base select-none">
                            {formatAyahNumber(ayah.numberInSurah)}
                          </span>
                        </span>
                      ))}
                    </div>

                    <div className="pt-4 border-t border-slate-800 text-center text-xs text-slate-500">
                      نهاية الثمن · رواية ورش عن نافع بطريق الأزرق
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: REPETITION ASSISTANT */}
          {activeTab === 'repeat' && (
            <div className="space-y-4">
              <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-5 text-center">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <RotateCcw className="w-4 h-4 text-teal-400" />
                    <h4 className="font-semibold text-slate-200 text-sm">
                      مساعد التكرار والتثبيت (طريقة اللوح)
                    </h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">الهدف:</span>
                    {[10, 20, 40].map((t) => (
                      <button
                        key={t}
                        onClick={() => setTargetRepeats(t)}
                        className={`px-2 py-0.5 text-xs rounded-lg border transition cursor-pointer ${
                          targetRepeats === t
                            ? 'bg-teal-600/30 border-teal-500 text-teal-300 font-bold'
                            : 'bg-slate-900 border-slate-800 text-slate-500'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="py-2">
                  <span className="text-6xl sm:text-7xl font-mono font-bold text-teal-300 block select-none">
                    {repeatCount}
                  </span>
                  <span className="text-xs text-slate-400 mt-1 block">
                    من أصل {targetRepeats} تكراراً مستهدفاً ({repeatPercent}%)
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 transition-all duration-300 rounded-full"
                    style={{ width: `${repeatPercent}%` }}
                  />
                </div>

                {/* Quick Add Buttons */}
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    onClick={onIncrementRepeat}
                    className="px-6 py-3 rounded-2xl bg-teal-600 hover:bg-teal-500 text-slate-950 font-bold text-sm transition cursor-pointer shadow-lg shadow-teal-900/30 active:scale-95"
                  >
                    +1 تكرار جديد
                  </button>

                  <button
                    onClick={() => {
                      for (let i = 0; i < 5; i++) onIncrementRepeat();
                    }}
                    className="px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition cursor-pointer"
                  >
                    +5 تكرارات
                  </button>

                  <button
                    onClick={onResetRepeat}
                    className="p-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-500 hover:text-red-400 transition cursor-pointer border border-slate-800"
                    title="تصفير عداد التكرار"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: NOTES & MUTASHABIHAT */}
          {activeTab === 'notes' && (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileEdit className="w-4 h-4 text-amber-400" />
                    <h4 className="font-semibold text-slate-200 text-sm">
                      ملاحظات الحافظ، الروابط، والمتشابهات
                    </h4>
                  </div>
                  {isSavedNote && (
                    <span className="text-xs text-emerald-400 font-medium animate-in fade-in">
                      تم الحفظ بنجاح!
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-400">
                  سجل هنا أي كلمات تحتاج انتباهك في رواية ورش (كتقليل، أو نقل، أو إبدال) أو مواضع المتشابهات مع سور أخرى.
                </p>

                <textarea
                  value={localNote}
                  onChange={(e) => setLocalNote(e.target.value)}
                  placeholder="مثال: انتبه للإمالة في رؤوس الآي، رابط مع ثمن سورة آل عمران..."
                  rows={4}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition resize-none"
                />

                <div className="flex justify-end">
                  <button
                    onClick={handleSaveNote}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs transition cursor-pointer shadow-lg shadow-emerald-900/30"
                  >
                    حفظ الملاحظة
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Memorization Stage Buttons */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <label className="text-xs font-semibold text-slate-300 block">
              مرحلة الحفظ الحالية للثمن:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={() => onStatusChange('not_started')}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                  currentStatus === 'not_started'
                    ? 'bg-slate-800 border-slate-600 text-slate-200 ring-2 ring-slate-500/40'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800/50'
                }`}
              >
                <Circle className="w-3.5 h-3.5" />
                <span>لم يبدأ</span>
              </button>

              <button
                onClick={() => onStatusChange('learning')}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                  currentStatus === 'learning'
                    ? 'bg-amber-950/80 border-amber-600 text-amber-300 ring-2 ring-amber-500/40'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800/50'
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>قيد الحفظ</span>
              </button>

              <button
                onClick={() => onStatusChange('memorized')}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                  currentStatus === 'memorized'
                    ? 'bg-emerald-950/80 border-emerald-600 text-emerald-300 ring-2 ring-emerald-500/40'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800/50'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>تم الحفظ</span>
              </button>

              <button
                onClick={() => onStatusChange('mastered')}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                  currentStatus === 'mastered'
                    ? 'bg-blue-950/80 border-blue-600 text-blue-200 ring-2 ring-blue-500/40'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800/50'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span>متقن ومثبت</span>
              </button>
            </div>
          </div>

          {/* Audio Reciter Controls */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-emerald-400" />
                <h4 className="font-semibold text-slate-200 text-xs">
                  الاستماع لسورة {thumun.surahName} (رواية ورش):
                </h4>
              </div>

              {/* Reciter Selector */}
              <select
                value={selectedReciterId}
                onChange={(e) => setSelectedReciterId(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                {WARSH_RECITERS.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            <audio
              ref={audioRef}
              src={audioUrl}
              preload="none"
              onEnded={() => setIsPlaying(false)}
              onError={() => {
                setIsPlaying(false);
                setIsLoadingAudio(false);
                setAudioError(true);
              }}
            />

            <div className="flex items-center justify-between gap-3 pt-1">
              <button
                onClick={toggleAudio}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs transition cursor-pointer shadow-lg shadow-emerald-900/30"
              >
                {isLoadingAudio ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>جاري التحميل...</span>
                  </>
                ) : isPlaying ? (
                  <>
                    <Pause className="w-3.5 h-3.5" />
                    <span>إيقاف مؤقت</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-slate-950" />
                    <span>تشغيل التلاوة</span>
                  </>
                )}
              </button>

              <div className="text-right">
                <p className="text-[11px] text-slate-400">{currentReciter.subtext}</p>
                {audioError && (
                  <p className="text-[11px] text-amber-400">
                    تعذر تشغيل هذا الخادم حالياً، جرب اختيار قارئ آخر من القائمة.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
