import React, { useState, useEffect } from 'react';
import { 
  X, 
  Trophy, 
  Flame, 
  Users, 
  CheckCircle2, 
  Sparkles, 
  Award, 
  Heart, 
  Share2, 
  Plus, 
  Target, 
  Zap,
  MessageSquare,
  Send,
  UserPlus,
  Trash2,
  BookOpen,
  MapPin
} from 'lucide-react';
import { UserProgressData } from '../types/quran';

interface ChallengesModalProps {
  onClose: () => void;
  progress: UserProgressData;
  onSelectThumunDirectly?: (thumunId: number) => void;
  isDark?: boolean;
}

export interface EnrolledParticipant {
  id: string;
  name: string;
  location: string;
  targetHizb: string;
  dailyGoal: string;
  hizbCount: number;
  thumunCount: number;
  joinedAt: string;
  likes: number;
  isCurrentUser?: boolean;
}

export interface CircleMessage {
  id: string;
  senderName: string;
  senderLocation: string;
  content: string;
  category: 'motivation' | 'question' | 'partner' | 'general';
  createdAt: string;
  likes: number;
}

interface ChallengeItem {
  id: string;
  title: string;
  desc: string;
  category: 'daily' | 'weekly' | 'sprint';
  target: number;
  current: number;
  unit: string;
  rewardBadge: string;
  isCompleted: boolean;
}

export const ChallengesModal: React.FC<ChallengesModalProps> = ({
  onClose,
  progress,
  isDark = true
}) => {
  const [activeTab, setActiveTab] = useState<'challenges' | 'leaderboard' | 'chat'>('leaderboard');
  
  // Enrolled participants - starts completely EMPTY as requested by user
  const [participants, setParticipants] = useState<EnrolledParticipant[]>(() => {
    try {
      const saved = localStorage.getItem('warsh_enrolled_participants');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Messages between participants
  const [messages, setMessages] = useState<CircleMessage[]>(() => {
    try {
      const saved = localStorage.getItem('warsh_circle_messages');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // New Participant Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newTargetHizb, setNewTargetHizb] = useState('الحزب 1');
  const [newDailyGoal, setNewDailyGoal] = useState('ثمن واحد يومياً مع 20 تكراراً');
  const [formError, setFormError] = useState('');

  // New Chat Message State
  const [chatSender, setChatSender] = useState('');
  const [chatContent, setChatContent] = useState('');
  const [chatCategory, setChatCategory] = useState<'motivation' | 'question' | 'partner' | 'general'>('motivation');
  const [encouragedMap, setEncouragedMap] = useState<Record<string, boolean>>({});
  const [likedMessagesMap, setLikedMessagesMap] = useState<Record<string, boolean>>({});

  // Sync participants to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('warsh_enrolled_participants', JSON.stringify(participants));
    } catch (e) {
      console.warn('Could not save participants:', e);
    }
  }, [participants]);

  // Sync messages to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('warsh_circle_messages', JSON.stringify(messages));
    } catch (e) {
      console.warn('Could not save messages:', e);
    }
  }, [messages]);

  // Calculate current user progress
  let userMastered = 0;
  let userMemorized = 0;
  let userTotalRepeats = 0;
  Object.values(progress.thumuns).forEach(p => {
    if (p.status === 'mastered') userMastered++;
    else if (p.status === 'memorized') userMemorized++;
    userTotalRepeats += p.repeatCount || 0;
  });
  const userDoneThumuns = userMastered + userMemorized;
  const userDoneHizbs = Math.floor(userDoneThumuns / 8);

  const challengesList: ChallengeItem[] = [
    {
      id: 'c1',
      title: 'تحدي اليوم: إتقان ثمن جديد وتثبيت سابقه',
      desc: 'احفظ ثمناً واحداً اليوم وكرره 15 مرة على طريقة اللوح لتثبيته في الذاكرة.',
      category: 'daily',
      target: 1,
      current: Math.min(1, userDoneThumuns > 0 ? 1 : 0),
      unit: 'ثمن',
      rewardBadge: 'وسام الورد اليومي',
      isCompleted: userDoneThumuns >= 1
    },
    {
      id: 'c2',
      title: 'تحدي الأسبوع: إتمام حزب كامل (8 أثمان متتالية)',
      desc: 'أكمل حفظ ومراجعة حزب كامل متصلاً (8 أثمان) برواية ورش عن نافع.',
      category: 'weekly',
      target: 8,
      current: Math.min(8, userDoneThumuns),
      unit: 'أثمان',
      rewardBadge: 'وسام الحزب المكتمل',
      isCompleted: userDoneThumuns >= 8
    },
    {
      id: 'c3',
      title: 'تحدي اللوح الشنقيطي: 40 تكراراً لتثبيت الأثمان',
      desc: 'استخدم عداد التكرار للوصول إلى 40 تكراراً في دراسة وتثبيت الأثمان.',
      category: 'sprint',
      target: 40,
      current: Math.min(40, userTotalRepeats),
      unit: 'تكرار',
      rewardBadge: 'وسام محارب النسيان',
      isCompleted: userTotalRepeats >= 40
    },
    {
      id: 'c4',
      title: 'تحدي سورة البقرة الكبرى (الأحزاب الخمسة الأولى)',
      desc: 'إتمام 40 ثمناً كاملة من سورة الفاتحة والبقرة بإتقان تام مع المتشابهات.',
      category: 'sprint',
      target: 40,
      current: Math.min(40, userDoneThumuns),
      unit: 'ثمناً',
      rewardBadge: 'تاج سنام القرآن',
      isCompleted: userDoneThumuns >= 40
    }
  ];

  // Handle Registering a New Participant
  const handleEnrollParticipant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      setFormError('يرجى إدخال اسم المنخرط');
      return;
    }

    const newParticipant: EnrolledParticipant = {
      id: `p_${Date.now()}`,
      name: newName.trim(),
      location: newLocation.trim() || 'المغرب العربي',
      targetHizb: newTargetHizb.trim() || 'الحزب 1',
      dailyGoal: newDailyGoal.trim() || 'ثمن يومياً',
      hizbCount: userDoneHizbs,
      thumunCount: userDoneThumuns,
      joinedAt: new Date().toLocaleDateString('ar-MA', { month: 'short', day: 'numeric' }),
      likes: 1
    };

    setParticipants(prev => [newParticipant, ...prev]);
    setChatSender(newParticipant.name);
    setNewName('');
    setNewLocation('');
    setFormError('');
    setShowAddForm(false);
  };

  const handleDeleteParticipant = (id: string) => {
    setParticipants(prev => prev.filter(p => p.id !== id));
  };

  const handleEncourageParticipant = (id: string) => {
    if (encouragedMap[id]) return;
    setEncouragedMap(prev => ({ ...prev, [id]: true }));
    setParticipants(prev => prev.map(p => p.id === id ? { ...p, likes: p.likes + 1 } : p));
  };

  // Handle Posting a Message in Discussion
  const handlePostMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatContent.trim()) return;

    const sender = chatSender.trim() || (participants[0]?.name || 'متحدٍ في حفظ القرآن');
    const senderLoc = participants.find(p => p.name === sender)?.location || 'حلقة التثبيت';

    const newMsg: CircleMessage = {
      id: `msg_${Date.now()}`,
      senderName: sender,
      senderLocation: senderLoc,
      content: chatContent.trim(),
      category: chatCategory,
      createdAt: 'الآن',
      likes: 0
    };

    setMessages(prev => [newMsg, ...prev]);
    setChatContent('');
  };

  const handleLikeMessage = (id: string) => {
    if (likedMessagesMap[id]) return;
    setLikedMessagesMap(prev => ({ ...prev, [id]: true }));
    setMessages(prev => prev.map(m => m.id === id ? { ...m, likes: m.likes + 1 } : m));
  };

  const categoryLabels = {
    motivation: { label: 'فائدة وتشجيع 🌟', color: isDark ? 'text-amber-300 bg-amber-950/60 border-amber-600/40' : 'text-amber-800 bg-amber-50 border-amber-300' },
    question: { label: 'سؤال في رواية ورش 📖', color: isDark ? 'text-emerald-300 bg-emerald-950/60 border-emerald-600/40' : 'text-emerald-800 bg-emerald-50 border-emerald-300' },
    partner: { label: 'طلب رفيق تسميع 🤝', color: isDark ? 'text-teal-300 bg-teal-950/60 border-teal-600/40' : 'text-teal-800 bg-teal-50 border-teal-300' },
    general: { label: 'مدارسة عامة 💬', color: isDark ? 'text-blue-300 bg-blue-950/60 border-blue-600/40' : 'text-blue-800 bg-blue-50 border-blue-300' }
  };

  const modalBg = isDark ? 'bg-slate-900 border-emerald-900/60 text-slate-100' : 'bg-white border-slate-200 text-slate-800 shadow-2xl';
  const headerBg = isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200';
  const cardBg = isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50/80 border-slate-200';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className={`w-full max-w-3xl border rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] ${modalBg}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className={`p-4 sm:p-5 border-b flex items-center justify-between ${headerBg}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 text-slate-950 font-bold flex items-center justify-center shadow-lg shadow-amber-900/20 shrink-0">
              <Trophy className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg">
                  قسم التحديات والمنخرطين
                </h3>
                <span className="text-[11px] font-bold text-amber-500 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full">
                  حلقة ورش
                </span>
              </div>
              <p className="text-xs opacity-75">
                سجل اسمك في الحلقة، شارك في التحديات، وتواصل مع زملائك الحفاظ
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition cursor-pointer ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className={`flex items-center border-b px-4 sm:px-6 overflow-x-auto ${isDark ? 'border-slate-800 bg-slate-950/40' : 'border-slate-200 bg-slate-50/60'}`}>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`py-3 px-3 sm:px-4 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-2 transition cursor-pointer shrink-0 ${
              activeTab === 'leaderboard'
                ? 'border-amber-500 text-amber-500'
                : 'border-transparent opacity-60 hover:opacity-100'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>حلقة المنخرطين ({participants.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('chat')}
            className={`py-3 px-3 sm:px-4 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-2 transition cursor-pointer shrink-0 ${
              activeTab === 'chat'
                ? 'border-emerald-500 text-emerald-500'
                : 'border-transparent opacity-60 hover:opacity-100'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>مجلس التواصل والمذاكرة ({messages.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('challenges')}
            className={`py-3 px-3 sm:px-4 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-2 transition cursor-pointer shrink-0 ${
              activeTab === 'challenges'
                ? 'border-teal-500 text-teal-500'
                : 'border-transparent opacity-60 hover:opacity-100'
            }`}
          >
            <Target className="w-4 h-4" />
            <span>تحديات الهمة القرآنية</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* TAB 1: PARTICIPANTS LIST & REGISTRATION */}
          {activeTab === 'leaderboard' && (
            <div className="space-y-4">
              {/* Add New Participant Banner / Button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-teal-500/10 border border-amber-500/30">
                <div className="space-y-1">
                  <h4 className="text-sm font-bold flex items-center gap-2">
                    <UserPlus className="w-4 h-4 text-amber-500" />
                    <span>انضمام متحدٍ جديد لحلقة الحفظ</span>
                  </h4>
                  <p className="text-xs opacity-75">
                    أدخل اسمك الحقيقي ومدينتك ليظهر تقدمك ويعرفك زملاؤك في الحلقة.
                  </p>
                </div>

                <button
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition cursor-pointer shadow-md shrink-0 flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{showAddForm ? 'إلغاء' : 'تسجيل منخرط جديد'}</span>
                </button>
              </div>

              {/* Add Participant Form */}
              {showAddForm && (
                <form 
                  onSubmit={handleEnrollParticipant}
                  className={`p-4 sm:p-5 rounded-2xl border space-y-4 animate-in fade-in duration-200 ${cardBg}`}
                >
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-500">
                    استمارة تسجيل المتحدي
                  </h4>

                  {formError && (
                    <div className="p-2.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs">
                      {formError}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block mb-1 font-semibold">اسم المتحدي / الطالب:</label>
                      <input
                        type="text"
                        required
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="مثال: محمد الإدريسي"
                        className={`w-full p-2.5 rounded-xl border transition focus:outline-none focus:border-amber-500 ${isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-800'}`}
                      />
                    </div>

                    <div>
                      <label className="block mb-1 font-semibold">المدينة أو البلد:</label>
                      <input
                        type="text"
                        value={newLocation}
                        onChange={(e) => setNewLocation(e.target.value)}
                        placeholder="مثال: فاس، المغرب"
                        className={`w-full p-2.5 rounded-xl border transition focus:outline-none focus:border-amber-500 ${isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-800'}`}
                      />
                    </div>

                    <div>
                      <label className="block mb-1 font-semibold">الحزب المستهدف:</label>
                      <input
                        type="text"
                        value={newTargetHizb}
                        onChange={(e) => setNewTargetHizb(e.target.value)}
                        placeholder="مثال: الحزب 1 أو سورة البقرة"
                        className={`w-full p-2.5 rounded-xl border transition focus:outline-none focus:border-amber-500 ${isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-800'}`}
                      />
                    </div>

                    <div>
                      <label className="block mb-1 font-semibold">الورد اليومي:</label>
                      <input
                        type="text"
                        value={newDailyGoal}
                        onChange={(e) => setNewDailyGoal(e.target.value)}
                        placeholder="مثال: ثمن يومياً مع 20 تكراراً"
                        className={`w-full p-2.5 rounded-xl border transition focus:outline-none focus:border-amber-500 ${isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-800'}`}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className={`px-3 py-1.5 rounded-xl border text-xs cursor-pointer ${isDark ? 'border-slate-700 text-slate-400' : 'border-slate-300 text-slate-600'}`}
                    >
                      إلغاء
                    </button>

                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs transition cursor-pointer shadow-lg"
                    >
                      تأكيد الانضمام للحلقة
                    </button>
                  </div>
                </form>
              )}

              {/* Empty State when no participants */}
              {participants.length === 0 ? (
                <div className={`p-8 sm:p-12 text-center rounded-3xl border border-dashed space-y-4 ${cardBg}`}>
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-500 flex items-center justify-center mx-auto text-xl">
                    👥
                  </div>
                  <div className="space-y-1 max-w-md mx-auto">
                    <h4 className="text-base font-bold">لا يوجد منخرطون مسجلون بعد</h4>
                    <p className="text-xs opacity-75 leading-relaxed">
                      تم تفريغ القائمة لتتمكن من معرفة كل منخرط باسمه الحقيقي. اضغط على زر التسجيل أعلاه لتكون أول المنخرطين في حلقة الحفظ والتنافس!
                    </p>
                  </div>

                  <button
                    onClick={() => setShowAddForm(true)}
                    className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition cursor-pointer shadow-md inline-flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>سجل اسمك كأول متحدٍ الآن</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {participants.map((p, index) => {
                    const percent = Math.min(100, Math.round((p.thumunCount / 480) * 100));

                    return (
                      <div
                        key={p.id}
                        className={`p-3.5 sm:p-4 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${cardBg}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs font-mono shrink-0 border ${
                            index === 0
                              ? 'bg-amber-500 text-slate-950 border-amber-400'
                              : index === 1
                              ? 'bg-slate-300 text-slate-950 border-slate-200'
                              : 'bg-slate-800 text-slate-300 border-slate-700'
                          }`}>
                            {index + 1}
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-bold">
                                {p.name}
                              </h4>
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border border-amber-500/30 text-amber-500 bg-amber-500/10">
                                الهدف: {p.targetHizb}
                              </span>
                            </div>

                            <div className="flex items-center gap-3 text-xs opacity-75 pt-0.5">
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-slate-400" />
                                <span>{p.location}</span>
                              </span>
                              <span>·</span>
                              <span>الورد: {p.dailyGoal}</span>
                              <span>·</span>
                              <span>انضم: {p.joinedAt}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/40">
                          <div className="text-right">
                            <div className="text-xs font-bold">
                              <span className="text-emerald-500 font-mono text-sm">{p.hizbCount}</span> أحزاب ({p.thumunCount} ثمناً)
                            </div>
                            <div className="text-[11px] opacity-60 font-mono">
                              {percent}% من القرآن
                            </div>
                          </div>

                          {/* Encourage Button */}
                          <button
                            onClick={() => handleEncourageParticipant(p.id)}
                            disabled={encouragedMap[p.id]}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                              encouragedMap[p.id]
                                ? 'bg-amber-500/20 text-amber-500 border border-amber-500/40'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                            }`}
                            title="تشجيع زميلك في الحلقة بعبارة ما شاء الله"
                          >
                            <Heart className={`w-3.5 h-3.5 ${encouragedMap[p.id] ? 'fill-amber-500 text-amber-500' : ''}`} />
                            <span>{p.likes}</span>
                            <span className="hidden sm:inline">ما شاء الله</span>
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => handleDeleteParticipant(p.id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 transition cursor-pointer"
                            title="حذف هذا المنخرط"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: COMMUNICATION & DISCUSSION */}
          {activeTab === 'chat' && (
            <div className="space-y-4">
              {/* Message Composer Card */}
              <form 
                onSubmit={handlePostMessage}
                className={`p-4 rounded-2xl border space-y-3 ${cardBg}`}
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-500 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>كتابة رسالة أو فائدة أو طلب مراجعة</span>
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block mb-1 opacity-75">الاسم في المجلس:</label>
                    <input
                      type="text"
                      value={chatSender}
                      onChange={(e) => setChatSender(e.target.value)}
                      placeholder={participants[0]?.name || 'اكتب اسمك...'}
                      className={`w-full p-2 rounded-xl border focus:outline-none focus:border-emerald-500 ${isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-800'}`}
                    />
                  </div>

                  <div>
                    <label className="block mb-1 opacity-75">نوع المشاركة:</label>
                    <select
                      value={chatCategory}
                      onChange={(e) => setChatCategory(e.target.value as any)}
                      className={`w-full p-2 rounded-xl border focus:outline-none focus:border-emerald-500 ${isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-800'}`}
                    >
                      <option value="motivation">فائدة وتشجيع 🌟</option>
                      <option value="question">سؤال في رواية ورش 📖</option>
                      <option value="partner">طلب رفيق تسميع ومراجعة 🤝</option>
                      <option value="general">مدارسة عامة 💬</option>
                    </select>
                  </div>
                </div>

                <div>
                  <textarea
                    rows={2}
                    required
                    value={chatContent}
                    onChange={(e) => setChatContent(e.target.value)}
                    placeholder="اكتب هنا فائدة في ثمن، استفساراً في المتشابهات، أو دعوة لمراجعة حزب..."
                    className={`w-full p-3 rounded-xl border text-xs transition resize-none focus:outline-none focus:border-emerald-500 ${isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-800'}`}
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs transition cursor-pointer shadow-lg flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>إرسال للمجلس</span>
                  </button>
                </div>
              </form>

              {/* Messages Feed */}
              {messages.length === 0 ? (
                <div className={`p-8 text-center rounded-2xl border border-dashed space-y-2 ${cardBg}`}>
                  <MessageSquare className="w-8 h-8 text-emerald-500/40 mx-auto" />
                  <h4 className="text-sm font-semibold">المجلس مفتوح لتواصل الحفاظ</h4>
                  <p className="text-xs opacity-75">
                    كن أول من يكتب رسالة أو فائدة أو سؤالاً في رواية ورش لتستفيد الحلقة كاملة!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map((msg) => {
                    const cat = categoryLabels[msg.category] || categoryLabels.general;

                    return (
                      <div 
                        key={msg.id}
                        className={`p-4 rounded-2xl border space-y-2.5 transition ${cardBg}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-500 font-bold flex items-center justify-center text-xs">
                              {msg.senderName.slice(0, 1)}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold">{msg.senderName}</span>
                                <span className="text-[10px] opacity-60">({msg.senderLocation})</span>
                              </div>
                              <span className="text-[10px] opacity-50 block">{msg.createdAt}</span>
                            </div>
                          </div>

                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${cat.color}`}>
                            {cat.label}
                          </span>
                        </div>

                        <p className="text-xs sm:text-sm leading-relaxed pr-9 select-text">
                          {msg.content}
                        </p>

                        <div className="flex items-center justify-between pt-1 border-t border-slate-800/40 text-xs">
                          <button
                            onClick={() => handleLikeMessage(msg.id)}
                            disabled={likedMessagesMap[msg.id]}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                              likedMessagesMap[msg.id]
                                ? 'text-amber-500 bg-amber-500/10'
                                : 'opacity-70 hover:opacity-100 hover:text-amber-500'
                            }`}
                          >
                            <Heart className={`w-3 h-3 ${likedMessagesMap[msg.id] ? 'fill-amber-500 text-amber-500' : ''}`} />
                            <span>{msg.likes > 0 ? msg.likes : ''}</span>
                            <span>{likedMessagesMap[msg.id] ? 'تم التفاعل' : 'ما شاء الله'}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CHALLENGES */}
          {activeTab === 'challenges' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {challengesList.map(c => {
                  const percent = Math.min(100, Math.round((c.current / c.target) * 100));

                  return (
                    <div
                      key={c.id}
                      className={`p-4 rounded-2xl border transition relative overflow-hidden flex flex-col justify-between gap-3 ${
                        c.isCompleted
                          ? 'bg-emerald-500/15 border-emerald-500/50'
                          : cardBg
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-teal-500/30 text-teal-400 bg-teal-500/10">
                            {c.category === 'daily' ? 'تحدٍ يومي' : c.category === 'weekly' ? 'تحدٍ أسبوعي' : 'تحدي الهمة'}
                          </span>

                          {c.isCompleted ? (
                            <span className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>مكتمل ✓</span>
                            </span>
                          ) : (
                            <span className="text-xs font-mono opacity-70">
                              {c.current} / {c.target} {c.unit}
                            </span>
                          )}
                        </div>

                        <h4 className="text-sm font-bold leading-snug">
                          {c.title}
                        </h4>

                        <p className="text-xs opacity-75 leading-relaxed">
                          {c.desc}
                        </p>
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-2 pt-1 border-t border-slate-800/40">
                        <div className="flex items-center justify-between text-[11px] opacity-75">
                          <span className="flex items-center gap-1 text-amber-500 font-medium">
                            <Award className="w-3.5 h-3.5" />
                            <span>الجائزة: {c.rewardBadge}</span>
                          </span>
                          <span className="font-mono font-bold">{percent}%</span>
                        </div>

                        <div className="h-2 w-full bg-slate-800/60 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-500 rounded-full ${
                              c.isCompleted ? 'bg-emerald-500' : 'bg-gradient-to-r from-amber-500 to-emerald-500'
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
