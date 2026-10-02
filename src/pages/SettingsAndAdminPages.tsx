import React, { useCallback, useEffect, useState } from 'react';
import {
  Ban,
  CheckCircle2,
  Edit3,
  Flag,
  FolderPlus,
  Lock,
  Pin,
  ShieldCheck,
  Trash2,
  Users,
  XCircle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { apiRequest } from '../services/api';
import type { Category, CommentItem, ReportItem, Topic, User } from '../types';
import { EmptyState, LoadingSkeleton, UserAvatar } from '../components/ui/CommonUI';
import { formatRelativeTime } from '../utils/format';

// ============================================================================
// 19. SETTINGS PAGE
// ============================================================================
export const SettingsPage: React.FC = () => {
  const { user, refreshUser, navigate, showToast, logout } = useApp();
  const [newPassword, setNewPassword] = useState('');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [showOnlineStatus, setShowOnlineStatus] = useState(true);
  const [savingPassword, setSavingPassword] = useState(false);
  const [togglingRole, setTogglingRole] = useState(false);

  if (!user) return null;

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      showToast('Mật khẩu mới phải từ 6 ký tự trở lên.', 'error');
      return;
    }
    setSavingPassword(true);
    try {
      await apiRequest('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: user.email, newPassword }),
      });
      setNewPassword('');
      showToast('Đã cập nhật mật khẩu bảo mật thành công!', 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleToggleAdminMode = async () => {
    setTogglingRole(true);
    const nextRole = user.role === 'admin' ? 'user' : 'admin';
    try {
      await apiRequest('/api/users/me', {
        method: 'PUT',
        body: JSON.stringify({ role: nextRole }),
      });
      await refreshUser();
      showToast(
        nextRole === 'admin'
          ? 'Đã kích hoạt quyền Quản trị viên (Admin).'
          : 'Đã chuyển về quyền Thành viên tiêu chuẩn.',
        'info'
      );
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setTogglingRole(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200/80 rounded-xl p-6">
        <h1 className="text-xl font-bold text-slate-900">Cài đặt tài khoản</h1>
        <p className="text-sm text-slate-500 mt-1">
          Quản lý thông tin bảo mật, quyền riêng tư và tùy chọn trải nghiệm trên BlueSpace.
        </p>
      </div>

      {/* Quick Profile Overview */}
      <section className="bg-white border border-slate-200/80 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <UserAvatar name={user.displayName} avatar={user.avatar} size="lg" />
          <div>
            <h2 className="text-base font-semibold text-slate-900">{user.displayName}</h2>
            <p className="text-xs text-slate-500">
              @{user.username} · {user.email} · Vai trò:{' '}
              <strong className="text-blue-600">
                {user.role === 'admin' ? 'Quản trị viên (Admin)' : 'Thành viên'}
              </strong>
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate('edit-profile')}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-colors whitespace-nowrap self-start sm:self-auto"
        >
          <Edit3 className="w-3.5 h-3.5" /> Chỉnh sửa hồ sơ
        </button>
      </section>

      {/* Security & Password */}
      <section className="bg-white border border-slate-200/80 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Lock className="w-4 h-4 text-blue-600" />
          <h2 className="text-base font-semibold text-slate-900">Đổi mật khẩu</h2>
        </div>
        <form onSubmit={handlePasswordChange} className="max-w-md space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Mật khẩu mới (Tối thiểu 6 ký tự)
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Nhập mật khẩu mới..."
              className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600"
            />
          </div>
          <button
            type="submit"
            disabled={savingPassword}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-colors whitespace-nowrap"
          >
            {savingPassword ? 'Đang lưu...' : 'Cập nhật mật khẩu'}
          </button>
        </form>
      </section>

      {/* Preferences & Admin Role Access */}
      <section className="bg-white border border-slate-200/80 rounded-xl p-6 space-y-5">
        <h2 className="text-base font-semibold text-slate-900">
          Tùy chọn quyền riêng tư & Quản trị
        </h2>

        <div className="space-y-3 divide-y divide-slate-100">
          <label className="flex items-center justify-between py-2 cursor-pointer">
            <div>
              <p className="text-sm font-medium text-slate-800">
                Hiển thị trạng thái trực tuyến
              </p>
              <p className="text-xs text-slate-500">
                Cho phép bạn bè nhìn thấy khi bạn đang hoạt động trên diễn đàn.
              </p>
            </div>
            <input
              type="checkbox"
              checked={showOnlineStatus}
              onChange={(e) => {
                setShowOnlineStatus(e.target.checked);
                showToast('Đã lưu tùy chọn trạng thái trực tuyến.', 'info');
              }}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-600 w-4 h-4"
            />
          </label>

          <label className="flex items-center justify-between py-3 cursor-pointer">
            <div>
              <p className="text-sm font-medium text-slate-800">
                Thông báo thời gian thực
              </p>
              <p className="text-xs text-slate-500">
                Nhận thông báo ngay khi có bình luận, lượt thích hoặc tin nhắn riêng mới.
              </p>
            </div>
            <input
              type="checkbox"
              checked={emailNotifications}
              onChange={(e) => {
                setEmailNotifications(e.target.checked);
                showToast('Đã cập nhật cài đặt thông báo.', 'info');
              }}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-600 w-4 h-4"
            />
          </label>

          <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Quyền Quản trị viên (Admin Dashboard)
              </p>
              <p className="text-xs text-slate-500">
                Cho phép truy cập bảng điều khiển Admin để quản lý người dùng, danh mục và báo cáo vi phạm.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                disabled={togglingRole}
                onClick={handleToggleAdminMode}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl transition-colors whitespace-nowrap"
              >
                {user.role === 'admin' ? 'Tắt quyền Admin' : 'Bật quyền Admin'}
              </button>
              {user.role === 'admin' && (
                <button
                  type="button"
                  onClick={() => navigate('admin')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-colors whitespace-nowrap"
                >
                  Mở Admin Dashboard
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={logout}
            className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-semibold rounded-xl transition-colors whitespace-nowrap"
          >
            Đăng xuất khỏi thiết bị này
          </button>
        </div>
      </section>
    </div>
  );
};

// ============================================================================
// 20 & 21. ADMIN DASHBOARD & REPORTS MANAGEMENT PAGE
// ============================================================================
export const AdminDashboardPage: React.FC<{
  initialSection?: 'users' | 'topics' | 'comments' | 'categories' | 'reports';
}> = ({ initialSection = 'users' }) => {
  const { user, navigate, showToast, refreshCategories } = useApp();
  const [section, setSection] = useState<
    'users' | 'topics' | 'comments' | 'categories' | 'reports'
  >(initialSection);
  const [data, setData] = useState<{
    users: User[];
    topics: Topic[];
    comments: (CommentItem & { topicTitle?: string })[];
    categories: Category[];
    reports: ReportItem[];
  }>({
    users: [],
    topics: [],
    comments: [],
    categories: [],
    reports: [],
  });
  const [loading, setLoading] = useState(true);

  // New Category state
  const [catName, setCatName] = useState('');
  const [catSlug, setCatSlug] = useState('');
  const [catDesc, setCatDesc] = useState('');

  useEffect(() => {
    setSection(initialSection);
  }, [initialSection]);

  const loadAdminData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiRequest<typeof data>('/api/admin/overview');
      setData(res);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (user?.role === 'admin') {
      loadAdminData();
    } else {
      setLoading(false);
    }
  }, [user?.role, loadAdminData]);

  if (!user || user.role !== 'admin') {
    return (
      <EmptyState
        title="Khu vực dành riêng cho Quản trị viên"
        description="Bạn cần có quyền Admin để truy cập bảng điều khiển này. Bạn có thể bật quyền Admin trong mục Cài đặt."
        actionLabel="Đi tới Cài đặt"
        onAction={() => navigate('settings')}
      />
    );
  }

  const handleToggleBanUser = async (targetUser: User) => {
    try {
      await apiRequest(`/api/admin/users/${targetUser.id}/ban`, {
        method: 'POST',
        body: JSON.stringify({ isBanned: !targetUser.isBanned }),
      });
      showToast(
        !targetUser.isBanned
          ? `Đã khóa tài khoản @${targetUser.username}.`
          : `Đã mở khóa tài khoản @${targetUser.username}.`,
        'info'
      );
      loadAdminData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteUser = async (userId: number) => {
    try {
      await apiRequest(`/api/admin/users/${userId}`, { method: 'DELETE' });
      showToast('Đã xóa người dùng.', 'info');
      loadAdminData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleTogglePinTopic = async (topic: Topic) => {
    try {
      await apiRequest(`/api/topics/${topic.id}`, {
        method: 'PUT',
        body: JSON.stringify({ isPinned: !topic.isPinned }),
      });
      showToast(topic.isPinned ? 'Đã bỏ ghim chủ đề.' : 'Đã ghim chủ đề lên đầu.', 'info');
      loadAdminData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteTopic = async (topicId: number) => {
    try {
      await apiRequest(`/api/topics/${topicId}`, { method: 'DELETE' });
      showToast('Đã xóa chủ đề.', 'info');
      loadAdminData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    try {
      await apiRequest(`/api/comments/${commentId}`, { method: 'DELETE' });
      showToast('Đã xóa bình luận.', 'info');
      loadAdminData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/api/admin/categories', {
        method: 'POST',
        body: JSON.stringify({
          name: catName,
          slug: catSlug || catName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          description: catDesc,
        }),
      });
      setCatName('');
      setCatSlug('');
      setCatDesc('');
      showToast('Đã tạo danh mục mới!', 'success');
      await refreshCategories();
      loadAdminData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteCategory = async (catId: number) => {
    try {
      await apiRequest(`/api/admin/categories/${catId}`, { method: 'DELETE' });
      showToast('Đã xóa danh mục.', 'info');
      await refreshCategories();
      loadAdminData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleResolveReport = async (
    reportId: number,
    status: 'resolved' | 'dismissed'
  ) => {
    try {
      await apiRequest(`/api/admin/reports/${reportId}/resolve`, {
        method: 'POST',
        body: JSON.stringify({ status }),
      });
      showToast('Đã cập nhật trạng thái xử lý báo cáo.', 'success');
      loadAdminData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Summary Metrics */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-6 space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Admin Dashboard — Quản trị Hệ thống
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Kiểm duyệt nội dung, quản lý thành viên, danh mục và xử lý báo cáo vi phạm.
            </p>
          </div>
        </div>

        {/* High-Density Stat Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 pt-2 border-t border-slate-100">
          <div>
            <p className="text-xs text-slate-500">Thành viên</p>
            <p className="text-xl font-bold text-slate-900 tabular-nums mt-0.5">
              {data.users.length}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Chủ đề</p>
            <p className="text-xl font-bold text-slate-900 tabular-nums mt-0.5">
              {data.topics.length}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Bình luận</p>
            <p className="text-xl font-bold text-slate-900 tabular-nums mt-0.5">
              {data.comments.length}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Danh mục</p>
            <p className="text-xl font-bold text-slate-900 tabular-nums mt-0.5">
              {data.categories.length}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Báo cáo chờ xử lý</p>
            <p className="text-xl font-bold text-blue-600 tabular-nums mt-0.5">
              {data.reports.filter((r) => r.status === 'pending').length}
            </p>
          </div>
        </div>

        {/* Section Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto">
          {[
            { id: 'users', label: `Users (${data.users.length})` },
            { id: 'topics', label: `Topics (${data.topics.length})` },
            { id: 'comments', label: `Comments (${data.comments.length})` },
            { id: 'categories', label: `Categories (${data.categories.length})` },
            { id: 'reports', label: `Reports (${data.reports.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSection(tab.id as any)}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                section === tab.id
                  ? 'bg-white text-blue-600 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <LoadingSkeleton count={2} />
      ) : (
        <>
          {/* 1. USERS MANAGEMENT */}
          {section === 'users' && (
            <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-600">
                      <th className="py-3 px-4">Thành viên</th>
                      <th className="py-3 px-4">Email</th>
                      <th className="py-3 px-4">Vai trò</th>
                      <th className="py-3 px-4">Trạng thái</th>
                      <th className="py-3 px-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {data.users.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <UserAvatar
                              name={u.displayName}
                              avatar={u.avatar}
                              size="xs"
                            />
                            <div>
                              <p className="font-medium text-slate-900">
                                {u.displayName}
                              </p>
                              <p className="text-xs text-slate-400">@{u.username}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-600">{u.email}</td>
                        <td className="py-3 px-4 text-xs font-medium text-slate-700">
                          {u.role === 'admin' ? 'Admin' : 'User'}
                        </td>
                        <td className="py-3 px-4 text-xs">
                          {u.isBanned ? (
                            <span className="text-rose-600 font-medium">Đã khóa (Banned)</span>
                          ) : (
                            <span className="text-emerald-600 font-medium">Hoạt động</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                          {u.id !== user.id && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleToggleBanUser(u)}
                                className="px-2.5 py-1 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors"
                              >
                                {u.isBanned ? 'Unban' : 'Ban'}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteUser(u.id)}
                                className="px-2.5 py-1 text-xs font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors"
                              >
                                Xóa
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 2. TOPICS MANAGEMENT */}
          {section === 'topics' && (
            <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-600">
                      <th className="py-3 px-4">Tiêu đề chủ đề</th>
                      <th className="py-3 px-4">Tác giả</th>
                      <th className="py-3 px-4">Danh mục</th>
                      <th className="py-3 px-4 text-right">Lượt xem</th>
                      <th className="py-3 px-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {data.topics.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 max-w-xs">
                          <button
                            type="button"
                            onClick={() => navigate('topic-detail', { topicId: t.id })}
                            className="font-medium text-slate-900 hover:text-blue-600 text-left line-clamp-1"
                          >
                            {t.isPinned ? '[Ghim] ' : ''}
                            {t.title}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-600">
                          {t.author.displayName}
                        </td>
                        <td className="py-3 px-4 text-xs text-blue-600">
                          {t.category?.name || 'General'}
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-600 text-right tabular-nums">
                          {t.views}
                        </td>
                        <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleTogglePinTopic(t)}
                            className="px-2.5 py-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg"
                          >
                            {t.isPinned ? 'Bỏ ghim' : 'Ghim'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteTopic(t.id)}
                            className="px-2.5 py-1 text-xs font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg"
                          >
                            Xóa
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 3. COMMENTS MANAGEMENT */}
          {section === 'comments' && (
            <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-600">
                      <th className="py-3 px-4">Nội dung bình luận</th>
                      <th className="py-3 px-4">Người gửi</th>
                      <th className="py-3 px-4">Thuộc chủ đề</th>
                      <th className="py-3 px-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {data.comments.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 max-w-md">
                          <p className="text-xs text-slate-800 line-clamp-2">{c.content}</p>
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-600">
                          {c.author?.displayName || `User #${c.authorId}`}
                        </td>
                        <td className="py-3 px-4 text-xs text-blue-600 max-w-xs truncate">
                          <button
                            type="button"
                            onClick={() => navigate('topic-detail', { topicId: c.topicId })}
                            className="hover:underline truncate"
                          >
                            {c.topicTitle}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleDeleteComment(c.id)}
                            className="px-2.5 py-1 text-xs font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg"
                          >
                            Xóa bình luận
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 4. CATEGORIES MANAGEMENT */}
          {section === 'categories' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-5 bg-white border border-slate-200/80 rounded-xl p-6 h-fit">
                <h3 className="text-base font-semibold text-slate-900 mb-4">
                  Thêm Danh mục mới
                </h3>
                <form onSubmit={handleCreateCategory} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Tên danh mục *
                    </label>
                    <input
                      type="text"
                      required
                      value={catName}
                      onChange={(e) => setCatName(e.target.value)}
                      placeholder="vd: Artificial Intelligence"
                      className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Slug đường dẫn *
                    </label>
                    <input
                      type="text"
                      required
                      value={catSlug}
                      onChange={(e) => setCatSlug(e.target.value)}
                      placeholder="vd: ai-machine-learning"
                      className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Mô tả
                    </label>
                    <textarea
                      rows={3}
                      value={catDesc}
                      onChange={(e) => setCatDesc(e.target.value)}
                      placeholder="Mô tả ngắn gọn về nội dung của danh mục..."
                      className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-colors"
                  >
                    + Tạo danh mục
                  </button>
                </form>
              </div>

              <div className="md:col-span-7 bg-white border border-slate-200/80 rounded-xl p-6">
                <h3 className="text-base font-semibold text-slate-900 mb-4">
                  Danh mục hiện có ({data.categories.length})
                </h3>
                <div className="divide-y divide-slate-100">
                  {data.categories.map((cat) => (
                    <div
                      key={cat.id}
                      className="py-3 flex items-center justify-between gap-4"
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {cat.name}{' '}
                          <span className="text-xs font-normal text-slate-400">
                            /{cat.slug} · {cat.topicCount || 0} bài
                          </span>
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">{cat.description}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 rounded-lg"
                        title="Xóa danh mục"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 5. REPORTS MANAGEMENT */}
          {section === 'reports' && (
            <div className="space-y-3">
              {data.reports.length === 0 ? (
                <EmptyState
                  title="Chưa có báo cáo vi phạm nào"
                  description="Cộng đồng hiện đang hoạt động lành mạnh, không có báo cáo nào tồn đọng."
                />
              ) : (
                data.reports.map((rep) => (
                  <div
                    key={rep.id}
                    className="bg-white border border-slate-200/80 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center flex-wrap gap-2 text-xs text-slate-500">
                        <span className="font-semibold text-slate-900">
                          Loại: {rep.targetType.toUpperCase()}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="text-rose-600 font-medium">Lý do: {rep.reason}</span>
                        <span aria-hidden="true">·</span>
                        <span>
                          Trạng thái:{' '}
                          <strong
                            className={
                              rep.status === 'pending'
                                ? 'text-amber-600'
                                : 'text-emerald-600'
                            }
                          >
                            {rep.status}
                          </strong>
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="tabular-nums">
                          {formatRelativeTime(rep.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-slate-800">
                        Đối tượng: {rep.targetSummary}
                      </p>
                      {rep.details && (
                        <p className="text-xs text-slate-600">Chi tiết: "{rep.details}"</p>
                      )}
                      <p className="text-xs text-slate-400">
                        Người báo cáo: {rep.reporter?.displayName || `User #${rep.reporterId}`}
                      </p>
                    </div>

                    {rep.status === 'pending' && (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleResolveReport(rep.id, 'resolved')}
                          className="inline-flex items-center gap-1 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-colors whitespace-nowrap"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Đánh dấu Đã xử lý
                        </button>
                        <button
                          type="button"
                          onClick={() => handleResolveReport(rep.id, 'dismissed')}
                          className="inline-flex items-center gap-1 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors whitespace-nowrap"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Bỏ qua
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};
