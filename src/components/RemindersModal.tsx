import React, { useState, useEffect } from 'react';
import { 
  X, 
  Bell, 
  Clock, 
  Check, 
  Volume2, 
  AlertCircle,
  Sparkles,
  Plus,
  Trash2
} from 'lucide-react';

export interface ReminderItem {
  id: string;
  label: string;
  time: string; // HH:mm
  enabled: boolean;
  repeatDaily: boolean;
}

interface RemindersModalProps {
  onClose: () => void;
  onTestChime: () => void;
}

const DEFAULT_REMINDERS: ReminderItem[] = [
  { id: 'fajr', label: 'ورد الفجر (بركة البكور)', time: '05:45', enabled: true, repeatDaily: true },
  { id: 'asr', label: 'ورد ما بعد العصر (مراجعة اللوح)', time: '17:15', enabled: true, repeatDaily: true },
  { id: 'isha', label: 'ورد العشاء وتثبيت الحفظ قبل النوم', time: '21:30', enabled: true, repeatDaily: true }
];

export const RemindersModal: React.FC<RemindersModalProps> = ({ onClose, onTestChime }) => {
  const [reminders, setReminders] = useState<ReminderItem[]>(() => {
    try {
      const saved = localStorage.getItem('warsh_reminders');
      return saved ? JSON.parse(saved) : DEFAULT_REMINDERS;
    } catch {
      return DEFAULT_REMINDERS;
    }
  });

  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  const [newLabel, setNewLabel] = useState('');
  const [newTime, setNewTime] = useState('18:00');
  const [showAddForm, setShowAddForm] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('warsh_reminders', JSON.stringify(reminders));
    } catch (e) {
      console.warn('Could not save reminders to localStorage', e);
    }
  }, [reminders]);

  const requestNotificationAccess = async () => {
    if (typeof Notification === 'undefined') {
      alert('متصفحك لا يدعم الإشعارات المباشرة.');
      return;
    }
    try {
      const perm = await Notification.requestPermission();
      setNotificationPermission(perm);
      if (perm === 'granted') {
        new Notification('جامع الحفظ - مصحف ورش', {
          body: 'تم تفعيل التنبيهات بنجاح! سنذكرك بأوقات وردك القرآني اليومي.',
          icon: '/favicon.ico'
        });
        onTestChime();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const toggleReminder = (id: string) => {
    setReminders(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const updateTime = (id: string, time: string) => {
    setReminders(prev => prev.map(r => r.id === id ? { ...r, time } : r));
  };

  const handleDelete = (id: string) => {
    setReminders(prev => prev.filter(r => r.id !== id));
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim()) return;
    const item: ReminderItem = {
      id: `custom_${Date.now()}`,
      label: newLabel.trim(),
      time: newTime,
      enabled: true,
      repeatDaily: true
    };
    setReminders(prev => [...prev, item]);
    setNewLabel('');
    setShowAddForm(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-slate-900 border border-emerald-900/60 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-950 border border-emerald-500/40 text-emerald-300 flex items-center justify-center shadow-inner">
              <Bell className="w-5 h-5 text-emerald-400 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-base sm:text-lg">
                منبه وتذكيرات الحفظ والمراجعة
              </h3>
              <p className="text-xs text-slate-400">
                حافظ على وردك القرآني اليومي ولا تفوّت موعد اللوح
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

        {/* Scrollable Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Notification Permission Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-emerald-950/40 border border-emerald-800/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h4 className="font-semibold text-slate-200 text-sm">
                  إشعارات المتصفح والهاتف
                </h4>
              </div>

              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                notificationPermission === 'granted'
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-600/50'
                  : 'bg-amber-950 text-amber-300 border-amber-600/50'
              }`}>
                {notificationPermission === 'granted' ? 'مفعّلة ✓' : 'بحاجة لتفعيل'}
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              تصلك التنبيهات في المواعيد المحددة حتى عند تصفح صفحات أخرى لتضمن بقاءك على اتصال دائم بكتاب الله.
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              {notificationPermission !== 'granted' && (
                <button
                  onClick={requestNotificationAccess}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs transition cursor-pointer shadow-lg shadow-emerald-900/30 flex items-center gap-1.5"
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span>تفعيل تنبيهات الجهاز</span>
                </button>
              )}

              <button
                onClick={onTestChime}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs transition cursor-pointer flex items-center gap-1.5"
              >
                <Volume2 className="w-3.5 h-3.5 text-teal-400" />
                <span>تجربة رنة المنبه</span>
              </button>
            </div>
          </div>

          {/* Active Reminders List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>مواعيد التنبيه اليومية:</span>
              </label>

              {savedSuccess && (
                <span className="text-xs text-emerald-400 font-medium animate-in fade-in">
                  تم الحفظ بنجاح!
                </span>
              )}
            </div>

            <div className="space-y-2.5">
              {reminders.map((r) => (
                <div
                  key={r.id}
                  className={`p-3.5 rounded-2xl border transition flex items-center justify-between gap-3 ${
                    r.enabled 
                      ? 'bg-slate-950/70 border-slate-700/80 shadow-md' 
                      : 'bg-slate-950/30 border-slate-900 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleReminder(r.id)}
                      className={`w-6 h-6 rounded-lg border flex items-center justify-center transition cursor-pointer ${
                        r.enabled 
                          ? 'bg-emerald-600 border-emerald-500 text-slate-950 font-bold' 
                          : 'border-slate-700 bg-slate-900'
                      }`}
                      title={r.enabled ? 'إيقاف المنبه' : 'تفعيل المنبه'}
                    >
                      {r.enabled && <Check className="w-4 h-4 stroke-[3]" />}
                    </button>

                    <div>
                      <h4 className={`text-xs sm:text-sm font-semibold ${
                        r.enabled ? 'text-slate-100' : 'text-slate-400 line-through'
                      }`}>
                        {r.label}
                      </h4>
                      <span className="text-[10px] text-slate-500">يتكرر يومياً</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={r.time}
                      onChange={(e) => updateTime(r.id, e.target.value)}
                      className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1 text-xs font-mono font-bold text-amber-300 focus:outline-none focus:border-emerald-500 cursor-pointer"
                    />

                    {r.id.startsWith('custom_') && (
                      <button
                        onClick={() => handleDelete(r.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-800 transition cursor-pointer"
                        title="حذف هذا المنبه"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Add Custom Reminder Form */}
          {showAddForm ? (
            <form onSubmit={handleAddCustom} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <h5 className="text-xs font-bold text-slate-200">إضافة منبه جديد:</h5>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="اسم الورد (مثال: ورد الضحى، ورد الاستظهار...)"
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
                  required
                />
                <input
                  type="time"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-amber-300 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs transition cursor-pointer"
                >
                  حفظ المنبه
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full py-2.5 rounded-xl border border-dashed border-slate-700/80 hover:border-emerald-500/80 bg-slate-950/40 text-slate-300 hover:text-emerald-300 text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة وقت منبه مخصص</span>
            </button>
          )}

          {/* Quranic Motivation Note */}
          <div className="p-3.5 rounded-2xl bg-amber-950/20 border border-amber-900/40 text-[11px] text-amber-200/90 leading-relaxed flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-300 mb-0.5">وصية أهل القرآن:</p>
              «تعاهدوا هذا القرآن، فوالذي نفس محمد بيده لهو أشد تفلتاً من الإبل في عقلها». تخصيص ورد يومي ثابت هو سر رسوخ الحفظ وثباته.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs transition cursor-pointer"
          >
            تم وحفظ الإعدادات
          </button>
        </div>
      </div>
    </div>
  );
};
