/**
 * محرك فحص وتصحيح التسميع القرآني برواية ورش عن نافع
 * يقوم بمقارنة دقيقة كلمة بكلمة بين تلاوة القارئ والنص القرآني المعتمد
 * يكتشف: الكلمات الناقصة، الزائدة، المستبدلة، وترتيب الآيات
 */

export interface RecitedWordDiff {
  canonicalWord: string;
  recitedWord?: string;
  status: 'correct' | 'missing' | 'replaced' | 'extra';
  ayahNumber?: number;
  surahName?: string;
}

export interface RecitationAnalysisResult {
  accuracyPercent: number;
  totalWords: number;
  correctWords: number;
  missingWordsCount: number;
  replacedWordsCount: number;
  extraWordsCount: number;
  wordsDiff: RecitedWordDiff[];
  verseOrderErrors: string[];
  feedbackSummary: string;
  ratingLabel: string;
  ratingColor: string;
}

/**
 * تنظيف وتطبيع النص القرآني لأغراض المقارنة الصوتية
 * إزالة التشكيل، علامات الوقف، توحيد الألفات والهمزات، والتاء المربوطة
 */
export function normalizeForSpeechDiff(text: string): string {
  if (!text) return '';
  return text
    // إزالة التشكيل وحركات الإعراب وعلامات الضبط
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '')
    // إزالة علامات ترقيم الآيات والأقواس
    .replace(/[﴾﴿()[\]{}0-9\u0660-\u0669.,:;!؟۞]/g, ' ')
    // توحيد الألفات (همزة وصل، قطع، مد)
    .replace(/[إأآٱ]/g, 'ا')
    // توحيد التاء المربوطة والهاء في أواخر الكلمات للتعرف الصوتي
    .replace(/ة\b/g, 'ه')
    // توحيد الياء والألف المقصورة
    .replace(/ى\b/g, 'ي')
    // توحيد الواو والياء المهموزتين
    .replace(/[ؤئ]/g, 'ء')
    // توحيد المسافات
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/**
 * إزالة التكرارات المزدوجة المتتالية الناتجة عن ميكروفون المتصفح أو تداخل أجزاء الصوت
 * تقوم بفحص وتصفية الكلمات المكررة فورياً والعبارات المتكررة (من كلمتين إلى 8 كلمات)
 */
export function deduplicateConsecutiveWords(text: string): string {
  if (!text) return '';
  const words = text.trim().split(/\s+/).filter(w => w.length > 0);
  if (words.length <= 1) return text.trim();

  // 1. إزالة الكلمات المفردة المكررة فوراً (مثل: "الدين الدين")
  const singleCleaned: string[] = [];
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    if (singleCleaned.length > 0 && normalizeForSpeechDiff(singleCleaned[singleCleaned.length - 1]) === normalizeForSpeechDiff(w)) {
      continue;
    }
    singleCleaned.push(w);
  }

  // 2. إزالة العبارات والآيات المكررة المتتالية (من 8 كلمات نزولاً إلى كلمتين)
  let phraseWords = [...singleCleaned];
  for (let phraseLen = 8; phraseLen >= 2; phraseLen--) {
    const cleaned: string[] = [];
    let i = 0;
    while (i < phraseWords.length) {
      if (i + 2 * phraseLen <= phraseWords.length) {
        const p1 = phraseWords.slice(i, i + phraseLen).map(w => normalizeForSpeechDiff(w)).join(' ');
        const p2 = phraseWords.slice(i + phraseLen, i + 2 * phraseLen).map(w => normalizeForSpeechDiff(w)).join(' ');
        if (p1 === p2) {
          cleaned.push(...phraseWords.slice(i, i + phraseLen));
          i += 2 * phraseLen;
          continue;
        }
      }
      cleaned.push(phraseWords[i]);
      i++;
    }
    phraseWords = cleaned;
  }

  return phraseWords.join(' ');
}

/**
 * تقسيم النص إلى كلمات نظيفة مع الاحتفاظ بالنص الأصلي
 */
export function tokenizeText(text: string): { original: string; normalized: string }[] {
  const cleaned = deduplicateConsecutiveWords(text);
  const rawWords = cleaned.trim().split(/\s+/).filter(w => w.length > 0);
  return rawWords.map(w => ({
    original: w,
    normalized: normalizeForSpeechDiff(w)
  })).filter(w => w.normalized.length > 0);
}

/**
 * حساب مصفوفة المسافات (Levenshtein) بين كلمتين مفردتين
 */
function wordSimilarity(word1: string, word2: string): number {
  if (word1 === word2) return 1.0;
  // في ورش: ملك / مالك
  if ((word1 === 'ملك' && word2 === 'مالك') || (word1 === 'مالك' && word2 === 'ملك')) return 0.95;
  // الرحمن / الرحمان
  if ((word1 === 'الرحمن' && word2 === 'الرحمان') || (word1 === 'الرحمان' && word2 === 'الرحمن')) return 1.0;

  const len1 = word1.length;
  const len2 = word2.length;
  if (Math.abs(len1 - len2) > 3) return 0.0;

  const matrix: number[][] = [];
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = word1[i - 1] === word2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  const dist = matrix[len1][len2];
  const maxLen = Math.max(len1, len2);
  return maxLen === 0 ? 1.0 : (1.0 - dist / maxLen);
}

/**
 * المقارنة التحليلية الشاملة بين النص القرآني المعتمد والمسموع
 * تعتمد خوارزمية المحاذاة العالمية (Needleman-Wunsch) لمنع تضاعف الآيات أو اختلال ترتيبها
 */
export function analyzeRecitation(
  canonicalAyahs: { numberInSurah: number; surahName: string; text: string }[],
  recitedText: string
): RecitationAnalysisResult {
  // تجميع الكلمات الأصلية مع رقم الآية واسم السورة
  const canonicalTokens: { 
    original: string; 
    normalized: string; 
    ayahNumber: number; 
    surahName: string; 
  }[] = [];

  canonicalAyahs.forEach(ayah => {
    // إزالة أقواس وأرقام الآيات من النص
    const cleanAyahText = ayah.text.replace(/[\d\u0660-\u0669﴾﴿()]/g, '');
    const words = cleanAyahText.trim().split(/\s+/).filter(w => w.length > 0);
    words.forEach(w => {
      const norm = normalizeForSpeechDiff(w);
      if (norm) {
        canonicalTokens.push({
          original: w,
          normalized: norm,
          ayahNumber: ayah.numberInSurah,
          surahName: ayah.surahName
        });
      }
    });
  });

  const cleanedRecited = deduplicateConsecutiveWords(recitedText);
  const recitedTokens = tokenizeText(cleanedRecited);

  // خوارزمية المحاذاة المتسلسلة الدقيقة (Needleman-Wunsch Global Sequence Alignment)
  const n = canonicalTokens.length;
  const m = recitedTokens.length;

  const GAP_C = -2.0; // كلمة ناقصة من المصحف
  const GAP_R = -2.0; // كلمة زائدة

  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));

  for (let i = 0; i <= n; i++) dp[i][0] = i * GAP_C;
  for (let j = 0; j <= m; j++) dp[0][j] = j * GAP_R;

  for (let i = 1; i <= n; i++) {
    const cNorm = canonicalTokens[i - 1].normalized;
    for (let j = 1; j <= m; j++) {
      const rNorm = recitedTokens[j - 1].normalized;
      const sim = wordSimilarity(cNorm, rNorm);
      const matchScore = sim >= 0.82 ? (sim * 3.0) : -1.8;

      dp[i][j] = Math.max(
        dp[i - 1][j - 1] + matchScore,
        dp[i - 1][j] + GAP_C,
        dp[i][j - 1] + GAP_R
      );
    }
  }

  // التتبع العكسي لإعادة بناء تسلسل الكلمات المنظم بدون مضاعفة أو تداخل
  let i = n;
  let j = m;
  const diffs: RecitedWordDiff[] = [];

  let correctCount = 0;
  let missingCount = 0;
  let replacedCount = 0;
  let extraCount = 0;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0) {
      const cNorm = canonicalTokens[i - 1].normalized;
      const rNorm = recitedTokens[j - 1].normalized;
      const sim = wordSimilarity(cNorm, rNorm);
      const matchScore = sim >= 0.82 ? (sim * 3.0) : -1.8;

      if (Math.abs(dp[i][j] - (dp[i - 1][j - 1] + matchScore)) < 0.001) {
        if (sim >= 0.82) {
          diffs.unshift({
            canonicalWord: canonicalTokens[i - 1].original,
            recitedWord: recitedTokens[j - 1].original,
            status: 'correct',
            ayahNumber: canonicalTokens[i - 1].ayahNumber,
            surahName: canonicalTokens[i - 1].surahName
          });
          correctCount++;
        } else {
          diffs.unshift({
            canonicalWord: canonicalTokens[i - 1].original,
            recitedWord: recitedTokens[j - 1].original,
            status: 'replaced',
            ayahNumber: canonicalTokens[i - 1].ayahNumber,
            surahName: canonicalTokens[i - 1].surahName
          });
          replacedCount++;
        }
        i--;
        j--;
        continue;
      }
    }

    if (i > 0 && (j === 0 || Math.abs(dp[i][j] - (dp[i - 1][j] + GAP_C)) < 0.001)) {
      diffs.unshift({
        canonicalWord: canonicalTokens[i - 1].original,
        status: 'missing',
        ayahNumber: canonicalTokens[i - 1].ayahNumber,
        surahName: canonicalTokens[i - 1].surahName
      });
      missingCount++;
      i--;
    } else {
      diffs.unshift({
        canonicalWord: '',
        recitedWord: recitedTokens[j - 1].original,
        status: 'extra'
      });
      extraCount++;
      j--;
    }
  }

  const totalWords = canonicalTokens.length;
  // نسبة الإتقان
  const scoreNumerator = Math.max(0, correctCount - (extraCount * 0.5));
  const accuracyPercent = totalWords > 0 
    ? Math.min(100, Math.max(0, Math.round((scoreNumerator / totalWords) * 100)))
    : 0;

  // فحص ترتيب الآيات
  const verseOrderErrors: string[] = [];
  let lastSeenAyah = 0;
  diffs.forEach(d => {
    if (d.status === 'correct' && d.ayahNumber) {
      if (d.ayahNumber < lastSeenAyah && Math.abs(d.ayahNumber - lastSeenAyah) > 1) {
        const errorMsg = `انتقال غير مرتب: الآية ${d.ayahNumber} تليت بعد الآية ${lastSeenAyah} في ${d.surahName}`;
        if (!verseOrderErrors.includes(errorMsg)) {
          verseOrderErrors.push(errorMsg);
        }
      }
      lastSeenAyah = d.ayahNumber;
    }
  });

  // التقييم والتعليق التربوي
  let ratingLabel = 'يحتاج إلى مراجعة وتكرار';
  let ratingColor = 'text-amber-400';
  let feedbackSummary = 'استمر في التكرار والاستماع للمقرئ لإتقان الثمن.';

  if (accuracyPercent >= 95) {
    ratingLabel = 'إتقان ممتاز وراسخ 🌟';
    ratingColor = 'text-emerald-400';
    feedbackSummary = 'ما شاء الله تبارك الله! تلاوة محكمة ومتقنة برواية ورش عن نافع.';
  } else if (accuracyPercent >= 85) {
    ratingLabel = 'حفظ جيد جداً 👍';
    ratingColor = 'text-teal-400';
    feedbackSummary = 'أداء طيب ومتقارب مع المصحف، راجع فقط الكلمات المحددة باللونين الأحمر والبرتقالي.';
  } else if (accuracyPercent >= 70) {
    ratingLabel = 'حفظ متوسط يحتاج تثبيتاً 📖';
    ratingColor = 'text-amber-400';
    feedbackSummary = 'انتبه للكلمات المستبدلة أو الناقصة، وكرر الثمن 10 مرات في عداد التكرار.';
  } else {
    ratingLabel = 'يحتاج إلى إعادة مدارسة ✍️';
    ratingColor = 'text-rose-400';
    feedbackSummary = 'توجد فوارق في النص المسجل مقارنة بالثمن المعتمد، استمع للشيخ الحصري أو العيون الكوشي ثم أعد المحاولة.';
  }

  return {
    accuracyPercent,
    totalWords,
    correctWords: correctCount,
    missingWordsCount: missingCount,
    replacedWordsCount: replacedCount,
    extraWordsCount: extraCount,
    wordsDiff: diffs,
    verseOrderErrors,
    feedbackSummary,
    ratingLabel,
    ratingColor
  };
}

/**
 * محرك المحاذاة الدقيقة المباشرة (Strict Word-for-Word Alignment & Verifier Engine)
 * يطابق الكلمات بدقة صارمة دون تخمين أو تكملة، ويحدد موضع الخطأ فوراً
 */
export interface AlignmentEngineError {
  type: 'MISSED_WORD' | 'WRONG_WORD' | 'SIMILARITY_JUMP';
  expected: string;
  spoken: string;
  index: number;
}

export interface AlignmentEngineOutput {
  status: 'correct' | 'error' | 'incomplete';
  matched_words_count: number;
  last_matched_word_index: number;
  current_ayah_number: number;
  repetition_detected: boolean;
  errors: AlignmentEngineError[];
  revealed_text: string;
}

export function evaluateRecitationAlignment(
  targetText: string,
  userAudioTranscription: string,
  currentAyahNumber: number = 1
): AlignmentEngineOutput {
  if (!targetText || targetText.trim().length === 0) {
    return {
      status: 'incomplete',
      matched_words_count: 0,
      last_matched_word_index: -1,
      current_ayah_number: currentAyahNumber,
      repetition_detected: false,
      errors: [],
      revealed_text: ''
    };
  }

  // 1. استخراج وتطبيع الكلمات
  const rawTargetWords = targetText.trim().split(/\s+/).filter(w => w.length > 0);
  const targetWordsNorm = rawTargetWords.map(w => normalizeForSpeechDiff(w));

  const rawSpokenWords = userAudioTranscription ? userAudioTranscription.trim().split(/\s+/).filter(w => w.length > 0) : [];
  const spokenWordsNorm = rawSpokenWords.map(w => normalizeForSpeechDiff(w));

  if (spokenWordsNorm.length === 0) {
    return {
      status: 'incomplete',
      matched_words_count: 0,
      last_matched_word_index: -1,
      current_ayah_number: currentAyahNumber,
      repetition_detected: false,
      errors: [],
      revealed_text: ''
    };
  }

  // فحص التكرار اللحظي (Repetition)
  let repetitionDetected = false;
  for (let i = 1; i < spokenWordsNorm.length; i++) {
    if (spokenWordsNorm[i] === spokenWordsNorm[i - 1]) {
      repetitionDetected = true;
      break;
    }
  }

  let matchedCount = 0;
  let lastMatchedIndex = -1;
  const errors: AlignmentEngineError[] = [];

  // 2. مقارنة تسلسلية كلمة بكلمة
  for (let idx = 0; idx < spokenWordsNorm.length; idx++) {
    const spoken = spokenWordsNorm[idx];
    const expected = targetWordsNorm[idx];

    if (idx >= targetWordsNorm.length) {
      // كلام زائد بعد نهاية النص
      errors.push({
        type: 'WRONG_WORD',
        expected: '',
        spoken: rawSpokenWords[idx],
        index: idx
      });
      break;
    }

    const sim = wordSimilarity(spoken, expected);
    if (sim >= 0.85 || spoken === expected) {
      matchedCount++;
      lastMatchedIndex = idx;
    } else {
      // فحص هل قفز القارئ كلمة (MISSED_WORD)
      if (idx + 1 < targetWordsNorm.length && (targetWordsNorm[idx + 1] === spoken || wordSimilarity(spoken, targetWordsNorm[idx + 1]) >= 0.85)) {
        errors.push({
          type: 'MISSED_WORD',
          expected: rawTargetWords[idx],
          spoken: rawSpokenWords[idx],
          index: idx
        });
      } else {
        // فحص قفز تشابه أكبر (SIMILARITY_JUMP)
        const jumpIdx = targetWordsNorm.slice(idx + 2, idx + 8).indexOf(spoken);
        if (jumpIdx !== -1) {
          errors.push({
            type: 'SIMILARITY_JUMP',
            expected: rawTargetWords[idx],
            spoken: rawSpokenWords[idx],
            index: idx
          });
        } else {
          errors.push({
            type: 'WRONG_WORD',
            expected: rawTargetWords[idx],
            spoken: rawSpokenWords[idx],
            index: idx
          });
        }
      }
      break; // التوقف عند أول خطأ للمحاذاة الفورية
    }
  }

  let status: 'correct' | 'error' | 'incomplete' = 'incomplete';
  if (errors.length > 0) {
    status = 'error';
  } else if (matchedCount === targetWordsNorm.length) {
    status = 'correct';
  } else {
    status = 'incomplete';
  }

  const revealedWords = lastMatchedIndex >= 0 ? rawTargetWords.slice(0, lastMatchedIndex + 1) : [];

  return {
    status,
    matched_words_count: matchedCount,
    last_matched_word_index: lastMatchedIndex,
    current_ayah_number: currentAyahNumber,
    repetition_detected: repetitionDetected,
    errors,
    revealed_text: revealedWords.join(' ')
  };
}
