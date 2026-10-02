import { and, asc, desc, eq, ilike, isNull, ne, or } from 'drizzle-orm';
import { db } from './index.ts';
import {
  bookmarks,
  categories,
  comments,
  friendships,
  likes,
  messages,
  notifications,
  reports,
  topics,
  users,
} from './schema.ts';

const BOOTSTRAP_ADMIN_EMAIL = 'trungquann38@gmail.com';

export function sanitizeUser(user: typeof users.$inferSelect) {
  const { passwordHash, ...rest } = user;
  return rest;
}

export async function getOrCreateUser(
  uid: string,
  email: string,
  displayName?: string,
  avatar?: string
) {
  try {
    const cleanEmail = email.trim().toLowerCase();
    const existingByUid = await db.select().from(users).where(eq(users.uid, uid));
    if (existingByUid.length > 0) {
      const current = existingByUid[0];
      const shouldBeAdmin = cleanEmail === BOOTSTRAP_ADMIN_EMAIL ? 'admin' : current.role;
      const updated = await db
        .update(users)
        .set({
          onlineStatus: true,
          lastSeen: new Date(),
          role: shouldBeAdmin,
          ...(avatar && !current.avatar ? { avatar } : {}),
        })
        .where(eq(users.id, current.id))
        .returning();
      return sanitizeUser(updated[0]);
    }

    const existingByEmail = await db.select().from(users).where(eq(users.email, cleanEmail));
    if (existingByEmail.length > 0) {
      const current = existingByEmail[0];
      const shouldBeAdmin = cleanEmail === BOOTSTRAP_ADMIN_EMAIL ? 'admin' : current.role;
      const updated = await db
        .update(users)
        .set({
          uid,
          onlineStatus: true,
          lastSeen: new Date(),
          role: shouldBeAdmin,
        })
        .where(eq(users.id, current.id))
        .returning();
      return sanitizeUser(updated[0]);
    }

    const baseUsername = cleanEmail
      .split('@')[0]
      .replace(/[^a-zA-Z0-9_]/g, '_')
      .slice(0, 20) || 'member';
    const uniqueSuffix = Math.floor(100 + Math.random() * 900);
    const username = `${baseUsername}_${uniqueSuffix}`;
    const resolvedName = displayName?.trim() || baseUsername;
    const role = cleanEmail === BOOTSTRAP_ADMIN_EMAIL ? 'admin' : 'user';

    const result = await db
      .insert(users)
      .values({
        uid,
        username,
        email: cleanEmail,
        displayName: resolvedName,
        avatar: avatar || '',
        bio: 'Thành viên cộng đồng BlueSpace',
        role,
        onlineStatus: true,
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email: cleanEmail,
          onlineStatus: true,
          lastSeen: new Date(),
        },
      })
      .returning();

    return sanitizeUser(result[0]);
  } catch (error) {
    console.error('Database error in getOrCreateUser:', error);
    throw new Error('Không thể đồng bộ tài khoản người dùng.', { cause: error });
  }
}

export async function registerLocalUser(input: {
  username: string;
  email: string;
  passwordHash: string;
  displayName?: string;
}) {
  try {
    const cleanEmail = input.email.trim().toLowerCase();
    const cleanUsername = input.username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');

    const existing = await db
      .select()
      .from(users)
      .where(or(eq(users.email, cleanEmail), eq(users.username, cleanUsername)));

    if (existing.length > 0) {
      if (existing[0].email === cleanEmail) {
        throw new Error('Email này đã được sử dụng.');
      }
      throw new Error('Username này đã tồn tại.');
    }

    const uid = `local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const role = cleanEmail === BOOTSTRAP_ADMIN_EMAIL ? 'admin' : 'user';

    const inserted = await db
      .insert(users)
      .values({
        uid,
        username: cleanUsername,
        email: cleanEmail,
        passwordHash: input.passwordHash,
        displayName: input.displayName?.trim() || input.username.trim(),
        bio: 'Thành viên mới tại cộng đồng BlueSpace.',
        role,
        onlineStatus: true,
      })
      .returning();

    return sanitizeUser(inserted[0]);
  } catch (error: any) {
    console.error('Database error in registerLocalUser:', error);
    throw new Error(error.message || 'Không thể đăng ký tài khoản.', { cause: error });
  }
}

export async function getUserWithPasswordByIdentifier(identifier: string) {
  try {
    const clean = identifier.trim().toLowerCase();
    const found = await db
      .select()
      .from(users)
      .where(or(eq(users.email, clean), eq(users.username, clean)));
    return found[0] || null;
  } catch (error) {
    console.error('Database error in getUserWithPasswordByIdentifier:', error);
    throw new Error('Không thể kiểm tra thông tin đăng nhập.', { cause: error });
  }
}

export async function resetPasswordByEmail(email: string, newPasswordHash: string) {
  try {
    const cleanEmail = email.trim().toLowerCase();
    const found = await db.select().from(users).where(eq(users.email, cleanEmail));
    if (found.length === 0) {
      throw new Error('Không tìm thấy tài khoản với email này.');
    }
    const updated = await db
      .update(users)
      .set({ passwordHash: newPasswordHash, updatedAt: new Date() })
      .where(eq(users.id, found[0].id))
      .returning();
    return sanitizeUser(updated[0]);
  } catch (error: any) {
    console.error('Database error in resetPasswordByEmail:', error);
    throw new Error(error.message || 'Không thể đặt lại mật khẩu.', { cause: error });
  }
}

export async function getUserByUid(uid: string) {
  try {
    const found = await db.select().from(users).where(eq(users.uid, uid));
    return found[0] ? sanitizeUser(found[0]) : null;
  } catch (error) {
    console.error('Database error in getUserByUid:', error);
    throw new Error('Không thể tải thông tin người dùng.', { cause: error });
  }
}

export async function getUserById(userId: number) {
  try {
    const found = await db.select().from(users).where(eq(users.id, userId));
    if (!found[0]) return null;
    const user = sanitizeUser(found[0]);

    const userTopics = await db
      .select()
      .from(topics)
      .where(eq(topics.authorId, userId))
      .orderBy(desc(topics.createdAt));

    const userComments = await db
      .select()
      .from(comments)
      .where(eq(comments.authorId, userId));

    const userFriends = await db
      .select()
      .from(friendships)
      .where(
        and(
          eq(friendships.status, 'accepted'),
          or(eq(friendships.requesterId, userId), eq(friendships.receiverId, userId))
        )
      );

    return {
      ...user,
      topicsCount: userTopics.length,
      postsCount: userTopics.length + userComments.length,
      friendsCount: userFriends.length,
    };
  } catch (error) {
    console.error('Database error in getUserById:', error);
    throw new Error('Không thể tải hồ sơ cá nhân.', { cause: error });
  }
}

export async function updateUserProfile(
  userId: number,
  data: { username?: string; displayName?: string; bio?: string; avatar?: string; role?: string }
) {
  try {
    const updateValues: Partial<typeof users.$inferInsert> = {
      updatedAt: new Date(),
    };
    if (data.username !== undefined) {
      const cleanUsername = data.username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
      if (cleanUsername.length >= 3) {
        const conflict = await db
          .select()
          .from(users)
          .where(and(eq(users.username, cleanUsername), ne(users.id, userId)));
        if (conflict.length > 0) {
          throw new Error('Username này đã có người sử dụng.');
        }
        updateValues.username = cleanUsername;
      }
    }
    if (data.displayName !== undefined && data.displayName.trim()) {
      updateValues.displayName = data.displayName.trim();
    }
    if (data.bio !== undefined) {
      updateValues.bio = data.bio.trim();
    }
    if (data.avatar !== undefined) {
      updateValues.avatar = data.avatar.trim();
    }
    if (data.role !== undefined && (data.role === 'admin' || data.role === 'user')) {
      updateValues.role = data.role;
    }

    const updated = await db
      .update(users)
      .set(updateValues)
      .where(eq(users.id, userId))
      .returning();

    return sanitizeUser(updated[0]);
  } catch (error: any) {
    console.error('Database error in updateUserProfile:', error);
    throw new Error(error.message || 'Không thể cập nhật hồ sơ.', { cause: error });
  }
}

export async function setUserOnlineStatus(userId: number, online: boolean) {
  try {
    await db
      .update(users)
      .set({ onlineStatus: online, lastSeen: new Date() })
      .where(eq(users.id, userId));
  } catch (error) {
    console.error('Database error in setUserOnlineStatus:', error);
  }
}

export async function getCategoriesWithCounts() {
  try {
    const allCats = await db.select().from(categories).orderBy(asc(categories.id));
    const allTopics = await db.select().from(topics);
    return allCats.map((cat) => ({
      ...cat,
      topicCount: allTopics.filter((t) => t.categoryId === cat.id).length,
    }));
  } catch (error) {
    console.error('Database error in getCategoriesWithCounts:', error);
    throw new Error('Không thể tải danh mục.', { cause: error });
  }
}

export async function getEnrichedTopics(options: {
  sort?: 'latest' | 'popular' | 'discussing';
  categoryId?: number;
  categorySlug?: string;
  authorId?: number;
  bookmarkedByUserId?: number;
  search?: string;
  tag?: string;
  viewerId?: number;
}) {
  try {
    const allTopics = await db.select().from(topics).orderBy(desc(topics.createdAt));
    const allUsers = await db.select().from(users);
    const allCategories = await db.select().from(categories);
    const allComments = await db.select().from(comments);
    const allLikes = await db.select().from(likes);
    const allBookmarks = await db.select().from(bookmarks);

    const userMap = new Map(allUsers.map((u) => [u.id, sanitizeUser(u)]));
    const catMap = new Map(allCategories.map((c) => [c.id, c]));

    let enriched = allTopics.map((topic) => {
      const topicComments = allComments.filter((c) => c.topicId === topic.id);
      const topicLikes = allLikes.filter((l) => l.topicId === topic.id);
      const topicBookmarks = allBookmarks.filter((b) => b.topicId === topic.id);
      const lastCommentAt =
        topicComments.length > 0
          ? Math.max(...topicComments.map((c) => new Date(c.createdAt).getTime()))
          : new Date(topic.createdAt).getTime();

      return {
        ...topic,
        author: userMap.get(topic.authorId) || {
          id: topic.authorId,
          displayName: 'Thành viên',
          username: 'member',
          avatar: '',
          onlineStatus: false,
        },
        category: topic.categoryId ? catMap.get(topic.categoryId) || null : null,
        commentCount: topicComments.length,
        likeCount: topicLikes.length,
        bookmarkCount: topicBookmarks.length,
        isLiked: options.viewerId
          ? topicLikes.some((l) => l.userId === options.viewerId)
          : false,
        isBookmarked: options.viewerId
          ? topicBookmarks.some((b) => b.userId === options.viewerId)
          : false,
        lastActivityAt: lastCommentAt,
      };
    });

    if (options.categoryId) {
      enriched = enriched.filter((t) => t.categoryId === options.categoryId);
    }
    if (options.categorySlug) {
      enriched = enriched.filter((t) => t.category?.slug === options.categorySlug);
    }
    if (options.authorId) {
      enriched = enriched.filter((t) => t.authorId === options.authorId);
    }
    if (options.bookmarkedByUserId) {
      enriched = enriched.filter((t) =>
        allBookmarks.some(
          (b) => b.topicId === t.id && b.userId === options.bookmarkedByUserId
        )
      );
    }
    if (options.tag) {
      const cleanTag = options.tag.toLowerCase().trim();
      enriched = enriched.filter((t) =>
        t.tags
          .split(',')
          .map((s) => s.trim().toLowerCase())
          .includes(cleanTag)
      );
    }
    if (options.search) {
      const q = options.search.toLowerCase().trim();
      enriched = enriched.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.content.toLowerCase().includes(q) ||
          t.tags.toLowerCase().includes(q) ||
          t.author.displayName.toLowerCase().includes(q)
      );
    }

    if (options.sort === 'popular') {
      enriched.sort(
        (a, b) =>
          b.likeCount * 3 + b.commentCount * 2 + b.views -
          (a.likeCount * 3 + a.commentCount * 2 + a.views)
      );
    } else if (options.sort === 'discussing') {
      enriched.sort((a, b) => b.commentCount - a.commentCount || b.lastActivityAt - a.lastActivityAt);
    } else {
      enriched.sort((a, b) => {
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    }

    return enriched;
  } catch (error) {
    console.error('Database error in getEnrichedTopics:', error);
    throw new Error('Không thể tải danh sách chủ đề.', { cause: error });
  }
}

export async function getTopicDetailById(topicId: number, viewerId?: number) {
  try {
    const foundTopics = await db.select().from(topics).where(eq(topics.id, topicId));
    if (foundTopics.length === 0) return null;

    await db
      .update(topics)
      .set({ views: foundTopics[0].views + 1 })
      .where(eq(topics.id, topicId));

    const topic = { ...foundTopics[0], views: foundTopics[0].views + 1 };
    const allUsers = await db.select().from(users);
    const allCategories = await db.select().from(categories);
    const topicComments = await db
      .select()
      .from(comments)
      .where(eq(comments.topicId, topicId))
      .orderBy(asc(comments.createdAt));
    const allLikes = await db.select().from(likes);
    const topicBookmarks = await db
      .select()
      .from(bookmarks)
      .where(eq(bookmarks.topicId, topicId));

    const userMap = new Map(allUsers.map((u) => [u.id, sanitizeUser(u)]));
    const catMap = new Map(allCategories.map((c) => [c.id, c]));

    const topicLikes = allLikes.filter((l) => l.topicId === topicId);

    const enrichedComments = topicComments.map((c) => {
      const cLikes = allLikes.filter((l) => l.commentId === c.id);
      return {
        ...c,
        author: userMap.get(c.authorId) || {
          id: c.authorId,
          displayName: 'Thành viên',
          username: 'member',
          avatar: '',
          onlineStatus: false,
        },
        likeCount: cLikes.length,
        isLiked: viewerId ? cLikes.some((l) => l.userId === viewerId) : false,
      };
    });

    return {
      ...topic,
      author: userMap.get(topic.authorId) || {
        id: topic.authorId,
        displayName: 'Thành viên',
        username: 'member',
        avatar: '',
        onlineStatus: false,
      },
      category: topic.categoryId ? catMap.get(topic.categoryId) || null : null,
      commentCount: enrichedComments.length,
      likeCount: topicLikes.length,
      bookmarkCount: topicBookmarks.length,
      isLiked: viewerId ? topicLikes.some((l) => l.userId === viewerId) : false,
      isBookmarked: viewerId ? topicBookmarks.some((b) => b.userId === viewerId) : false,
      comments: enrichedComments,
    };
  } catch (error) {
    console.error('Database error in getTopicDetailById:', error);
    throw new Error('Không thể tải chi tiết chủ đề.', { cause: error });
  }
}

export async function createNewTopic(input: {
  authorId: number;
  categoryId: number | null;
  title: string;
  content: string;
  imageUrl?: string;
  tags?: string;
}) {
  try {
    const inserted = await db
      .insert(topics)
      .values({
        authorId: input.authorId,
        categoryId: input.categoryId,
        title: input.title.trim(),
        content: input.content.trim(),
        imageUrl: input.imageUrl?.trim() || '',
        tags: input.tags?.trim() || '',
      })
      .returning();
    return inserted[0];
  } catch (error) {
    console.error('Database error in createNewTopic:', error);
    throw new Error('Không thể tạo chủ đề mới.', { cause: error });
  }
}

export async function updateExistingTopic(
  topicId: number,
  userId: number,
  isAdmin: boolean,
  input: {
    categoryId?: number | null;
    title?: string;
    content?: string;
    imageUrl?: string;
    tags?: string;
    isPinned?: boolean;
  }
) {
  try {
    const existing = await db.select().from(topics).where(eq(topics.id, topicId));
    if (existing.length === 0) throw new Error('Chủ đề không tồn tại.');
    if (existing[0].authorId !== userId && !isAdmin) {
      throw new Error('Bạn không có quyền chỉnh sửa chủ đề này.');
    }

    const updated = await db
      .update(topics)
      .set({
        ...(input.categoryId !== undefined ? { categoryId: input.categoryId } : {}),
        ...(input.title !== undefined ? { title: input.title.trim() } : {}),
        ...(input.content !== undefined ? { content: input.content.trim() } : {}),
        ...(input.imageUrl !== undefined ? { imageUrl: input.imageUrl.trim() } : {}),
        ...(input.tags !== undefined ? { tags: input.tags.trim() } : {}),
        ...(input.isPinned !== undefined && isAdmin ? { isPinned: input.isPinned } : {}),
        updatedAt: new Date(),
      })
      .where(eq(topics.id, topicId))
      .returning();
    return updated[0];
  } catch (error: any) {
    console.error('Database error in updateExistingTopic:', error);
    throw new Error(error.message || 'Không thể cập nhật chủ đề.', { cause: error });
  }
}

export async function deleteExistingTopic(topicId: number, userId: number, isAdmin: boolean) {
  try {
    const existing = await db.select().from(topics).where(eq(topics.id, topicId));
    if (existing.length === 0) throw new Error('Chủ đề không tồn tại.');
    if (existing[0].authorId !== userId && !isAdmin) {
      throw new Error('Bạn không có quyền xóa chủ đề này.');
    }
    await db.delete(topics).where(eq(topics.id, topicId));
    return { success: true };
  } catch (error: any) {
    console.error('Database error in deleteExistingTopic:', error);
    throw new Error(error.message || 'Không thể xóa chủ đề.', { cause: error });
  }
}

export async function toggleTopicLike(userId: number, topicId: number) {
  try {
    const existing = await db
      .select()
      .from(likes)
      .where(and(eq(likes.userId, userId), eq(likes.topicId, topicId)));

    if (existing.length > 0) {
      await db.delete(likes).where(eq(likes.id, existing[0].id));
      return { liked: false };
    } else {
      await db.insert(likes).values({ userId, topicId });
      const topicRows = await db.select().from(topics).where(eq(topics.id, topicId));
      const actorRows = await db.select().from(users).where(eq(users.id, userId));
      if (topicRows[0] && topicRows[0].authorId !== userId && actorRows[0]) {
        await db.insert(notifications).values({
          userId: topicRows[0].authorId,
          actorId: userId,
          type: 'topic_like',
          referenceId: topicId,
          message: `${actorRows[0].displayName} đã thích chủ đề "${topicRows[0].title.slice(0, 45)}"`,
        });
      }
      return { liked: true, authorId: topicRows[0]?.authorId };
    }
  } catch (error) {
    console.error('Database error in toggleTopicLike:', error);
    throw new Error('Không thể tương tác thích chủ đề.', { cause: error });
  }
}

export async function toggleTopicBookmark(userId: number, topicId: number) {
  try {
    const existing = await db
      .select()
      .from(bookmarks)
      .where(and(eq(bookmarks.userId, userId), eq(bookmarks.topicId, topicId)));

    if (existing.length > 0) {
      await db.delete(bookmarks).where(eq(bookmarks.id, existing[0].id));
      return { bookmarked: false };
    } else {
      await db.insert(bookmarks).values({ userId, topicId });
      return { bookmarked: true };
    }
  } catch (error) {
    console.error('Database error in toggleTopicBookmark:', error);
    throw new Error('Không thể lưu chủ đề.', { cause: error });
  }
}

export async function createNewComment(input: {
  topicId: number;
  authorId: number;
  parentCommentId?: number | null;
  content: string;
}) {
  try {
    const inserted = await db
      .insert(comments)
      .values({
        topicId: input.topicId,
        authorId: input.authorId,
        parentCommentId: input.parentCommentId || null,
        content: input.content.trim(),
      })
      .returning();

    const comment = inserted[0];
    const actorRows = await db.select().from(users).where(eq(users.id, input.authorId));
    const topicRows = await db.select().from(topics).where(eq(topics.id, input.topicId));
    const actor = actorRows[0] ? sanitizeUser(actorRows[0]) : null;

    let notifiedUserId: number | null = null;

    if (input.parentCommentId) {
      const parentRows = await db
        .select()
        .from(comments)
        .where(eq(comments.id, input.parentCommentId));
      if (parentRows[0] && parentRows[0].authorId !== input.authorId && actor) {
        notifiedUserId = parentRows[0].authorId;
        await db.insert(notifications).values({
          userId: parentRows[0].authorId,
          actorId: input.authorId,
          type: 'comment_reply',
          referenceId: input.topicId,
          message: `${actor.displayName} đã trả lời bình luận của bạn trong "${topicRows[0]?.title.slice(0, 40) || 'chủ đề'}"`,
        });
      }
    } else if (topicRows[0] && topicRows[0].authorId !== input.authorId && actor) {
      notifiedUserId = topicRows[0].authorId;
      await db.insert(notifications).values({
        userId: topicRows[0].authorId,
        actorId: input.authorId,
        type: 'topic_comment',
        referenceId: input.topicId,
        message: `${actor.displayName} đã bình luận vào chủ đề "${topicRows[0].title.slice(0, 40)}"`,
      });
    }

    return {
      comment: {
        ...comment,
        author: actor || {
          id: input.authorId,
          displayName: 'Thành viên',
          username: 'member',
          avatar: '',
          onlineStatus: true,
        },
        likeCount: 0,
        isLiked: false,
      },
      notifiedUserId,
    };
  } catch (error) {
    console.error('Database error in createNewComment:', error);
    throw new Error('Không thể gửi bình luận.', { cause: error });
  }
}

export async function updateExistingComment(
  commentId: number,
  userId: number,
  content: string
) {
  try {
    const existing = await db.select().from(comments).where(eq(comments.id, commentId));
    if (existing.length === 0) throw new Error('Bình luận không tồn tại.');
    if (existing[0].authorId !== userId) {
      throw new Error('Bạn chỉ có thể chỉnh sửa bình luận của chính mình.');
    }
    const updated = await db
      .update(comments)
      .set({ content: content.trim(), updatedAt: new Date() })
      .where(eq(comments.id, commentId))
      .returning();
    return updated[0];
  } catch (error: any) {
    console.error('Database error in updateExistingComment:', error);
    throw new Error(error.message || 'Không thể chỉnh sửa bình luận.', { cause: error });
  }
}

export async function deleteExistingComment(
  commentId: number,
  userId: number,
  isAdmin: boolean
) {
  try {
    const existing = await db.select().from(comments).where(eq(comments.id, commentId));
    if (existing.length === 0) throw new Error('Bình luận không tồn tại.');
    if (existing[0].authorId !== userId && !isAdmin) {
      throw new Error('Bạn không có quyền xóa bình luận này.');
    }
    await db.delete(comments).where(eq(comments.id, commentId));
    return { success: true, topicId: existing[0].topicId };
  } catch (error: any) {
    console.error('Database error in deleteExistingComment:', error);
    throw new Error(error.message || 'Không thể xóa bình luận.', { cause: error });
  }
}

export async function toggleCommentLike(userId: number, commentId: number) {
  try {
    const existing = await db
      .select()
      .from(likes)
      .where(and(eq(likes.userId, userId), eq(likes.commentId, commentId)));

    if (existing.length > 0) {
      await db.delete(likes).where(eq(likes.id, existing[0].id));
      return { liked: false };
    } else {
      await db.insert(likes).values({ userId, commentId });
      return { liked: true };
    }
  } catch (error) {
    console.error('Database error in toggleCommentLike:', error);
    throw new Error('Không thể thích bình luận.', { cause: error });
  }
}

export async function getSocialDataForUser(userId?: number) {
  try {
    const allUsers = (await db.select().from(users)).map(sanitizeUser);
    const allFriendships = await db.select().from(friendships);

    const onlineUsers = allUsers.filter((u) => u.onlineStatus && u.id !== userId);

    if (!userId) {
      return {
        friends: [],
        incomingRequests: [],
        outgoingRequests: [],
        suggestedUsers: allUsers.slice(0, 6),
        onlineUsers,
        allUsers,
        friendships: [],
      };
    }

    const myFriendships = allFriendships.filter(
      (f) => f.requesterId === userId || f.receiverId === userId
    );

    const userMap = new Map(allUsers.map((u) => [u.id, u]));

    const friends = myFriendships
      .filter((f) => f.status === 'accepted')
      .map((f) => {
        const otherId = f.requesterId === userId ? f.receiverId : f.requesterId;
        return {
          friendshipId: f.id,
          user: userMap.get(otherId),
          since: f.updatedAt,
        };
      })
      .filter((item) => item.user !== undefined);

    const incomingRequests = myFriendships
      .filter((f) => f.status === 'pending' && f.receiverId === userId)
      .map((f) => ({
        friendshipId: f.id,
        user: userMap.get(f.requesterId),
        createdAt: f.createdAt,
      }))
      .filter((item) => item.user !== undefined);

    const outgoingRequests = myFriendships
      .filter((f) => f.status === 'pending' && f.requesterId === userId)
      .map((f) => ({
        friendshipId: f.id,
        user: userMap.get(f.receiverId),
        createdAt: f.createdAt,
      }))
      .filter((item) => item.user !== undefined);

    const connectedUserIds = new Set<number>([userId]);
    myFriendships.forEach((f) => {
      if (f.status === 'accepted' || f.status === 'pending') {
        connectedUserIds.add(f.requesterId);
        connectedUserIds.add(f.receiverId);
      }
    });

    const suggestedUsers = allUsers.filter((u) => !connectedUserIds.has(u.id) && !u.isBanned);

    return {
      friends,
      incomingRequests,
      outgoingRequests,
      suggestedUsers,
      onlineUsers,
      allUsers,
      friendships: myFriendships,
    };
  } catch (error) {
    console.error('Database error in getSocialDataForUser:', error);
    throw new Error('Không thể tải dữ liệu bạn bè.', { cause: error });
  }
}

export async function sendFriendRequest(requesterId: number, receiverId: number) {
  try {
    if (requesterId === receiverId) {
      throw new Error('Không thể tự kết bạn với chính mình.');
    }
    const existing = await db
      .select()
      .from(friendships)
      .where(
        or(
          and(eq(friendships.requesterId, requesterId), eq(friendships.receiverId, receiverId)),
          and(eq(friendships.requesterId, receiverId), eq(friendships.receiverId, requesterId))
        )
      );

    if (existing.length > 0) {
      if (existing[0].status === 'accepted') {
        throw new Error('Hai bạn đã là bạn bè.');
      }
      if (existing[0].status === 'pending') {
        throw new Error('Lời mời kết bạn đang chờ phản hồi.');
      }
      const updated = await db
        .update(friendships)
        .set({
          requesterId,
          receiverId,
          status: 'pending',
          updatedAt: new Date(),
        })
        .where(eq(friendships.id, existing[0].id))
        .returning();

      return updated[0];
    }

    const inserted = await db
      .insert(friendships)
      .values({
        requesterId,
        receiverId,
        status: 'pending',
      })
      .returning();

    const requesterRows = await db.select().from(users).where(eq(users.id, requesterId));
    if (requesterRows[0]) {
      await db.insert(notifications).values({
        userId: receiverId,
        actorId: requesterId,
        type: 'friend_request',
        referenceId: requesterId,
        message: `${requesterRows[0].displayName} đã gửi cho bạn lời mời kết bạn.`,
      });
    }

    return inserted[0];
  } catch (error: any) {
    console.error('Database error in sendFriendRequest:', error);
    throw new Error(error.message || 'Không thể gửi lời mời kết bạn.', { cause: error });
  }
}

export async function respondToFriendRequest(
  friendshipId: number,
  userId: number,
  action: 'accepted' | 'declined'
) {
  try {
    const existing = await db
      .select()
      .from(friendships)
      .where(eq(friendships.id, friendshipId));

    if (existing.length === 0) throw new Error('Không tìm thấy lời mời kết bạn.');
    const record = existing[0];
    if (record.receiverId !== userId && record.requesterId !== userId) {
      throw new Error('Bạn không có quyền xử lý lời mời này.');
    }

    if (action === 'declined') {
      await db.delete(friendships).where(eq(friendships.id, friendshipId));
      return { status: 'declined', requesterId: record.requesterId };
    }

    const updated = await db
      .update(friendships)
      .set({ status: 'accepted', updatedAt: new Date() })
      .where(eq(friendships.id, friendshipId))
      .returning();

    const receiverRows = await db.select().from(users).where(eq(users.id, userId));
    if (receiverRows[0]) {
      await db.insert(notifications).values({
        userId: record.requesterId,
        actorId: userId,
        type: 'friend_accepted',
        referenceId: userId,
        message: `${receiverRows[0].displayName} đã chấp nhận lời mời kết bạn của bạn.`,
      });
    }

    return { status: 'accepted', record: updated[0], requesterId: record.requesterId };
  } catch (error: any) {
    console.error('Database error in respondToFriendRequest:', error);
    throw new Error(error.message || 'Không thể phản hồi lời mời kết bạn.', { cause: error });
  }
}

export async function removeFriendshipByUser(userId: number, targetUserId: number) {
  try {
    await db
      .delete(friendships)
      .where(
        or(
          and(eq(friendships.requesterId, userId), eq(friendships.receiverId, targetUserId)),
          and(eq(friendships.requesterId, targetUserId), eq(friendships.receiverId, userId))
        )
      );
    return { success: true };
  } catch (error) {
    console.error('Database error in removeFriendshipByUser:', error);
    throw new Error('Không thể hủy kết bạn.', { cause: error });
  }
}

export async function getConversationsForUser(userId: number) {
  try {
    const allUsers = (await db.select().from(users)).map(sanitizeUser);
    const userMessages = await db
      .select()
      .from(messages)
      .where(or(eq(messages.senderId, userId), eq(messages.receiverId, userId)))
      .orderBy(desc(messages.createdAt));

    const myFriendships = await db
      .select()
      .from(friendships)
      .where(
        and(
          eq(friendships.status, 'accepted'),
          or(eq(friendships.requesterId, userId), eq(friendships.receiverId, userId))
        )
      );

    const partnerIds = new Set<number>();
    userMessages.forEach((m) => {
      partnerIds.add(m.senderId === userId ? m.receiverId : m.senderId);
    });
    myFriendships.forEach((f) => {
      partnerIds.add(f.requesterId === userId ? f.receiverId : f.requesterId);
    });

    const userMap = new Map(allUsers.map((u) => [u.id, u]));

    const conversations = Array.from(partnerIds)
      .map((partnerId) => {
        const partner = userMap.get(partnerId);
        if (!partner) return null;
        const thread = userMessages.filter(
          (m) =>
            (m.senderId === userId && m.receiverId === partnerId) ||
            (m.senderId === partnerId && m.receiverId === userId)
        );
        const lastMessage = thread[0] || null;
        const unreadCount = thread.filter(
          (m) => m.senderId === partnerId && m.receiverId === userId && !m.readAt
        ).length;

        return {
          partner,
          lastMessage,
          unreadCount,
          updatedAt: lastMessage ? new Date(lastMessage.createdAt).getTime() : 0,
        };
      })
      .filter((c): c is NonNullable<typeof c> => c !== null)
      .sort((a, b) => b.updatedAt - a.updatedAt);

    return conversations;
  } catch (error) {
    console.error('Database error in getConversationsForUser:', error);
    throw new Error('Không thể tải danh sách hội thoại.', { cause: error });
  }
}

export async function getMessagesBetweenUsers(userId: number, partnerId: number) {
  try {
    await db
      .update(messages)
      .set({ readAt: new Date() })
      .where(
        and(
          eq(messages.senderId, partnerId),
          eq(messages.receiverId, userId),
          isNull(messages.readAt)
        )
      );

    const thread = await db
      .select()
      .from(messages)
      .where(
        or(
          and(eq(messages.senderId, userId), eq(messages.receiverId, partnerId)),
          and(eq(messages.senderId, partnerId), eq(messages.receiverId, userId))
        )
      )
      .orderBy(asc(messages.createdAt));

    return thread;
  } catch (error) {
    console.error('Database error in getMessagesBetweenUsers:', error);
    throw new Error('Không thể tải tin nhắn.', { cause: error });
  }
}

export async function createPrivateMessage(
  senderId: number,
  receiverId: number,
  content: string
) {
  try {
    const inserted = await db
      .insert(messages)
      .values({
        senderId,
        receiverId,
        content: content.trim(),
      })
      .returning();

    const senderRows = await db.select().from(users).where(eq(users.id, senderId));
    if (senderRows[0]) {
      await db.insert(notifications).values({
        userId: receiverId,
        actorId: senderId,
        type: 'new_message',
        referenceId: senderId,
        message: `${senderRows[0].displayName} đã gửi cho bạn một tin nhắn mới.`,
      });
    }

    return {
      message: inserted[0],
      sender: senderRows[0] ? sanitizeUser(senderRows[0]) : null,
    };
  } catch (error) {
    console.error('Database error in createPrivateMessage:', error);
    throw new Error('Không thể gửi tin nhắn.', { cause: error });
  }
}

export async function getNotificationsForUser(userId: number) {
  try {
    const rows = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));

    const allUsers = (await db.select().from(users)).map(sanitizeUser);
    const userMap = new Map(allUsers.map((u) => [u.id, u]));

    return rows.map((n) => ({
      ...n,
      actor: n.actorId ? userMap.get(n.actorId) || null : null,
    }));
  } catch (error) {
    console.error('Database error in getNotificationsForUser:', error);
    throw new Error('Không thể tải thông báo.', { cause: error });
  }
}

export async function markNotificationRead(notificationId: number, userId: number) {
  try {
    await db
      .update(notifications)
      .set({ read: true })
      .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)));
    return { success: true };
  } catch (error) {
    console.error('Database error in markNotificationRead:', error);
    throw new Error('Không thể đánh dấu đã đọc.', { cause: error });
  }
}

export async function markAllNotificationsRead(userId: number) {
  try {
    await db
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.userId, userId));
    return { success: true };
  } catch (error) {
    console.error('Database error in markAllNotificationsRead:', error);
    throw new Error('Không thể đánh dấu tất cả đã đọc.', { cause: error });
  }
}

export async function searchEverything(queryStr: string, viewerId?: number) {
  try {
    const q = queryStr.trim().toLowerCase();
    const allUsers = (await db.select().from(users)).map(sanitizeUser);
    const allCategories = await getCategoriesWithCounts();
    const allTopics = await getEnrichedTopics({ viewerId });

    const matchedUsers = q
      ? allUsers.filter(
          (u) =>
            u.username.toLowerCase().includes(q) ||
            u.displayName.toLowerCase().includes(q) ||
            u.bio.toLowerCase().includes(q)
        )
      : allUsers.slice(0, 8);

    const matchedTopics = q
      ? allTopics.filter(
          (t) =>
            t.title.toLowerCase().includes(q) ||
            t.content.toLowerCase().includes(q) ||
            t.tags.toLowerCase().includes(q)
        )
      : allTopics.slice(0, 8);

    const matchedCategories = q
      ? allCategories.filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            c.description.toLowerCase().includes(q) ||
            c.slug.toLowerCase().includes(q)
        )
      : allCategories;

    const tagCounts = new Map<string, number>();
    allTopics.forEach((t) => {
      t.tags
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean)
        .forEach((tag) => {
          tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
        });
    });

    const allTags = Array.from(tagCounts.entries()).map(([tag, count]) => ({ tag, count }));
    const matchedTags = q
      ? allTags.filter((item) => item.tag.includes(q))
      : allTags;

    return {
      users: matchedUsers,
      topics: matchedTopics,
      categories: matchedCategories,
      tags: matchedTags,
    };
  } catch (error) {
    console.error('Database error in searchEverything:', error);
    throw new Error('Không thể thực hiện tìm kiếm.', { cause: error });
  }
}

export async function createContentReport(input: {
  reporterId: number;
  targetType: 'user' | 'topic' | 'comment';
  targetId: number;
  reason: string;
  details?: string;
}) {
  try {
    const inserted = await db
      .insert(reports)
      .values({
        reporterId: input.reporterId,
        targetType: input.targetType,
        targetId: input.targetId,
        reason: input.reason,
        details: input.details?.trim() || '',
        status: 'pending',
      })
      .returning();
    return inserted[0];
  } catch (error) {
    console.error('Database error in createContentReport:', error);
    throw new Error('Không thể gửi báo cáo vi phạm.', { cause: error });
  }
}

export async function getAdminOverviewData() {
  try {
    const allUsers = (await db.select().from(users).orderBy(desc(users.createdAt))).map(
      sanitizeUser
    );
    const allTopics = await getEnrichedTopics({});
    const allComments = await db.select().from(comments).orderBy(desc(comments.createdAt));
    const allCategories = await getCategoriesWithCounts();
    const allReports = await db.select().from(reports).orderBy(desc(reports.createdAt));

    const userMap = new Map(allUsers.map((u) => [u.id, u]));
    const topicMap = new Map(allTopics.map((t) => [t.id, t]));
    const commentMap = new Map(allComments.map((c) => [c.id, c]));

    const enrichedComments = allComments.map((c) => ({
      ...c,
      author: userMap.get(c.authorId) || null,
      topicTitle: topicMap.get(c.topicId)?.title || `Chủ đề #${c.topicId}`,
    }));

    const enrichedReports = allReports.map((r) => {
      let targetSummary = `#${r.targetId}`;
      if (r.targetType === 'user') {
        const u = userMap.get(r.targetId);
        targetSummary = u ? `${u.displayName} (@${u.username})` : `User #${r.targetId}`;
      } else if (r.targetType === 'topic') {
        const t = topicMap.get(r.targetId);
        targetSummary = t ? t.title : `Topic #${r.targetId}`;
      } else if (r.targetType === 'comment') {
        const c = commentMap.get(r.targetId);
        targetSummary = c ? c.content.slice(0, 60) : `Comment #${r.targetId}`;
      }
      return {
        ...r,
        reporter: userMap.get(r.reporterId) || null,
        targetSummary,
      };
    });

    return {
      users: allUsers,
      topics: allTopics,
      comments: enrichedComments,
      categories: allCategories,
      reports: enrichedReports,
    };
  } catch (error) {
    console.error('Database error in getAdminOverviewData:', error);
    throw new Error('Không thể tải dữ liệu quản trị.', { cause: error });
  }
}

export async function adminSetUserBan(targetUserId: number, isBanned: boolean) {
  try {
    const updated = await db
      .update(users)
      .set({ isBanned, updatedAt: new Date() })
      .where(eq(users.id, targetUserId))
      .returning();
    return sanitizeUser(updated[0]);
  } catch (error) {
    console.error('Database error in adminSetUserBan:', error);
    throw new Error('Không thể cập nhật trạng thái khóa tài khoản.', { cause: error });
  }
}

export async function adminDeleteUserById(targetUserId: number) {
  try {
    await db.delete(users).where(eq(users.id, targetUserId));
    return { success: true };
  } catch (error) {
    console.error('Database error in adminDeleteUserById:', error);
    throw new Error('Không thể xóa tài khoản người dùng.', { cause: error });
  }
}

export async function adminCreateCategory(input: {
  name: string;
  slug: string;
  description: string;
}) {
  try {
    const cleanSlug = input.slug
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-');
    const inserted = await db
      .insert(categories)
      .values({
        name: input.name.trim(),
        slug: cleanSlug,
        description: input.description.trim(),
      })
      .returning();
    return inserted[0];
  } catch (error) {
    console.error('Database error in adminCreateCategory:', error);
    throw new Error('Không thể tạo danh mục mới.', { cause: error });
  }
}

export async function adminDeleteCategory(categoryId: number) {
  try {
    await db.delete(categories).where(eq(categories.id, categoryId));
    return { success: true };
  } catch (error) {
    console.error('Database error in adminDeleteCategory:', error);
    throw new Error('Không thể xóa danh mục.', { cause: error });
  }
}

export async function adminUpdateReportStatus(
  reportId: number,
  status: 'resolved' | 'dismissed'
) {
  try {
    const updated = await db
      .update(reports)
      .set({ status })
      .where(eq(reports.id, reportId))
      .returning();
    return updated[0];
  } catch (error) {
    console.error('Database error in adminUpdateReportStatus:', error);
    throw new Error('Không thể cập nhật trạng thái báo cáo.', { cause: error });
  }
}
