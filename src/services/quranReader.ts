import { ThumunItem } from '../types/quran';
import { ALL_AHZAB } from '../data/warshAhzab';
import { sanitizeAyahText } from '../utils/quranText';

export interface ThumunAyahItem {
  id: number;
  surahNumber: number;
  surahName: string;
  numberInSurah: number;
  text: string;
  isFirstInSurah?: boolean;
}

export interface FullThumunContent {
  thumunId: number;
  hizbNumber: number;
  thumunInHizb: number;
  label: string;
  surahs: string[];
  ayahs: ThumunAyahItem[];
  fullTextPlain: string;
}

// In-memory cache for loaded hizb files
const hizbCache: Record<number, any> = {};

export async function fetchFullThumun(thumun: ThumunItem): Promise<FullThumunContent> {
  const hizbNum = thumun.hizbNumber;
  const padded = String(hizbNum).padStart(2, '0');

  let hizbData = hizbCache[hizbNum];
  if (!hizbData) {
    try {
      const response = await fetch(`/data/hizbs/hizb_${padded}.json`);
      if (!response.ok) {
        throw new Error(`Failed to load hizb ${hizbNum}: ${response.statusText}`);
      }
      hizbData = await response.json();
      hizbCache[hizbNum] = hizbData;
    } catch (err) {
      console.error('Error loading local hizb data:', err);
      // Fallback: return at least the opening ayah from thumun
      return {
        thumunId: thumun.id,
        hizbNumber: thumun.hizbNumber,
        thumunInHizb: thumun.thumunInHizb,
        label: thumun.label,
        surahs: [thumun.surahName],
        ayahs: [
          {
            id: 1,
            surahNumber: thumun.surahNumber,
            surahName: thumun.surahName,
            numberInSurah: thumun.ayahStart,
            text: sanitizeAyahText(thumun.ayahText),
            isFirstInSurah: thumun.ayahStart === 1
          }
        ],
        fullTextPlain: sanitizeAyahText(thumun.ayahText)
      };
    }
  }

  // Flatten all ayahs in this Hizb
  const allHizbAyahs: ThumunAyahItem[] = [];
  (hizbData.surahs || []).forEach((surahObj: any) => {
    const rawSurahName = surahObj.name?.replace(/^سورة\s+/, '') || thumun.surahName;
    (surahObj.ayahs || []).forEach((a: any) => {
      const sNum = parseInt(a.surah || surahObj.surah || '0', 10);
      allHizbAyahs.push({
        id: a.id || (sNum * 1000 + a.number),
        surahNumber: sNum,
        surahName: rawSurahName,
        numberInSurah: a.number,
        text: sanitizeAyahText(a.text),
        isFirstInSurah: a.number === 1
      });
    });
  });

  const hizbConfig = ALL_AHZAB[hizbNum - 1];
  const currIndexInHizb = thumun.thumunInHizb - 1; // 0 to 7
  const nextThumun = hizbConfig?.thumuns[currIndexInHizb + 1];

  // Find start index
  let startIndex = allHizbAyahs.findIndex(
    a => a.surahNumber === thumun.surahNumber && a.numberInSurah === thumun.ayahStart
  );

  if (startIndex === -1) {
    // Fuzzy search if surah number or ayah shifted
    startIndex = allHizbAyahs.findIndex(a => a.surahNumber === thumun.surahNumber);
    if (startIndex === -1) startIndex = 0;
  }

  // Find end index
  let endIndex = allHizbAyahs.length;
  if (nextThumun) {
    const foundNext = allHizbAyahs.findIndex(
      (a, idx) =>
        idx > startIndex &&
        a.surahNumber === nextThumun.surahNumber &&
        a.numberInSurah === nextThumun.ayahStart
    );
    if (foundNext !== -1) {
      endIndex = foundNext;
    }
  }

  const selectedAyahs = allHizbAyahs.slice(startIndex, endIndex);

  // Extract unique surahs involved
  const surahsSet = new Set<string>();
  selectedAyahs.forEach(a => surahsSet.add(a.surahName));

  const fullTextPlain = selectedAyahs.map(a => a.text).join(' ');

  return {
    thumunId: thumun.id,
    hizbNumber: thumun.hizbNumber,
    thumunInHizb: thumun.thumunInHizb,
    label: thumun.label,
    surahs: Array.from(surahsSet),
    ayahs: selectedAyahs,
    fullTextPlain
  };
}
