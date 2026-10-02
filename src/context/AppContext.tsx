import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleAuthProvider } from '../lib/firebase';
import { apiRequest, getAuthToken, setAuthToken } from '../services/api';
import type {
  Category,
  ConversationItem,
  NotificationItem,
  RouteState,
  ScreenName,
  SocialData,
  User,
} from '../types';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export interface ReportModalTarget {
  targetType: 'user' | 'topic' | 'comment';
  targetId: number;
  targetLabel: string;
}

type SocketEventListener = (event: any) => void;

interface AppContextValue {
  user: User | null;
  authLoading: boolean;
  route: RouteState;
  navigate: (screen: ScreenName, params?: Partial<Omit<RouteState, 'screen'>>) => void;
  categories: Category[];
  socialData: SocialData;
  notifications: NotificationItem[];
  conversations: ConversationItem[];
  unreadNotificationsCount: number;
  unreadMessagesCount: number;
  toasts: ToastMessage[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  dismissToast: (id: string) => void;
  loginWithEmail: (identifier: string, password: string) => Promise<void>;
  registerWithEmail: (input: {
    username: string;
    email: string;
    password: string;
    displayName?: string;
  }) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  refreshSocial: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  refreshConversations: () => Promise<void>;
  refreshCategories: () => Promise<void>;
  subscribeSocket: (listener: SocketEventListener) => () => void;
  sendSocketEvent: (payload: any) => void;
  reportTarget: ReportModalTarget | null;
  openReportModal: (target: ReportModalTarget) => void;
  closeReportModal: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [route, setRoute] = useState<RouteState>({ screen: 'landing' });
  const [categories, setCategories] = useState<Category[]>([]);
  const [socialData, setSocialData] = useState<SocialData>({
    friends: [],
    incomingRequests: [],
    outgoingRequests: [],
    suggestedUsers: [],
    onlineUsers: [],
    allUsers: [],
    friendships: [],
  });
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [reportTarget, setReportTarget] = useState<ReportModalTarget | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const listenersRef = useRef<Set<SocketEventListener>>(new Set());

  const showToast = useCallback(
    (message: string, type: 'success' | 'error' | 'info' = 'success') => {
      const id = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const navigate = useCallback(
    (screen: ScreenName, params?: Partial<Omit<RouteState, 'screen'>>) => {
      setRoute({ screen, ...(params || {}) });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    []
  );

  const refreshCategories = useCallback(async () => {
    try {
      const data = await apiRequest<{ categories: Category[] }>('/api/categories');
      setCategories(data.categories || []);
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  }, []);

  const refreshSocial = useCallback(async () => {
    try {
      const data = await apiRequest<SocialData>('/api/social');
      setSocialData(data);
    } catch (err) {
      console.error('Failed to load social data:', err);
    }
  }, []);

  const refreshNotifications = useCallback(async () => {
    if (!getAuthToken() && !auth.currentUser) return;
    try {
      const data = await apiRequest<{ notifications: NotificationItem[] }>('/api/notifications');
      setNotifications(data.notifications || []);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  }, []);

  const refreshConversations = useCallback(async () => {
    if (!getAuthToken() && !auth.currentUser) return;
    try {
      const data = await apiRequest<{ conversations: ConversationItem[] }>('/api/conversations');
      setConversations(data.conversations || []);
    } catch (err) {
      console.error('Failed to load conversations:', err);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const data = await apiRequest<{ user: User }>('/api/auth/me');
      setUser(data.user);
    } catch (err) {
      console.error('Failed to refresh user:', err);
    }
  }, []);

  // Initialize Categories & Social data on mount
  useEffect(() => {
    refreshCategories();
    refreshSocial();
  }, [refreshCategories, refreshSocial]);

  // Listen to Firebase Auth state changes (Google OAuth)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const token = await firebaseUser.getIdToken();
          setAuthToken(token);
          const syncRes = await apiRequest<{ user: User }>('/api/auth/sync', {
            method: 'POST',
            body: JSON.stringify({
              displayName: firebaseUser.displayName,
              avatar: firebaseUser.photoURL,
            }),
          });
          setUser(syncRes.user);
          setRoute((prev) =>
            prev.screen === 'landing' || prev.screen === 'login' || prev.screen === 'register'
              ? { screen: 'home' }
              : prev
          );
        } catch (err: any) {
          console.error('Auth sync error:', err);
          showToast(err.message || 'Không thể đồng bộ tài khoản Google.', 'error');
        }
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, [showToast]);

  // Refresh user-specific data whenever user logs in
  useEffect(() => {
    if (user) {
      refreshSocial();
      refreshNotifications();
      refreshConversations();
    } else {
      setNotifications([]);
      setConversations([]);
    }
  }, [user, refreshSocial, refreshNotifications, refreshConversations]);

  // Real-time WebSocket connection management
  useEffect(() => {
    if (!user) {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      return;
    }

    let isUnmounted = false;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    const connectWs = () => {
      if (isUnmounted) return;
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = async () => {
        const token = getAuthToken();
        if (token && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'auth', token }));
        }
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'notification:new') {
            refreshNotifications();
          } else if (payload.type === 'social:updated' || payload.type === 'presence:update') {
            refreshSocial();
          } else if (payload.type === 'message:new' || payload.type === 'message:read') {
            refreshConversations();
          }
          listenersRef.current.forEach((listener) => listener(payload));
        } catch (err) {
          console.error('WS parse error:', err);
        }
      };

      ws.onclose = () => {
        if (!isUnmounted) {
          reconnectTimer = setTimeout(connectWs, 3500);
        }
      };
    };

    connectWs();

    return () => {
      isUnmounted = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [user, refreshNotifications, refreshSocial, refreshConversations]);

  const subscribeSocket = useCallback((listener: SocketEventListener) => {
    listenersRef.current.add(listener);
    return () => {
      listenersRef.current.delete(listener);
    };
  }, []);

  const sendSocketEvent = useCallback((payload: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload));
    }
  }, []);

  const loginWithEmail = useCallback(
    async (identifier: string, password: string) => {
      const data = await apiRequest<{ token: string; user: User }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ identifier, password }),
      });
      setAuthToken(data.token);
      setUser(data.user);
      showToast(`Chào mừng trở lại, ${data.user.displayName}!`, 'success');
      navigate('home');
    },
    [navigate, showToast]
  );

  const registerWithEmail = useCallback(
    async (input: {
      username: string;
      email: string;
      password: string;
      displayName?: string;
    }) => {
      const data = await apiRequest<{ token: string; user: User }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(input),
      });
      setAuthToken(data.token);
      setUser(data.user);
      showToast('Đăng ký tài khoản thành công!', 'success');
      navigate('home');
    },
    [navigate, showToast]
  );

  const loginWithGoogle = useCallback(async () => {
    const credential = await signInWithPopup(auth, googleAuthProvider);
    const token = await credential.user.getIdToken();
    setAuthToken(token);
    const syncRes = await apiRequest<{ user: User }>('/api/auth/sync', {
      method: 'POST',
      body: JSON.stringify({
        displayName: credential.user.displayName,
        avatar: credential.user.photoURL,
      }),
    });
    setUser(syncRes.user);
    showToast(`Đã đăng nhập bằng Google với tên ${syncRes.user.displayName}`, 'success');
    navigate('home');
  }, [navigate, showToast]);

  const logout = useCallback(async () => {
    try {
      await signOut(auth).catch(() => {});
    } finally {
      setAuthToken(null);
      setUser(null);
      showToast('Đã đăng xuất khỏi tài khoản.', 'info');
      navigate('landing');
    }
  }, [navigate, showToast]);

  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;
  const unreadMessagesCount = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  return (
    <AppContext.Provider
      value={{
        user,
        authLoading,
        route,
        navigate,
        categories,
        socialData,
        notifications,
        conversations,
        unreadNotificationsCount,
        unreadMessagesCount,
        toasts,
        showToast,
        dismissToast,
        loginWithEmail,
        registerWithEmail,
        loginWithGoogle,
        logout,
        refreshUser,
        refreshSocial,
        refreshNotifications,
        refreshConversations,
        refreshCategories,
        subscribeSocket,
        sendSocketEvent,
        reportTarget,
        openReportModal: (target) => setReportTarget(target),
        closeReportModal: () => setReportTarget(null),
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
