export type MemorizationStatus = 'not_started' | 'learning' | 'memorized' | 'mastered';

export interface ThumunItem {
  id: number; // 1 to 480
  thumunInHizb: number; // 1 to 8
  hizbNumber: number; // 1 to 60
  juzNumber: number; // 1 to 30
  label: string; // e.g. "مطلع الحزب", "الثمن الثاني", "الربع", "النصف", etc.
  type: 'hizb' | 'quarter' | 'half' | 'three_quarters' | 'thumun';
  surahName: string;
  surahNumber: number;
  ayahStart: number;
  ayahEnd?: number;
  ayahText: string; // Famous opening words in Warsh
  warshNote?: string; // Specific characteristic or similarity
}

export interface HizbData {
  number: number; // 1 to 60
  juzNumber: number; // 1 to 30
  title: string; // e.g. "الحزب 1"
  surahsSummary: string; // e.g. "الفاتحة - البقرة"
  startSurah: string;
  thumuns: ThumunItem[];
}

export interface ThumunProgress {
  status: MemorizationStatus;
  repeatCount: number;
  lastReviewedDate?: string;
  rating?: number; // 1 to 5
  notes?: string;
}

export interface UserProgressData {
  thumuns: Record<number, ThumunProgress>;
  dailyTargetThumuns: number;
  streakDays: number;
  lastActiveDate: string;
  bookmarkedThumunId?: number | null;
}

export interface QuizQuestion {
  id: string;
  type: 'identify_hizb' | 'identify_surah' | 'next_thumun';
  questionText: string;
  thumun: ThumunItem;
  options: string[];
  correctAnswer: string;
  explanation: string;
}
