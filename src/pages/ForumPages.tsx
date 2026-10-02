import React, { useCallback, useEffect, useState } from 'react';
import {
  ArrowLeft,
  Bookmark,
  CornerDownRight,
  Edit3,
  Eye,
  Flag,
  Heart,
  Image as ImageIcon,
  MessageSquare,
  Pin,
  Plus,
  Send,
  Share2,
  Trash2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { apiRequest } from '../services/api';
import type { Category, CommentItem, Topic, User } from '../types';
import {
  EmptyState,
  LoadingSkeleton,
  SearchBar,
  TopicCard,
  TopicImage,
  UserAvatar,
  UserCard,
} from '../components/ui/CommonUI';
import {
  formatFullDate,
  formatRelativeTime,
  GENERATED_ASSETS,
  parseTags,
} from '../utils/format';

// ============================================================================
// 5. HOME / FORUM PAGE
// ============================================================================
export const HomePage: React.FC = () => {
  const { user, navigate, subscribeSocket } = useApp();
  const [sort, setSort] = useState<'latest' | 'popular' | 'discussing'>('latest');
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTopics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiRequest<{ topics: Topic[] }>(`/api/topics?sort=${sort}`);
      setTopics(res.topics || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [sort]);

  useEffect(() => {
    loadTopics();
  }, [loadTopics]);

  useEffect(() => {
    return subscribeSocket((event) => {
      if (event.type === 'topic:created' && event.topic) {
        setTopics((prev) => {
          if (prev.some((t) => t.id === event.topic.id)) return prev;
          return [event.topic, ...prev];
        });
      } else if (event.type === 'topic:deleted' && event.topicId) {
        setTopics((prev) => prev.filter((t) => t.id !== event.topicId));
      }
    });
  }, [subscribeSocket]);

  return (
    <div className="space-y-5">
      {/* Top Search & Create Topic Bar */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex-1">
            <SearchBar />
          </div>
          <button
            type="button"
            onClick={() => {
              if (!user) {
                navigate('login');
                return;
              }
              navigate('create-topic');
            }}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo chủ đề mới</span>
          </button>
        </div>

        {/* Interactive Filter Controls */}
        <div className="flex items-center justify-between flex-wrap gap-3 pt-1">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => setSort('latest')}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                sort === 'latest'
                  ? 'bg-white text-blue-600 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Mới nhất
            </button>
            <button
              type="button"
              onClick={() => setSort('popular')}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                sort === 'popular'
                  ? 'bg-white text-blue-600 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Phổ biến
            </button>
            <button
              type="button"
              onClick={() => setSort('discussing')}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                sort === 'discussing'
                  ? 'bg-white text-blue-600 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Đang thảo luận
            </button>
          </div>

          <span className="text-xs text-slate-400 tabular-nums">
            Hiển thị {topics.length} chủ đề
          </span>
        </div>
      </div>

      {/* Topic Feed */}
      {loading ? (
        <LoadingSkeleton count={3} />
      ) : topics.length === 0 ? (
        <EmptyState
          title="Chưa có chủ đề nào"
          description="Hãy là người đầu tiên khởi tạo cuộc thảo luận trong cộng đồng BlueSpace."
          actionLabel="Tạo chủ đề mới"
          onAction={() => navigate(user ? 'create-topic' : 'login')}
        />
      ) : (
        <div className="space-y-4">
          {topics.map((topic) => (
            <TopicCard key={topic.id} topic={topic} onRefresh={loadTopics} />
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 6. EXPLORE PAGE & 18. CATEGORY PAGE & MY TOPICS PAGE
// ============================================================================
export const ExplorePage: React.FC = () => {
  const { categories, navigate } = useApp();
  const [popularTopics, setPopularTopics] = useState<Topic[]>([]);
  const [popularTags, setPopularTags] = useState<{ tag: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      apiRequest<{ topics: Topic[] }>('/api/topics?sort=popular'),
      apiRequest<{ tags: { tag: string; count: number }[] }>('/api/search?q='),
    ])
      .then(([tRes, sRes]) => {
        setPopularTopics(tRes.topics || []);
        setPopularTags(sRes.tags || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200/80 rounded-xl p-6">
        <h1 className="text-xl font-bold text-slate-900 mb-1">Khám phá Cộng đồng</h1>
        <p className="text-sm text-slate-500 mb-4">
          Tìm kiếm theo danh mục chuyên môn, từ khóa xu hướng hoặc các bài viết được đọc nhiều nhất.
        </p>
        <SearchBar />
      </div>

      {/* Categories Grid */}
      <section className="bg-white border border-slate-200/80 rounded-xl p-6">
        <h2 className="text-base font-semibold text-slate-900 mb-4">Danh mục thảo luận</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => navigate('category', { categorySlug: cat.slug })}
              className="p-4 rounded-xl border border-slate-200/70 hover:border-blue-400 text-left transition-colors flex items-start justify-between gap-3"
            >
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-1">{cat.name}</h3>
                <p className="text-xs text-slate-500 line-clamp-2">{cat.description}</p>
              </div>
              <span className="text-xs font-medium text-blue-600 tabular-nums shrink-0">
                {cat.topicCount || 0} bài
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Popular Tags */}
      {popularTags.length > 0 && (
        <section className="bg-white border border-slate-200/80 rounded-xl p-6">
          <h2 className="text-base font-semibold text-slate-900 mb-3">Từ khóa phổ biến</h2>
          <div className="flex items-center flex-wrap gap-3 text-xs text-slate-600">
            {popularTags.map((item, idx) => (
              <React.Fragment key={item.tag}>
                {idx > 0 && <span aria-hidden="true">·</span>}
                <button
                  type="button"
                  onClick={() =>
                    navigate('search', { searchQuery: item.tag, tagFilter: item.tag })
                  }
                  className="hover:text-blue-600 font-medium transition-colors"
                >
                  #{item.tag} ({item.count})
                </button>
              </React.Fragment>
            ))}
          </div>
        </section>
      )}

      {/* Trending Topics */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold text-slate-900 px-1">
          Chủ đề thịnh hành
        </h2>
        {loading ? (
          <LoadingSkeleton count={2} />
        ) : (
          popularTopics.map((topic) => <TopicCard key={topic.id} topic={topic} />)
        )}
      </section>
    </div>
  );
};

export const CategoryPage: React.FC = () => {
  const { route, categories, navigate, user } = useApp();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);

  const currentCategory: Category | undefined = categories.find(
    (c) => c.slug === route.categorySlug
  );

  useEffect(() => {
    if (!route.categorySlug) return;
    setLoading(true);
    apiRequest<{ topics: Topic[] }>(`/api/topics?category=${route.categorySlug}`)
      .then((res) => setTopics(res.topics || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [route.categorySlug]);

  return (
    <div className="space-y-5">
      <div className="bg-white border border-slate-200/80 rounded-xl p-6">
        <button
          type="button"
          onClick={() => navigate('explore')}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-blue-600 mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Tất cả danh mục
        </button>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Danh mục: {currentCategory?.name || route.categorySlug}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {currentCategory?.description || 'Các chủ đề thảo luận thuộc danh mục này.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate(user ? 'create-topic' : 'login')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-colors whitespace-nowrap self-start"
          >
            + Đăng bài trong mục này
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingSkeleton count={2} />
      ) : topics.length === 0 ? (
        <EmptyState
          title="Chưa có bài viết trong danh mục này"
          description="Hãy khởi tạo chủ đề đầu tiên để mở đầu cuộc thảo luận."
          actionLabel="Tạo chủ đề mới"
          onAction={() => navigate(user ? 'create-topic' : 'login')}
        />
      ) : (
        <div className="space-y-4">
          {topics.map((t) => (
            <TopicCard key={t.id} topic={t} />
          ))}
        </div>
      )}
    </div>
  );
};

export const MyTopicsPage: React.FC = () => {
  const { user, navigate } = useApp();
  const [tab, setTab] = useState<'created' | 'bookmarked'>('created');
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);

  const loadMyTopics = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const url =
        tab === 'created'
          ? `/api/topics?authorId=${user.id}`
          : `/api/topics?bookmarked=true`;
      const res = await apiRequest<{ topics: Topic[] }>(url);
      setTopics(res.topics || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user, tab]);

  useEffect(() => {
    loadMyTopics();
  }, [loadMyTopics]);

  return (
    <div className="space-y-5">
      <div className="bg-white border border-slate-200/80 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Chủ đề của tôi</h1>
          <p className="text-sm text-slate-500 mt-1">
            Quản lý các bài viết bạn đã đăng và danh sách chủ đề đã lưu.
          </p>
        </div>
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg self-start">
          <button
            type="button"
            onClick={() => setTab('created')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              tab === 'created'
                ? 'bg-white text-blue-600 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Đã đăng
          </button>
          <button
            type="button"
            onClick={() => setTab('bookmarked')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              tab === 'bookmarked'
                ? 'bg-white text-blue-600 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Đã lưu (Bookmark)
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingSkeleton count={2} />
      ) : topics.length === 0 ? (
        <EmptyState
          title={
            tab === 'created'
              ? 'Bạn chưa đăng chủ đề nào'
              : 'Chưa có chủ đề nào được lưu'
          }
          description={
            tab === 'created'
              ? 'Chia sẻ câu hỏi, kiến thức hoặc góc nhìn của bạn với cộng đồng ngay hôm nay.'
              : 'Nhấn vào biểu tượng Bookmark trên bất kỳ bài viết nào để lưu đọc lại sau.'
          }
          actionLabel="Tạo chủ đề mới"
          onAction={() => navigate('create-topic')}
        />
      ) : (
        <div className="space-y-4">
          {topics.map((t) => (
            <TopicCard key={t.id} topic={t} onRefresh={loadMyTopics} />
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 7. TOPIC DETAIL & MULTI-LEVEL COMMENT SYSTEM
// ============================================================================
export const TopicDetailPage: React.FC = () => {
  const { route, user, navigate, showToast, subscribeSocket, openReportModal } = useApp();
  const [topic, setTopic] = useState<Topic | null>(null);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<CommentItem | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadTopic = useCallback(async () => {
    if (!route.topicId) return;
    setLoading(true);
    try {
      const res = await apiRequest<{ topic: Topic }>(`/api/topics/${route.topicId}`);
      setTopic(res.topic);
      setComments(res.topic.comments || []);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [route.topicId, showToast]);

  useEffect(() => {
    loadTopic();
  }, [loadTopic]);

  // Real-time WebSocket updates for comments (Idempotent handlers)
  useEffect(() => {
    return subscribeSocket((event) => {
      if (event.topicId !== route.topicId) return;
      if (event.type === 'comment:created' && event.comment) {
        setComments((prev) => {
          if (prev.some((c) => c.id === event.comment.id)) return prev;
          return [...prev, event.comment];
        });
      } else if (event.type === 'comment:updated' && event.comment) {
        setComments((prev) =>
          prev.map((c) =>
            c.id === event.comment.id
              ? { ...c, content: event.comment.content, updatedAt: event.comment.updatedAt }
              : c
          )
        );
      } else if (event.type === 'comment:deleted' && event.commentId) {
        setComments((prev) => prev.filter((c) => c.id !== event.commentId));
      }
    });
  }, [subscribeSocket, route.topicId]);

  const handleToggleTopicLike = async () => {
    if (!topic) return;
    if (!user) {
      navigate('login');
      return;
    }
    const prev = topic.isLiked;
    setTopic({
      ...topic,
      isLiked: !prev,
      likeCount: prev ? Math.max(0, topic.likeCount - 1) : topic.likeCount + 1,
    });
    try {
      await apiRequest(`/api/topics/${topic.id}/like`, { method: 'POST' });
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleToggleBookmark = async () => {
    if (!topic) return;
    if (!user) {
      navigate('login');
      return;
    }
    const prev = topic.isBookmarked;
    setTopic({ ...topic, isBookmarked: !prev });
    try {
      const res = await apiRequest<{ bookmarked: boolean }>(
        `/api/topics/${topic.id}/bookmark`,
        { method: 'POST' }
      );
      showToast(
        res.bookmarked ? 'Đã lưu bài viết.' : 'Đã bỏ lưu bài viết.',
        'info'
      );
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteTopic = async () => {
    if (!topic) return;
    try {
      await apiRequest(`/api/topics/${topic.id}`, { method: 'DELETE' });
      showToast('Đã xóa chủ đề.', 'info');
      navigate('home');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleCreateComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic || !newComment.trim()) return;
    if (!user) {
      navigate('login');
      return;
    }
    setSubmitting(true);
    try {
      const res = await apiRequest<{ comment: CommentItem }>(
        `/api/topics/${topic.id}/comments`,
        {
          method: 'POST',
          body: JSON.stringify({
            content: newComment,
            parentCommentId: replyingTo ? replyingTo.id : null,
          }),
        }
      );
      setComments((prev) => {
        if (prev.some((c) => c.id === res.comment.id)) return prev;
        return [...prev, res.comment];
      });
      setNewComment('');
      setReplyingTo(null);
      showToast('Đã đăng bình luận.', 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveEditComment = async (commentId: number) => {
    if (!editContent.trim()) return;
    try {
      await apiRequest(`/api/comments/${commentId}`, {
        method: 'PUT',
        body: JSON.stringify({ content: editContent }),
      });
      setComments((prev) =>
        prev.map((c) => (c.id === commentId ? { ...c, content: editContent } : c))
      );
      setEditingCommentId(null);
      showToast('Đã cập nhật bình luận.', 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    try {
      await apiRequest(`/api/comments/${commentId}`, { method: 'DELETE' });
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      showToast('Đã xóa bình luận.', 'info');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleToggleCommentLike = async (commentItem: CommentItem) => {
    if (!user) {
      navigate('login');
      return;
    }
    setComments((prev) =>
      prev.map((c) =>
        c.id === commentItem.id
          ? {
              ...c,
              isLiked: !c.isLiked,
              likeCount: c.isLiked ? Math.max(0, c.likeCount - 1) : c.likeCount + 1,
            }
          : c
      )
    );
    try {
      await apiRequest(`/api/comments/${commentItem.id}/like`, { method: 'POST' });
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Recursive Comment Node Renderer for Multi-Level Nested Replies
  const renderCommentTree = (parentId: number | null = null, depth = 0): React.ReactNode => {
    const branch = comments.filter((c) => (c.parentCommentId || null) === parentId);
    if (branch.length === 0) return null;

    return (
      <div className={depth > 0 ? 'mt-3 pl-4 sm:pl-6 border-l-2 border-slate-100 space-y-3' : 'space-y-4'}>
        {branch.map((item) => {
          const isOwner = user?.id === item.authorId;
          const canDelete = isOwner || user?.role === 'admin';

          return (
            <div key={item.id} className="bg-[#F8FAFC] border border-slate-200/70 rounded-xl p-4">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <UserAvatar
                    name={item.author.displayName}
                    avatar={item.author.avatar}
                    size="xs"
                    online={item.author.onlineStatus}
                    showStatusDot
                    onClick={() => navigate('profile', { userId: item.author.id })}
                  />
                  <div className="flex items-center flex-wrap gap-1.5 text-xs text-slate-500">
                    <button
                      type="button"
                      onClick={() => navigate('profile', { userId: item.author.id })}
                      className="font-semibold text-slate-900 hover:text-blue-600"
                    >
                      {item.author.displayName}
                    </button>
                    <span aria-hidden="true">·</span>
                    <span>@{item.author.username}</span>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">{formatRelativeTime(item.createdAt)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {isOwner && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCommentId(item.id);
                        setEditContent(item.content);
                      }}
                      className="p-1 text-slate-400 hover:text-blue-600 rounded"
                      title="Sửa bình luận"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => handleDeleteComment(item.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded"
                      title="Xóa bình luận"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
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
                        targetType: 'comment',
                        targetId: item.id,
                        targetLabel: item.content.slice(0, 50),
                      });
                    }}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded"
                    title="Báo cáo"
                  >
                    <Flag className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {editingCommentId === item.id ? (
                <div className="space-y-2 mt-2">
                  <textarea
                    rows={2}
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSaveEditComment(item.id)}
                      className="px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded-lg"
                    >
                      Lưu
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingCommentId(null)}
                      className="px-3 py-1 bg-slate-200 text-slate-700 text-xs font-medium rounded-lg"
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-800 whitespace-pre-line leading-relaxed">
                  {item.content}
                </p>
              )}

              <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
                <button
                  type="button"
                  onClick={() => handleToggleCommentLike(item)}
                  className={`inline-flex items-center gap-1 font-medium transition-colors ${
                    item.isLiked ? 'text-blue-600' : 'hover:text-slate-900'
                  }`}
                >
                  <Heart
                    className={`w-3.5 h-3.5 ${
                      item.isLiked ? 'fill-blue-600 text-blue-600' : ''
                    }`}
                  />
                  <span className="tabular-nums">{item.likeCount}</span>
                  <span>Thích</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (!user) {
                      navigate('login');
                      return;
                    }
                    setReplyingTo(item);
                  }}
                  className="inline-flex items-center gap-1 font-medium hover:text-blue-600 transition-colors"
                >
                  <CornerDownRight className="w-3.5 h-3.5" />
                  <span>Trả lời</span>
                </button>
              </div>

              {/* Render Nested Replies */}
              {renderCommentTree(item.id, Math.min(depth + 1, 4))}
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) return <LoadingSkeleton count={2} />;
  if (!topic) {
    return (
      <EmptyState
        title="Không tìm thấy chủ đề"
        description="Chủ đề này có thể đã bị xóa hoặc đường dẫn không tồn tại."
        actionLabel="Quay về Trang chủ"
        onAction={() => navigate('home')}
      />
    );
  }

  const tags = parseTags(topic.tags);
  const canModify = user && (user.id === topic.authorId || user.role === 'admin');

  return (
    <div className="space-y-6">
      {/* Main Topic Detail Card */}
      <article className="bg-white border border-slate-200/80 rounded-xl p-6 sm:p-8">
        <button
          type="button"
          onClick={() => navigate('home')}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-blue-600 mb-5"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Quay lại danh sách chủ đề
        </button>

        {/* Author & Metadata Header */}
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <UserAvatar
              name={topic.author.displayName}
              avatar={topic.author.avatar}
              size="md"
              online={topic.author.onlineStatus}
              showStatusDot
              onClick={() => navigate('profile', { userId: topic.author.id })}
            />
            <div>
              <div className="flex items-center flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => navigate('profile', { userId: topic.author.id })}
                  className="text-sm font-semibold text-slate-900 hover:text-blue-600"
                >
                  {topic.author.displayName}
                </button>
                <span className="text-xs text-slate-400">@{topic.author.username}</span>
              </div>
              <div className="flex items-center flex-wrap gap-1.5 text-xs text-slate-500 mt-0.5">
                <span>Đăng ngày {formatFullDate(topic.createdAt)}</span>
                {topic.category && (
                  <>
                    <span aria-hidden="true">·</span>
                    <button
                      type="button"
                      onClick={() =>
                        navigate('category', { categorySlug: topic.category!.slug })
                      }
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {topic.category.name}
                    </button>
                  </>
                )}
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">{topic.views} lượt xem</span>
              </div>
            </div>
          </div>

          {canModify && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => navigate('edit-topic', { topicId: topic.id })}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap"
              >
                <Edit3 className="w-3.5 h-3.5" /> Sửa
              </button>
              <button
                type="button"
                onClick={handleDeleteTopic}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors whitespace-nowrap"
              >
                <Trash2 className="w-3.5 h-3.5" /> Xóa
              </button>
            </div>
          )}
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight mb-5">
          {topic.title}
        </h1>

        {/* Full Content */}
        <div className="text-[15px] sm:text-base text-slate-800 leading-[1.7] whitespace-pre-line mb-6">
          {topic.content}
        </div>

        {/* Topic Image */}
        {topic.imageUrl && (
          <div className="mb-6">
            <TopicImage
              src={topic.imageUrl}
              alt={topic.title}
              className="w-full max-h-[420px] object-cover rounded-xl"
            />
          </div>
        )}

        {/* Unboxed Tags */}
        {tags.length > 0 && (
          <div className="flex items-center flex-wrap gap-2 text-xs text-slate-500 mb-6">
            <span>Thẻ chủ đề:</span>
            {tags.map((t, idx) => (
              <React.Fragment key={t}>
                {idx > 0 && <span aria-hidden="true">·</span>}
                <button
                  type="button"
                  onClick={() => navigate('search', { searchQuery: t, tagFilter: t })}
                  className="text-blue-600 hover:underline font-medium"
                >
                  #{t}
                </button>
              </React.Fragment>
            ))}
          </div>
        )}

        {/* Interaction Toolbar */}
        <div className="pt-4 border-t border-slate-200/80 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleToggleTopicLike}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap ${
                topic.isLiked
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Heart className={`w-4 h-4 ${topic.isLiked ? 'fill-white' : ''}`} />
              <span className="tabular-nums">{topic.likeCount}</span>
              <span>Thích</span>
            </button>

            <button
              type="button"
              onClick={handleToggleBookmark}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap ${
                topic.isBookmarked
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${topic.isBookmarked ? 'fill-blue-600' : ''}`} />
              <span>{topic.isBookmarked ? 'Đã lưu' : 'Lưu bài'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                navigator.clipboard
                  ?.writeText(`${window.location.origin}/?topic=${topic.id}`)
                  .catch(() => {});
                showToast('Đã sao chép liên kết chia sẻ.', 'info');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors whitespace-nowrap"
            >
              <Share2 className="w-4 h-4" /> Chia sẻ
            </button>
            <button
              type="button"
              onClick={() => {
                if (!user) {
                  navigate('login');
                  return;
                }
                openReportModal({
                  targetType: 'topic',
                  targetId: topic.id,
                  targetLabel: topic.title,
                });
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors whitespace-nowrap"
            >
              <Flag className="w-4 h-4" /> Báo cáo
            </button>
          </div>
        </div>
      </article>

      {/* Comments Section */}
      <section className="bg-white border border-slate-200/80 rounded-xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 tabular-nums">
            Bình luận ({comments.length})
          </h2>
        </div>

        {/* Comment Input Form */}
        {user ? (
          <form onSubmit={handleCreateComment} className="space-y-3">
            {replyingTo && (
              <div className="flex items-center justify-between bg-blue-50 border border-blue-200 px-3.5 py-2 rounded-lg text-xs text-blue-800">
                <span>
                  Đang trả lời bình luận của <strong>{replyingTo.author.displayName}</strong>:{' '}
                  "{replyingTo.content.slice(0, 60)}..."
                </span>
                <button
                  type="button"
                  onClick={() => setReplyingTo(null)}
                  className="font-semibold hover:underline ml-2"
                >
                  Hủy
                </button>
              </div>
            )}
            <div className="flex items-start gap-3">
              <UserAvatar name={user.displayName} avatar={user.avatar} size="sm" />
              <div className="flex-1 space-y-2">
                <textarea
                  rows={3}
                  required
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder={
                    replyingTo
                      ? `Viết câu trả lời cho ${replyingTo.author.displayName}...`
                      : 'Chia sẻ ý kiến đóng góp của bạn về chủ đề này...'
                  }
                  className="w-full px-4 py-3 text-sm bg-[#F8FAFC] border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-blue-600 transition-colors"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-colors whitespace-nowrap"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{submitting ? 'Đang gửi...' : 'Gửi bình luận'}</span>
                  </button>
                </div>
              </div>
            </div>
          </form>
        ) : (
          <div className="p-4 bg-slate-50 border border-slate-200/70 rounded-xl flex items-center justify-between">
            <span className="text-sm text-slate-600">
              Đăng nhập để tham gia bình luận và thảo luận cùng mọi người.
            </span>
            <button
              type="button"
              onClick={() => navigate('login')}
              className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg whitespace-nowrap"
            >
              Đăng nhập
            </button>
          </div>
        )}

        {/* Comment Tree */}
        {comments.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-6">
            Chưa có bình luận nào. Hãy là người đầu tiên chia sẻ suy nghĩ!
          </p>
        ) : (
          renderCommentTree(null, 0)
        )}
      </section>
    </div>
  );
};

// ============================================================================
// 8 & 9. CREATE TOPIC & EDIT TOPIC PAGE
// ============================================================================
export const TopicFormPage: React.FC<{ mode: 'create' | 'edit' }> = ({ mode }) => {
  const { route, categories, navigate, showToast } = useApp();
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [tags, setTags] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (categories.length > 0 && !categoryId) {
      setCategoryId(String(categories[0].id));
    }
  }, [categories, categoryId]);

  useEffect(() => {
    if (mode === 'edit' && route.topicId) {
      apiRequest<{ topic: Topic }>(`/api/topics/${route.topicId}`)
        .then((res) => {
          setTitle(res.topic.title);
          setCategoryId(res.topic.categoryId ? String(res.topic.categoryId) : '');
          setContent(res.topic.content);
          setImageUrl(res.topic.imageUrl || '');
          setTags(res.topic.tags || '');
        })
        .catch((err) => showToast(err.message, 'error'));
    }
  }, [mode, route.topicId, showToast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (mode === 'create') {
        const res = await apiRequest<{ topic: Topic }>('/api/topics', {
          method: 'POST',
          body: JSON.stringify({
            title,
            categoryId: categoryId ? Number(categoryId) : null,
            content,
            imageUrl,
            tags,
          }),
        });
        showToast('Topic created successfully — Đã tạo chủ đề mới!', 'success');
        navigate('topic-detail', { topicId: res.topic.id });
      } else if (route.topicId) {
        const res = await apiRequest<{ topic: Topic }>(`/api/topics/${route.topicId}`, {
          method: 'PUT',
          body: JSON.stringify({
            title,
            categoryId: categoryId ? Number(categoryId) : null,
            content,
            imageUrl,
            tags,
          }),
        });
        showToast('Đã cập nhật chủ đề thành công!', 'success');
        navigate('topic-detail', { topicId: res.topic.id });
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const presetImages = [
    { label: 'Không gian Kỹ thuật', url: GENERATED_ASSETS.topicTech },
    { label: 'Thiết kế Design System', url: GENERATED_ASSETS.topicDesign },
    { label: 'Không gian Cộng đồng', url: GENERATED_ASSETS.heroBanner },
  ];

  return (
    <div className="bg-white border border-slate-200/80 rounded-xl p-6 sm:p-8">
      <button
        type="button"
        onClick={() => navigate('home')}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-blue-600 mb-4"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Hủy & Quay lại
      </button>

      <h1 className="text-2xl font-bold text-slate-900 mb-1">
        {mode === 'create' ? 'Tạo chủ đề thảo luận mới' : 'Chỉnh sửa chủ đề'}
      </h1>
      <p className="text-sm text-slate-500 mb-6">
        Điền tiêu đề rõ ràng, chọn danh mục phù hợp và trình bày nội dung chi tiết.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Tiêu đề chủ đề (Title) *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Đặt tiêu đề ngắn gọn, súc tích..."
              className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Danh mục (Category) *
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-blue-600"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Nội dung chi tiết (Content) *
          </label>
          <textarea
            rows={8}
            required
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Viết nội dung thảo luận, đặt câu hỏi hoặc chia sẻ kinh nghiệm của bạn..."
            className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600 leading-relaxed"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Hình ảnh minh họa (Optional Image URL)
            </label>
            <div className="relative">
              <ImageIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="Dán URL ảnh hoặc chọn mẫu bên dưới..."
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600"
              />
            </div>
            <div className="mt-2 flex items-center flex-wrap gap-2">
              <span className="text-xs text-slate-400">Chọn nhanh ảnh mẫu:</span>
              {presetImages.map((img) => (
                <button
                  key={img.label}
                  type="button"
                  onClick={() => setImageUrl(img.url)}
                  className="text-xs text-blue-600 hover:underline"
                >
                  {img.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Thẻ từ khóa (Tags, phân cách bằng dấu phẩy)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="vd: react, typescript, architecture"
              className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600"
            />
          </div>
        </div>

        {imageUrl && (
          <div className="pt-2">
            <p className="text-xs text-slate-500 mb-1.5">Xem trước hình ảnh:</p>
            <TopicImage
              src={imageUrl}
              alt="Xem trước"
              className="w-full max-h-52 object-cover rounded-xl"
            />
          </div>
        )}

        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('home')}
            className="px-5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors whitespace-nowrap"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-colors whitespace-nowrap"
          >
            {submitting
              ? 'Đang lưu...'
              : mode === 'create'
              ? 'Create Topic'
              : 'Lưu thay đổi'}
          </button>
        </div>
      </form>
    </div>
  );
};

// ============================================================================
// 17. SEARCH RESULTS PAGE
// ============================================================================
export const SearchResultsPage: React.FC = () => {
  const { route, navigate } = useApp();
  const [query, setQuery] = useState(route.searchQuery || '');
  const [activeTab, setActiveTab] = useState<'all' | 'topics' | 'users' | 'categories' | 'tags'>(
    'all'
  );
  const [results, setResults] = useState<{
    users: User[];
    topics: Topic[];
    categories: Category[];
    tags: { tag: string; count: number }[];
  }>({
    users: [],
    topics: [],
    categories: [],
    tags: [],
  });
  const [loading, setLoading] = useState(true);

  const performSearch = useCallback(async (qStr: string) => {
    setLoading(true);
    try {
      const data = await apiRequest<{
        users: User[];
        topics: Topic[];
        categories: Category[];
        tags: { tag: string; count: number }[];
      }>(`/api/search?q=${encodeURIComponent(qStr)}`);
      setResults(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setQuery(route.searchQuery || '');
    performSearch(route.searchQuery || '');
  }, [route.searchQuery, performSearch]);

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200/80 rounded-xl p-6 space-y-4">
        <h1 className="text-xl font-bold text-slate-900">
          Tìm kiếm toàn hệ thống
        </h1>
        <SearchBar
          initialValue={query}
          onSearch={(val) => {
            setQuery(val);
            performSearch(val);
          }}
        />

        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto">
          {[
            { id: 'all', label: 'Tất cả' },
            { id: 'topics', label: `Chủ đề (${results.topics.length})` },
            { id: 'users', label: `Thành viên (${results.users.length})` },
            { id: 'categories', label: `Danh mục (${results.categories.length})` },
            { id: 'tags', label: `Tags (${results.tags.length})` },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id as any)}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                activeTab === t.id
                  ? 'bg-white text-blue-600 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <LoadingSkeleton count={2} />
      ) : (
        <div className="space-y-6">
          {/* Users Section */}
          {(activeTab === 'all' || activeTab === 'users') && results.users.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-slate-900 px-1">
                Thành viên ({results.users.length})
              </h2>
              <div className="grid grid-cols-1 gap-3">
                {results.users.map((u) => (
                  <UserCard key={u.id} targetUser={u} />
                ))}
              </div>
            </section>
          )}

          {/* Categories Section */}
          {(activeTab === 'all' || activeTab === 'categories') &&
            results.categories.length > 0 && (
              <section className="bg-white border border-slate-200/80 rounded-xl p-5">
                <h2 className="text-sm font-semibold text-slate-900 mb-3">
                  Danh mục ({results.categories.length})
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {results.categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => navigate('category', { categorySlug: cat.slug })}
                      className="p-3.5 rounded-xl border border-slate-200/70 hover:border-blue-400 text-left transition-colors"
                    >
                      <p className="text-sm font-semibold text-slate-900">{cat.name}</p>
                      <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                        {cat.description}
                      </p>
                    </button>
                  ))}
                </div>
              </section>
            )}

          {/* Tags Section */}
          {(activeTab === 'all' || activeTab === 'tags') && results.tags.length > 0 && (
            <section className="bg-white border border-slate-200/80 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-slate-900 mb-3">
                Thẻ từ khóa ({results.tags.length})
              </h2>
              <div className="flex items-center flex-wrap gap-3 text-xs text-slate-600">
                {results.tags.map((item, idx) => (
                  <React.Fragment key={item.tag}>
                    {idx > 0 && <span aria-hidden="true">·</span>}
                    <button
                      type="button"
                      onClick={() => {
                        setQuery(item.tag);
                        performSearch(item.tag);
                      }}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      #{item.tag} ({item.count})
                    </button>
                  </React.Fragment>
                ))}
              </div>
            </section>
          )}

          {/* Topics Section */}
          {(activeTab === 'all' || activeTab === 'topics') && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-slate-900 px-1">
                Chủ đề thảo luận ({results.topics.length})
              </h2>
              {results.topics.length === 0 ? (
                <EmptyState
                  title="Không tìm thấy chủ đề phù hợp"
                  description="Hãy thử tìm kiếm bằng từ khóa khác hoặc tạo chủ đề mới."
                />
              ) : (
                <div className="space-y-4">
                  {results.topics.map((t) => (
                    <TopicCard key={t.id} topic={t} />
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      )}
    </div>
  );
};
