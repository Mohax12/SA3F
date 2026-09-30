/**
 * خدمة المحادثة والتواصل الفوري بين الحفاظ عبر الإنترنت
 * يدعم Server-Sent Events (SSE) للتحديث الفوري بدون تحديث الصفحة
 * مع دعم التخزين المحلي في حال عدم توفر الاتصال
 */

export interface CircleMessage {
  id: string;
  senderName: string;
  senderLocation: string;
  content: string;
  category: 'motivation' | 'question' | 'partner' | 'general';
  createdAt: string;
  likes: number;
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
}

const LOCAL_MESSAGES_KEY = 'warsh_circle_messages';
const LOCAL_PARTICIPANTS_KEY = 'warsh_enrolled_participants';

type RealtimeCallback = (event: { type: string; payload: any }) => void;

class RealtimeChatService {
  private eventSource: EventSource | null = null;
  private listeners: Set<RealtimeCallback> = new Set();
  private isConnecting = false;
  private reconnectTimer: any = null;

  constructor() {
    this.initSSE();
  }

  private initSSE() {
    if (typeof window === 'undefined' || typeof EventSource === 'undefined') return;
    if (this.eventSource || this.isConnecting) return;

    this.isConnecting = true;
    try {
      const es = new EventSource('/api/messages/events');

      es.onopen = () => {
        this.isConnecting = false;
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }
      };

      es.addEventListener('new_message', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          this.notifyListeners({ type: 'new_message', payload: data.payload });
        } catch (err) {}
      });

      es.addEventListener('like_message', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          this.notifyListeners({ type: 'like_message', payload: data.payload });
        } catch (err) {}
      });

      es.addEventListener('new_participant', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          this.notifyListeners({ type: 'new_participant', payload: data.payload });
        } catch (err) {}
      });

      es.addEventListener('encourage_participant', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          this.notifyListeners({ type: 'encourage_participant', payload: data.payload });
        } catch (err) {}
      });

      es.addEventListener('delete_participant', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          this.notifyListeners({ type: 'delete_participant', payload: data.payload });
        } catch (err) {}
      });

      es.onerror = () => {
        this.isConnecting = false;
        es.close();
        this.eventSource = null;
        // Reconnect after 4s
        if (!this.reconnectTimer) {
          this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            this.initSSE();
          }, 4000);
        }
      };

      this.eventSource = es;
    } catch (e) {
      this.isConnecting = false;
    }
  }

  private notifyListeners(event: { type: string; payload: any }) {
    this.listeners.forEach((callback) => {
      try {
        callback(event);
      } catch (err) {}
    });
  }

  public subscribe(callback: RealtimeCallback): () => void {
    this.listeners.add(callback);
    this.initSSE();
    return () => {
      this.listeners.delete(callback);
    };
  }

  // 1. Fetch Messages
  public async getMessages(): Promise<CircleMessage[]> {
    try {
      const res = await fetch('/api/messages');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.messages)) {
          localStorage.setItem(LOCAL_MESSAGES_KEY, JSON.stringify(json.messages));
          return json.messages;
        }
      }
    } catch (e) {}

    // Fallback to local
    try {
      const saved = localStorage.getItem(LOCAL_MESSAGES_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }

  // 2. Post Message
  public async sendMessage(data: {
    senderName: string;
    senderLocation: string;
    content: string;
    category: 'motivation' | 'question' | 'partner' | 'general';
  }): Promise<CircleMessage> {
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.message) {
          return json.message;
        }
      }
    } catch (e) {}

    // Fallback locally
    const fallback: CircleMessage = {
      id: `msg_${Date.now()}`,
      senderName: data.senderName,
      senderLocation: data.senderLocation,
      content: data.content,
      category: data.category,
      createdAt: 'الآن',
      likes: 0,
    };

    try {
      const saved = localStorage.getItem(LOCAL_MESSAGES_KEY);
      const list = saved ? JSON.parse(saved) : [];
      list.unshift(fallback);
      localStorage.setItem(LOCAL_MESSAGES_KEY, JSON.stringify(list));
    } catch (e) {}

    return fallback;
  }

  // 3. Like Message
  public async likeMessage(id: string): Promise<number | null> {
    try {
      const res = await fetch(`/api/messages/${id}/like`, { method: 'POST' });
      if (res.ok) {
        const json = await res.json();
        return json.likes;
      }
    } catch (e) {}
    return null;
  }

  // 4. Fetch Participants
  public async getParticipants(): Promise<EnrolledParticipant[]> {
    try {
      const res = await fetch('/api/participants');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.participants)) {
          localStorage.setItem(LOCAL_PARTICIPANTS_KEY, JSON.stringify(json.participants));
          return json.participants;
        }
      }
    } catch (e) {}

    // Fallback to local
    try {
      const saved = localStorage.getItem(LOCAL_PARTICIPANTS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }

  // 5. Enroll Participant
  public async enrollParticipant(data: {
    name: string;
    location: string;
    targetHizb: string;
    dailyGoal: string;
    hizbCount: number;
    thumunCount: number;
  }): Promise<EnrolledParticipant> {
    try {
      const res = await fetch('/api/participants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.participant) {
          return json.participant;
        }
      }
    } catch (e) {}

    // Fallback locally
    const fallback: EnrolledParticipant = {
      id: `p_${Date.now()}`,
      name: data.name,
      location: data.location,
      targetHizb: data.targetHizb,
      dailyGoal: data.dailyGoal,
      hizbCount: data.hizbCount,
      thumunCount: data.thumunCount,
      joinedAt: new Date().toLocaleDateString('ar-MA', { month: 'short', day: 'numeric' }),
      likes: 1,
    };

    try {
      const saved = localStorage.getItem(LOCAL_PARTICIPANTS_KEY);
      const list = saved ? JSON.parse(saved) : [];
      list.unshift(fallback);
      localStorage.setItem(LOCAL_PARTICIPANTS_KEY, JSON.stringify(list));
    } catch (e) {}

    return fallback;
  }

  // 6. Encourage Participant
  public async encourageParticipant(id: string): Promise<number | null> {
    try {
      const res = await fetch(`/api/participants/${id}/encourage`, { method: 'POST' });
      if (res.ok) {
        const json = await res.json();
        return json.likes;
      }
    } catch (e) {}
    return null;
  }

  // 7. Delete Participant
  public async deleteParticipant(id: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/participants/${id}`, { method: 'DELETE' });
      if (res.ok) return true;
    } catch (e) {}
    return false;
  }
}

export const realtimeChatService = new RealtimeChatService();
