import React, { useEffect, useState } from 'react';
import { ArrowRight, CheckCircle2, Eye, EyeOff, Lock, Mail, MessageSquare, Users } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { apiRequest } from '../services/api';
import type { Topic } from '../types';
import { formatRelativeTime, GENERATED_ASSETS } from '../utils/format';
import { UserAvatar } from '../components/ui/CommonUI';

// ============================================================================
// 1. LANDING PAGE
// ============================================================================
export const LandingPage: React.FC = () => {
  const { navigate, user, categories } = useApp();
  const [featuredTopics, setFeaturedTopics] = useState<Topic[]>([]);
  const [heroImgFailed, setHeroImgFailed] = useState(false);

  useEffect(() => {
    apiRequest<{ topics: Topic[] }>('/api/topics?sort=popular')
      .then((res) => setFeaturedTopics((res.topics || []).slice(0, 3)))
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xs border-b border-slate-200 px-6 py-4">
        <div className="max-w-[1280px] mx-auto flex items-center justify-between">
          {/* Zone 1: Single text element wordmark */}
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              navigate('landing');
            }}
            className="text-xl font-bold tracking-tight text-blue-600"
          >
            BlueSpace
          </a>

          {/* Zone 2: 4 clean text navigation links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-blue-600 transition-colors">
              Tính năng
            </a>
            <a href="#discussions" className="hover:text-blue-600 transition-colors">
              Chủ đề nổi bật
            </a>
            <a href="#categories" className="hover:text-blue-600 transition-colors">
              Danh mục
            </a>
            <button
              type="button"
              onClick={() => navigate('home')}
              className="hover:text-blue-600 transition-colors cursor-pointer"
            >
              Vào diễn đàn
            </button>
          </nav>

          {/* Zone 3: 1-2 primary actions */}
          <div className="flex items-center gap-3">
            {user ? (
              <button
                type="button"
                onClick={() => navigate('home')}
                className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors whitespace-nowrap"
              >
                Vào Bảng Tin
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => navigate('login')}
                  className="px-3.5 py-2 text-xs font-medium text-slate-700 hover:text-blue-600 transition-colors whitespace-nowrap"
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => navigate('register')}
                  className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors whitespace-nowrap"
                >
                  Join Community
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="top" className="py-16 lg:py-24 px-6 border-b border-slate-200/80 bg-white">
        <div className="max-w-[1280px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-6">
            <p className="text-xs font-semibold text-blue-600 tracking-wide">
              Nền tảng Diễn đàn Cộng đồng · Mạng xã hội · Trò chuyện 1-1
            </p>
            <h1 className="text-4xl sm:text-5xl lg:text-[52px] font-bold tracking-tight text-slate-900 leading-[1.12]">
              Connect. Discuss. Share.
            </h1>
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl">
              A place to share ideas, start conversations and connect with people. Khởi tạo
              chủ đề chuyên sâu, thảo luận đa chiều và nhắn tin trực tiếp với những người
              cùng chung đam mê trong một không gian xanh dương tối giản.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigate(user ? 'home' : 'register')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors whitespace-nowrap"
              >
                <span>Join Community</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => navigate('home')}
                className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-semibold rounded-xl transition-colors whitespace-nowrap"
              >
                Khám phá chủ đề ngay
              </button>
            </div>
            <div className="pt-4 flex items-center gap-6 text-xs text-slate-500 tabular-nums">
              <span>10+ Danh mục chuyên sâu</span>
              <span aria-hidden="true">·</span>
              <span>Bình luận đa cấp Realtime</span>
              <span aria-hidden="true">·</span>
              <span>Nhắn tin 1-1 WebSocket</span>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 shadow-sm aspect-video">
              {!heroImgFailed ? (
                <img
                  src={GENERATED_ASSETS.heroBanner}
                  alt="Không gian cộng đồng trực tuyến BlueSpace"
                  referrerPolicy="no-referrer"
                  onError={() => setHeroImgFailed(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-600 to-slate-900 flex items-center justify-center p-8 text-white">
                  <div className="max-w-md text-center">
                    <h3 className="text-xl font-semibold mb-2">
                      Không gian thảo luận mở & văn minh
                    </h3>
                    <p className="text-sm text-blue-100">
                      Chia sẻ kiến trúc phần mềm, thiết kế sản phẩm và kết nối bạn bè theo
                      thời gian thực.
                    </p>
                  </div>
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/80 via-slate-950/40 to-transparent p-6 text-white">
                <p className="text-xs text-blue-200 mb-1">
                  Cộng đồng công nghệ & sáng tạo Việt Nam
                </p>
                <p className="text-sm font-medium">
                  Hàng trăm cuộc thảo luận chuyên môn và kết nối trực tiếp mỗi ngày.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Capabilities (Asymmetric Bento Grid with Editorial Numbering) */}
      <section id="features" className="py-16 px-6 max-w-[1280px] mx-auto w-full">
        <div className="max-w-2xl mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">
            Một nền tảng thống nhất cho thảo luận và kết nối
          </h2>
          <p className="text-sm sm:text-base text-slate-600">
            Kết hợp sức mạnh lưu trữ tri thức của diễn đàn truyền thống với tốc độ tương tác
            tức thời của mạng xã hội và ứng dụng nhắn tin hiện đại.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-white border border-slate-200/80 rounded-xl p-7 flex flex-col justify-between">
            <div>
              <p className="text-xs font-semibold text-blue-600 mb-2 tabular-nums">
                01. Diễn đàn chủ đề & Bình luận đa cấp
              </p>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                Tổ chức tri thức mạch lạc theo danh mục và thẻ #tag
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed max-w-xl">
                Tạo bài viết chuyên sâu kèm hình ảnh minh họa, phân loại rõ ràng theo 10 danh
                mục. Hệ thống bình luận hỗ trợ phản hồi nhiều tầng giúp mạch tranh luận luôn
                rõ ràng, dễ theo dõi.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-4 text-xs text-slate-500">
              <span>Tìm kiếm toàn văn</span>
              <span aria-hidden="true">·</span>
              <span>Lưu bài viết (Bookmark)</span>
              <span aria-hidden="true">·</span>
              <span>Cập nhật bình luận tức thì</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-xl p-7 flex flex-col justify-between">
            <div>
              <p className="text-xs font-semibold text-blue-600 mb-2 tabular-nums">
                02. Mạng lưới bạn bè
              </p>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Hồ sơ cá nhân & Kết bạn bốn phương
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Xây dựng hồ sơ cá nhân, theo dõi trạng thái trực tuyến, gửi lời mời kết bạn
                và nhận thông báo tương tác theo thời gian thực.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs text-blue-600 font-medium">
              <Users className="w-4 h-4" />
              <span>Hiển thị trạng thái Online / Offline</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-xl p-7 flex flex-col justify-between">
            <div>
              <p className="text-xs font-semibold text-blue-600 mb-2 tabular-nums">
                03. Nhắn tin riêng 1-1
              </p>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Trò chuyện trực tiếp qua WebSocket
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Gửi tin nhắn văn bản, biểu tượng cảm xúc (Emoji), xem trạng thái đã đọc và
                nhận tin nhắn mới ngay lập tức mà không cần tải lại trang.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs text-blue-600 font-medium">
              <MessageSquare className="w-4 h-4" />
              <span>Độ trễ thấp & Đồng bộ đa thiết bị</span>
            </div>
          </div>

          <div className="md:col-span-2 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-7 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="max-w-lg">
              <h3 className="text-xl font-semibold mb-1.5">
                Sẵn sàng tham gia cuộc trò chuyện?
              </h3>
              <p className="text-sm text-blue-100">
                Đăng ký tài khoản miễn phí hoặc đăng nhập nhanh chỉ với 1 cú nhấp bằng Google.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => navigate('register')}
                className="px-5 py-2.5 bg-white text-blue-700 hover:bg-blue-50 text-xs font-semibold rounded-xl transition-colors whitespace-nowrap"
              >
                Tạo tài khoản ngay
              </button>
              <button
                type="button"
                onClick={() => navigate('login')}
                className="px-4 py-2.5 bg-blue-800/60 hover:bg-blue-800 text-white text-xs font-semibold rounded-xl transition-colors whitespace-nowrap"
              >
                Đăng nhập
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Discussions Section */}
      <section id="discussions" className="py-14 px-6 bg-white border-y border-slate-200/80">
        <div className="max-w-[1280px] mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                Chủ đề nổi bật trong cộng đồng
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Những cuộc thảo luận đang nhận được nhiều sự quan tâm nhất
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('home')}
              className="text-sm font-semibold text-blue-600 hover:underline whitespace-nowrap"
            >
              Xem toàn bộ diễn đàn →
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredTopics.map((topic) => (
              <div
                key={topic.id}
                onClick={() => navigate('topic-detail', { topicId: topic.id })}
                className="border border-slate-200/80 rounded-xl p-6 hover:border-blue-400 transition-colors cursor-pointer flex flex-col justify-between bg-[#F8FAFC]/50"
              >
                <div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
                    <span className="font-medium text-blue-600">
                      {topic.category?.name || 'General'}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{formatRelativeTime(topic.createdAt)}</span>
                  </div>
                  <h3 className="text-base font-semibold text-slate-900 mb-2 line-clamp-2">
                    {topic.title}
                  </h3>
                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed mb-4">
                    {topic.content}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-2 min-w-0">
                    <UserAvatar
                      name={topic.author.displayName}
                      avatar={topic.author.avatar}
                      size="xs"
                    />
                    <span className="font-medium text-slate-700 truncate">
                      {topic.author.displayName}
                    </span>
                  </div>
                  <span className="tabular-nums shrink-0">
                    {topic.likeCount} thích · {topic.commentCount} phản hồi
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Categories Section */}
      <section id="categories" className="py-14 px-6 max-w-[1280px] mx-auto w-full">
        <h2 className="text-xl font-bold text-slate-900 mb-6">Khám phá theo Danh mục</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => navigate('category', { categorySlug: cat.slug })}
              className="bg-white border border-slate-200/80 hover:border-blue-400 rounded-xl p-4 text-left transition-colors"
            >
              <p className="text-sm font-semibold text-slate-900 mb-1">{cat.name}</p>
              <p className="text-xs text-slate-500 line-clamp-2 mb-2">{cat.description}</p>
              <p className="text-xs font-medium text-blue-600 tabular-nums">
                {cat.topicCount || 0} chủ đề
              </p>
            </button>
          ))}
        </div>
      </section>

      {/* Quiet Footer */}
      <footer className="mt-auto bg-white border-t border-slate-200 px-6 py-8">
        <div className="max-w-[1280px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <span className="font-bold text-slate-900 text-sm">BlueSpace</span>
            <span aria-hidden="true">·</span>
            <span>Connect. Discuss. Share.</span>
          </div>
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => navigate('home')}
              className="hover:text-slate-900"
            >
              Diễn đàn
            </button>
            <button
              type="button"
              onClick={() => navigate('explore')}
              className="hover:text-slate-900"
            >
              Khám phá
            </button>
            <button
              type="button"
              onClick={() => navigate('login')}
              className="hover:text-slate-900"
            >
              Đăng nhập
            </button>
            <button
              type="button"
              onClick={() => navigate('register')}
              className="hover:text-slate-900"
            >
              Đăng ký
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

// ============================================================================
// 2. LOGIN PAGE
// ============================================================================
export const LoginPage: React.FC = () => {
  const { loginWithEmail, loginWithGoogle, navigate, showToast } = useApp();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await loginWithEmail(identifier, password);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      showToast(err.message || 'Đăng nhập Google không thành công.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center mb-6">
          <button
            type="button"
            onClick={() => navigate('landing')}
            className="text-2xl font-bold tracking-tight text-blue-600"
          >
            BlueSpace
          </button>
          <h1 className="mt-3 text-2xl font-bold text-slate-900">
            Đăng nhập vào cộng đồng
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Chào mừng trở lại! Hãy đăng nhập để tiếp tục thảo luận và kết nối.
          </p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-6 sm:p-8 shadow-xs">
          {/* Google OAuth Button */}
          <button
            type="button"
            disabled={loading}
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl text-sm font-medium text-slate-700 transition-colors mb-5 whitespace-nowrap"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.3 0 6.08-1.09 8.1-2.96l-3.88-3.05c-1.08.72-2.45 1.16-4.22 1.16-3.24 0-5.98-2.18-6.96-5.11H1.05v3.14C3.06 21.2 7.21 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.04 14.04c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.32H1.05C.38 7.66 0 9.16 0 11.75s.38 4.09 1.05 5.43l3.99-3.14z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.8 0 3.41.62 4.68 1.84l3.51-3.51C18.07 1.19 15.3 0 12 0 7.21 0 3.06 2.8 1.05 6.32l3.99 3.14c.98-2.93 3.72-5.11 6.96-5.11z"
              />
            </svg>
            <span>Login with Google</span>
          </button>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-white text-slate-400">
                hoặc dùng Email / Username
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Email hoặc Username
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="name@example.com hoặc username"
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Mật khẩu
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                />
                <span>Remember me</span>
              </label>
              <button
                type="button"
                onClick={() => navigate('forgot-password')}
                className="font-medium text-blue-600 hover:underline"
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors whitespace-nowrap"
            >
              {loading ? 'Đang xử lý...' : 'Đăng nhập'}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-500">
            Chưa có tài khoản?{' '}
            <button
              type="button"
              onClick={() => navigate('register')}
              className="font-semibold text-blue-600 hover:underline"
            >
              Đăng ký ngay
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 3. REGISTER PAGE
// ============================================================================
export const RegisterPage: React.FC = () => {
  const { registerWithEmail, loginWithGoogle, navigate, showToast } = useApp();
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      showToast('Mật khẩu xác nhận không khớp.', 'error');
      return;
    }
    if (!agreedTerms) {
      showToast('Vui lòng đồng ý với điều khoản cộng đồng.', 'error');
      return;
    }
    setLoading(true);
    try {
      await registerWithEmail({
        username,
        email,
        password,
        displayName: displayName || username,
      });
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center mb-6">
          <button
            type="button"
            onClick={() => navigate('landing')}
            className="text-2xl font-bold tracking-tight text-blue-600"
          >
            BlueSpace
          </button>
          <h1 className="mt-3 text-2xl font-bold text-slate-900">Tạo tài khoản mới</h1>
          <p className="mt-1 text-sm text-slate-500">
            Tham gia cộng đồng thảo luận và kết nối bạn bè ngay hôm nay.
          </p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-6 sm:p-8 shadow-xs">
          <button
            type="button"
            disabled={loading}
            onClick={() => loginWithGoogle()}
            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl text-sm font-medium text-slate-700 transition-colors mb-5 whitespace-nowrap"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.3 0 6.08-1.09 8.1-2.96l-3.88-3.05c-1.08.72-2.45 1.16-4.22 1.16-3.24 0-5.98-2.18-6.96-5.11H1.05v3.14C3.06 21.2 7.21 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.04 14.04c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.32H1.05C.38 7.66 0 9.16 0 11.75s.38 4.09 1.05 5.43l3.99-3.14z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.8 0 3.41.62 4.68 1.84l3.51-3.51C18.07 1.19 15.3 0 12 0 7.21 0 3.06 2.8 1.05 6.32l3.99 3.14c.98-2.93 3.72-5.11 6.96-5.11z"
              />
            </svg>
            <span>Đăng ký nhanh bằng Google</span>
          </button>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-white text-slate-400">hoặc điền thông tin</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Username *
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="vd: minh_dev"
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Tên hiển thị
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="vd: Minh Nguyễn"
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Tối thiểu 6 ký tự"
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Confirm Password *
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu"
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            <label className="flex items-start gap-2.5 text-xs text-slate-600 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={agreedTerms}
                onChange={(e) => setAgreedTerms(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
              />
              <span>
                Tôi đồng ý với Điều khoản sử dụng và Quy tắc ứng xử văn minh của cộng đồng
                BlueSpace.
              </span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors whitespace-nowrap"
            >
              {loading ? 'Đang tạo tài khoản...' : 'Đăng ký tài khoản'}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-500">
            Đã có tài khoản?{' '}
            <button
              type="button"
              onClick={() => navigate('login')}
              className="font-semibold text-blue-600 hover:underline"
            >
              Đăng nhập
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 4. FORGOT PASSWORD PAGE
// ============================================================================
export const ForgotPasswordPage: React.FC = () => {
  const { navigate, showToast } = useApp();
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiRequest('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email, newPassword }),
      });
      setDone(true);
      showToast('Đặt lại mật khẩu thành công!', 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center mb-6">
          <button
            type="button"
            onClick={() => navigate('landing')}
            className="text-2xl font-bold tracking-tight text-blue-600"
          >
            BlueSpace
          </button>
          <h1 className="mt-3 text-2xl font-bold text-slate-900">Khôi phục mật khẩu</h1>
          <p className="mt-1 text-sm text-slate-500">
            Nhập địa chỉ email đăng ký để thiết lập lại mật khẩu mới.
          </p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-6 sm:p-8 shadow-xs">
          {done ? (
            <div className="text-center space-y-4">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <h3 className="text-base font-semibold text-slate-900">
                Mật khẩu đã được cập nhật
              </h3>
              <p className="text-xs text-slate-500">
                Bạn có thể sử dụng mật khẩu mới để đăng nhập vào tài khoản ngay bây giờ.
              </p>
              <button
                type="button"
                onClick={() => navigate('login')}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                Quay lại Đăng nhập
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Email tài khoản
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Mật khẩu mới
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Tối thiểu 6 ký tự"
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                {loading ? 'Đang cập nhật...' : 'Đặt lại mật khẩu'}
              </button>
              <button
                type="button"
                onClick={() => navigate('login')}
                className="w-full py-2 text-xs font-medium text-slate-500 hover:text-slate-800"
              >
                ← Quay lại màn hình đăng nhập
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
