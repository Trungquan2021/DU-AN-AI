import React, { useState } from 'react';
import {
  Bookmark,
  Check,
  Edit3,
  Eye,
  Flag,
  Heart,
  MessageCircle,
  MessageSquare,
  Pin,
  Search,
  Share2,
  Trash2,
  UserCheck,
  UserPlus,
  X,
} from 'lucide-react';
import type { NotificationItem, Topic, User } from '../../types';
import { formatRelativeTime, getInitials, parseTags } from '../../utils/format';
import { useApp } from '../../context/AppContext';
import { apiRequest } from '../../services/api';

// ============================================================================
// Xamvier Brand Logo Component
// ============================================================================
export const XamvierLogo: React.FC<{
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  showBadge?: boolean;
}> = ({ size = 'md', onClick, showBadge = false }) => {
  const iconSize = size === 'sm' ? 'w-6 h-6' : size === 'lg' ? 'w-9 h-9' : 'w-7 h-7';
  const textSize = size === 'sm' ? 'text-base' : size === 'lg' ? 'text-2xl' : 'text-xl';
  const glyphSize = size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4';

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-2.5 select-none ${
        onClick ? 'cursor-pointer group' : ''
      }`}
    >
      <div
        className={`${iconSize} rounded-xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 flex items-center justify-center shadow-xs shadow-blue-600/30 group-hover:scale-105 transition-transform shrink-0`}
      >
        <svg
          viewBox="0 0 24 24"
          className={`${glyphSize} text-white`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 4l16 16M20 4L4 20" />
        </svg>
      </div>
      <div className="flex items-center gap-1.5">
        <span
          className={`${textSize} font-extrabold tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors`}
        >
          Xamvier
        </span>
        {showBadge && (
          <span className="px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-blue-50 text-blue-700 rounded-md border border-blue-200/60">
            Community
          </span>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// UserAvatar Component (Zero-Broken-Image Policy)
// ============================================================================
export const UserAvatar: React.FC<{
  name: string;
  avatar?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  online?: boolean;
  showStatusDot?: boolean;
  onClick?: () => void;
}> = ({ name, avatar, size = 'md', online = false, showStatusDot = false, onClick }) => {
  const [imgError, setImgError] = useState(false);

  const sizeClasses = {
    xs: 'w-7 h-7 text-xs',
    sm: 'w-9 h-9 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-base',
    xl: 'w-20 h-20 text-xl',
  }[size];

  const dotClasses = {
    xs: 'w-2 h-2',
    sm: 'w-2.5 h-2.5',
    md: 'w-2.5 h-2.5',
    lg: 'w-3.5 h-3.5',
    xl: 'w-4 h-4',
  }[size];

  return (
    <div
      onClick={onClick}
      className={`relative inline-flex shrink-0 select-none ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      {avatar && !imgError ? (
        <img
          src={avatar}
          alt={name || 'Avatar thành viên'}
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
          className={`${sizeClasses} rounded-full object-cover border border-slate-200 bg-slate-100`}
        />
      ) : (
        <div
          className={`${sizeClasses} rounded-full bg-gradient-to-br from-blue-600 to-blue-800 text-white font-semibold flex items-center justify-center border border-blue-700/20`}
        >
          {getInitials(name)}
        </div>
      )}
      {showStatusDot && (
        <span
          title={online ? 'Đang trực tuyến' : 'Ngoại tuyến'}
          className={`absolute bottom-0 right-0 ${dotClasses} rounded-full ring-2 ring-white ${
            online ? 'bg-emerald-500' : 'bg-slate-300'
          }`}
        />
      )}
    </div>
  );
};

// ============================================================================
// TopicImage Component (Resilient Image Slot with Fallback)
// ============================================================================
export const TopicImage: React.FC<{
  src: string;
  alt: string;
  className?: string;
}> = ({ src, alt, className = 'w-full h-56 object-cover rounded-lg' }) => {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return null;

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200/80 bg-slate-50">
      <img
        src={src}
        alt={alt}
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className={className}
      />
    </div>
  );
};

// ============================================================================
// TopicCard Component (Zero-Pill Metadata Discipline)
// ============================================================================
export const TopicCard: React.FC<{
  topic: Topic;
  onRefresh?: () => void;
}> = ({ topic, onRefresh }) => {
  const { user, navigate, showToast, openReportModal } = useApp();
  const [liked, setLiked] = useState(topic.isLiked);
  const [likeCount, setLikeCount] = useState(topic.likeCount);
  const [bookmarked, setBookmarked] = useState(topic.isBookmarked);
  const tags = parseTags(topic.tags);

  const handleToggleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      showToast('Vui lòng đăng nhập để thích chủ đề.', 'info');
      navigate('login');
      return;
    }
    const prevLiked = liked;
    setLiked(!prevLiked);
    setLikeCount((c) => (prevLiked ? Math.max(0, c - 1) : c + 1));
    try {
      await apiRequest(`/api/topics/${topic.id}/like`, { method: 'POST' });
    } catch (err: any) {
      setLiked(prevLiked);
      setLikeCount(topic.likeCount);
      showToast(err.message, 'error');
    }
  };

  const handleToggleBookmark = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      showToast('Vui lòng đăng nhập để lưu chủ đề.', 'info');
      navigate('login');
      return;
    }
    const prev = bookmarked;
    setBookmarked(!prev);
    try {
      const res = await apiRequest<{ bookmarked: boolean }>(
        `/api/topics/${topic.id}/bookmark`,
        { method: 'POST' }
      );
      showToast(
        res.bookmarked ? 'Đã lưu chủ đề vào danh sách đọc.' : 'Đã bỏ lưu chủ đề.',
        'info'
      );
      if (onRefresh) onRefresh();
    } catch (err: any) {
      setBookmarked(prev);
      showToast(err.message, 'error');
    }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/?topic=${topic.id}`;
    navigator.clipboard?.writeText(url).catch(() => {});
    showToast('Đã sao chép liên kết chủ đề vào bộ nhớ tạm.', 'info');
  };

  const canModify = user && (user.id === topic.authorId || user.role === 'admin');

  return (
    <article
      onClick={() => navigate('topic-detail', { topicId: topic.id })}
      className="bg-white border border-slate-200/80 rounded-xl p-5 sm:p-6 hover:border-blue-300 transition-colors cursor-pointer"
    >
      {/* Author & Unboxed Metadata Line */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <UserAvatar
            name={topic.author.displayName}
            avatar={topic.author.avatar}
            size="sm"
            online={topic.author.onlineStatus}
            showStatusDot
            onClick={() => {}}
          />
          <div className="min-w-0">
            <div className="flex items-center flex-wrap gap-1.5 text-xs text-slate-500">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('profile', { userId: topic.author.id });
                }}
                className="font-semibold text-slate-900 hover:text-blue-600 transition-colors truncate"
              >
                {topic.author.displayName}
              </button>
              <span aria-hidden="true">·</span>
              <span className="text-slate-400">@{topic.author.username}</span>
              <span aria-hidden="true">·</span>
              <span>{formatRelativeTime(topic.createdAt)}</span>
              {topic.category && (
                <>
                  <span aria-hidden="true">·</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate('category', { categorySlug: topic.category!.slug });
                    }}
                    className="font-medium text-blue-600 hover:underline"
                  >
                    {topic.category.name}
                  </button>
                </>
              )}
              {topic.isPinned && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="inline-flex items-center gap-1 font-medium text-blue-700">
                    <Pin className="w-3 h-3" /> Đã ghim
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {canModify && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                navigate('edit-topic', { topicId: topic.id });
              }}
              title="Chỉnh sửa chủ đề"
              className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (!user) {
                showToast('Vui lòng đăng nhập để báo cáo.', 'info');
                navigate('login');
                return;
              }
              openReportModal({
                targetType: 'topic',
                targetId: topic.id,
                targetLabel: topic.title,
              });
            }}
            title="Báo cáo chủ đề"
            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <Flag className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Topic Title */}
      <h3 className="text-lg font-semibold text-slate-900 mb-2 leading-snug group-hover:text-blue-600">
        {topic.title}
      </h3>

      {/* Summary Content */}
      <p className="text-sm text-slate-600 leading-relaxed line-clamp-3 mb-4 whitespace-pre-line">
        {topic.content}
      </p>

      {/* Optional Topic Image */}
      {topic.imageUrl && (
        <div className="mb-4">
          <TopicImage
            src={topic.imageUrl}
            alt={topic.title}
            className="w-full max-h-64 object-cover rounded-lg"
          />
        </div>
      )}

      {/* Unboxed Tags Metadata */}
      {tags.length > 0 && (
        <div className="flex items-center flex-wrap gap-2 text-xs text-slate-500 mb-4">
          {tags.map((tag, idx) => (
            <React.Fragment key={tag}>
              {idx > 0 && <span aria-hidden="true">·</span>}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('search', { searchQuery: tag, tagFilter: tag });
                }}
                className="hover:text-blue-600 transition-colors"
              >
                #{tag}
              </button>
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Footer Actions & Tabular Metrics */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={handleToggleLike}
            className={`inline-flex items-center gap-1.5 font-medium transition-colors whitespace-nowrap ${
              liked ? 'text-blue-600' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Heart className={`w-4 h-4 ${liked ? 'fill-blue-600 text-blue-600' : ''}`} />
            <span className="tabular-nums">{likeCount}</span>
            <span className="hidden sm:inline">Thích</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              navigate('topic-detail', { topicId: topic.id });
            }}
            className="inline-flex items-center gap-1.5 font-medium text-slate-500 hover:text-slate-900 transition-colors whitespace-nowrap"
          >
            <MessageSquare className="w-4 h-4" />
            <span className="tabular-nums">{topic.commentCount}</span>
            <span className="hidden sm:inline">Bình luận</span>
          </button>

          <span className="inline-flex items-center gap-1.5 text-slate-400 whitespace-nowrap">
            <Eye className="w-4 h-4" />
            <span className="tabular-nums">{topic.views}</span>
            <span className="hidden sm:inline">Lượt xem</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleToggleBookmark}
            className={`p-1.5 rounded-lg transition-colors ${
              bookmarked
                ? 'text-blue-600 bg-blue-50'
                : 'text-slate-400 hover:text-slate-700 hover:bg-slate-50'
            }`}
            title={bookmarked ? 'Bỏ lưu' : 'Lưu chủ đề'}
          >
            <Bookmark className={`w-4 h-4 ${bookmarked ? 'fill-blue-600' : ''}`} />
          </button>
          <button
            type="button"
            onClick={handleShare}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors"
            title="Chia sẻ liên kết"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </article>
  );
};

// ============================================================================
// UserCard Component
// ============================================================================
export const UserCard: React.FC<{
  targetUser: User;
  compact?: boolean;
}> = ({ targetUser, compact = false }) => {
  const { user, socialData, refreshSocial, navigate, showToast } = useApp();
  const [busy, setBusy] = useState(false);

  const existingFriendship = socialData.friendships.find(
    (f) =>
      (f.requesterId === user?.id && f.receiverId === targetUser.id) ||
      (f.requesterId === targetUser.id && f.receiverId === user?.id)
  );

  const handleAddFriend = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      showToast('Vui lòng đăng nhập để kết bạn.', 'info');
      navigate('login');
      return;
    }
    setBusy(true);
    try {
      await apiRequest('/api/friends/request', {
        method: 'POST',
        body: JSON.stringify({ receiverId: targetUser.id }),
      });
      showToast('Friend request sent — Đã gửi lời mời kết bạn.', 'success');
      await refreshSocial();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleAccept = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!existingFriendship) return;
    setBusy(true);
    try {
      await apiRequest('/api/friends/respond', {
        method: 'POST',
        body: JSON.stringify({ friendshipId: existingFriendship.id, action: 'accepted' }),
      });
      showToast(`Đã kết bạn với ${targetUser.displayName}!`, 'success');
      await refreshSocial();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  if (compact) {
    return (
      <div className="flex items-center justify-between gap-3 py-2">
        <div
          onClick={() => navigate('profile', { userId: targetUser.id })}
          className="flex items-center gap-2.5 min-w-0 cursor-pointer"
        >
          <UserAvatar
            name={targetUser.displayName}
            avatar={targetUser.avatar}
            size="sm"
            online={targetUser.onlineStatus}
            showStatusDot
          />
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-900 hover:text-blue-600 truncate">
              {targetUser.displayName}
            </p>
            <p className="text-xs text-slate-500 truncate">@{targetUser.username}</p>
          </div>
        </div>
        {user?.id !== targetUser.id && (
          <div>
            {!existingFriendship ? (
              <button
                type="button"
                disabled={busy}
                onClick={handleAddFriend}
                className="px-2.5 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors whitespace-nowrap"
              >
                + Kết bạn
              </button>
            ) : existingFriendship.status === 'pending' &&
              existingFriendship.requesterId === user?.id ? (
              <span className="text-xs text-slate-400 whitespace-nowrap">Đã gửi</span>
            ) : existingFriendship.status === 'pending' ? (
              <button
                type="button"
                disabled={busy}
                onClick={handleAccept}
                className="px-2.5 py-1 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors whitespace-nowrap"
              >
                Đồng ý
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate('messages', { chatPartnerId: targetUser.id })}
                className="p-1.5 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition-colors"
                title="Nhắn tin"
              >
                <MessageCircle className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200/80 rounded-xl p-4 flex items-start justify-between gap-4">
      <div
        onClick={() => navigate('profile', { userId: targetUser.id })}
        className="flex items-start gap-3.5 min-w-0 cursor-pointer"
      >
        <UserAvatar
          name={targetUser.displayName}
          avatar={targetUser.avatar}
          size="md"
          online={targetUser.onlineStatus}
          showStatusDot
        />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-slate-900 hover:text-blue-600 truncate">
              {targetUser.displayName}
            </h4>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-slate-500">
              {targetUser.onlineStatus ? 'Trực tuyến' : 'Ngoại tuyến'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mb-1.5">@{targetUser.username}</p>
          {targetUser.bio && (
            <p className="text-xs text-slate-600 line-clamp-2">{targetUser.bio}</p>
          )}
        </div>
      </div>

      {user?.id !== targetUser.id && (
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              if (!user) {
                navigate('login');
                return;
              }
              navigate('messages', { chatPartnerId: targetUser.id });
            }}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap"
          >
            Nhắn tin
          </button>
          {!existingFriendship && (
            <button
              type="button"
              disabled={busy}
              onClick={handleAddFriend}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors whitespace-nowrap"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Kết bạn
            </button>
          )}
          {existingFriendship?.status === 'pending' &&
            existingFriendship.requesterId === user?.id && (
              <span className="text-xs text-slate-500 px-2 py-1">Đã gửi lời mời</span>
            )}
          {existingFriendship?.status === 'pending' &&
            existingFriendship.receiverId === user?.id && (
              <button
                type="button"
                disabled={busy}
                onClick={handleAccept}
                className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors whitespace-nowrap"
              >
                Chấp nhận
              </button>
            )}
          {existingFriendship?.status === 'accepted' && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 px-2 py-1">
              <UserCheck className="w-3.5 h-3.5" /> Bạn bè
            </span>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// SearchBar Component
// ============================================================================
export const SearchBar: React.FC<{
  initialValue?: string;
  placeholder?: string;
  onSearch?: (query: string) => void;
}> = ({
  initialValue = '',
  placeholder = 'Tìm kiếm chủ đề, thành viên, danh mục hoặc #tag...',
  onSearch,
}) => {
  const [value, setValue] = useState(initialValue);
  const { navigate } = useApp();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(value);
    } else {
      navigate('search', { searchQuery: value });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-full">
      <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-20 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15 transition-all"
      />
      {value && (
        <button
          type="button"
          onClick={() => {
            setValue('');
            if (onSearch) onSearch('');
          }}
          className="absolute right-14 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
      <button
        type="submit"
        className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors whitespace-nowrap"
      >
        Tìm
      </button>
    </form>
  );
};

// ============================================================================
// NotificationItemCard Component
// ============================================================================
export const NotificationItemCard: React.FC<{
  item: NotificationItem;
  onSelect: (item: NotificationItem) => void;
}> = ({ item, onSelect }) => {
  return (
    <div
      onClick={() => onSelect(item)}
      className={`p-4 rounded-xl border transition-colors cursor-pointer flex items-start justify-between gap-3 ${
        item.read
          ? 'bg-white border-slate-200/70 hover:border-slate-300'
          : 'bg-blue-50/50 border-blue-200 hover:border-blue-300'
      }`}
    >
      <div className="flex items-start gap-3 min-w-0">
        <UserAvatar
          name={item.actor?.displayName || 'Hệ thống'}
          avatar={item.actor?.avatar}
          size="sm"
        />
        <div className="min-w-0">
          <p className="text-sm text-slate-800 leading-snug">{item.message}</p>
          <p className="text-xs text-slate-400 mt-1 tabular-nums">
            {formatRelativeTime(item.createdAt)}
          </p>
        </div>
      </div>
      {!item.read && (
        <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0 mt-1.5" title="Chưa đọc" />
      )}
    </div>
  );
};

// ============================================================================
// LoadingSkeleton & EmptyState Components
// ============================================================================
export const LoadingSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white border border-slate-200/80 rounded-xl p-6 animate-pulse"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-full bg-slate-200" />
            <div className="space-y-1.5 flex-1">
              <div className="h-3 bg-slate-200 rounded w-1/4" />
              <div className="h-2.5 bg-slate-100 rounded w-1/6" />
            </div>
          </div>
          <div className="h-5 bg-slate-200 rounded w-3/4 mb-3" />
          <div className="h-3.5 bg-slate-100 rounded w-full mb-2" />
          <div className="h-3.5 bg-slate-100 rounded w-2/3" />
        </div>
      ))}
    </div>
  );
};

export const EmptyState: React.FC<{
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}> = ({ title, description, actionLabel, onAction }) => {
  return (
    <div className="bg-white border border-slate-200/80 rounded-xl p-10 text-center">
      <h3 className="text-base font-semibold text-slate-900 mb-1.5">{title}</h3>
      <p className="text-sm text-slate-500 max-w-md mx-auto mb-5">{description}</p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

// ============================================================================
// ToastContainer & ReportModal Components
// ============================================================================
export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useApp();
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium transition-all ${
            t.type === 'error'
              ? 'bg-rose-950 text-white border-rose-800'
              : t.type === 'info'
              ? 'bg-slate-900 text-white border-slate-800'
              : 'bg-blue-600 text-white border-blue-500'
          }`}
        >
          <span>{t.message}</span>
          <button
            type="button"
            onClick={() => dismissToast(t.id)}
            className="text-white/80 hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};

export const ReportModal: React.FC = () => {
  const { reportTarget, closeReportModal, showToast } = useApp();
  const [reason, setReason] = useState('Spam');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!reportTarget) return null;

  const reasons = [
    { value: 'Spam', label: 'Spam / Quảng cáo rác' },
    { value: 'Harassment', label: 'Quấy rối / Công kích cá nhân' },
    { value: 'Inappropriate content', label: 'Nội dung không phù hợp' },
    { value: 'Hate speech', label: 'Ngôn từ gây thù ghét' },
    { value: 'Other', label: 'Lý do khác' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiRequest('/api/reports', {
        method: 'POST',
        body: JSON.stringify({
          targetType: reportTarget.targetType,
          targetId: reportTarget.targetId,
          reason,
          details,
        }),
      });
      showToast('Đã gửi báo cáo vi phạm cho ban quản trị.', 'success');
      setDetails('');
      closeReportModal();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-slate-900">Báo cáo vi phạm</h3>
          <button
            type="button"
            onClick={closeReportModal}
            className="text-slate-400 hover:text-slate-600 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          Đối tượng báo cáo: <strong className="text-slate-800">{reportTarget.targetLabel}</strong>
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-2">
              Lý do báo cáo
            </label>
            <div className="space-y-2">
              {reasons.map((r) => (
                <label
                  key={r.value}
                  className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="reportReason"
                    value={r.value}
                    checked={reason === r.value}
                    onChange={(e) => setReason(e.target.value)}
                    className="text-blue-600 focus:ring-blue-600"
                  />
                  <span>{r.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Mô tả chi tiết (không bắt buộc)
            </label>
            <textarea
              rows={3}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Cung cấp thêm ngữ cảnh để quản trị viên xử lý nhanh hơn..."
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={closeReportModal}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors whitespace-nowrap"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors whitespace-nowrap"
            >
              {submitting ? 'Đang gửi...' : 'Gửi báo cáo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
