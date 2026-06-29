// ─── API Response Types ──────────────────────────────────────────

export interface ApiSuccess<T = unknown> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError;

// ─── Pagination ──────────────────────────────────────────────────

export interface PaginationParams {
  limit: number;
  offset: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

// ─── Session Types ───────────────────────────────────────────────

export interface SessionInfo {
  id: string;
  name: string;
  phoneNumber: string;
  isActive: boolean;
  isAuthorized: boolean;
  createdAt: string;
  lastConnected: string | null;
}

export type SessionLoginStep =
  | 'PHONE_REQUIRED'
  | 'CODE_REQUIRED'
  | 'PASSWORD_REQUIRED'
  | 'LOGGED_IN';

export interface SessionLoginState {
  sessionId: string;
  step: SessionLoginStep;
  phoneCodeHash?: string;
}

// ─── Event Types ─────────────────────────────────────────────────

export type EventCategory =
  | 'session'
  | 'message'
  | 'chat'
  | 'group'
  | 'channel'
  | 'user';

export interface TeleFlowEvent {
  id: string;
  type: string;
  sessionId: string;
  timestamp: string;
  data: Record<string, unknown>;
}

// ─── Auth Types ──────────────────────────────────────────────────

export interface JwtPayload {
  sub: string;
  role: string;
  iat: number;
  exp: number;
}

export type AuthMethod = 'jwt' | 'api_key';

// ─── Webhook Types ───────────────────────────────────────────────

export interface WebhookConfig {
  id: string;
  url: string;
  secret: string | null;
  events: string[];
  isActive: boolean;
}

// ─── Telegram Message Types ──────────────────────────────────────

export interface TelegramMessage {
  id: number;
  chatId: string;
  senderId: string;
  text: string;
  date: number;
  editDate?: number;
  replyToMsgId?: number;
  forwardFrom?: string;
  media?: TelegramMedia;
}

export interface TelegramMedia {
  type: 'photo' | 'video' | 'voice' | 'audio' | 'document' | 'sticker' | 'gif';
  fileId?: string;
  fileName?: string;
  mimeType?: string;
  fileSize?: number;
  thumbnailUrl?: string;
}

export interface TelegramChat {
  id: string;
  title: string;
  type: 'user' | 'group' | 'supergroup' | 'channel';
  username?: string;
  membersCount?: number;
}

export interface TelegramUser {
  id: string;
  firstName: string;
  lastName?: string;
  username?: string;
  phone?: string;
  bio?: string;
  photo?: string;
}
