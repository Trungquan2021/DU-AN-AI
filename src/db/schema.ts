import { relations } from 'drizzle-orm';
import { boolean, integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  username: text('username').notNull().unique(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash'),
  displayName: text('display_name').notNull(),
  avatar: text('avatar').notNull().default(''),
  bio: text('bio').notNull().default(''),
  role: text('role').notNull().default('user'), // 'user' | 'admin'
  isBanned: boolean('is_banned').notNull().default(false),
  onlineStatus: boolean('online_status').notNull().default(false),
  lastSeen: timestamp('last_seen').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description').notNull().default(''),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const topics = pgTable('topics', {
  id: serial('id').primaryKey(),
  authorId: integer('author_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  categoryId: integer('category_id').references(() => categories.id, { onDelete: 'set null' }),
  title: text('title').notNull(),
  content: text('content').notNull(),
  imageUrl: text('image_url').notNull().default(''),
  tags: text('tags').notNull().default(''),
  views: integer('views').notNull().default(0),
  isPinned: boolean('is_pinned').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const comments = pgTable('comments', {
  id: serial('id').primaryKey(),
  topicId: integer('topic_id')
    .references(() => topics.id, { onDelete: 'cascade' })
    .notNull(),
  authorId: integer('author_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  parentCommentId: integer('parent_comment_id'),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const likes = pgTable('likes', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  topicId: integer('topic_id').references(() => topics.id, { onDelete: 'cascade' }),
  commentId: integer('comment_id').references(() => comments.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const bookmarks = pgTable('bookmarks', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  topicId: integer('topic_id')
    .references(() => topics.id, { onDelete: 'cascade' })
    .notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const friendships = pgTable('friendships', {
  id: serial('id').primaryKey(),
  requesterId: integer('requester_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  receiverId: integer('receiver_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  status: text('status').notNull().default('pending'), // 'pending' | 'accepted' | 'declined'
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const messages = pgTable('messages', {
  id: serial('id').primaryKey(),
  senderId: integer('sender_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  receiverId: integer('receiver_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  content: text('content').notNull(),
  readAt: timestamp('read_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  actorId: integer('actor_id').references(() => users.id, { onDelete: 'set null' }),
  type: text('type').notNull(), // 'friend_request' | 'friend_accepted' | 'topic_comment' | 'comment_reply' | 'topic_like' | 'comment_like' | 'new_message'
  referenceId: integer('reference_id'),
  message: text('message').notNull().default(''),
  read: boolean('read').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const reports = pgTable('reports', {
  id: serial('id').primaryKey(),
  reporterId: integer('reporter_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  targetType: text('target_type').notNull(), // 'user' | 'topic' | 'comment'
  targetId: integer('target_id').notNull(),
  reason: text('reason').notNull(),
  details: text('details').notNull().default(''),
  status: text('status').notNull().default('pending'), // 'pending' | 'resolved' | 'dismissed'
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  topics: many(topics),
  comments: many(comments),
  likes: many(likes),
  bookmarks: many(bookmarks),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  topics: many(topics),
}));

export const topicsRelations = relations(topics, ({ one, many }) => ({
  author: one(users, {
    fields: [topics.authorId],
    references: [users.id],
  }),
  category: one(categories, {
    fields: [topics.categoryId],
    references: [categories.id],
  }),
  comments: many(comments),
  likes: many(likes),
  bookmarks: many(bookmarks),
}));

export const commentsRelations = relations(comments, ({ one, many }) => ({
  topic: one(topics, {
    fields: [comments.topicId],
    references: [topics.id],
  }),
  author: one(users, {
    fields: [comments.authorId],
    references: [users.id],
  }),
  likes: many(likes),
}));
