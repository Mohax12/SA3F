/**
 * خدمة التذكيرات والمنبهات الصوتية والإشعارات لورد القرآن الكريم
 */

import { ReminderItem } from '../components/RemindersModal';

let audioCtx: AudioContext | null = null;

/**
 * تشغيل نغمة تنبيه إسلامية هادئة ونقية عبر Web Audio API
 * تعمل فوراً على كافة المتصفحات دون الحاجة لتحميل ملفات صوتية خارجية
 */
export function playIslamicChime(): void {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    if (!audioCtx || audioCtx.state === 'suspended') {
      audioCtx = new AudioContextClass();
    }

    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const now = audioCtx.currentTime;
    // نغمات متناسقة هادئة تشبه جرس المئذنة الهادئ (C5, E5, G5, C6)
    const notes = [523.25, 659.25, 783.99, 1046.5];

    notes.forEach((freq, index) => {
      if (!audioCtx) return;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + index * 0.18);

      gain.gain.setValueAtTime(0.001, now + index * 0.18);
      gain.gain.exponentialRampToValueAtTime(0.2, now + index * 0.18 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.18 + 0.9);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(now + index * 0.18);
      osc.stop(now + index * 0.18 + 0.95);
    });
  } catch (e) {
    console.warn('Audio chime could not be played:', e);
  }
}

/**
 * إرسال إشعار للمتصفح إذا كانت الصلاحية ممنوحة
 */
export function sendBrowserNotification(title: string, body: string): boolean {
  if (typeof Notification === 'undefined') return false;

  if (Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'quran-reminder-' + Date.now()
      });
      return true;
    } catch (e) {
      console.warn('Notification error:', e);
      return false;
    }
  }
  return false;
}
