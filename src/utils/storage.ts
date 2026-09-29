import { UserProgressData, MemorizationStatus, ThumunProgress } from '../types/quran';

const STORAGE_KEY = 'quran_warsh_memorization_v1';

export const DEFAULT_PROGRESS: UserProgressData = {
  thumuns: {},
  dailyTargetThumuns: 2,
  streakDays: 1,
  lastActiveDate: new Date().toISOString().split('T')[0],
  bookmarkedThumunId: 1
};

export function loadUserProgress(): UserProgressData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PROGRESS;
    const parsed = JSON.parse(raw) as UserProgressData;

    const today = new Date().toISOString().split('T')[0];
    if (parsed.lastActiveDate !== today) {
      const lastDate = new Date(parsed.lastActiveDate);
      const currentDate = new Date(today);
      const diffTime = Math.abs(currentDate.getTime() - lastDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        parsed.streakDays = (parsed.streakDays || 0) + 1;
      } else if (diffDays > 1) {
        parsed.streakDays = 1;
      }
      parsed.lastActiveDate = today;
      saveUserProgress(parsed);
    }

    return parsed;
  } catch (e) {
    console.error('Failed to load user progress:', e);
    return DEFAULT_PROGRESS;
  }
}

export function saveUserProgress(data: UserProgressData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save user progress:', e);
  }
}

export function updateThumunStatus(
  thumunId: number, 
  status: MemorizationStatus, 
  prevData: UserProgressData
): UserProgressData {
  const current = prevData.thumuns[thumunId] || {
    status: 'not_started',
    repeatCount: 0
  };

  const updated: ThumunProgress = {
    ...current,
    status,
    lastReviewedDate: new Date().toISOString().split('T')[0]
  };

  const nextProgress: UserProgressData = {
    ...prevData,
    thumuns: {
      ...prevData.thumuns,
      [thumunId]: updated
    }
  };

  saveUserProgress(nextProgress);
  return nextProgress;
}

export function incrementThumunRepeat(
  thumunId: number, 
  prevData: UserProgressData
): UserProgressData {
  const current = prevData.thumuns[thumunId] || {
    status: 'learning',
    repeatCount: 0
  };

  const newCount = (current.repeatCount || 0) + 1;
  const nextProgress: UserProgressData = {
    ...prevData,
    thumuns: {
      ...prevData.thumuns,
      [thumunId]: {
        ...current,
        repeatCount: newCount,
        lastReviewedDate: new Date().toISOString().split('T')[0]
      }
    }
  };

  saveUserProgress(nextProgress);
  return nextProgress;
}

export function saveThumunNote(
  thumunId: number, 
  notes: string, 
  prevData: UserProgressData
): UserProgressData {
  const current = prevData.thumuns[thumunId] || {
    status: 'not_started',
    repeatCount: 0
  };

  const nextProgress: UserProgressData = {
    ...prevData,
    thumuns: {
      ...prevData.thumuns,
      [thumunId]: {
        ...current,
        notes
      }
    }
  };

  saveUserProgress(nextProgress);
  return nextProgress;
}

export function exportProgressJSON(data: UserProgressData): void {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `quran_warsh_progress_${new Date().toISOString().split('T')[0]}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

export function importProgressJSON(
  fileContent: string, 
  onSuccess: (data: UserProgressData) => void,
  onError: (err: string) => void
): void {
  try {
    const parsed = JSON.parse(fileContent);
    if (parsed && typeof parsed.thumuns === 'object') {
      saveUserProgress(parsed);
      onSuccess(parsed);
    } else {
      onError('الملف غير متطابق مع تنسيق بيانات الحفظ');
    }
  } catch (e) {
    onError('حدث خطأ أثناء قراءة الملف');
  }
}
