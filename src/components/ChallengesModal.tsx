import React, { useState, useEffect, useRef } from 'react';
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
  MapPin,
  Pin,
  Bell
} from 'lucide-react';
import { UserProgressData } from '../types/quran';
import { realtimeChatService, CircleMessage, EnrolledParticipant } from '../services/realtimeChatService';
import { AuthUser } from '../services/authService';

interface ChallengesModalProps {
  onClose: () => void;
  progress: UserProgressData;
  onSelectThumunDirectly?: (thumunId: number) => void;
  isDark?: boolean;
  initialTab?: 'challenges' | 'leaderboard' | 'chat';
  currentUser?: AuthUser | null;
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

const SENDER_COLORS = [
  'text-emerald-400',
  'text-sky-400',
  'text-amber-400',
  'text-teal-400',
  'text-purple-400',
  'text-rose-400',
  'text-cyan-400',
  'text-indigo-400'
];

function getSenderColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return SENDER_COLORS[Math.abs(hash) % SENDER_COLORS.length];
}

export const ChallengesModal: React.FC<ChallengesModalProps> = ({
  onClose,
  progress,
  isDark = true,
  initialTab = 'chat',
  currentUser
}) => {
  const [activeTab, setActiveTab] = useState<'challenges' | 'leaderboard' | 'chat'>(initialTab);
  
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
  const [chatSender, setChatSender] = useState(() => currentUser?.name || '');
  const [chatContent, setChatContent] = useState('');
  const [chatCategory, setChatCategory] = useState<'motivation' | 'question' | 'partner' | 'general'>('motivation');
  const [encouragedMap, setEncouragedMap] = useState<Record<string, boolean>>({});
  const [likedMessagesMap, setLikedMessagesMap] = useState<Record<string, boolean>>({});
  const [isLiveConnected, setIsLiveConnected] = useState(true);
  const [instantAlert, setInstantAlert] = useState<{ id: string; sender: string; content: string } | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (activeTab === 'chat') {
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [messages, activeTab]);

  // Load live messages and participants from server and listen via SSE
  useEffect(() => {
    let isMounted = true;

    realtimeChatService.getMessages().then(msgs => {
      if (isMounted && msgs && msgs.length > 0) {
        setMessages(msgs);
      }
    });

    realtimeChatService.getParticipants().then(pts => {
      if (isMounted && pts && pts.length > 0) {
        setParticipants(pts);
      }
    });

    const unsubscribe = realtimeChatService.subscribe((event) => {
      if (!isMounted) return;
      setIsLiveConnected(true);

      if (event.type === 'new_message') {
        const msg = event.payload;
        setMessages(prev => {
          if (prev.some(m => m.id === msg.id)) return prev;
          return [msg, ...prev];
        });
        const myName = currentUser?.name || chatSender;
        if (!myName || msg.senderName.trim().toLowerCase() !== myName.trim().toLowerCase()) {
          setInstantAlert({ id: msg.id, sender: msg.senderName, content: msg.content });
          setTimeout(() => {
            setInstantAlert(prev => prev?.id === msg.id ? null : prev);
          }, 4500);
        }
      } else if (event.type === 'like_message') {
        setMessages(prev => prev.map(m => m.id === event.payload.id ? { ...m, likes: event.payload.likes } : m));
      } else if (event.type === 'new_participant') {
        setParticipants(prev => {
          if (prev.some(p => p.id === event.payload.id)) return prev;
          return [event.payload, ...prev];
        });
      } else if (event.type === 'encourage_participant') {
        setParticipants(prev => prev.map(p => p.id === event.payload.id ? { ...p, likes: event.payload.likes } : p));
      } else if (event.type === 'delete_participant') {
        setParticipants(prev => prev.filter(p => p.id !== event.payload.id));
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

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
  const handleEnrollParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      setFormError('يرجى إدخال اسم المنخرط');
      return;
    }

    const newP = await realtimeChatService.enrollParticipant({
      name: newName.trim(),
      location: newLocation.trim() || 'المغرب العربي',
      targetHizb: newTargetHizb.trim() || 'الحزب 1',
      dailyGoal: newDailyGoal.trim() || 'ثمن واحد يومياً مع 20 تكراراً',
      hizbCount: userDoneHizbs,
      thumunCount: userDoneThumuns,
    });

    setParticipants(prev => {
      if (prev.some(p => p.id === newP.id)) return prev;
      return [newP, ...prev];
    });
    setChatSender(newP.name);
    setNewName('');
    setNewLocation('');
    setFormError('');
    setShowAddForm(false);
  };

  const handleDeleteParticipant = async (id: string) => {
    setParticipants(prev => prev.filter(p => p.id !== id));
    await realtimeChatService.deleteParticipant(id);
  };

  const handleEncourageParticipant = async (id: string) => {
    if (encouragedMap[id]) return;
    setEncouragedMap(prev => ({ ...prev, [id]: true }));
    const newLikes = await realtimeChatService.encourageParticipant(id);
    if (newLikes !== null) {
      setParticipants(prev => prev.map(p => p.id === id ? { ...p, likes: newLikes } : p));
    }
  };

  // Handle Posting a Message in Discussion
  const handlePostMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatContent.trim()) return;

    const sender = chatSender.trim() || (participants[0]?.name || 'متحدٍ في حفظ القرآن');
    const senderLoc = participants.find(p => p.name === sender)?.location || 'المغرب العربي';

    const newMsg = await realtimeChatService.sendMessage({
      senderName: sender,
      senderLocation: senderLoc,
      content: chatContent.trim(),
      category: chatCategory,
    });

    setMessages(prev => {
      if (prev.some(m => m.id === newMsg.id)) return prev;
      return [newMsg, ...prev];
    });
    setChatContent('');
  };

  const handleLikeMessage = async (id: string) => {
    if (likedMessagesMap[id]) return;
    setLikedMessagesMap(prev => ({ ...prev, [id]: true }));
    const updatedLikes = await realtimeChatService.likeMessage(id);
    if (updatedLikes !== null) {
      setMessages(prev => prev.map(m => m.id === id ? { ...m, likes: updatedLikes } : m));
    }
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
            <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              مباشر أونلاين
            </span>
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

          {/* TAB 2: COMMUNICATION & DISCUSSION - WHATSAPP / TELEGRAM GROUP STYLE */}
          {activeTab === 'chat' && (
            <div className="flex flex-col rounded-3xl overflow-hidden border border-slate-700/60 shadow-2xl bg-[#0b141a] max-h-[75vh]">
              {/* WhatsApp / Telegram Group Header Bar */}
              <div className="bg-[#1f2c34] text-slate-100 px-3 sm:px-4 py-2.5 border-b border-slate-700/60 flex items-center justify-between shadow-md shrink-0">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-600 to-teal-800 border-2 border-emerald-500/50 flex items-center justify-center font-bold text-amber-300 text-lg shadow-inner">
                      ۞
                    </div>
                    <span className="w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#1f2c34] absolute bottom-0 right-0 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-100 flex items-center gap-1">
                        <span>مجموعة حفاظ ورش العامة</span>
                        <span className="text-emerald-400 text-xs">🟢</span>
                      </h4>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      {participants.length > 0 ? `${participants.length} حفاظ مسجلون` : 'مجلس التواصي بالحق'} · متصل الآن
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    مباشر
                  </span>
                </div>
              </div>

              {/* Pinned Note Banner (مثل تلغرام/واتساب) */}
              <div className="bg-[#182229] border-b border-slate-700/40 px-3.5 py-1.5 flex items-center justify-between text-[11px] text-slate-300 shrink-0">
                <div className="flex items-center gap-2 truncate">
                  <Pin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="font-semibold text-amber-300">رسالة مثبتة:</span>
                  <span className="truncate opacity-80">
                    مجلس مدارسة الأثمان وتثبيت القرآن برواية ورش عن نافع. تواصلوا بالخير وانشروا فوائد المتشابهات.
                  </span>
                </div>
              </div>

              {/* Instant Alert Banner (تنبيهات فورية عند وصول رسالة جديدة) */}
              {instantAlert && (
                <div 
                  onClick={() => {
                    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                    setInstantAlert(null);
                  }}
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-slate-950 px-3.5 py-2 text-xs font-bold flex items-center justify-between shadow-lg cursor-pointer transition animate-in slide-in-from-top duration-200 shrink-0 border-b border-emerald-400/40"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-2 h-2 rounded-full bg-amber-300 animate-ping shrink-0" />
                    <Bell className="w-3.5 h-3.5 shrink-0" />
                    <span>تنبيه فوري: رسالة من <strong>{instantAlert.sender}</strong></span>
                    <span className="truncate opacity-90 text-[11px] font-normal">«{instantAlert.content}»</span>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setInstantAlert(null); }}
                    className="p-1 hover:bg-emerald-700/30 rounded-full cursor-pointer shrink-0"
                    title="إغلاق التنبيه"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Chat Messages Body (WhatsApp Chat Wallpaper Style) */}
              <div className="p-3 sm:p-4 overflow-y-auto space-y-2.5 flex-1 min-h-[320px] max-h-[50vh] bg-[#0b141a] bg-[radial-gradient(#1a2730_1px,transparent_1px)] [background-size:24px_24px]">
                {/* Date Badge */}
                <div className="flex justify-center my-1 sticky top-1 z-10">
                  <span className="px-3 py-0.5 rounded-lg bg-[#182229]/95 border border-slate-700/60 text-slate-400 text-[10px] font-semibold shadow">
                    اليوم · مجلس التواصي بالحق
                  </span>
                </div>

                {messages.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl border border-dashed border-slate-800 space-y-2 my-auto">
                    <MessageSquare className="w-8 h-8 text-emerald-500/40 mx-auto" />
                    <h4 className="text-sm font-semibold text-slate-200">المجموعة مفتوحة لتواصل الحفاظ</h4>
                    <p className="text-xs text-slate-400">
                      كن أول من يكتب رسالة أو فائدة أو سؤالاً في رواية ورش لتستفيد الحلقة كاملة!
                    </p>
                  </div>
                ) : (
                  [...messages].reverse().map((msg) => {
                    const myName = currentUser?.name || chatSender;
                    const isMe = (myName && msg.senderName.trim().toLowerCase() === myName.trim().toLowerCase()) || msg.senderName === 'أنا';
                    const nameColor = getSenderColor(msg.senderName);
                    const cat = categoryLabels[msg.category] || categoryLabels.general;

                    return (
                      <div 
                        key={msg.id} 
                        className={`flex ${isMe ? 'justify-end' : 'justify-start'} w-full animate-in fade-in duration-150`}
                      >
                        <div className={`rounded-2xl p-2.5 sm:p-3 shadow-md max-w-[85%] sm:max-w-[75%] space-y-1.5 transition ${
                          isMe 
                            ? 'bg-[#005c4b] text-white rounded-tr-none border border-emerald-600/30' 
                            : 'bg-[#202c33] text-slate-100 rounded-tl-none border border-slate-700/50'
                        }`}>
                          {/* Sender Name & Category */}
                          <div className="flex items-center justify-between gap-2 text-xs">
                            <div className="flex items-center gap-1.5">
                              <span className={`font-bold text-xs ${isMe ? 'text-amber-200' : nameColor}`}>
                                {isMe ? 'أنت' : msg.senderName}
                              </span>
                              <span className="text-[10px] opacity-60">
                                · {msg.senderLocation || 'المغرب العربي'}
                              </span>
                            </div>

                            <span className={`text-[9px] font-semibold px-2 py-0.2 rounded-full border ${
                              isMe ? 'bg-emerald-950/60 border-emerald-400/40 text-emerald-200' : cat.color
                            }`}>
                              {cat.label}
                            </span>
                          </div>

                          {/* Message Content */}
                          <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap select-text pr-1">
                            {msg.content}
                          </p>

                          {/* Footer with Likes & Read Receipt */}
                          <div className="flex items-center justify-between gap-3 pt-1 text-[10px] opacity-75">
                            <button
                              onClick={() => handleLikeMessage(msg.id)}
                              disabled={likedMessagesMap[msg.id]}
                              className={`flex items-center gap-1 px-1.5 py-0.5 rounded transition cursor-pointer ${
                                likedMessagesMap[msg.id] 
                                  ? 'text-amber-400 bg-amber-400/20' 
                                  : 'hover:text-amber-400 hover:bg-slate-700/40'
                              }`}
                              title="تفاعل بعبارة ما شاء الله"
                            >
                              <Heart className={`w-3 h-3 ${likedMessagesMap[msg.id] ? 'fill-amber-400 text-amber-400' : ''}`} />
                              <span>{msg.likes > 0 ? msg.likes : ''}</span>
                              <span>{likedMessagesMap[msg.id] ? 'ما شاء الله' : 'تشجيع'}</span>
                            </button>

                            <div className="flex items-center gap-1 font-mono">
                              <span>{msg.createdAt || 'الآن'}</span>
                              {isMe && (
                                <span className="text-[#53bdeb] text-xs font-bold select-none" title="تم التسليم">
                                  ✓✓
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={chatEndRef} />
              </div>

              {/* WhatsApp / Telegram Bottom Input Bar */}
              <form onSubmit={handlePostMessage} className="bg-[#202c33] border-t border-slate-700/60 p-2.5 sm:p-3 space-y-2 shrink-0">
                {/* Category and Quick Emoji Bar */}
                <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 text-xs">
                  <div className="flex items-center gap-1.5">
                    {[
                      { id: 'motivation', label: 'فائدة 🌟' },
                      { id: 'question', label: 'سؤال ورش 📖' },
                      { id: 'partner', label: 'رفيق حفظ 🤝' },
                      { id: 'general', label: 'مدارسة 💬' }
                    ].map(c => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setChatCategory(c.id as any)}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold transition cursor-pointer whitespace-nowrap border ${
                          chatCategory === c.id
                            ? 'bg-emerald-600 text-slate-950 font-bold border-emerald-500'
                            : 'bg-[#182229] text-slate-400 border-slate-700 hover:text-slate-200'
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>

                  {/* Quick Emojis */}
                  <div className="flex items-center gap-1 shrink-0">
                    {['🤲', '❤️', '👏', '🌟', '🕌'].map(em => (
                      <button
                        key={em}
                        type="button"
                        onClick={() => setChatContent(prev => prev ? prev + ' ' + em : em)}
                        className="hover:scale-125 transition-transform text-sm cursor-pointer p-0.5"
                        title={`إضافة ${em}`}
                      >
                        {em}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Input Row */}
                <div className="flex items-center gap-2">
                  {!currentUser && (
                    <input
                      type="text"
                      value={chatSender}
                      onChange={(e) => setChatSender(e.target.value)}
                      placeholder="اسمك في المجلس..."
                      className="w-28 sm:w-36 px-2.5 py-2 rounded-xl bg-[#2a3942] border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
                    />
                  )}

                  <div className="flex-1 relative">
                    <input
                      type="text"
                      required
                      value={chatContent}
                      onChange={(e) => setChatContent(e.target.value)}
                      placeholder={currentUser ? `اكتب رسالة في المجموعة باسم ${currentUser.name.split(' ')[0]}...` : "اكتب فائدة أو استفساراً في المجموعة..."}
                      className="w-full px-4 py-2.5 rounded-full bg-[#2a3942] border border-slate-700 text-slate-100 text-xs sm:text-sm placeholder:text-slate-400 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!chatContent.trim()}
                    className="w-10 h-10 rounded-full bg-[#00a884] hover:bg-[#02906f] text-slate-950 flex items-center justify-center shadow-lg transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                    title="إرسال في المجموعة"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </form>
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
