// ─── Session Events ──────────────────────────────────────────────

export const SESSION_EVENTS = [
  'session.created',
  'session.connected',
  'session.disconnected',
  'session.authorized',
  'session.deleted',
] as const;

// ─── Message Events ──────────────────────────────────────────────

export const MESSAGE_EVENTS = [
  'message.received',
  'message.sent',
  'message.edited',
  'message.deleted',
  'message.read',
] as const;

// ─── Chat Events ─────────────────────────────────────────────────

export const CHAT_EVENTS = [
  'chat.created',
  'chat.updated',
  'chat.deleted',
  'chat.member_joined',
  'chat.member_left',
] as const;

// ─── Group Events ────────────────────────────────────────────────

export const GROUP_EVENTS = [
  'group.created',
  'group.updated',
  'group.deleted',
  'group.member_added',
  'group.member_removed',
  'group.admin_changed',
] as const;

// ─── Channel Events ──────────────────────────────────────────────

export const CHANNEL_EVENTS = [
  'channel.created',
  'channel.updated',
  'channel.deleted',
  'channel.post_published',
] as const;

// ─── User Events ─────────────────────────────────────────────────

export const USER_EVENTS = [
  'user.status_changed',
  'user.typing',
  'user.profile_updated',
] as const;

// ─── All Events ──────────────────────────────────────────────────

export const ALL_EVENTS = [
  ...SESSION_EVENTS,
  ...MESSAGE_EVENTS,
  ...CHAT_EVENTS,
  ...GROUP_EVENTS,
  ...CHANNEL_EVENTS,
  ...USER_EVENTS,
] as const;

export type EventType = (typeof ALL_EVENTS)[number];
