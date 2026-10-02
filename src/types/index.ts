export interface User {
  id: number;
  uid: string;
  username: string;
  email: string;
  displayName: string;
  avatar: string;
  bio: string;
  role: 'user' | 'admin' | string;
  isBanned: boolean;
  onlineStatus: boolean;
  lastSeen: string;
  createdAt: string;
  updatedAt: string;
  topicsCount?: number;
  postsCount?: number;
  friendsCount?: number;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  createdAt: string;
  topicCount?: number;
}

export interface CommentItem {
  id: number;
  topicId: number;
  authorId: number;
  parentCommentId: number | null;
  content: string;
  createdAt: string;
  updatedAt: string;
  author: {
    id: number;
    displayName: string;
    username: string;
    avatar: string;
    onlineStatus: boolean;
  };
  likeCount: number;
  isLiked: boolean;
}

export interface Topic {
  id: number;
  authorId: number;
  categoryId: number | null;
  title: string;
  content: string;
  imageUrl: string;
  tags: string;
  views: number;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
  author: {
    id: number;
    displayName: string;
    username: string;
    avatar: string;
    onlineStatus: boolean;
  };
  category: Category | null;
  commentCount: number;
  likeCount: number;
  bookmarkCount: number;
  isLiked: boolean;
  isBookmarked: boolean;
  comments?: CommentItem[];
}

export interface FriendshipRecord {
  id: number;
  requesterId: number;
  receiverId: number;
  status: 'pending' | 'accepted' | 'declined' | string;
  createdAt: string;
  updatedAt: string;
}

export interface SocialData {
  friends: {
    friendshipId: number;
    user: User;
    since: string;
  }[];
  incomingRequests: {
    friendshipId: number;
    user: User;
    createdAt: string;
  }[];
  outgoingRequests: {
    friendshipId: number;
    user: User;
    createdAt: string;
  }[];
  suggestedUsers: User[];
  onlineUsers: User[];
  allUsers: User[];
  friendships: FriendshipRecord[];
}

export interface PrivateMessage {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  readAt: string | null;
  createdAt: string;
}

export interface ConversationItem {
  partner: User;
  lastMessage: PrivateMessage | null;
  unreadCount: number;
  updatedAt: number;
}

export interface NotificationItem {
  id: number;
  userId: number;
  actorId: number | null;
  type:
    | 'friend_request'
    | 'friend_accepted'
    | 'topic_comment'
    | 'comment_reply'
    | 'topic_like'
    | 'comment_like'
    | 'new_message'
    | string;
  referenceId: number | null;
  message: string;
  read: boolean;
  createdAt: string;
  actor: User | null;
}

export interface ReportItem {
  id: number;
  reporterId: number;
  targetType: 'user' | 'topic' | 'comment' | string;
  targetId: number;
  reason: string;
  details: string;
  status: 'pending' | 'resolved' | 'dismissed' | string;
  createdAt: string;
  reporter: User | null;
  targetSummary: string;
}

export type ScreenName =
  | 'landing'
  | 'login'
  | 'register'
  | 'forgot-password'
  | 'home'
  | 'explore'
  | 'my-topics'
  | 'topic-detail'
  | 'create-topic'
  | 'edit-topic'
  | 'profile'
  | 'edit-profile'
  | 'friends'
  | 'friend-requests'
  | 'messages'
  | 'chat-detail'
  | 'notifications'
  | 'search'
  | 'category'
  | 'settings'
  | 'admin'
  | 'reports';

export interface RouteState {
  screen: ScreenName;
  topicId?: number;
  userId?: number;
  categorySlug?: string;
  chatPartnerId?: number;
  searchQuery?: string;
  tagFilter?: string;
}
