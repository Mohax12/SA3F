import React, { useState, useRef } from 'react';
import { 
  X, 
  Volume2, 
  Play, 
  Pause, 
  Check 
} from 'lucide-react';
import { WARSH_RECITERS, getSurahAudioUrl } from '../data/reciters';

interface AudioSettingsModalProps {
  onClose: () => void;
}

export const AudioSettingsModal: React.FC<AudioSettingsModalProps> = ({ onClose }) => {
  const [selectedReciter, setSelectedReciter] = useState(WARSH_RECITERS[0]);
  const [playingSurah, setPlayingSurah] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [audioError, setAudioError] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const testAudioUrl = getSurahAudioUrl(selectedReciter.audioServer, playingSurah);

  const handleSelectReciter = (r: typeof WARSH_RECITERS[0]) => {
    setSelectedReciter(r);
    setIsPlaying(false);
    setIsLoadingAudio(false);
    setAudioError(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.load();
    }
  };

  const toggleTestPlay = async () => {
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
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        console.warn('Reciter test error:', err);
        setAudioError(true);
      }
      setIsPlaying(false);
      setIsLoadingAudio(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-500/40 text-emerald-300 flex items-center justify-center">
              <Volume2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-base sm:text-lg">
                قراء ورش عن نافع
              </h3>
              <p className="text-xs text-slate-400">
                اختر القارئ المفضل واستمع للتلاوة
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

        <div className="p-5 sm:p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300">
              قائمة القراء المتاحين برواية ورش:
            </label>

            <div className="space-y-2">
              {WARSH_RECITERS.map((r) => {
                const isCurrent = selectedReciter.id === r.id;
                return (
                  <div
                    key={r.id}
                    onClick={() => handleSelectReciter(r)}
                    className={`p-3.5 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                      isCurrent
                        ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-200'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800/40'
                    }`}
                  >
                    <div>
                      <h4 className="font-bold text-sm text-slate-100">
                        {r.name}
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {r.subtext}
                      </p>
                    </div>

                    {isCurrent && (
                      <Check className="w-5 h-5 text-emerald-400 shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>تجربة الاستماع (سورة الفاتحة):</span>
              <span className="text-emerald-400 font-semibold">{selectedReciter.name}</span>
            </div>

            <audio
              ref={audioRef}
              src={testAudioUrl}
              preload="none"
              onWaiting={() => setIsLoadingAudio(true)}
              onCanPlay={() => setIsLoadingAudio(false)}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={() => setIsPlaying(false)}
              onError={() => {
                setAudioError(true);
                setIsPlaying(false);
                setIsLoadingAudio(false);
              }}
            />

            <button
              onClick={toggleTestPlay}
              disabled={isLoadingAudio}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-75 text-slate-950 font-bold text-xs transition cursor-pointer flex items-center justify-center gap-2"
            >
              {isLoadingAudio ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>جاري تحميل التلاوة...</span>
                </>
              ) : isPlaying ? (
                <>
                  <Pause className="w-4 h-4" />
                  <span>إيقاف التلاوة</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>تشغيل تلاوة تجريبية</span>
                </>
              )}
            </button>

            {audioError && (
              <p className="text-[11px] text-amber-400 text-center">
                تعذر تحميل الصوت من السيرفر، يرجى التحقق من الاتصال بالإنترنت.
              </p>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition cursor-pointer"
          >
            حفظ وإغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
