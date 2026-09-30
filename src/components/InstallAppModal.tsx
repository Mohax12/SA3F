import React, { useState } from 'react';
import { 
  X, 
  Download, 
  Smartphone, 
  Apple, 
  Share, 
  PlusSquare, 
  CheckCircle2, 
  Sparkles, 
  ShieldCheck, 
  WifiOff, 
  Zap,
  ArrowRight
} from 'lucide-react';
import { usePWAInstall } from '../utils/usePWAInstall';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark?: boolean;
  onInstalled?: () => void;
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({
  isOpen,
  onClose,
  isDark = true,
  onInstalled
}) => {
  const { isInstallable, isIOS, isAndroid, install, markAsInstalled } = usePWAInstall();
  // Default to user's device tab
  const [selectedDevice, setSelectedDevice] = useState<'android' | 'ios'>(
    isIOS ? 'ios' : 'android'
  );
  const [installSuccess, setInstallSuccess] = useState(false);

  if (!isOpen) return null;

  const handleAndroidInstallClick = async () => {
    if (isInstallable) {
      const res = await install();
      if (res) {
        setInstallSuccess(true);
        markAsInstalled();
        if (onInstalled) onInstalled();
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } else {
      // Browser didn't trigger beforeinstallprompt yet or in in-app browser
      alert('لتثبيت التطبيق على أندرويد: اضغط على زر القائمة (⋮) أعلى أو أسفل المتصفح واختر "تثبيت التطبيق" أو "إضافة إلى الشاشة الرئيسية".');
    }
  };

  const handleManualMarkInstalled = () => {
    markAsInstalled();
    if (onInstalled) onInstalled();
    setInstallSuccess(true);
    setTimeout(() => {
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div 
        className={`w-full max-w-lg rounded-3xl border shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 ${
          isDark 
            ? 'bg-slate-950 text-slate-100 border-emerald-800/50 shadow-emerald-950/40' 
            : 'bg-white text-slate-900 border-slate-300 shadow-xl'
        }`}
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className={`p-4 sm:p-5 border-b flex items-center justify-between gap-3 ${
          isDark ? 'border-slate-800/90 bg-gradient-to-r from-emerald-950/70 to-slate-900' : 'border-slate-200 bg-emerald-50/80'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-800 border border-emerald-500/30 flex items-center justify-center shadow-lg shadow-emerald-950/40 shrink-0">
              <span className="font-['Amiri'] font-bold text-amber-300 text-2xl select-none">
                ۞
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-bold">
                  تثبيت تطبيق جامع الحفظ
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  مصحف ورش
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                تثبيت مباشر وسريع لهواتف آيفون وأندرويد
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

        {/* Device Switcher (Android vs iPhone) */}
        <div className={`p-3 border-b grid grid-cols-2 gap-2 ${
          isDark ? 'border-slate-900 bg-slate-900/40' : 'border-slate-200 bg-slate-100/50'
        }`}>
          <button
            onClick={() => setSelectedDevice('android')}
            className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
              selectedDevice === 'android'
                ? 'bg-emerald-600 text-slate-950 shadow-md ring-2 ring-emerald-400/30'
                : isDark ? 'bg-slate-900 text-slate-400 hover:text-slate-200' : 'bg-white text-slate-700'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>هواتف أندرويد (Android)</span>
            {isAndroid && <span className="text-[10px] bg-black/20 px-1.5 py-0.5 rounded">جهازك الحالي</span>}
          </button>

          <button
            onClick={() => setSelectedDevice('ios')}
            className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
              selectedDevice === 'ios'
                ? 'bg-emerald-600 text-slate-950 shadow-md ring-2 ring-emerald-400/30'
                : isDark ? 'bg-slate-900 text-slate-400 hover:text-slate-200' : 'bg-white text-slate-700'
            }`}
          >
            <Apple className="w-4 h-4" />
            <span>آيفون وآيباد (iPhone / iOS)</span>
            {isIOS && <span className="text-[10px] bg-black/20 px-1.5 py-0.5 rounded">جهازك الحالي</span>}
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto">
          {/* ANDROID INSTRUCTIONS */}
          {selectedDevice === 'android' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-800 border border-emerald-500/40 text-amber-300 flex items-center justify-center mx-auto shadow-lg shadow-emerald-950/40">
                  <span className="font-['Amiri'] font-bold text-3xl select-none">
                    ۞
                  </span>
                </div>
                <h4 className="text-base font-bold">
                  تثبيت تطبيق جامع الحفظ على أندرويد
                </h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  احصل على تجربة التطبيق الكاملة بدون شريط متصفح وبشاشة كاملة مع ميزات التسميع الصوتي والتنبيهات.
                </p>
              </div>

              {/* Install Button for Android */}
              <div className="space-y-2">
                <button
                  onClick={handleAndroidInstallClick}
                  className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-slate-950 font-bold text-sm shadow-xl shadow-emerald-950/50 flex items-center justify-center gap-2.5 transition cursor-pointer"
                >
                  <Download className="w-5 h-5 text-amber-300" />
                  <span>تثبيت التطبيق للأندرويد الآن (مجاناً)</span>
                </button>

                <p className="text-[11px] text-center text-slate-400">
                  إذا لم يظهر التثبيت المباشر: اضغط على قائمة المتصفح (⋮) ثم اختر <strong className="text-amber-400">«تثبيت التطبيق»</strong> أو <strong className="text-amber-400">«إضافة إلى الشاشة الرئيسية»</strong>.
                </p>
              </div>

              {/* Features List */}
              <div className={`p-4 rounded-2xl border space-y-2 ${
                isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <span className="text-[11px] font-bold text-emerald-400 block mb-1">
                  مميزات تثبيت التطبيق:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>وصول سريع بضغطة زر من الشاشة</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <WifiOff className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                    <span>يعمل بدون إنترنت للأحزاب المحفوظة</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>أداء أسرع وتصفح بدون تشتيت</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>آمن 100% وخفيف الحجم</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* IOS INSTRUCTIONS */}
          {selectedDevice === 'ios' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-800 border border-emerald-500/40 text-amber-300 flex items-center justify-center mx-auto shadow-lg shadow-emerald-950/40">
                  <span className="font-['Amiri'] font-bold text-3xl select-none">
                    ۞
                  </span>
                </div>
                <h4 className="text-base font-bold">
                  تثبيت تطبيق جامع الحفظ على آيفون وآيباد
                </h4>
                <p className="text-xs text-slate-400">
                  اتبع 3 خطوات بسيطة لإضافة التطبيق كأيقونة على شاشتك الرئيسية:
                </p>
              </div>

              {/* Illustrated 3 Steps for iOS */}
              <div className="space-y-3">
                {/* Step 1 */}
                <div className={`p-3.5 rounded-2xl border flex items-center gap-3.5 ${
                  isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center font-bold text-xs shrink-0">
                    1
                  </div>
                  <div className="flex-1">
                    <p className="text-xs sm:text-sm font-semibold">
                      اضغط على زر المشاركة <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-400 border border-sky-500/30 mx-1"><Share className="w-3.5 h-3.5" /></span> في شريط سفاري السفلي.
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className={`p-3.5 rounded-2xl border flex items-center gap-3.5 ${
                  isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-xs shrink-0">
                    2
                  </div>
                  <div className="flex-1">
                    <p className="text-xs sm:text-sm font-semibold">
                      مرر القائمة لأسفل واضغط على <strong className="text-amber-400">«إضافة إلى الشاشة الرئيسية»</strong> (Add to Home Screen).
                    </p>
                  </div>
                  <PlusSquare className="w-5 h-5 text-amber-400 shrink-0" />
                </div>

                {/* Step 3 */}
                <div className={`p-3.5 rounded-2xl border flex items-center gap-3.5 ${
                  isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-xs shrink-0">
                    3
                  </div>
                  <div className="flex-1">
                    <p className="text-xs sm:text-sm font-semibold">
                      اضغط على كلمة <strong className="text-emerald-400">«إضافة»</strong> (Add) في الزاوية العلوية ليظهر التطبيق على شاشة هاتفك فوراً!
                    </p>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs text-center">
                ✨ بعد إضافته، افتح التطبيق مباشرة من الشاشة للتمتع بكامل الشاشة والتسميع الصوتي.
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className={`p-4 border-t flex items-center justify-between gap-3 ${
          isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-200 bg-slate-50'
        }`}>
          <button
            onClick={handleManualMarkInstalled}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold transition cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>تم تثبيته في شاشتي</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer transition"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
