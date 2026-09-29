import React, { useState, useMemo } from 'react';
import { 
  X, 
  Award, 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  Sparkles,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { ALL_AHZAB } from '../data/warshAhzab';
import { ThumunItem } from '../types/quran';

interface QuizModalProps {
  onClose: () => void;
  onOpenThumun: (thumun: ThumunItem) => void;
}

interface Question {
  id: number;
  questionText: string;
  subtext: string;
  options: { text: string; isCorrect: boolean }[];
  explanation: string;
  thumun: ThumunItem;
}

export const QuizModal: React.FC<QuizModalProps> = ({ onClose, onOpenThumun }) => {
  const [activeTab, setActiveTab] = useState<'quiz' | 'flashcard'>('quiz');
  
  const allThumuns = useMemo(() => {
    const list: ThumunItem[] = [];
    ALL_AHZAB.forEach(h => {
      h.thumuns.forEach(t => list.push(t));
    });
    return list;
  }, []);

  function generateQuestions(thumunsList: ThumunItem[]): Question[] {
    const result: Question[] = [];
    const indices = new Set<number>();
    while (indices.size < 5) {
      indices.add(Math.floor(Math.random() * thumunsList.length));
    }

    const idxArray = Array.from(indices);
    idxArray.forEach((idx, qIdx) => {
      const thumun = thumunsList[idx];
      const nextThumun = thumunsList[idx + 1] || thumunsList[0];

      if (qIdx % 2 === 0) {
        const correctAnswer = `سورة ${thumun.surahName} · الحزب ${thumun.hizbNumber}`;
        const wrongOpts: string[] = [];
        while (wrongOpts.length < 3) {
          const rand = thumunsList[Math.floor(Math.random() * thumunsList.length)];
          const optStr = `سورة ${rand.surahName} · الحزب ${rand.hizbNumber}`;
          if (optStr !== correctAnswer && !wrongOpts.includes(optStr)) {
            wrongOpts.push(optStr);
          }
        }

        const options = [
          { text: correctAnswer, isCorrect: true },
          ...wrongOpts.map(w => ({ text: w, isCorrect: false }))
        ].sort(() => Math.random() - 0.5);

        result.push({
          id: qIdx,
          questionText: `أين يقع هذا الثمن برواية ورش؟`,
          subtext: thumun.ayahText,
          options,
          explanation: `هذا ${thumun.label}، يبدأ من الآية ${thumun.ayahStart} من سورة ${thumun.surahName} في الحزب ${thumun.hizbNumber} (الجزء ${thumun.juzNumber}).`,
          thumun
        });
      } else {
        const correctAnswer = nextThumun.ayahText;
        const wrongOpts: string[] = [];
        while (wrongOpts.length < 3) {
          const rand = thumunsList[Math.floor(Math.random() * thumunsList.length)];
          if (rand.id !== nextThumun.id && !wrongOpts.includes(rand.ayahText)) {
            wrongOpts.push(rand.ayahText);
          }
        }

        const options = [
          { text: correctAnswer, isCorrect: true },
          ...wrongOpts.map(w => ({ text: w, isCorrect: false }))
        ].sort(() => Math.random() - 0.5);

        result.push({
          id: qIdx,
          questionText: `ما هو الثمن التالي مباشرة لهذا الثمن؟`,
          subtext: thumun.ayahText,
          options,
          explanation: `الثمن التالي هو ${nextThumun.label} من سورة ${nextThumun.surahName} (الحزب ${nextThumun.hizbNumber}).`,
          thumun
        });
      }
    });

    return result;
  }

  const [questions, setQuestions] = useState<Question[]>(() => generateQuestions(allThumuns));
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const [cardIndex, setCardIndex] = useState(0);
  const [isCardFlipped, setIsCardFlipped] = useState(false);

  const handleSelectOption = (optIdx: number) => {
    if (isAnswered) return;
    setSelectedOption(optIdx);
    setIsAnswered(true);
    if (questions[currentQIndex].options[optIdx].isCorrect) {
      setScore(prev => prev + 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentQIndex < questions.length - 1) {
      setCurrentQIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setIsFinished(true);
    }
  };

  const restartQuiz = () => {
    setQuestions(generateQuestions(allThumuns));
    setCurrentQIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setIsFinished(false);
  };

  const currentQ = questions[currentQIndex];
  const currentCard = allThumuns[cardIndex];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl bg-slate-900 border border-amber-900/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-950/60 border border-amber-500/40 text-amber-300 font-bold flex items-center justify-center">
              <Award className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-base sm:text-lg">
                اختبار تثبيت الأثمان والمطالع
              </h3>
              <p className="text-xs text-slate-400">
                اختبر دقة حفظك لمطالع الأثمان وأرقام الأحزاب برواية ورش
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-xl text-xs">
              <button
                onClick={() => setActiveTab('quiz')}
                className={`px-3 py-1 rounded-lg font-medium cursor-pointer transition ${
                  activeTab === 'quiz' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400'
                }`}
              >
                اختبار سريع
              </button>
              <button
                onClick={() => setActiveTab('flashcard')}
                className={`px-3 py-1 rounded-lg font-medium cursor-pointer transition ${
                  activeTab === 'flashcard' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400'
                }`}
              >
                بطاقات استذكار
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-400 hover:text-slate-100 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {activeTab === 'quiz' ? (
            !isFinished ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>السؤال {currentQIndex + 1} من {questions.length}</span>
                  <span className="font-semibold text-amber-400">النتيجة الحالية: {score}</span>
                </div>

                <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                  <h4 className="text-sm font-semibold text-amber-300">
                    {currentQ.questionText}
                  </h4>

                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800/80 text-center">
                    <p className="font-['Amiri'] sm:font-['Scheherazade_New'] text-xl sm:text-2xl text-slate-100 font-bold leading-relaxed">
                      {currentQ.subtext}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2.5">
                  {currentQ.options.map((opt, oIdx) => {
                    let optStyle = 'bg-slate-950/60 border-slate-800 hover:bg-slate-800/50 text-slate-200';
                    
                    if (isAnswered) {
                      if (opt.isCorrect) {
                        optStyle = 'bg-emerald-950/80 border-emerald-500 text-emerald-200 font-bold ring-1 ring-emerald-500';
                      } else if (selectedOption === oIdx) {
                        optStyle = 'bg-rose-950/80 border-rose-500 text-rose-200 font-bold ring-1 ring-rose-500';
                      } else {
                        optStyle = 'opacity-40 border-slate-800';
                      }
                    }

                    return (
                      <button
                        key={oIdx}
                        onClick={() => handleSelectOption(oIdx)}
                        disabled={isAnswered}
                        className={`p-4 rounded-xl border text-right text-xs sm:text-sm transition flex items-center justify-between cursor-pointer ${optStyle}`}
                      >
                        <span className="font-medium font-['Scheherazade_New'] text-base sm:text-lg">{opt.text}</span>
                        {isAnswered && opt.isCorrect && (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mr-2" />
                        )}
                        {isAnswered && selectedOption === oIdx && !opt.isCorrect && (
                          <XCircle className="w-5 h-5 text-rose-400 shrink-0 mr-2" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {isAnswered && (
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 animate-in fade-in duration-200">
                    <p className="text-xs text-slate-300 leading-relaxed">
                      💡 <span className="font-semibold">التوضيح: </span>
                      {currentQ.explanation}
                    </p>

                    <div className="flex items-center justify-between pt-2">
                      <button
                        onClick={() => onOpenThumun(currentQ.thumun)}
                        className="text-xs text-emerald-400 hover:underline cursor-pointer"
                      >
                        عرض بطاقة هذا الثمن بالتفصيل
                      </button>

                      <button
                        onClick={handleNextQuestion}
                        className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition cursor-pointer"
                      >
                        {currentQIndex === questions.length - 1 ? 'عرض النتيجة النهائية' : 'السؤال التالي'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-8 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center mx-auto">
                  <Sparkles className="w-8 h-8 text-amber-400" />
                </div>

                <h4 className="text-xl font-bold text-slate-100">
                  اكتمل الاختبار بنجاح!
                </h4>

                <p className="text-sm text-slate-300">
                  لقد حصلت على <span className="font-black text-amber-400 text-lg font-mono">{score}</span> من أصل <span className="font-bold">{questions.length}</span> إجابات صحيحة.
                </p>

                <div className="pt-4 flex items-center justify-center gap-3">
                  <button
                    onClick={restartQuiz}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>إعادة الاختبار بأسئلة جديدة</span>
                  </button>

                  <button
                    onClick={onClose}
                    className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition cursor-pointer"
                  >
                    العودة للمصحف
                  </button>
                </div>
              </div>
            )
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>بطاقة استذكار {cardIndex + 1} من {allThumuns.length}</span>
                <span className="text-teal-400 font-medium">{currentCard.label} · الحزب {currentCard.hizbNumber}</span>
              </div>

              <div 
                onClick={() => setIsCardFlipped(!isCardFlipped)}
                className="p-8 rounded-3xl bg-gradient-to-b from-slate-950 to-slate-900 border border-slate-700 hover:border-amber-500/50 cursor-pointer min-h-[220px] flex flex-col items-center justify-center text-center space-y-4 transition-all shadow-xl select-none"
              >
                {!isCardFlipped ? (
                  <>
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">
                      وجه البطاقة (انقر لكشف التفاصيل)
                    </span>
                    <p className="font-['Amiri'] sm:font-['Scheherazade_New'] text-2xl sm:text-3xl text-slate-100 font-bold leading-relaxed">
                      {currentCard.ayahText}
                    </p>
                    <span className="text-xs text-slate-500">
                      خمّن السورة، الآية، ورقم الحزب ثم انقر
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">
                      تفاصيل الثمن
                    </span>
                    <div className="space-y-2">
                      <h5 className="text-lg font-bold text-slate-100">
                        سورة {currentCard.surahName} (الآية {currentCard.ayahStart})
                      </h5>
                      <p className="text-sm text-slate-300">
                        {currentCard.label} · الحزب {currentCard.hizbNumber} · الجزء {currentCard.juzNumber}
                      </p>
                      {currentCard.warshNote && (
                        <p className="text-xs text-amber-300/80 pt-2 border-t border-slate-800">
                          {currentCard.warshNote}
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>

              <div className="flex items-center justify-between">
                <button
                  onClick={() => {
                    setCardIndex(prev => (prev > 0 ? prev - 1 : allThumuns.length - 1));
                    setIsCardFlipped(false);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                  <span>الثمن السابق</span>
                </button>

                <button
                  onClick={() => {
                    const rand = Math.floor(Math.random() * allThumuns.length);
                    setCardIndex(rand);
                    setIsCardFlipped(false);
                  }}
                  className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-amber-400 font-medium transition cursor-pointer"
                >
                  بطاقة عشوائية
                </button>

                <button
                  onClick={() => {
                    setCardIndex(prev => (prev < allThumuns.length - 1 ? prev + 1 : 0));
                    setIsCardFlipped(false);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition cursor-pointer"
                >
                  <span>الثمن التالي</span>
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
