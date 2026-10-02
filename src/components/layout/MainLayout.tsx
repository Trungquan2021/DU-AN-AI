import React, { useEffect, useState } from 'react';
import {
  Bell,
  BookOpen,
  Compass,
  Flag,
  FolderKanban,
  Home,
  LogOut,
  Menu,
  MessageSquare,
  Plus,
  Settings,
  ShieldCheck,
  User as UserIcon,
  Users,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { UserAvatar, UserCard } from '../ui/CommonUI';
import { apiRequest } from '../../services/api';
import type { ScreenName, Topic } from '../../types';

export const MainLayout: React.FC<{
  children: React.ReactNode;
  hideRightSidebar?: boolean;
}> = ({ children, hideRightSidebar = false }) => {
  const {
    user,
    route,
    navigate,
    categories,
    socialData,
    unreadNotificationsCount,
    unreadMessagesCount,
    logout,
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [featuredTopics, setFeaturedTopics] = useState<Topic[]>([]);

  useEffect(() => {
    apiRequest<{ topics: Topic[] }>('/api/topics?sort=popular')
      .then((res) => setFeaturedTopics((res.topics || []).slice(0, 4)))
      .catch(() => {});
  }, [route.screen]);

  const navItems: {
    id: ScreenName;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
    requireAuth?: boolean;
  }[] = [
    { id: 'home', label: 'Trang chủ', icon: Home },
    { id: 'explore', label: 'Khám phá', icon: Compass },
    { id: 'my-topics', label: 'Chủ đề của tôi', icon: BookOpen, requireAuth: true },
    {
      id: 'friends',
      label: 'Bạn bè',
      icon: Users,
      badge: socialData.incomingRequests.length,
      requireAuth: true,
    },
    {
      id: 'messages',
      label: 'Tin nhắn',
      icon: MessageSquare,
      badge: unreadMessagesCount,
      requireAuth: true,
    },
    {
      id: 'notifications',
      label: 'Thông báo',
      icon: Bell,
      badge: unreadNotificationsCount,
      requireAuth: true,
    },
    { id: 'profile', label: 'Hồ sơ cá nhân', icon: UserIcon, requireAuth: true },
    { id: 'settings', label: 'Cài đặt', icon: Settings, requireAuth: true },
  ];

  const handleNavClick = (item: (typeof navItems)[number]) => {
    setMobileMenuOpen(false);
    if (item.requireAuth && !user) {
      navigate('login');
      return;
    }
    if (item.id === 'profile' && user) {
      navigate('profile', { userId: user.id });
      return;
    }
    navigate(item.id);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col">
      {/* Mobile Header (Strict 3-zone Top Bar Contract, <15% viewport height) */}
      <header className="lg:hidden sticky top-0 z-30 bg-white/95 backdrop-blur-xs border-b border-slate-200 px-4 h-14 flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate('home')}
          className="text-lg font-bold tracking-tight text-blue-600 whitespace-nowrap"
        >
          BlueSpace
        </button>

        <div className="flex items-center gap-4 text-xs font-medium text-slate-600">
          <button
            type="button"
            onClick={() => navigate('home')}
            className={route.screen === 'home' ? 'text-blue-600 font-semibold' : ''}
          >
            Diễn đàn
          </button>
          <button
            type="button"
            onClick={() => navigate('explore')}
            className={route.screen === 'explore' ? 'text-blue-600 font-semibold' : ''}
          >
            Khám phá
          </button>
        </div>

        <div className="flex items-center gap-2">
          {user ? (
            <button
              type="button"
              onClick={() => navigate('create-topic')}
              className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg whitespace-nowrap"
            >
              + Chủ đề
            </button>
          ) : (
            <button
              type="button"
              onClick={() => navigate('login')}
              className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg whitespace-nowrap"
            >
              Đăng nhập
            </button>
          )}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            aria-label="Mở menu điều hướng"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Slide-Over Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs flex">
          <div className="w-72 bg-white h-full flex flex-col justify-between p-5 overflow-y-auto shadow-xl">
            <div>
              <div className="flex items-center justify-between mb-6">
                <span className="text-xl font-bold tracking-tight text-blue-600">
                  BlueSpace
                </span>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active =
                    route.screen === item.id ||
                    (item.id === 'profile' &&
                      route.screen === 'profile' &&
                      route.userId === user?.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleNavClick(item)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                        active
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </span>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span
                          className={`text-xs font-semibold tabular-nums ${
                            active ? 'text-white' : 'text-blue-600'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
                {user?.role === 'admin' && (
                  <>
                    <div className="pt-3 pb-1 px-3 text-xs font-medium text-slate-400">
                      Quản trị hệ thống
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        navigate('admin');
                      }}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                        route.screen === 'admin'
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Admin Dashboard</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        navigate('reports');
                      }}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                        route.screen === 'reports'
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <Flag className="w-4 h-4" />
                      <span>Quản lý Báo cáo</span>
                    </button>
                  </>
                )}
              </nav>
            </div>

            {user ? (
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-2">
                <div
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate('profile', { userId: user.id });
                  }}
                  className="flex items-center gap-2.5 min-w-0 cursor-pointer"
                >
                  <UserAvatar
                    name={user.displayName}
                    avatar={user.avatar}
                    size="sm"
                    online={true}
                    showStatusDot
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {user.displayName}
                    </p>
                    <p className="text-xs text-slate-500 truncate">@{user.username}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={logout}
                  className="p-2 text-slate-400 hover:text-rose-600 rounded-lg"
                  title="Đăng xuất"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="pt-4 border-t border-slate-200 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate('login');
                  }}
                  className="w-full py-2 bg-blue-600 text-white text-sm font-medium rounded-lg"
                >
                  Đăng nhập
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate('register');
                  }}
                  className="w-full py-2 bg-slate-100 text-slate-800 text-sm font-medium rounded-lg"
                >
                  Đăng ký tài khoản
                </button>
              </div>
            )}
          </div>
          <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
        </div>
      )}

      {/* Main 3-Zone Desktop Container */}
      <div className="max-w-[1440px] w-full mx-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 px-4 sm:px-6 py-6">
        {/* LEFT SIDEBAR (3 cols on lg, 2.5 equivalent) */}
        <aside className="hidden lg:flex lg:col-span-3 xl:col-span-2 flex-col justify-between bg-white border border-slate-200/80 rounded-xl p-4 h-[calc(100vh-3rem)] sticky top-6">
          <div className="space-y-6 overflow-y-auto pr-1">
            {/* Brand Header */}
            <div className="px-2 pt-1 flex items-center justify-between">
              <button
                type="button"
                onClick={() => navigate(user ? 'home' : 'landing')}
                className="text-xl font-bold tracking-tight text-blue-600 hover:text-blue-700 transition-colors"
              >
                BlueSpace
              </button>
            </div>

            {/* Primary CTA */}
            <button
              type="button"
              onClick={() => {
                if (!user) {
                  navigate('login');
                  return;
                }
                navigate('create-topic');
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl shadow-xs transition-colors whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo chủ đề mới</span>
            </button>

            {/* Navigation List */}
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active =
                  route.screen === item.id ||
                  (item.id === 'profile' &&
                    route.screen === 'profile' &&
                    route.userId === user?.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNavClick(item)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${
                      active
                        ? 'bg-blue-50 text-blue-700 font-semibold'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <Icon
                        className={`w-4 h-4 ${
                          active ? 'text-blue-600' : 'text-slate-400'
                        }`}
                      />
                      <span>{item.label}</span>
                    </span>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="text-xs font-semibold text-blue-600 tabular-nums">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}

              {user?.role === 'admin' && (
                <div className="pt-4 mt-4 border-t border-slate-100 space-y-1">
                  <p className="px-3 pb-1 text-xs font-medium text-slate-400">
                    Quản trị viên
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate('admin')}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${
                      route.screen === 'admin'
                        ? 'bg-blue-50 text-blue-700 font-semibold'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    <span>Admin Dashboard</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('reports')}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${
                      route.screen === 'reports'
                        ? 'bg-blue-50 text-blue-700 font-semibold'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <Flag className="w-4 h-4 text-blue-600" />
                    <span>Báo cáo vi phạm</span>
                  </button>
                </div>
              )}
            </nav>
          </div>

          {/* Bottom Logged-in User Profile Card */}
          <div className="pt-4 border-t border-slate-100">
            {user ? (
              <div className="flex items-center justify-between gap-2 p-1.5 rounded-xl hover:bg-slate-50 transition-colors">
                <div
                  onClick={() => navigate('profile', { userId: user.id })}
                  className="flex items-center gap-2.5 min-w-0 cursor-pointer"
                >
                  <UserAvatar
                    name={user.displayName}
                    avatar={user.avatar}
                    size="sm"
                    online={true}
                    showStatusDot
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {user.displayName}
                    </p>
                    <p className="text-xs text-slate-500 truncate">@{user.username}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={logout}
                  title="Đăng xuất"
                  className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors shrink-0"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => navigate('login')}
                  className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors whitespace-nowrap"
                >
                  Đăng nhập
                </button>
                <button
                  type="button"
                  onClick={() => navigate('register')}
                  className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors whitespace-nowrap"
                >
                  Đăng ký tài khoản
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* CENTER CONTENT AREA */}
        <main
          className={
            hideRightSidebar
              ? 'lg:col-span-9 xl:col-span-10 min-w-0'
              : 'lg:col-span-6 xl:col-span-7 min-w-0'
          }
        >
          {children}
        </main>

        {/* RIGHT SIDEBAR */}
        {!hideRightSidebar && (
          <aside className="hidden lg:block lg:col-span-3 xl:col-span-3 space-y-6">
            {/* Featured Topics */}
            <section className="bg-white border border-slate-200/80 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-900">Chủ đề nổi bật</h3>
                <button
                  type="button"
                  onClick={() => navigate('explore')}
                  className="text-xs font-medium text-blue-600 hover:underline"
                >
                  Xem tất cả
                </button>
              </div>
              <div className="divide-y divide-slate-100">
                {featuredTopics.map((t, index) => (
                  <div
                    key={t.id}
                    onClick={() => navigate('topic-detail', { topicId: t.id })}
                    className="py-3 first:pt-0 last:pb-0 cursor-pointer group"
                  >
                    <p className="text-xs text-slate-400 mb-1 tabular-nums">
                      0{index + 1}. {t.category?.name || 'Cộng đồng'} · {t.views} lượt xem
                    </p>
                    <h4 className="text-sm font-medium text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
                      {t.title}
                    </h4>
                  </div>
                ))}
              </div>
            </section>

            {/* Online Users */}
            <section className="bg-white border border-slate-200/80 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-900">Đang trực tuyến</h3>
                <span className="text-xs text-emerald-600 font-medium tabular-nums">
                  {socialData.onlineUsers.length + (user ? 1 : 0)} thành viên
                </span>
              </div>
              {socialData.onlineUsers.length === 0 ? (
                <p className="text-xs text-slate-500">
                  Hiện bạn là thành viên duy nhất đang trực tuyến.
                </p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {socialData.onlineUsers.slice(0, 5).map((u) => (
                    <UserCard key={u.id} targetUser={u} compact />
                  ))}
                </div>
              )}
            </section>

            {/* Suggested Friends */}
            {socialData.suggestedUsers.length > 0 && (
              <section className="bg-white border border-slate-200/80 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-slate-900">Gợi ý kết bạn</h3>
                  <button
                    type="button"
                    onClick={() => navigate('friends')}
                    className="text-xs font-medium text-blue-600 hover:underline"
                  >
                    Khám phá
                  </button>
                </div>
                <div className="divide-y divide-slate-100">
                  {socialData.suggestedUsers.slice(0, 4).map((u) => (
                    <UserCard key={u.id} targetUser={u} compact />
                  ))}
                </div>
              </section>
            )}

            {/* Popular Categories */}
            <section className="bg-white border border-slate-200/80 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-900">Danh mục phổ biến</h3>
                <FolderKanban className="w-4 h-4 text-slate-400" />
              </div>
              <div className="space-y-1.5">
                {categories.slice(0, 8).map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => navigate('category', { categorySlug: cat.slug })}
                    className="w-full flex items-center justify-between py-1.5 px-2.5 rounded-lg text-xs hover:bg-slate-50 transition-colors text-left"
                  >
                    <span className="font-medium text-slate-700 hover:text-blue-600">
                      {cat.name}
                    </span>
                    <span className="text-slate-400 tabular-nums">
                      {cat.topicCount || 0} bài
                    </span>
                  </button>
                ))}
              </div>
            </section>
          </aside>
        )}
      </div>
    </div>
  );
};
