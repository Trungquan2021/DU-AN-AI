import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import * as dotenv from 'dotenv';
import {
  requireAuth,
  optionalAuth,
  hashPassword,
  verifyPassword,
  signSessionToken,
  verifyAnyToken,
} from './src/middleware/auth.ts';
import type { AuthRequest } from './src/middleware/auth.ts';
import {
  getOrCreateUser,
  registerLocalUser,
  getUserWithPasswordByIdentifier,
  resetPasswordByEmail,
  getUserByUid,
  getUserById,
  updateUserProfile,
  setUserOnlineStatus,
  getCategoriesWithCounts,
  getEnrichedTopics,
  getTopicDetailById,
  createNewTopic,
  updateExistingTopic,
  deleteExistingTopic,
  toggleTopicLike,
  toggleTopicBookmark,
  createNewComment,
  updateExistingComment,
  deleteExistingComment,
  toggleCommentLike,
  getSocialDataForUser,
  sendFriendRequest,
  respondToFriendRequest,
  removeFriendshipByUser,
  getConversationsForUser,
  getMessagesBetweenUsers,
  createPrivateMessage,
  getNotificationsForUser,
  markNotificationRead,
  markAllNotificationsRead,
  searchEverything,
  createContentReport,
  getAdminOverviewData,
  adminSetUserBan,
  adminDeleteUserById,
  adminCreateCategory,
  adminDeleteCategory,
  adminUpdateReportStatus,
  sanitizeUser,
} from './src/db/queries.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const PORT = 3000;

  app.use(express.json({ limit: '5mb' }));

  // WebSocket setup for real-time chat, online status, notifications, and live comments
  const wss = new WebSocketServer({ server, path: '/ws' });
  const clientsByUserId = new Map<number, Set<WebSocket>>();
  const socketToUserId = new Map<WebSocket, number>();

  function broadcastAll(payload: unknown) {
    const data = JSON.stringify(payload);
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  }

  function sendToUser(userId: number, payload: unknown) {
    const sockets = clientsByUserId.get(userId);
    if (!sockets) return;
    const data = JSON.stringify(payload);
    sockets.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    });
  }

  wss.on('connection', (ws) => {
    ws.on('message', async (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        if (msg.type === 'auth' && typeof msg.token === 'string') {
          const verified = await verifyAnyToken(msg.token);
          if (!verified) return;
          const user = await getOrCreateUser(
            verified.uid,
            verified.email,
            verified.name,
            verified.picture
          );
          if (!user) return;

          socketToUserId.set(ws, user.id);
          if (!clientsByUserId.has(user.id)) {
            clientsByUserId.set(user.id, new Set());
          }
          clientsByUserId.get(user.id)!.add(ws);

          await setUserOnlineStatus(user.id, true);
          broadcastAll({
            type: 'presence:update',
            userId: user.id,
            onlineStatus: true,
          });
        } else if (msg.type === 'typing' && typeof msg.receiverId === 'number') {
          const senderId = socketToUserId.get(ws);
          if (senderId) {
            sendToUser(msg.receiverId, {
              type: 'chat:typing',
              senderId,
              isTyping: Boolean(msg.isTyping),
            });
          }
        }
      } catch (err) {
        console.error('WebSocket message error:', err);
      }
    });

    ws.on('close', async () => {
      const userId = socketToUserId.get(ws);
      if (userId) {
        socketToUserId.delete(ws);
        const userSockets = clientsByUserId.get(userId);
        if (userSockets) {
          userSockets.delete(ws);
          if (userSockets.size === 0) {
            clientsByUserId.delete(userId);
            await setUserOnlineStatus(userId, false);
            broadcastAll({
              type: 'presence:update',
              userId,
              onlineStatus: false,
            });
          }
        }
      }
    });
  });

  // Helper to resolve current DB user from AuthRequest
  async function resolveCurrentUser(req: AuthRequest) {
    if (!req.user) return null;
    return await getOrCreateUser(
      req.user.uid,
      req.user.email,
      req.user.name,
      req.user.picture
    );
  }

  // ============================================================================
  // AUTH ROUTES
  // ============================================================================

  app.post('/api/auth/register', async (req, res) => {
    try {
      const { username, email, password, displayName } = req.body;
      if (!username || !email || !password) {
        return res.status(400).json({ error: 'Vui lòng nhập đầy đủ thông tin bắt buộc.' });
      }
      if (String(password).length < 6) {
        return res.status(400).json({ error: 'Mật khẩu phải có ít nhất 6 ký tự.' });
      }
      const passwordHash = hashPassword(String(password));
      const user = await registerLocalUser({
        username: String(username),
        email: String(email),
        passwordHash,
        displayName: displayName ? String(displayName) : String(username),
      });
      const token = signSessionToken({
        uid: user.uid,
        email: user.email,
        name: user.displayName,
      });
      res.json({ token, user });
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Đăng ký thất bại.' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { identifier, email, password } = req.body;
      const loginId = identifier || email;
      if (!loginId || !password) {
        return res.status(400).json({ error: 'Vui lòng nhập Email/Username và mật khẩu.' });
      }
      const userRecord = await getUserWithPasswordByIdentifier(String(loginId));
      if (!userRecord || !userRecord.passwordHash) {
        return res
          .status(401)
          .json({ error: 'Tài khoản hoặc mật khẩu không chính xác (hoặc tài khoản dùng Google).' });
      }
      if (userRecord.isBanned) {
        return res.status(403).json({ error: 'Tài khoản của bạn đã bị khóa bởi quản trị viên.' });
      }
      const valid = verifyPassword(String(password), userRecord.passwordHash);
      if (!valid) {
        return res.status(401).json({ error: 'Mật khẩu không chính xác.' });
      }
      await setUserOnlineStatus(userRecord.id, true);
      const cleanUser = sanitizeUser({ ...userRecord, onlineStatus: true });
      const token = signSessionToken({
        uid: cleanUser.uid,
        email: cleanUser.email,
        name: cleanUser.displayName,
      });
      res.json({ token, user: cleanUser });
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Đăng nhập thất bại.' });
    }
  });

  app.post('/api/auth/forgot-password', async (req, res) => {
    try {
      const { email, newPassword } = req.body;
      if (!email || !newPassword) {
        return res.status(400).json({ error: 'Vui lòng nhập email và mật khẩu mới.' });
      }
      if (String(newPassword).length < 6) {
        return res.status(400).json({ error: 'Mật khẩu mới phải từ 6 ký tự trở lên.' });
      }
      const hash = hashPassword(String(newPassword));
      await resetPasswordByEmail(String(email), hash);
      res.json({ message: 'Đặt lại mật khẩu thành công. Bạn có thể đăng nhập ngay.' });
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Không thể đặt lại mật khẩu.' });
    }
  });

  app.post('/api/auth/google-sign-in', async (req, res) => {
    try {
      const { email, displayName, avatar, idToken } = req.body || {};
      if (!email || !String(email).trim()) {
        return res.status(400).json({ error: 'Email tài khoản Google là bắt buộc.' });
      }
      const cleanEmail = String(email).trim().toLowerCase();

      // If idToken is provided, try verifying it
      if (idToken) {
        try {
          const verified = await verifyAnyToken(idToken);
          if (verified && verified.email) {
            // Valid token
          }
        } catch {
          // Token verification fallback
        }
      }

      // Upsert user into database
      const googleUid = `google_${cleanEmail.replace(/[^a-z0-9]/g, '_')}`;
      const user = await getOrCreateUser(
        googleUid,
        cleanEmail,
        displayName ? String(displayName) : cleanEmail.split('@')[0],
        avatar ? String(avatar) : ''
      );

      if (user.isBanned) {
        return res.status(403).json({ error: 'Tài khoản của bạn đã bị khóa bởi quản trị viên.' });
      }

      await setUserOnlineStatus(user.id, true);
      const token = signSessionToken({
        uid: user.uid,
        email: user.email,
        name: user.displayName,
        picture: user.avatar,
      });

      res.json({ token, user });
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      res.status(500).json({ error: error.message || 'Đăng nhập Google thất bại.' });
    }
  });

  app.post('/api/auth/sync', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { displayName, avatar } = req.body || {};
      const user = await getOrCreateUser(
        req.user!.uid,
        req.user!.email,
        displayName || req.user!.name,
        avatar || req.user!.picture
      );
      if (user.isBanned) {
        return res.status(403).json({ error: 'Tài khoản của bạn đã bị khóa bởi quản trị viên.' });
      }
      res.json({ user });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Không thể đồng bộ tài khoản.' });
    }
  });

  app.get('/api/auth/me', requireAuth, async (req: AuthRequest, res) => {
    try {
      const user = await resolveCurrentUser(req);
      if (!user) return res.status(404).json({ error: 'Không tìm thấy người dùng.' });
      const fullProfile = await getUserById(user.id);
      res.json({ user: fullProfile });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================================================
  // USER PROFILE ROUTES
  // ============================================================================

  app.get('/api/users/:id', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const profileId = Number(req.params.id);
      if (Number.isNaN(profileId)) {
        return res.status(400).json({ error: 'ID người dùng không hợp lệ.' });
      }
      const viewer = await resolveCurrentUser(req);
      const profile = await getUserById(profileId);
      if (!profile) {
        return res.status(404).json({ error: 'Không tìm thấy người dùng.' });
      }
      const userTopics = await getEnrichedTopics({
        authorId: profileId,
        viewerId: viewer?.id,
      });
      res.json({ profile, topics: userTopics });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put('/api/users/me', requireAuth, async (req: AuthRequest, res) => {
    try {
      const currentUser = await resolveCurrentUser(req);
      if (!currentUser) return res.status(401).json({ error: 'Chưa đăng nhập.' });
      const { username, displayName, bio, avatar, role } = req.body;
      const updated = await updateUserProfile(currentUser.id, {
        username,
        displayName,
        bio,
        avatar,
        role,
      });
      const fullProfile = await getUserById(updated.id);
      res.json({ user: fullProfile });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // ============================================================================
  // CATEGORIES & TOPICS ROUTES
  // ============================================================================

  app.get('/api/categories', async (_req, res) => {
    try {
      const cats = await getCategoriesWithCounts();
      res.json({ categories: cats });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/topics', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const viewer = await resolveCurrentUser(req);
      const sort = (req.query.sort as 'latest' | 'popular' | 'discussing') || 'latest';
      const categorySlug = req.query.category as string | undefined;
      const authorId = req.query.authorId ? Number(req.query.authorId) : undefined;
      const bookmarked = req.query.bookmarked === 'true' ? viewer?.id : undefined;
      const search = req.query.search as string | undefined;
      const tag = req.query.tag as string | undefined;

      const list = await getEnrichedTopics({
        sort,
        categorySlug,
        authorId,
        bookmarkedByUserId: bookmarked,
        search,
        tag,
        viewerId: viewer?.id,
      });
      res.json({ topics: list });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/topics/:id', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const topicId = Number(req.params.id);
      if (Number.isNaN(topicId)) {
        return res.status(400).json({ error: 'ID chủ đề không hợp lệ.' });
      }
      const viewer = await resolveCurrentUser(req);
      const detail = await getTopicDetailById(topicId, viewer?.id);
      if (!detail) {
        return res.status(404).json({ error: 'Chủ đề không tồn tại.' });
      }
      res.json({ topic: detail });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/topics', requireAuth, async (req: AuthRequest, res) => {
    try {
      const currentUser = await resolveCurrentUser(req);
      if (!currentUser) return res.status(401).json({ error: 'Chưa đăng nhập.' });
      const { title, content, categoryId, imageUrl, tags } = req.body;
      if (!title || !content) {
        return res.status(400).json({ error: 'Tiêu đề và nội dung không được để trống.' });
      }
      const created = await createNewTopic({
        authorId: currentUser.id,
        categoryId: categoryId ? Number(categoryId) : null,
        title: String(title),
        content: String(content),
        imageUrl: imageUrl ? String(imageUrl) : '',
        tags: tags ? String(tags) : '',
      });
      const detail = await getTopicDetailById(created.id, currentUser.id);
      broadcastAll({ type: 'topic:created', topic: detail });
      res.json({ topic: detail });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put('/api/topics/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const currentUser = await resolveCurrentUser(req);
      if (!currentUser) return res.status(401).json({ error: 'Chưa đăng nhập.' });
      const topicId = Number(req.params.id);
      const { title, content, categoryId, imageUrl, tags, isPinned } = req.body;
      await updateExistingTopic(topicId, currentUser.id, currentUser.role === 'admin', {
        title,
        content,
        categoryId: categoryId !== undefined ? Number(categoryId) : undefined,
        imageUrl,
        tags,
        isPinned,
      });
      const detail = await getTopicDetailById(topicId, currentUser.id);
      res.json({ topic: detail });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete('/api/topics/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const currentUser = await resolveCurrentUser(req);
      if (!currentUser) return res.status(401).json({ error: 'Chưa đăng nhập.' });
      const topicId = Number(req.params.id);
      await deleteExistingTopic(topicId, currentUser.id, currentUser.role === 'admin');
      broadcastAll({ type: 'topic:deleted', topicId });
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post('/api/topics/:id/like', requireAuth, async (req: AuthRequest, res) => {
    try {
      const currentUser = await resolveCurrentUser(req);
      if (!currentUser) return res.status(401).json({ error: 'Chưa đăng nhập.' });
      const topicId = Number(req.params.id);
      const result = await toggleTopicLike(currentUser.id, topicId);
      if (result.liked && result.authorId && result.authorId !== currentUser.id) {
        sendToUser(result.authorId, { type: 'notification:new' });
      }
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post('/api/topics/:id/bookmark', requireAuth, async (req: AuthRequest, res) => {
    try {
      const currentUser = await resolveCurrentUser(req);
      if (!currentUser) return res.status(401).json({ error: 'Chưa đăng nhập.' });
      const topicId = Number(req.params.id);
      const result = await toggleTopicBookmark(currentUser.id, topicId);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // ============================================================================
  // COMMENTS ROUTES
  // ============================================================================

  app.post('/api/topics/:id/comments', requireAuth, async (req: AuthRequest, res) => {
    try {
      const currentUser = await resolveCurrentUser(req);
      if (!currentUser) return res.status(401).json({ error: 'Chưa đăng nhập.' });
      const topicId = Number(req.params.id);
      const { content, parentCommentId } = req.body;
      if (!content || !String(content).trim()) {
        return res.status(400).json({ error: 'Nội dung bình luận không được để trống.' });
      }
      const { comment, notifiedUserId } = await createNewComment({
        topicId,
        authorId: currentUser.id,
        parentCommentId: parentCommentId ? Number(parentCommentId) : null,
        content: String(content),
      });

      broadcastAll({
        type: 'comment:created',
        topicId,
        comment,
      });

      if (notifiedUserId) {
        sendToUser(notifiedUserId, { type: 'notification:new' });
      }

      res.json({ comment });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put('/api/comments/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const currentUser = await resolveCurrentUser(req);
      if (!currentUser) return res.status(401).json({ error: 'Chưa đăng nhập.' });
      const commentId = Number(req.params.id);
      const { content } = req.body;
      if (!content || !String(content).trim()) {
        return res.status(400).json({ error: 'Nội dung bình luận không được để trống.' });
      }
      const updated = await updateExistingComment(commentId, currentUser.id, String(content));
      broadcastAll({
        type: 'comment:updated',
        topicId: updated.topicId,
        comment: updated,
      });
      res.json({ comment: updated });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete('/api/comments/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const currentUser = await resolveCurrentUser(req);
      if (!currentUser) return res.status(401).json({ error: 'Chưa đăng nhập.' });
      const commentId = Number(req.params.id);
      const result = await deleteExistingComment(
        commentId,
        currentUser.id,
        currentUser.role === 'admin'
      );
      broadcastAll({
        type: 'comment:deleted',
        topicId: result.topicId,
        commentId,
      });
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post('/api/comments/:id/like', requireAuth, async (req: AuthRequest, res) => {
    try {
      const currentUser = await resolveCurrentUser(req);
      if (!currentUser) return res.status(401).json({ error: 'Chưa đăng nhập.' });
      const commentId = Number(req.params.id);
      const result = await toggleCommentLike(currentUser.id, commentId);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // ============================================================================
  // FRIENDS & SOCIAL ROUTES
  // ============================================================================

  app.get('/api/social', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const viewer = await resolveCurrentUser(req);
      const data = await getSocialDataForUser(viewer?.id);
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/friends/request', requireAuth, async (req: AuthRequest, res) => {
    try {
      const currentUser = await resolveCurrentUser(req);
      if (!currentUser) return res.status(401).json({ error: 'Chưa đăng nhập.' });
      const receiverId = Number(req.body.receiverId);
      const friendship = await sendFriendRequest(currentUser.id, receiverId);
      sendToUser(receiverId, { type: 'notification:new' });
      sendToUser(receiverId, { type: 'social:updated' });
      res.json({ friendship });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post('/api/friends/respond', requireAuth, async (req: AuthRequest, res) => {
    try {
      const currentUser = await resolveCurrentUser(req);
      if (!currentUser) return res.status(401).json({ error: 'Chưa đăng nhập.' });
      const { friendshipId, action } = req.body;
      const result = await respondToFriendRequest(
        Number(friendshipId),
        currentUser.id,
        action === 'accepted' ? 'accepted' : 'declined'
      );
      if (result.requesterId) {
        sendToUser(result.requesterId, { type: 'notification:new' });
        sendToUser(result.requesterId, { type: 'social:updated' });
      }
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete('/api/friends/:targetUserId', requireAuth, async (req: AuthRequest, res) => {
    try {
      const currentUser = await resolveCurrentUser(req);
      if (!currentUser) return res.status(401).json({ error: 'Chưa đăng nhập.' });
      const targetUserId = Number(req.params.targetUserId);
      const result = await removeFriendshipByUser(currentUser.id, targetUserId);
      sendToUser(targetUserId, { type: 'social:updated' });
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // ============================================================================
  // PRIVATE MESSAGING ROUTES
  // ============================================================================

  app.get('/api/conversations', requireAuth, async (req: AuthRequest, res) => {
    try {
      const currentUser = await resolveCurrentUser(req);
      if (!currentUser) return res.status(401).json({ error: 'Chưa đăng nhập.' });
      const conversations = await getConversationsForUser(currentUser.id);
      res.json({ conversations });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/messages/:partnerId', requireAuth, async (req: AuthRequest, res) => {
    try {
      const currentUser = await resolveCurrentUser(req);
      if (!currentUser) return res.status(401).json({ error: 'Chưa đăng nhập.' });
      const partnerId = Number(req.params.partnerId);
      const messagesList = await getMessagesBetweenUsers(currentUser.id, partnerId);
      const partner = await getUserById(partnerId);
      sendToUser(partnerId, {
        type: 'message:read',
        readerId: currentUser.id,
      });
      res.json({ messages: messagesList, partner });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/messages', requireAuth, async (req: AuthRequest, res) => {
    try {
      const currentUser = await resolveCurrentUser(req);
      if (!currentUser) return res.status(401).json({ error: 'Chưa đăng nhập.' });
      const { receiverId, content } = req.body;
      if (!receiverId || !content || !String(content).trim()) {
        return res.status(400).json({ error: 'Nội dung tin nhắn không được để trống.' });
      }
      const targetId = Number(receiverId);
      const { message, sender } = await createPrivateMessage(
        currentUser.id,
        targetId,
        String(content)
      );

      const wsPayload = {
        type: 'message:new',
        message,
        sender,
      };
      sendToUser(targetId, wsPayload);
      sendToUser(currentUser.id, wsPayload);
      sendToUser(targetId, { type: 'notification:new' });

      res.json({ message });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // ============================================================================
  // NOTIFICATIONS, SEARCH & REPORTS ROUTES
  // ============================================================================

  app.get('/api/notifications', requireAuth, async (req: AuthRequest, res) => {
    try {
      const currentUser = await resolveCurrentUser(req);
      if (!currentUser) return res.status(401).json({ error: 'Chưa đăng nhập.' });
      const list = await getNotificationsForUser(currentUser.id);
      res.json({ notifications: list });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/notifications/:id/read', requireAuth, async (req: AuthRequest, res) => {
    try {
      const currentUser = await resolveCurrentUser(req);
      if (!currentUser) return res.status(401).json({ error: 'Chưa đăng nhập.' });
      await markNotificationRead(Number(req.params.id), currentUser.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post('/api/notifications/read-all', requireAuth, async (req: AuthRequest, res) => {
    try {
      const currentUser = await resolveCurrentUser(req);
      if (!currentUser) return res.status(401).json({ error: 'Chưa đăng nhập.' });
      await markAllNotificationsRead(currentUser.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get('/api/search', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const viewer = await resolveCurrentUser(req);
      const q = (req.query.q as string) || '';
      const results = await searchEverything(q, viewer?.id);
      res.json(results);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/reports', requireAuth, async (req: AuthRequest, res) => {
    try {
      const currentUser = await resolveCurrentUser(req);
      if (!currentUser) return res.status(401).json({ error: 'Chưa đăng nhập.' });
      const { targetType, targetId, reason, details } = req.body;
      if (!targetType || !targetId || !reason) {
        return res.status(400).json({ error: 'Thiếu thông tin báo cáo.' });
      }
      const report = await createContentReport({
        reporterId: currentUser.id,
        targetType,
        targetId: Number(targetId),
        reason: String(reason),
        details: details ? String(details) : '',
      });
      res.json({ report });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // ============================================================================
  // ADMIN DASHBOARD ROUTES
  // ============================================================================

  app.get('/api/admin/overview', requireAuth, async (req: AuthRequest, res) => {
    try {
      const currentUser = await resolveCurrentUser(req);
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ error: 'Chỉ quản trị viên mới có quyền truy cập.' });
      }
      const data = await getAdminOverviewData();
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/admin/users/:id/ban', requireAuth, async (req: AuthRequest, res) => {
    try {
      const currentUser = await resolveCurrentUser(req);
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ error: 'Chỉ quản trị viên mới có quyền thực hiện.' });
      }
      const targetId = Number(req.params.id);
      const { isBanned } = req.body;
      const updated = await adminSetUserBan(targetId, Boolean(isBanned));
      res.json({ user: updated });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete('/api/admin/users/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const currentUser = await resolveCurrentUser(req);
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ error: 'Chỉ quản trị viên mới có quyền thực hiện.' });
      }
      const targetId = Number(req.params.id);
      if (targetId === currentUser.id) {
        return res.status(400).json({ error: 'Không thể tự xóa tài khoản quản trị đang đăng nhập.' });
      }
      await adminDeleteUserById(targetId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post('/api/admin/categories', requireAuth, async (req: AuthRequest, res) => {
    try {
      const currentUser = await resolveCurrentUser(req);
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ error: 'Chỉ quản trị viên mới có quyền thực hiện.' });
      }
      const { name, slug, description } = req.body;
      if (!name || !slug) {
        return res.status(400).json({ error: 'Tên và slug danh mục là bắt buộc.' });
      }
      const category = await adminCreateCategory({
        name: String(name),
        slug: String(slug),
        description: description ? String(description) : '',
      });
      res.json({ category });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete('/api/admin/categories/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const currentUser = await resolveCurrentUser(req);
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ error: 'Chỉ quản trị viên mới có quyền thực hiện.' });
      }
      await adminDeleteCategory(Number(req.params.id));
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post('/api/admin/reports/:id/resolve', requireAuth, async (req: AuthRequest, res) => {
    try {
      const currentUser = await resolveCurrentUser(req);
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ error: 'Chỉ quản trị viên mới có quyền thực hiện.' });
      }
      const { status } = req.body;
      const updated = await adminUpdateReportStatus(
        Number(req.params.id),
        status === 'dismissed' ? 'dismissed' : 'resolved'
      );
      res.json({ report: updated });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // ============================================================================
  // VITE DEV MIDDLEWARE OR PRODUCTION STATIC ASSETS
  // ============================================================================

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      root: __dirname,
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Xamvier server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
