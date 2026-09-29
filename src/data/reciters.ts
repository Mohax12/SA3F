export interface ReciterOption {
  id: string;
  name: string;
  subtext: string;
  audioServer: string;
}

export const WARSH_RECITERS: ReciterOption[] = [
  {
    id: 'hussary_warsh',
    name: 'الشيخ محمود خليل الحصري',
    subtext: 'المصحف المرتل برواية ورش عن نافع بطريق الأزرق',
    audioServer: 'https://server13.mp3quran.net/husr/Rewayat-Warsh-A-n-Nafi/'
  },
  {
    id: 'kouchi_warsh',
    name: 'الشيخ العيون الكوشي',
    subtext: 'رواية ورش عن نافع (المغرب الأقصى)',
    audioServer: 'https://server11.mp3quran.net/koshi/'
  },
  {
    id: 'qazabri_warsh',
    name: 'الشيخ عمر القزابري',
    subtext: 'رواية ورش عن نافع (مسجد الحسن الثاني)',
    audioServer: 'https://server9.mp3quran.net/omar_warsh/'
  },
  {
    id: 'basit_warsh',
    name: 'الشيخ عبد الباسط عبد الصمد',
    subtext: 'المصحف المرتل برواية ورش عن نافع',
    audioServer: 'https://server7.mp3quran.net/basit/Rewayat-Warsh-A-n-Nafi/'
  },
  {
    id: 'yassin_warsh',
    name: 'القارئ ياسين الجزائري',
    subtext: 'رواية ورش عن نافع (الجزائر)',
    audioServer: 'https://server11.mp3quran.net/qari/'
  },
  {
    id: 'benkirane_warsh',
    name: 'الشيخ عبد المجيب بنكيران',
    subtext: 'رواية ورش عن نافع بطريق الأزرق (المغرب)',
    audioServer: 'https://server16.mp3quran.net/A-Benkirane/Rewayat-Warsh-A-n-Nafi/'
  }
];

export function getSurahAudioUrl(audioServer: string, surahNum: number): string {
  const pad = String(surahNum).padStart(3, '0');
  return `${audioServer}${pad}.mp3`;
}

