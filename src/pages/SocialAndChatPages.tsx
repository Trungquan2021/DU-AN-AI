import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Calendar,
  Check,
  CheckCheck,
  Edit3,
  Flag,
  MessageCircle,
  Send,
  Smile,
  UserCheck,
  UserMinus,
  UserPlus,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { apiRequest } from '../services/api';
import type {
  NotificationItem,
  PrivateMessage,
  Topic,
  User,
} from '../types';
import {
  EmptyState,
  LoadingSkeleton,
  NotificationItemCard,
  TopicCard,
  UserAvatar,
  UserCard,
} from '../components/ui/CommonUI';
import {
  formatFullDate,
  formatRelativeTime,
  formatTimeShort,
  GENERATED_ASSETS,
} from '../utils/format';

// ============================================================================
// 10. USER PROFILE PAGE
// ============================================================================
export const UserProfilePage: React.FC = () => {
  const {
    route,
    user,
    socialData,
    refreshSocial,
    navigate,
    showToast,
    openReportModal,
  } = useApp();
  const [profile, setProfile] = useState<User | null>(null);
  const [userTopics, setUserTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const targetUserId = route.userId || user?.id;

  const loadProfile = useCallback(async () => {
    if (!targetUserId) return;
    setLoading(true);
    try {
      const res = await apiRequest<{ profile: User; topics: Topic[] }>(
        `/api/users/${targetUserId}`
      );
      setProfile(res.profile);
      setUserTopics(res.topics || []);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [targetUserId, showToast]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  if (loading) return <LoadingSkeleton count={2} />;
  if (!profile) {
    return (
      <EmptyState
        title="Không tìm thấy hồ sơ thành viên"
        description="Tài khoản này không tồn tại hoặc đã bị xóa."
        actionLabel="Quay về Trang chủ"
        onAction={() => navigate('home')}
      />
    );
  }

  const isOwnProfile = user?.id === profile.id;
  const friendship = socialData.friendships.find(
    (f) =>
      (f.requesterId === user?.id && f.receiverId === profile.id) ||
      (f.requesterId === profile.id && f.receiverId === user?.id)
  );

  const handleAddFriend = async () => {
    if (!user) {
      navigate('login');
      return;
    }
    setBusy(true);
    try {
      await apiRequest('/api/friends/request', {
        method: 'POST',
        body: JSON.stringify({ receiverId: profile.id }),
      });
      showToast('Friend request sent — Đã gửi lời mời kết bạn.', 'success');
      await refreshSocial();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleRespondRequest = async (action: 'accepted' | 'declined') => {
    if (!friendship) return;
    setBusy(true);
    try {
      await apiRequest('/api/friends/respond', {
        method: 'POST',
        body: JSON.stringify({ friendshipId: friendship.id, action }),
      });
      showToast(
        action === 'accepted'
          ? 'Đã chấp nhận lời mời kết bạn!'
          : 'Đã từ chối lời mời kết bạn.',
        'info'
      );
      await refreshSocial();
      await loadProfile();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleRemoveFriend = async () => {
    setBusy(true);
    try {
      await apiRequest(`/api/friends/${profile.id}`, { method: 'DELETE' });
      showToast('Đã hủy kết bạn.', 'info');
      await refreshSocial();
      await loadProfile();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile Card */}
      <section className="bg-white border border-slate-200/80 rounded-xl overflow-hidden">
        <div className="h-28 bg-gradient-to-r from-blue-600 via-blue-700 to-slate-900" />
        <div className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-10 mb-4">
            <UserAvatar
              name={profile.displayName}
              avatar={profile.avatar}
              size="xl"
              online={profile.onlineStatus}
              showStatusDot
            />

            <div className="flex items-center flex-wrap gap-2">
              {isOwnProfile ? (
                <button
                  type="button"
                  onClick={() => navigate('edit-profile')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-colors whitespace-nowrap"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Profile</span>
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      if (!user) {
                        navigate('login');
                        return;
                      }
                      navigate('messages', { chatPartnerId: profile.id });
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl transition-colors whitespace-nowrap"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Message</span>
                  </button>

                  {!friendship && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={handleAddFriend}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-colors whitespace-nowrap"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Add Friend</span>
                    </button>
                  )}

                  {friendship?.status === 'pending' &&
                    friendship.requesterId === user?.id && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={handleRemoveFriend}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 text-xs font-semibold rounded-xl transition-colors whitespace-nowrap"
                      >
                        <span>Request Sent (Hủy)</span>
                      </button>
                    )}

                  {friendship?.status === 'pending' &&
                    friendship.receiverId === user?.id && (
                      <>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => handleRespondRequest('accepted')}
                          className="inline-flex items-center gap-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-colors whitespace-nowrap"
                        >
                          <Check className="w-3.5 h-3.5" /> Accept
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => handleRespondRequest('declined')}
                          className="inline-flex items-center gap-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors whitespace-nowrap"
                        >
                          <X className="w-3.5 h-3.5" /> Decline
                        </button>
                      </>
                    )}

                  {friendship?.status === 'accepted' && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={handleRemoveFriend}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-rose-50 text-emerald-700 hover:text-rose-600 text-xs font-semibold rounded-xl transition-colors whitespace-nowrap"
                      title="Nhấn để hủy kết bạn"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Friends · Remove Friend</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      if (!user) {
                        navigate('login');
                        return;
                      }
                      openReportModal({
                        targetType: 'user',
                        targetId: profile.id,
                        targetLabel: `${profile.displayName} (@${profile.username})`,
                      });
                    }}
                    className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-50"
                    title="Báo cáo người dùng"
                  >
                    <Flag className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center flex-wrap gap-2">
              <h1 className="text-xl font-bold text-slate-900">{profile.displayName}</h1>
              <span className="text-sm text-slate-400">@{profile.username}</span>
              <span aria-hidden="true" className="text-slate-300">
                ·
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600">
                <span
                  className={`w-2 h-2 rounded-full ${
                    profile.onlineStatus ? 'bg-emerald-500' : 'bg-slate-300'
                  }`}
                />
                {profile.onlineStatus ? 'Đang trực tuyến' : 'Ngoại tuyến'}
              </span>
            </div>

            {profile.bio && (
              <p className="text-sm text-slate-700 leading-relaxed max-w-2xl">
                {profile.bio}
              </p>
            )}

            <div className="flex items-center flex-wrap gap-4 pt-2 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Tham gia ngày {formatFullDate(profile.createdAt)}
              </span>
            </div>
          </div>

          {/* Profile Stats Row */}
          <div className="mt-6 pt-5 border-t border-slate-100 grid grid-cols-3 gap-4 max-w-md">
            <div>
              <p className="text-lg font-bold text-slate-900 tabular-nums">
                {profile.friendsCount || 0}
              </p>
              <p className="text-xs text-slate-500">Bạn bè</p>
            </div>
            <div>
              <p className="text-lg font-bold text-slate-900 tabular-nums">
                {profile.topicsCount || userTopics.length}
              </p>
              <p className="text-xs text-slate-500">Chủ đề đã tạo</p>
            </div>
            <div>
              <p className="text-lg font-bold text-slate-900 tabular-nums">
                {profile.postsCount || userTopics.length}
              </p>
              <p className="text-xs text-slate-500">Tổng bài viết</p>
            </div>
          </div>
        </div>
      </section>

      {/* User's Created Topics */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold text-slate-900 px-1">
          Chủ đề của {profile.displayName} ({userTopics.length})
        </h2>
        {userTopics.length === 0 ? (
          <EmptyState
            title="Chưa có chủ đề nào"
            description="Thành viên này chưa đăng chủ đề thảo luận nào."
          />
        ) : (
          userTopics.map((t) => <TopicCard key={t.id} topic={t} onRefresh={loadProfile} />)
        )}
      </section>
    </div>
  );
};

// ============================================================================
// 11. EDIT PROFILE PAGE
// ============================================================================
export const EditProfilePage: React.FC = () => {
  const { user, refreshUser, navigate, showToast } = useApp();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [username, setUsername] = useState(user?.username || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName);
      setUsername(user.username);
      setBio(user.bio || '');
      setAvatar(user.avatar || '');
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      await apiRequest('/api/users/me', {
        method: 'PUT',
        body: JSON.stringify({
          displayName,
          username,
          bio,
          avatar,
        }),
      });
      await refreshUser();
      showToast('Đã cập nhật hồ sơ cá nhân!', 'success');
      navigate('profile', { userId: user.id });
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="bg-white border border-slate-200/80 rounded-xl p-6 sm:p-8">
      <button
        type="button"
        onClick={() => navigate('profile', { userId: user.id })}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-blue-600 mb-4"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Quay lại Hồ sơ cá nhân
      </button>

      <h1 className="text-2xl font-bold text-slate-900 mb-1">Chỉnh sửa Hồ sơ cá nhân</h1>
      <p className="text-sm text-slate-500 mb-6">
        Cập nhật ảnh đại diện, tên hiển thị và lời giới thiệu bản thân.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5 max-w-xl">
        <div className="flex items-center gap-4">
          <UserAvatar name={displayName} avatar={avatar} size="xl" />
          <div className="flex-1 space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              URL Ảnh đại diện (Avatar)
            </label>
            <input
              type="text"
              value={avatar}
              onChange={(e) => setAvatar(e.target.value)}
              placeholder="Nhập URL ảnh hoặc chọn ảnh mẫu bên dưới..."
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600"
            />
            <div className="flex items-center gap-3 text-xs">
              <span className="text-slate-400">Ảnh mẫu studio:</span>
              <button
                type="button"
                onClick={() => setAvatar(GENERATED_ASSETS.avatarMinh)}
                className="text-blue-600 hover:underline"
              >
                Chân dung Nam
              </button>
              <button
                type="button"
                onClick={() => setAvatar(GENERATED_ASSETS.avatarLinh)}
                className="text-blue-600 hover:underline"
              >
                Chân dung Nữ
              </button>
              <button
                type="button"
                onClick={() => setAvatar('')}
                className="text-slate-500 hover:underline"
              >
                Dùng chữ cái tên
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Tên hiển thị (Display Name) *
            </label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Username *
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Giới thiệu bản thân (Bio)
          </label>
          <textarea
            rows={4}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Chia sẻ đôi nét về chuyên môn, sở thích của bạn..."
            className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600"
          />
        </div>

        <div className="pt-3 flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-colors whitespace-nowrap"
          >
            {saving ? 'Đang lưu...' : 'Lưu cập nhật'}
          </button>
          <button
            type="button"
            onClick={() => navigate('profile', { userId: user.id })}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors whitespace-nowrap"
          >
            Hủy
          </button>
        </div>
      </form>
    </div>
  );
};

// ============================================================================
// 12 & 13. FRIENDS & FRIEND REQUESTS PAGE
// ============================================================================
export const FriendsPage: React.FC<{ initialTab?: 'friends' | 'requests' | 'suggested' | 'online' }> = ({
  initialTab = 'friends',
}) => {
  const { socialData, refreshSocial, navigate, showToast } = useApp();
  const [tab, setTab] = useState<'friends' | 'requests' | 'suggested' | 'online'>(
    initialTab
  );

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  const handleRespond = async (
    friendshipId: number,
    action: 'accepted' | 'declined'
  ) => {
    try {
      await apiRequest('/api/friends/respond', {
        method: 'POST',
        body: JSON.stringify({ friendshipId, action }),
      });
      showToast(
        action === 'accepted'
          ? 'Đã chấp nhận lời mời kết bạn!'
          : 'Đã từ chối lời mời.',
        'success'
      );
      await refreshSocial();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleRemove = async (targetUserId: number) => {
    try {
      await apiRequest(`/api/friends/${targetUserId}`, { method: 'DELETE' });
      showToast('Đã xóa khỏi danh sách bạn bè.', 'info');
      await refreshSocial();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200/80 rounded-xl p-6 space-y-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Mạng lưới Bạn bè</h1>
          <p className="text-sm text-slate-500 mt-1">
            Quản lý danh sách bạn bè, lời mời kết bạn và kết nối với các thành viên đang trực tuyến.
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto">
          <button
            type="button"
            onClick={() => setTab('friends')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              tab === 'friends'
                ? 'bg-white text-blue-600 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Bạn bè ({socialData.friends.length})
          </button>
          <button
            type="button"
            onClick={() => setTab('requests')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              tab === 'requests'
                ? 'bg-white text-blue-600 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Lời mời kết bạn ({socialData.incomingRequests.length})
          </button>
          <button
            type="button"
            onClick={() => setTab('suggested')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              tab === 'suggested'
                ? 'bg-white text-blue-600 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Gợi ý kết bạn ({socialData.suggestedUsers.length})
          </button>
          <button
            type="button"
            onClick={() => setTab('online')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              tab === 'online'
                ? 'bg-white text-blue-600 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Đang Online ({socialData.onlineUsers.length})
          </button>
        </div>
      </div>

      {/* Friends List */}
      {tab === 'friends' && (
        <div className="space-y-3">
          {socialData.friends.length === 0 ? (
            <EmptyState
              title="Chưa có bạn bè nào"
              description="Hãy khám phá tab Gợi ý kết bạn để bắt đầu kết nối với các thành viên khác."
              actionLabel="Xem gợi ý kết bạn"
              onAction={() => setTab('suggested')}
            />
          ) : (
            socialData.friends.map((item) => (
              <div
                key={item.friendshipId}
                className="bg-white border border-slate-200/80 rounded-xl p-4 flex items-center justify-between gap-4"
              >
                <div
                  onClick={() => navigate('profile', { userId: item.user.id })}
                  className="flex items-center gap-3.5 min-w-0 cursor-pointer"
                >
                  <UserAvatar
                    name={item.user.displayName}
                    avatar={item.user.avatar}
                    size="md"
                    online={item.user.onlineStatus}
                    showStatusDot
                  />
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-slate-900 hover:text-blue-600 truncate">
                      {item.user.displayName}
                    </h3>
                    <p className="text-xs text-slate-500 truncate">
                      @{item.user.username} ·{' '}
                      {item.user.onlineStatus ? 'Trực tuyến' : 'Ngoại tuyến'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => navigate('messages', { chatPartnerId: item.user.id })}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-colors whitespace-nowrap"
                  >
                    <MessageCircle className="w-3.5 h-3.5" /> Nhắn tin
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemove(item.user.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                    title="Hủy kết bạn"
                  >
                    <UserMinus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Friend Requests */}
      {tab === 'requests' && (
        <div className="space-y-6">
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-slate-900 px-1">
              Lời mời nhận được ({socialData.incomingRequests.length})
            </h2>
            {socialData.incomingRequests.length === 0 ? (
              <EmptyState
                title="Không có lời mời kết bạn mới"
                description="Khi có người gửi lời mời kết bạn cho bạn, chúng sẽ xuất hiện tại đây."
              />
            ) : (
              socialData.incomingRequests.map((req) => (
                <div
                  key={req.friendshipId}
                  className="bg-white border border-slate-200/80 rounded-xl p-4 flex items-center justify-between gap-4"
                >
                  <div
                    onClick={() => navigate('profile', { userId: req.user.id })}
                    className="flex items-center gap-3.5 min-w-0 cursor-pointer"
                  >
                    <UserAvatar
                      name={req.user.displayName}
                      avatar={req.user.avatar}
                      size="md"
                      online={req.user.onlineStatus}
                      showStatusDot
                    />
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-slate-900 truncate">
                        {req.user.displayName}
                      </h3>
                      <p className="text-xs text-slate-500">
                        @{req.user.username} · {formatRelativeTime(req.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleRespond(req.friendshipId, 'accepted')}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap"
                    >
                      Accept
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRespond(req.friendshipId, 'declined')}
                      className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))
            )}
          </section>

          {socialData.outgoingRequests.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-slate-900 px-1">
                Lời mời đã gửi ({socialData.outgoingRequests.length})
              </h2>
              {socialData.outgoingRequests.map((req) => (
                <div
                  key={req.friendshipId}
                  className="bg-white border border-slate-200/80 rounded-xl p-4 flex items-center justify-between gap-4"
                >
                  <div
                    onClick={() => navigate('profile', { userId: req.user.id })}
                    className="flex items-center gap-3 cursor-pointer"
                  >
                    <UserAvatar
                      name={req.user.displayName}
                      avatar={req.user.avatar}
                      size="sm"
                    />
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {req.user.displayName}
                      </p>
                      <p className="text-xs text-slate-400">Request Sent · Đang chờ phản hồi</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemove(req.user.id)}
                    className="px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg"
                  >
                    Thu hồi
                  </button>
                </div>
              ))}
            </section>
          )}
        </div>
      )}

      {/* Suggested Friends */}
      {tab === 'suggested' && (
        <div className="space-y-3">
          {socialData.suggestedUsers.map((u) => (
            <UserCard key={u.id} targetUser={u} />
          ))}
        </div>
      )}

      {/* Online Users */}
      {tab === 'online' && (
        <div className="space-y-3">
          {socialData.onlineUsers.length === 0 ? (
            <EmptyState
              title="Chưa có thành viên nào khác đang trực tuyến"
              description="Bạn vẫn có thể gửi tin nhắn hoặc lời mời kết bạn bất kỳ lúc nào."
            />
          ) : (
            socialData.onlineUsers.map((u) => <UserCard key={u.id} targetUser={u} />)
          )}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 14 & 15. PRIVATE MESSAGING & CHAT DETAIL PAGE
// ============================================================================
const QUICK_EMOJIS = ['👋', '😊', '👍', '🎉', '🔥', '🚀', '💡', '❤️', '🙏', '✨'];

export const MessagesPage: React.FC = () => {
  const {
    user,
    route,
    conversations,
    refreshConversations,
    socialData,
    navigate,
    showToast,
    subscribeSocket,
    sendSocketEvent,
  } = useApp();

  const [selectedPartnerId, setSelectedPartnerId] = useState<number | null>(
    route.chatPartnerId || null
  );
  const [partner, setPartner] = useState<User | null>(null);
  const [messagesList, setMessagesList] = useState<PrivateMessage[]>([]);
  const [messageText, setMessageText] = useState('');
  const [showEmojis, setShowEmojis] = useState(false);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [loadingThread, setLoadingThread] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    refreshConversations();
  }, [refreshConversations]);

  useEffect(() => {
    if (route.chatPartnerId) {
      setSelectedPartnerId(route.chatPartnerId);
    } else if (!selectedPartnerId && conversations.length > 0) {
      setSelectedPartnerId(conversations[0].partner.id);
    } else if (!selectedPartnerId && socialData.allUsers.length > 0) {
      const firstOther = socialData.allUsers.find((u) => u.id !== user?.id);
      if (firstOther) setSelectedPartnerId(firstOther.id);
    }
  }, [route.chatPartnerId, conversations, socialData.allUsers, selectedPartnerId, user?.id]);

  const loadThread = useCallback(async (partnerId: number) => {
    setLoadingThread(true);
    try {
      const res = await apiRequest<{ messages: PrivateMessage[]; partner: User }>(
        `/api/messages/${partnerId}`
      );
      setMessagesList(res.messages || []);
      setPartner(res.partner);
      refreshConversations();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoadingThread(false);
    }
  }, [refreshConversations, showToast]);

  useEffect(() => {
    if (selectedPartnerId) {
      loadThread(selectedPartnerId);
    }
  }, [selectedPartnerId, loadThread]);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messagesList]);

  // Real-time WebSocket message & read status listener
  useEffect(() => {
    return subscribeSocket((event) => {
      if (event.type === 'message:new' && event.message) {
        const msg: PrivateMessage = event.message;
        const isCurrentThread =
          (msg.senderId === selectedPartnerId && msg.receiverId === user?.id) ||
          (msg.senderId === user?.id && msg.receiverId === selectedPartnerId);

        if (isCurrentThread) {
          setMessagesList((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
        }
      } else if (event.type === 'message:read' && event.readerId === selectedPartnerId) {
        setMessagesList((prev) =>
          prev.map((m) =>
            m.senderId === user?.id && !m.readAt
              ? { ...m, readAt: new Date().toISOString() }
              : m
          )
        );
      } else if (event.type === 'chat:typing' && event.senderId === selectedPartnerId) {
        setPartnerTyping(Boolean(event.isTyping));
      }
    });
  }, [subscribeSocket, selectedPartnerId, user?.id]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPartnerId || !messageText.trim()) return;
    const textToSend = messageText;
    setMessageText('');
    setShowEmojis(false);
    sendSocketEvent({
      type: 'typing',
      receiverId: selectedPartnerId,
      isTyping: false,
    });

    try {
      const res = await apiRequest<{ message: PrivateMessage }>('/api/messages', {
        method: 'POST',
        body: JSON.stringify({
          receiverId: selectedPartnerId,
          content: textToSend,
        }),
      });
      setMessagesList((prev) => {
        if (prev.some((m) => m.id === res.message.id)) return prev;
        return [...prev, res.message];
      });
      showToast('Message sent', 'info');
      refreshConversations();
    } catch (err: any) {
      setMessageText(textToSend);
      showToast(err.message, 'error');
    }
  };

  // Combine conversations + all users so the user can easily message anyone
  const chatDirectory = React.useMemo(() => {
    const existingIds = new Set(conversations.map((c) => c.partner.id));
    const extraUsers = socialData.allUsers
      .filter((u) => u.id !== user?.id && !existingIds.has(u.id))
      .map((u) => ({
        partner: u,
        lastMessage: null,
        unreadCount: 0,
        updatedAt: 0,
      }));
    return [...conversations, ...extraUsers];
  }, [conversations, socialData.allUsers, user?.id]);

  return (
    <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden grid grid-cols-1 md:grid-cols-12 h-[calc(100vh-7rem)] min-h-[540px]">
      {/* Left Column: Conversation List */}
      <div className="md:col-span-4 border-r border-slate-200 flex flex-col h-full">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">Tin nhắn riêng</h2>
          <span className="text-xs text-slate-400 tabular-nums">
            {chatDirectory.length} liên hệ
          </span>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {chatDirectory.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500">
              Chưa có cuộc trò chuyện nào.
            </div>
          ) : (
            chatDirectory.map((conv) => {
              const active = selectedPartnerId === conv.partner.id;
              return (
                <button
                  key={conv.partner.id}
                  type="button"
                  onClick={() => setSelectedPartnerId(conv.partner.id)}
                  className={`w-full p-3.5 flex items-center justify-between gap-3 text-left transition-colors ${
                    active ? 'bg-blue-50/80' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <UserAvatar
                      name={conv.partner.displayName}
                      avatar={conv.partner.avatar}
                      size="md"
                      online={conv.partner.onlineStatus}
                      showStatusDot
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p
                          className={`text-sm truncate ${
                            active || conv.unreadCount > 0
                              ? 'font-semibold text-slate-900'
                              : 'font-medium text-slate-800'
                          }`}
                        >
                          {conv.partner.displayName}
                        </p>
                      </div>
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        {conv.lastMessage
                          ? conv.lastMessage.content
                          : `@${conv.partner.username} · Bắt đầu trò chuyện`}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {conv.lastMessage && (
                      <span className="text-[11px] text-slate-400 tabular-nums">
                        {formatTimeShort(conv.lastMessage.createdAt)}
                      </span>
                    )}
                    {conv.unreadCount > 0 && (
                      <span className="px-1.5 py-0.5 bg-blue-600 text-white text-[10px] font-bold rounded-full tabular-nums">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Right Column: Active Chat Detail */}
      <div className="md:col-span-8 flex flex-col h-full bg-[#F8FAFC]/60">
        {partner ? (
          <>
            {/* Chat Header */}
            <div className="p-4 bg-white border-b border-slate-200 flex items-center justify-between">
              <div
                onClick={() => navigate('profile', { userId: partner.id })}
                className="flex items-center gap-3 cursor-pointer"
              >
                <UserAvatar
                  name={partner.displayName}
                  avatar={partner.avatar}
                  size="sm"
                  online={partner.onlineStatus}
                  showStatusDot
                />
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 hover:text-blue-600">
                    {partner.displayName}
                  </h3>
                  <p className="text-xs text-slate-500">
                    @{partner.username} ·{' '}
                    {partnerTyping ? (
                      <span className="text-blue-600 font-medium">Đang nhập tin nhắn...</span>
                    ) : partner.onlineStatus ? (
                      <span className="text-emerald-600 font-medium">Đang trực tuyến</span>
                    ) : (
                      <span>Ngoại tuyến</span>
                    )}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate('profile', { userId: partner.id })}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors whitespace-nowrap"
              >
                Xem hồ sơ
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
              {loadingThread ? (
                <div className="text-center text-xs text-slate-400 py-8">
                  Đang tải cuộc trò chuyện...
                </div>
              ) : messagesList.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-sm font-medium text-slate-700 mb-1">
                    Bắt đầu cuộc trò chuyện với {partner.displayName}
                  </p>
                  <p className="text-xs text-slate-400">
                    Tin nhắn được truyền tải theo thời gian thực qua WebSocket.
                  </p>
                </div>
              ) : (
                messagesList.map((msg) => {
                  const isMine = msg.senderId === user?.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${
                        isMine ? 'items-end' : 'items-start'
                      }`}
                    >
                      <div
                        className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                          isMine
                            ? 'bg-blue-600 text-white rounded-br-xs'
                            : 'bg-white border border-slate-200/80 text-slate-800 rounded-bl-xs'
                        }`}
                      >
                        <p className="whitespace-pre-line">{msg.content}</p>
                      </div>
                      <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-400 px-1 tabular-nums">
                        <span>{formatTimeShort(msg.createdAt)}</span>
                        {isMine && (
                          <span className="inline-flex items-center gap-0.5">
                            {msg.readAt ? (
                              <>
                                <CheckCheck className="w-3 h-3 text-blue-600" />
                                <span>Đã xem</span>
                              </>
                            ) : (
                              <>
                                <Check className="w-3 h-3" />
                                <span>Đã gửi</span>
                              </>
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-slate-200 relative">
              {showEmojis && (
                <div className="absolute bottom-16 left-4 bg-white border border-slate-200 rounded-xl shadow-lg p-2 flex items-center gap-1.5 z-10">
                  {QUICK_EMOJIS.map((em) => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => setMessageText((prev) => prev + em)}
                      className="w-8 h-8 hover:bg-slate-100 rounded-lg text-base flex items-center justify-center transition-colors"
                    >
                      {em}
                    </button>
                  ))}
                </div>
              )}

              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowEmojis(!showEmojis)}
                  className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-xl transition-colors"
                  title="Chọn biểu tượng cảm xúc"
                >
                  <Smile className="w-5 h-5" />
                </button>
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => {
                    setMessageText(e.target.value);
                    if (selectedPartnerId) {
                      sendSocketEvent({
                        type: 'typing',
                        receiverId: selectedPartnerId,
                        isTyping: e.target.value.length > 0,
                      });
                    }
                  }}
                  placeholder={`Nhắn tin tới ${partner.displayName}...`}
                  className="flex-1 px-4 py-2.5 text-sm bg-[#F8FAFC] border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-blue-600"
                />
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-colors whitespace-nowrap"
                >
                  <Send className="w-4 h-4" />
                  <span>Gửi</span>
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-8 text-center">
            <div>
              <h3 className="text-base font-semibold text-slate-900 mb-1">
                Chọn một cuộc trò chuyện
              </h3>
              <p className="text-xs text-slate-500">
                Chọn một người bạn ở danh sách bên trái để bắt đầu nhắn tin riêng 1-1.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// 16. NOTIFICATIONS PAGE
// ============================================================================
export const NotificationsPage: React.FC = () => {
  const {
    notifications,
    refreshNotifications,
    navigate,
    showToast,
  } = useApp();

  const handleSelectNotification = async (item: NotificationItem) => {
    if (!item.read) {
      try {
        await apiRequest(`/api/notifications/${item.id}/read`, { method: 'POST' });
        refreshNotifications();
      } catch {}
    }

    if (item.type === 'friend_request') {
      navigate('friend-requests');
    } else if (item.type === 'friend_accepted' && item.referenceId) {
      navigate('profile', { userId: item.referenceId });
    } else if (item.type === 'new_message' && item.referenceId) {
      navigate('messages', { chatPartnerId: item.referenceId });
    } else if (item.referenceId) {
      navigate('topic-detail', { topicId: item.referenceId });
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await apiRequest('/api/notifications/read-all', { method: 'POST' });
      await refreshNotifications();
      showToast('Đã đánh dấu tất cả thông báo là đã đọc.', 'info');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="space-y-5">
      <div className="bg-white border border-slate-200/80 rounded-xl p-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Thông báo</h1>
          <p className="text-sm text-slate-500 mt-1">
            Cập nhật tức thì về bình luận, lượt thích, lời mời kết bạn và tin nhắn mới.
          </p>
        </div>
        {notifications.some((n) => !n.read) && (
          <button
            type="button"
            onClick={handleMarkAllRead}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors whitespace-nowrap"
          >
            Đánh dấu tất cả đã đọc
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState
          title="Không có thông báo nào"
          description="Khi có thành viên tương tác với bài viết hoặc gửi lời mời kết bạn, thông báo sẽ hiển thị tại đây."
        />
      ) : (
        <div className="space-y-2.5">
          {notifications.map((n) => (
            <NotificationItemCard
              key={n.id}
              item={n}
              onSelect={handleSelectNotification}
            />
          ))}
        </div>
      )}
    </div>
  );
};
