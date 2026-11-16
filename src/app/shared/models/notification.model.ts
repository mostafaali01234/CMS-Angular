// shared/models/notification.model.ts

export type NotificationType = 'General' | 'OrderStatusChanged' | 'NewMessage';

// REST sends the enum as a string ("OrderStatusChanged"); the SignalR push sends it as a number (1).
// Both are accepted and normalised to the string.
const TYPE_BY_NUMBER: NotificationType[] = ['General', 'OrderStatusChanged', 'NewMessage'];

export interface AppNotification {
  id: number;
  type: NotificationType;
  title: string;
  body: string;
  entity_type: string | null;   // "order" | "message"
  entity_id: number | null;
  created_at: string;           // UTC, ends with Z
  read_at: string | null;
  is_read: boolean;
}

export function toNotification(raw: any): AppNotification {
  const t = raw?.type;
  const type: NotificationType =
    typeof t === 'number' ? (TYPE_BY_NUMBER[t] ?? 'General') : (t as NotificationType) ?? 'General';
  return {
    id: raw.id,
    type,
    title: raw.title ?? '',
    body: raw.body ?? '',
    entity_type: raw.entity_type ?? null,
    entity_id: raw.entity_id ?? null,
    created_at: raw.created_at,
    read_at: raw.read_at ?? null,
    is_read: !!raw.is_read,
  };
}

/** Where a click on a notification should go (null = nowhere). */
export interface NavTarget { commands: unknown[]; queryParams?: Record<string, string>; }

export function notificationLink(n: AppNotification): NavTarget | null {
  if (n.entity_type === 'order' && n.entity_id) return { commands: ['/orders', n.entity_id, 'edit'] };
  if (n.entity_type === 'message') return { commands: ['/messages'] };
  return null;
}

// ---------- messages ----------
export interface UserMessage {
  id: number;
  sender_user_id: string;
  sender_name: string;
  recipient_user_id: string;
  order_id: number | null;
  body: string;
  created_at: string;
  read_at: string | null;
  is_mine: boolean;
}

export interface Conversation {
  user_id: string;
  user_name: string;
  last_message: UserMessage | null;
  unread_count: number;
}

export interface Contact { user_id: string; name: string; }
