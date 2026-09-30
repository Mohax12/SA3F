import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Mic, 
  MicOff, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  RotateCcw, 
  BookOpen, 
  ChevronRight, 
  ChevronLeft, 
  Volume2, 
  ShieldCheck, 
  Award, 
  Edit3, 
  Play, 
  Share2, 
  Check, 
  Info,
  Layers
} from 'lucide-react';
import { ThumunItem, UserProgressData, MemorizationStatus } from '../types/quran';
import { ALL_AHZAB, getThumunById } from '../data/warshAhzab';
import { fetchFullThumun, FullThumunContent } from '../services/quranReader';
import { analyzeRecitation, deduplicateConsecutiveWords, RecitationAnalysisResult, RecitedWordDiff } from '../utils/recitationEngine';
import { sanitizeAyahText } from '../utils/quranText';

interface RecitationModalProps {
  initialThumun?: ThumunItem | null;
  onClose: () => void;
  onMarkStatus?: (thumunId: number, status: MemorizationStatus) => void;
  onShareToCommunity?: (message: string) => void;
  isDark?: boolean;
}

export const RecitationModal: React.FC<RecitationModalProps> = ({
  initialThumun,
  onClose,
  onMarkStatus,
  onShareToCommunity,
  isDark = true
}) => {
  // Current Thumun selection
  const [selectedThumunId, setSelectedThumunId] = useState<number>(
    initialThumun ? initialThumun.id : 1
  );
  
  const currentThumun = getThumunById(selectedThumunId) || ALL_AHZAB[0].thumuns[0];
  const [fullContent, setFullContent] = useState<FullThumunContent | null>(null);
  const [isLoadingText, setIsLoadingText] = useState(false);

  // Recitation Mode: 'mic' (Speech Recognition), 'text' (Manual Paste/Type)
  const [inputMode, setInputMode] = useState<'mic' | 'text'>('mic');
  const [isRecording, setIsRecording] = useState(false);
  const [recitedTranscript, setRecitedTranscript] = useState('');
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [speechError, setSpeechError] = useState<string | null>(null);

  // Analysis result
  const [analysis, setAnalysis] = useState<RecitationAnalysisResult | null>(null);
  const [selectedDiffWord, setSelectedDiffWord] = useState<RecitedWordDiff | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<any>(null);
  const [speechDialect, setSpeechDialect] = useState<'ar-SA' | 'ar-MA'>('ar-SA');

  // Stop any active audio playback when opening recitation to prevent echo/feedback
  useEffect(() => {
    document.querySelectorAll('audio').forEach((el) => {
      try {
        el.pause();
      } catch (e) {}
    });

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.onresult = null;
          recognitionRef.current.onerror = null;
          recognitionRef.current.onend = null;
          recognitionRef.current.abort();
        } catch (e) {}
        recognitionRef.current = null;
      }
    };
  }, []);

  // Load Quranic text whenever Thumun changes
  useEffect(() => {
    let isMounted = true;
    setIsLoadingText(true);
    setAnalysis(null);
    setRecitedTranscript('');
    setSelectedDiffWord(null);
    setSavedSuccess(false);

    fetchFullThumun(currentThumun)
      .then(content => {
        if (isMounted) {
          setFullContent(content);
          setIsLoadingText(false);
        }
      })
      .catch(err => {
        console.error('Failed to load full thumun text:', err);
        if (isMounted) setIsLoadingText(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedThumunId]);

  // Check speech recognition support
  useEffect(() => {
    const SpeechRecognition = 
      (window as any).SpeechRecognition || 
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechSupported(false);
      setInputMode('text');
    }
  }, []);

  // Timer while recording
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
      setRecordingSeconds(0);
    }
    return () => clearInterval(timerRef.current);
  }, [isRecording]);

  // Start live speech recognition
  const startRecording = () => {
    setSpeechError(null);
    setAnalysis(null);
    setSelectedDiffWord(null);
    setRecitedTranscript(''); // Clear previous transcript so recording starts cleanly without doubled verses

    const SpeechRecognition = 
      (window as any).SpeechRecognition || 
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechSupported(false);
      setInputMode('text');
      return;
    }

    // 1. Pause any background audio in the page to prevent microphone audio loop / echo
    document.querySelectorAll('audio').forEach((a) => {
      try {
        a.pause();
      } catch (e) {}
    });

    // 2. Abort any previous recognition instance to prevent dual parallel recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.abort();
      } catch (e) {}
      recognitionRef.current = null;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      // Set chosen Arabic dialect (Classical Quranic or Moroccan)
      recognition.lang = speechDialect;

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = 0; i < event.results.length; i++) {
          const item = event.results[i];
          const text = (item[0]?.transcript || '').trim();
          if (!text) continue;
          if (item.isFinal) {
            finalTranscript += (finalTranscript ? ' ' : '') + text;
          } else {
            interimTranscript += (interimTranscript ? ' ' : '') + text;
          }
        }

        // Clean boundary overlap between final and interim:
        let cleanInterim = interimTranscript;
        if (finalTranscript && interimTranscript) {
          const finalWords = finalTranscript.split(/\s+/);
          const interimWords = interimTranscript.split(/\s+/);
          for (let len = Math.min(8, interimWords.length, finalWords.length); len >= 1; len--) {
            const finalTail = finalWords.slice(-len).join(' ');
            const interimHead = interimWords.slice(0, len).join(' ');
            if (finalTail === interimHead) {
              cleanInterim = interimWords.slice(len).join(' ');
              break;
            }
          }
        }

        const combined = (finalTranscript + (cleanInterim ? ' ' + cleanInterim : '')).trim();
        const deduplicated = deduplicateConsecutiveWords(combined);
        setRecitedTranscript(deduplicated);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setSpeechError('لم يتم منح إذن الميكروفون. يرجى تفعيل الميكروفون في المتصفح أو استخدام وضع الكتابة.');
        } else if (event.error !== 'no-speech') {
          setSpeechError(`ملاحظة صوتية: ${event.error}`);
        }
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e: any) {
      console.error('Failed to start speech recognition:', e);
      setSpeechError('تعذر تشغيل الميكروفون. يمكنك التسميع عن طريق كتابة أو لصق ما حفظته.');
      setIsRecording(false);
    }
  };

  // Stop recording and analyze
  const stopRecording = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    setIsRecording(false);
    setTimeout(() => {
      runAnalysis();
    }, 150);
  };

  // Run accuracy diff analysis against authentic Warsh text
  const runAnalysis = (customTranscript?: string) => {
    const textToAnalyze = (customTranscript !== undefined ? customTranscript : recitedTranscript).trim();
    if (!fullContent || !textToAnalyze) return;

    const cleaned = deduplicateConsecutiveWords(textToAnalyze);
    const result = analyzeRecitation(fullContent.ayahs, cleaned);
    setAnalysis(result);
  };

  // Format recording seconds
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
  };

  // Mark as Mastered
  const handleMarkMastered = () => {
    if (onMarkStatus) {
      onMarkStatus(selectedThumunId, 'mastered');
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }
  };

  // Share to community
  const handleShareResult = () => {
    if (analysis && onShareToCommunity) {
      const msg = `أتممت تسميع ${currentThumun.label} من سورة ${currentThumun.surahName} برواية ورش بنسبة إتقان ${analysis.accuracyPercent}% (${analysis.ratingLabel}) 🎯`;
      onShareToCommunity(msg);
      alert('تمت مشاركة إنجازك في حلقة التواصل بين المنخرطين بنجاح!');
    }
  };

  const cardBg = isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div 
        className={`w-full max-w-4xl rounded-3xl border shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200 ${
          isDark ? 'bg-slate-950 text-slate-100 border-emerald-900/40' : 'bg-slate-50 text-slate-900 border-slate-300'
        }`}
        dir="rtl"
      >
        {/* Modal Header */}
        <div className={`p-4 sm:p-6 border-b flex items-center justify-between gap-3 ${
          isDark ? 'border-slate-800/80 bg-slate-900/60' : 'border-slate-200 bg-emerald-50/70'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-800 text-amber-300 flex items-center justify-center shadow-lg shadow-emerald-900/30 shrink-0">
              <Mic className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-bold">
                  التسميع الذكي المباشر
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  برواية ورش عن نافع
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                خصوصية تامة 100% · معالجة فورية دون تخزين تسجيلاتك
              </p>
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

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* Thumun Selector & Target Bar */}
          <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 ${cardBg}`}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-xs shrink-0">
                {currentThumun.thumunInHizb}/8
              </div>
              <div>
                <span className="text-xs text-slate-400 font-medium block">
                  الثمن المراد تسميعه:
                </span>
                <h4 className="text-sm sm:text-base font-bold text-emerald-400">
                  {currentThumun.label} · سورة {currentThumun.surahName} (الحزب {currentThumun.hizbNumber})
                </h4>
              </div>
            </div>

            {/* Quick Thumun Navigator */}
            <div className="flex items-center gap-1.5 self-end sm:self-auto">
              <button
                disabled={selectedThumunId <= 1}
                onClick={() => setSelectedThumunId(prev => Math.max(1, prev - 1))}
                className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1 transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                  isDark ? 'border-slate-800 hover:bg-slate-800' : 'border-slate-300 hover:bg-slate-100'
                }`}
                title="الثمن السابق"
              >
                <ChevronRight className="w-4 h-4" />
                <span className="hidden sm:inline">السابق</span>
              </button>

              <select
                value={selectedThumunId}
                onChange={(e) => setSelectedThumunId(Number(e.target.value))}
                className={`px-3 py-2 rounded-xl border text-xs font-bold transition focus:outline-none focus:border-emerald-500 ${
                  isDark ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-white border-slate-300 text-slate-800'
                }`}
              >
                {ALL_AHZAB.flatMap(h => h.thumuns).map(t => (
                  <option key={t.id} value={t.id}>
                    ح{t.hizbNumber} · ث{t.thumunInHizb} ({t.surahName})
                  </option>
                ))}
              </select>

              <button
                disabled={selectedThumunId >= 480}
                onClick={() => setSelectedThumunId(prev => Math.min(480, prev + 1))}
                className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1 transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                  isDark ? 'border-slate-800 hover:bg-slate-800' : 'border-slate-300 hover:bg-slate-100'
                }`}
                title="الثمن التالي"
              >
                <span className="hidden sm:inline">التالي</span>
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Mode Switcher: Live Mic vs Manual Text */}
          <div className="flex items-center justify-between gap-3 border-b pb-3 border-slate-800/60">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setInputMode('mic')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                  inputMode === 'mic'
                    ? 'bg-emerald-600 text-slate-950 shadow-md'
                    : isDark ? 'bg-slate-900 text-slate-400 hover:text-slate-200' : 'bg-slate-100 text-slate-600'
                }`}
              >
                <Mic className="w-3.5 h-3.5" />
                <span>تسميع صوتي مباشر</span>
              </button>

              <button
                onClick={() => setInputMode('text')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                  inputMode === 'text'
                    ? 'bg-emerald-600 text-slate-950 shadow-md'
                    : isDark ? 'bg-slate-900 text-slate-400 hover:text-slate-200' : 'bg-slate-100 text-slate-600'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>كتابة / لصق التسميع</span>
              </button>
            </div>

            {inputMode === 'mic' && (
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400 hidden sm:inline">لهجة التعرف:</span>
                <select
                  value={speechDialect}
                  onChange={(e) => setSpeechDialect(e.target.value as any)}
                  className={`text-[11px] font-bold px-2 py-1 rounded-lg border transition ${
                    isDark ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-white border-slate-300 text-slate-800'
                  }`}
                  title="اختيار لهجة ونموذج التعرف الصوتي"
                >
                  <option value="ar-SA">العربية الفصحى (القرآن الكريم)</option>
                  <option value="ar-MA">المغربية (ورش)</option>
                </select>
              </div>
            )}
          </div>

          {speechError && (
            <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{speechError}</span>
            </div>
          )}

          {/* Live Recording Console */}
          {inputMode === 'mic' ? (
            <div className={`p-6 sm:p-8 rounded-3xl border text-center space-y-5 transition-all ${
              isRecording 
                ? 'border-emerald-500 bg-emerald-950/20 shadow-xl shadow-emerald-950/30 ring-2 ring-emerald-500/40' 
                : cardBg
            }`}>
              {/* Mic Visualizer & Pulsing Button */}
              <div className="relative inline-block mx-auto">
                {isRecording && (
                  <>
                    <span className="absolute -inset-3 rounded-full bg-emerald-500/20 animate-ping pointer-events-none" />
                    <span className="absolute -inset-6 rounded-full bg-emerald-500/10 animate-pulse pointer-events-none" />
                  </>
                )}

                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full flex flex-col items-center justify-center transition-all cursor-pointer shadow-xl ${
                    isRecording
                      ? 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-slate-950 hover:scale-105'
                  }`}
                  title={isRecording ? 'إيقاف التسميع وفحص النتيجة' : 'بدء التسميع الصوتي'}
                >
                  {isRecording ? (
                    <>
                      <MicOff className="w-7 h-7 sm:w-8 sm:h-8" />
                      <span className="text-[10px] font-bold mt-1">إيقاف</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-7 h-7 sm:w-8 sm:h-8" />
                      <span className="text-[10px] font-bold mt-1">ابدأ التلاوة</span>
                    </>
                  )}
                </button>
              </div>

              {/* Timer & Instructions */}
              <div>
                {isRecording ? (
                  <div className="space-y-1">
                    <span className="text-xl sm:text-2xl font-bold font-mono text-emerald-400">
                      {formatTime(recordingSeconds)}
                    </span>
                    <p className="text-xs text-emerald-300 font-semibold animate-pulse">
                      جارٍ الاستماع إلى تلاوتك الكريمة... اقرأ بترتيل وتؤدة
                    </p>
                  </div>
                ) : (
                  <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
                    اضغط على الزر الأخضر وابدأ بتلاوة الثمن كاملاً بصوت واضح، وسيقوم النظام فوراً بتحويل صوتك إلى نص ومقارنته بالمصحف.
                  </p>
                )}
              </div>

              {/* Real-time transcribed text box */}
              {recitedTranscript && (
                <div className={`p-4 rounded-2xl border text-right space-y-2 max-h-40 overflow-y-auto ${
                  isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-300'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-400">
                      النص الملتقط من تلاوتك:
                    </span>
                    {!isRecording && (
                      <button
                        onClick={() => {
                          setRecitedTranscript('');
                          setAnalysis(null);
                        }}
                        className="text-[10px] text-rose-400 hover:text-rose-300 cursor-pointer underline"
                      >
                        مسح النص وإعادة التسميع
                      </button>
                    )}
                  </div>
                  <p className="text-sm font-quran text-slate-200 leading-relaxed">
                    {recitedTranscript}
                  </p>
                </div>
              )}

              {/* Action: Trigger Analysis if not recording and transcript exists */}
              {!isRecording && recitedTranscript && !analysis && (
                <button
                  onClick={() => runAnalysis()}
                  className="px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs transition cursor-pointer shadow-lg flex items-center gap-2 mx-auto"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>فحص التسميع واكتشاف الأخطاء</span>
                </button>
              )}
            </div>
          ) : (
            /* Manual Text Mode */
            <div className={`p-5 rounded-3xl border space-y-4 ${cardBg}`}>
              <div className="space-y-1">
                <label className="text-xs font-bold text-emerald-400 block">
                  اكتب أو الصق تلاوتك للثمن هنا للمقارنة الآلية:
                </label>
                <textarea
                  rows={4}
                  value={recitedTranscript}
                  onChange={(e) => setRecitedTranscript(e.target.value)}
                  placeholder="مثال: الحمد لله رب العالمين الرحمن الرحيم مالك يوم الدين..."
                  className={`w-full p-3.5 rounded-2xl border text-sm font-quran transition focus:outline-none focus:border-emerald-500 ${
                    isDark ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setRecitedTranscript('')}
                  className="text-xs text-slate-500 hover:text-slate-300 cursor-pointer"
                >
                  مسح النص
                </button>

                <button
                  onClick={() => runAnalysis()}
                  disabled={!recitedTranscript.trim()}
                  className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs transition cursor-pointer shadow-lg disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>مقارنة التسميع بالنص المعتمد</span>
                </button>
              </div>
            </div>
          )}

          {/* Analysis Results Display */}
          {analysis && (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-300">
              {/* Overall Accuracy Banner */}
              <div className={`p-5 sm:p-6 rounded-3xl border relative overflow-hidden ${
                analysis.accuracyPercent >= 90
                  ? 'bg-gradient-to-r from-emerald-950/60 via-slate-900 to-teal-950/60 border-emerald-500/50 shadow-emerald-950/40 shadow-xl'
                  : analysis.accuracyPercent >= 75
                  ? 'bg-gradient-to-r from-teal-950/60 via-slate-900 to-amber-950/60 border-teal-500/50'
                  : 'bg-gradient-to-r from-rose-950/60 via-slate-900 to-amber-950/60 border-amber-500/50'
              }`}>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4 text-center sm:text-right">
                    {/* Circle Score */}
                    <div className="w-20 h-20 rounded-full border-4 border-emerald-500 bg-slate-950 flex flex-col items-center justify-center shrink-0 shadow-lg">
                      <span className="text-2xl font-bold font-mono text-emerald-400">
                        {analysis.accuracyPercent}%
                      </span>
                      <span className="text-[10px] text-slate-400">نسبة الإتقان</span>
                    </div>

                    <div>
                      <span className="text-xs uppercase font-bold tracking-wider text-amber-400 block mb-0.5">
                        نتيجة التسميع برواية ورش
                      </span>
                      <h4 className={`text-lg sm:text-xl font-bold ${analysis.ratingColor}`}>
                        {analysis.ratingLabel}
                      </h4>
                      <p className="text-xs text-slate-300 mt-1">
                        {analysis.feedbackSummary}
                      </p>
                    </div>
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-end">
                    <button
                      onClick={handleMarkMastered}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs transition cursor-pointer shadow-md flex items-center gap-1.5"
                    >
                      {savedSuccess ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>تم تسجيل الإتقان!</span>
                        </>
                      ) : (
                        <>
                          <Award className="w-4 h-4" />
                          <span>اعتماده كثمن متقن</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={handleShareResult}
                      className={`px-3.5 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                        isDark ? 'border-amber-500/40 text-amber-300 hover:bg-amber-950/40' : 'border-amber-400 text-amber-800 hover:bg-amber-100'
                      }`}
                      title="مشاركة النتيجة في حلقة المتحدين"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>مشاركة النتيجة</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Statistics Breakdown Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className={`p-3.5 rounded-2xl border text-center ${cardBg}`}>
                  <span className="text-[11px] text-emerald-400 font-semibold block">كلمات صحيحة</span>
                  <span className="text-xl font-bold text-emerald-400 font-mono">
                    {analysis.correctWords}
                  </span>
                  <span className="text-[10px] text-slate-500 block">من أصل {analysis.totalWords}</span>
                </div>

                <div className={`p-3.5 rounded-2xl border text-center ${cardBg}`}>
                  <span className="text-[11px] text-rose-400 font-semibold block">كلمات ناقصة</span>
                  <span className="text-xl font-bold text-rose-400 font-mono">
                    {analysis.missingWordsCount}
                  </span>
                  <span className="text-[10px] text-slate-500 block">سقطت من الحفظ</span>
                </div>

                <div className={`p-3.5 rounded-2xl border text-center ${cardBg}`}>
                  <span className="text-[11px] text-amber-400 font-semibold block">كلمات مستبدلة</span>
                  <span className="text-xl font-bold text-amber-400 font-mono">
                    {analysis.replacedWordsCount}
                  </span>
                  <span className="text-[10px] text-slate-500 block">فوارق أو أخطاء</span>
                </div>

                <div className={`p-3.5 rounded-2xl border text-center ${cardBg}`}>
                  <span className="text-[11px] text-sky-400 font-semibold block">كلمات زائدة</span>
                  <span className="text-xl font-bold text-sky-400 font-mono">
                    {analysis.extraWordsCount}
                  </span>
                  <span className="text-[10px] text-slate-500 block">غير موجودة بالنص</span>
                </div>
              </div>

              {/* Verse Ordering Warning */}
              {analysis.verseOrderErrors.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs space-y-1">
                  <span className="font-bold flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-amber-400" />
                    ملاحظة في ترتيب الآيات:
                  </span>
                  <ul className="list-disc list-inside space-y-0.5 text-slate-300 pr-2">
                    {analysis.verseOrderErrors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Word-by-Word Interactive Inspection */}
              <div className={`p-5 rounded-3xl border space-y-3 ${cardBg}`}>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-emerald-400" />
                    <h5 className="text-xs sm:text-sm font-bold">
                      فحص مواضع الكلمات في الثمن كلمة بكلمة:
                    </h5>
                  </div>

                  {/* Legend */}
                  <div className="flex items-center gap-2 text-[10px] font-semibold flex-wrap">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      صحيحة
                    </span>
                    <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30 line-through">
                      ناقصة
                    </span>
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      مستبدلة
                    </span>
                    <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-400 border border-sky-500/30">
                      زائدة
                    </span>
                  </div>
                </div>

                {/* Tokens Stream */}
                <div className={`p-4 sm:p-5 rounded-2xl border text-right leading-loose font-quran text-lg sm:text-xl max-h-80 overflow-y-auto ${
                  isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-300'
                }`}>
                  {analysis.wordsDiff.map((token, idx) => {
                    if (token.status === 'correct') {
                      return (
                        <span 
                          key={idx}
                          onClick={() => setSelectedDiffWord(token)}
                          className="inline-block px-1 mx-0.5 rounded text-emerald-300 hover:bg-emerald-500/20 cursor-pointer transition-colors"
                          title={`الآية ${token.ayahNumber || ''}`}
                        >
                          {token.canonicalWord}
                        </span>
                      );
                    } else if (token.status === 'missing') {
                      return (
                        <span 
                          key={idx}
                          onClick={() => setSelectedDiffWord(token)}
                          className="inline-block px-1.5 mx-0.5 rounded bg-rose-950/60 text-rose-400 border border-rose-500/40 line-through cursor-pointer transition-colors"
                          title="كلمة ناقصة سقطت من التسميع (اضغط للتفاصيل)"
                        >
                          {token.canonicalWord}
                        </span>
                      );
                    } else if (token.status === 'replaced') {
                      return (
                        <span 
                          key={idx}
                          onClick={() => setSelectedDiffWord(token)}
                          className="inline-block px-1.5 mx-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-500/40 underline decoration-amber-500/80 underline-offset-4 cursor-pointer transition-colors font-bold"
                          title={`استبدال: قرأت (${token.recitedWord}) والصواب (${token.canonicalWord})`}
                        >
                          {token.canonicalWord}
                        </span>
                      );
                    } else {
                      // Extra word
                      return (
                        <span 
                          key={idx}
                          onClick={() => setSelectedDiffWord(token)}
                          className="inline-block px-1.5 mx-0.5 rounded bg-sky-950/60 text-sky-300 border border-sky-500/40 italic cursor-pointer transition-colors text-base"
                          title={`كلمة زائدة قالها القارئ: (${token.recitedWord})`}
                        >
                          [{token.recitedWord}]
                        </span>
                      );
                    }
                  })}
                </div>

                {/* Selected Token Detail Card */}
                {selectedDiffWord && (
                  <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-between gap-3 text-xs animate-in fade-in">
                    <div>
                      <span className="text-[11px] text-slate-400 block font-semibold">
                        تفاصيل الكلمة المحددة:
                      </span>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        {selectedDiffWord.canonicalWord && (
                          <span className="font-quran text-base text-emerald-400">
                            في المصحف: <strong>{selectedDiffWord.canonicalWord}</strong>
                          </span>
                        )}
                        {selectedDiffWord.recitedWord && (
                          <span className="text-amber-300">
                            ما تلوته: <strong>{selectedDiffWord.recitedWord}</strong>
                          </span>
                        )}
                        {selectedDiffWord.ayahNumber && (
                          <span className="text-slate-400">
                            سورة {selectedDiffWord.surahName} · الآية {selectedDiffWord.ayahNumber}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedDiffWord(null)}
                      className="text-xs text-slate-400 hover:text-slate-200 px-2 py-1 rounded-lg border border-slate-700 cursor-pointer"
                    >
                      إغلاق
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Reference Warsh Text Preview Box */}
          <div className={`p-4 sm:p-5 rounded-2xl border space-y-3 ${
            isDark ? 'bg-slate-900/40 border-slate-800/80' : 'bg-slate-100 border-slate-200'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-amber-500" />
                النص القرآني الكامل المعتمد للثمن (رواية ورش):
              </span>
              <span className="text-[11px] text-slate-500">
                {fullContent?.ayahs.length || 0} آيات
              </span>
            </div>

            {isLoadingText ? (
              <div className="p-6 text-center text-xs text-slate-500 animate-pulse">
                جارٍ تحميل آيات الثمن برواية ورش عن نافع...
              </div>
            ) : (
              <div className="font-quran text-sm sm:text-base leading-loose text-slate-300 text-justify max-h-48 overflow-y-auto pr-1">
                {fullContent?.ayahs.map(a => (
                  <span key={a.id} className="inline">
                    {a.text}{' '}
                    <span className="text-amber-500/80 text-xs px-1 select-none font-sans font-bold">
                      ﴿{a.numberInSurah}﴾
                    </span>{' '}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className={`p-4 border-t flex items-center justify-between gap-3 ${
          isDark ? 'border-slate-800 bg-slate-900/40' : 'border-slate-200 bg-white'
        }`}>
          <div className="text-[11px] text-slate-500 hidden sm:block">
            نص قرآني موثوق برواية ورش عن نافع من طريق الأزرق
          </div>

          <div className="flex items-center gap-2">
            {analysis && (
              <button
                onClick={() => {
                  setAnalysis(null);
                  setRecitedTranscript('');
                }}
                className={`px-3.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                  isDark ? 'border-slate-700 hover:bg-slate-800 text-slate-300' : 'border-slate-300 hover:bg-slate-100 text-slate-700'
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>إعادة التسميع</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition cursor-pointer"
            >
              إغلاق
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
