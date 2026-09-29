import React, { useState, useRef } from 'react';
import { 
  X, 
  Download, 
  Upload, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';
import { UserProgressData } from '../types/quran';
import { exportProgressJSON, importProgressJSON, DEFAULT_PROGRESS, saveUserProgress } from '../utils/storage';

interface BackupModalProps {
  progress: UserProgressData;
  onUpdateProgress: (data: UserProgressData) => void;
  onClose: () => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({
  progress,
  onUpdateProgress,
  onClose
}) => {
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleExport = () => {
    exportProgressJSON(progress);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      importProgressJSON(
        content,
        (importedData) => {
          onUpdateProgress(importedData);
          setImportStatus('تم استيراد بيانات الحفظ بنجاح وتحديث كافة الأثمان والأحزاب!');
          setErrorStatus(null);
        },
        (errMsg) => {
          setErrorStatus(errMsg);
          setImportStatus(null);
        }
      );
    };
    reader.readAsText(file);
  };

  const handleResetAll = () => {
    if (window.confirm('هل أنت متأكد من رغبتك في تصفير وإعادة تعيين جميع بيانات الحفظ والتكرارات؟ لا يمكن التراجع عن هذا الإجراء.')) {
      saveUserProgress(DEFAULT_PROGRESS);
      onUpdateProgress(DEFAULT_PROGRESS);
      setImportStatus('تمت إعادة ضبط البيانات بنجاح.');
      setErrorStatus(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center">
              <Download className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-base sm:text-lg">
                النسخ الاحتياطي وإدارة البيانات
              </h3>
              <p className="text-xs text-slate-400">
                حفظ واستيراد تقدمك وتكراراتك وملاحظاتك
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

        <div className="p-5 sm:p-6 space-y-5">
          {importStatus && (
            <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-600/40 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{importStatus}</span>
            </div>
          )}

          {errorStatus && (
            <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-600/40 text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorStatus}</span>
            </div>
          )}

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-200">
                تصدير نسخة احتياطية (JSON)
              </span>
              <Download className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-xs text-slate-400">
              احفظ ملفاً يحوي كامل إحصائياتك وتكراراتك وملاحظاتك لنقلها لأي جهاز آخر.
            </p>
            <button
              onClick={handleExport}
              className="mt-2 w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs transition cursor-pointer"
            >
              تحميل ملف النسخة الاحتياطية الآن
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-200">
                استيراد نسخة احتياطية
              </span>
              <Upload className="w-4 h-4 text-teal-400" />
            </div>
            <p className="text-xs text-slate-400">
              قم باختيار ملف النسخة الاحتياطية الذي قمت بتحميله سابقاً لاستعادة تقدمك.
            </p>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
              className="hidden"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              className="mt-2 w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition cursor-pointer"
            >
              اختيار ملف واستيراده
            </button>
          </div>

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500">
              تصفير كافة الإحصائيات والبدء من الصفر
            </span>
            <button
              onClick={handleResetAll}
              className="text-rose-400 hover:text-rose-300 font-semibold cursor-pointer"
            >
              إعادة تعيين الكل
            </button>
          </div>
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
