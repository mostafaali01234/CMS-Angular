import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { map, Observable, Subject, tap } from 'rxjs';
import { environment } from '../../../../environments/environment.development';
import { Paged, PageQuery } from '../../../shared/models/paged.model';
import {
  AppNotification, notificationLink, toNotification, UserMessage,
} from '../../../shared/models/notification.model';
import { toParams } from '../../../shared/utils/params';
import { AuthService } from '../AuthService/auth';
import { body } from '../MessageService/message';
import { ToastService } from '../ToastService/toast';

/**
 * Notifications (the bell) + the live SignalR line.
 *
 * Golden rule: the database is the truth, SignalR is only a "ding".
 * After login and after every reconnect the numbers are re-read from REST;
 * the live events only keep the screen up to date in between.
 */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private toasts = inject(ToastService);

  private baseUrl = `${environment.apiUrl}/Notification`;
  // the hub lives next to /api, not under it:  https://host/api  ->  https://host/hubs/notifications
  private hubUrl = environment.apiUrl.replace(/\/api\/?$/i, '') + '/hubs/notifications';

  /** the number on the bell */
  readonly unread = signal(0);
  /** newest notifications, for the bell dropdown */
  readonly latest = signal<AppNotification[]>([]);
  /** the chat the user has open right now (set by the messages page): no pop-up for that person */
  readonly activeChat = signal<string | null>(null);

  /** live events, for pages that want to react (the messages page) */
  readonly message$ = new Subject<UserMessage>();
  /** fired after a reconnect: anything missed while offline is in the DB, pages should re-read */
  readonly resync$ = new Subject<void>();

  private conn?: HubConnection;

  // ------------------------------------------------------------------ live connection

  /** Call once when the user is logged in (App does it). Safe to call twice. */
  start() {
    if (this.conn) return;

    const conn = new HubConnectionBuilder()
      .withUrl(this.hubUrl, {
        // browsers cannot set headers on a WebSocket, so the token travels as ?access_token=...
        // the factory runs again on every reconnect, so a refreshed token is picked up
        accessTokenFactory: () => this.freshToken(),
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build();

    // event names must match SignalRPusher on the server
    conn.on('notification', raw => this.onNotification(toNotification(raw)));
    conn.on('message', raw => this.onMessage(raw as UserMessage));
    conn.onreconnected(() => this.refreshAll(true));
    // automatic reconnect gives up after a few tries; keep trying with a growing delay
    conn.onclose(() => { if (this.conn === conn) void this.connect(conn, true); });

    this.conn = conn;
    this.refreshAll(false);          // show the real numbers at once, even if the hub is slow to connect
    void this.connect(conn, false);
  }

  /** Call on logout. */
  stop() {
    const conn = this.conn;
    this.conn = undefined;           // makes any running retry loop stop
    void conn?.stop();
    this.unread.set(0);
    this.latest.set([]);
    this.activeChat.set(null);
  }

  private async connect(conn: HubConnection, afterOutage: boolean) {
    let failures = 0;
    while (this.conn === conn) {
      try {
        await conn.start();
        if (afterOutage || failures > 0) this.refreshAll(true);
        return;
      } catch {
        const delay = Math.min(30_000, 1_000 * 2 ** failures++);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  /** a token that is not about to expire (the hub rejects expired tokens) */
  private async freshToken(): Promise<string> {
    const token = this.auth.token();
    if (!token) return '';
    const exp = this.auth.claim<number>('exp');
    if (exp && exp * 1000 - Date.now() < 30_000) {
      try { return await this.auth.refresh(token); } catch { /* fall through: the REST interceptor handles logout */ }
    }
    return token;
  }

  private onNotification(n: AppNotification) {
    this.unread.update(v => v + 1);
    this.latest.update(list => [n, ...list.filter(x => x.id !== n.id)].slice(0, 10));
    // a new chat message also creates a bell item, but its pop-up comes from the "message" event below
    if (n.type !== 'NewMessage') {
      this.toasts.show({ title: n.title, body: n.body, link: notificationLink(n) ?? undefined });
    }
  }

  private onMessage(m: UserMessage) {
    this.message$.next(m);
    if (m.sender_user_id === this.activeChat()) return;     // the chat is open: the page shows it
    this.toasts.show({
      title: m.sender_name || 'رسالة جديدة',
      body: m.body.length > 90 ? m.body.slice(0, 90) + '…' : m.body,
      link: { commands: ['/messages'], queryParams: { with: m.sender_user_id } },
    });
  }

  // ------------------------------------------------------------------ REST (the bell)

  refreshUnread() {
    this.http.get<unknown>(`${this.baseUrl}/unread-count`).subscribe({
      next: r => this.unread.set(Number(body<number>(r)) || 0),
      error: () => { /* keep the old number */ },
    });
  }

  loadLatest() {
    this.list({ unreadOnly: false, page: 1, pageSize: 10 }).subscribe({
      next: r => this.latest.set(r.items),
      error: () => { /* keep the old list */ },
    });
  }

  private refreshAll(notifyPages: boolean) {
    this.refreshUnread();
    this.loadLatest();
    if (notifyPages) this.resync$.next();
  }

  list(q: { unreadOnly: boolean } & PageQuery): Observable<Paged<AppNotification>> {
    return this.http.get<unknown>(this.baseUrl, { params: toParams(q) }).pipe(
      map(r => {
        const p = body<Paged<unknown>>(r);
        return { ...p, items: p.items.map(toNotification) };
      }),
    );
  }

  /** Mark one as read. The bell updates at once; if the server refuses, the real numbers are re-read. */
  read(n: AppNotification) {
    if (n.is_read) return;
    this.unread.update(v => Math.max(0, v - 1));
    const now = new Date().toISOString();
    this.latest.update(list => list.map(x => (x.id === n.id ? { ...x, is_read: true, read_at: now } : x)));
    this.http.post<unknown>(`${this.baseUrl}/${n.id}/read`, {}).subscribe({
      error: () => this.refreshAll(false),
    });
  }

  /** Mark everything as read; returns how many were changed. */
  markAllRead(): Observable<number> {
    return this.http.post<unknown>(`${this.baseUrl}/read-all`, {}).pipe(
      map(r => Number(body<number>(r)) || 0),
      tap(() => {
        const now = new Date().toISOString();
        this.unread.set(0);
        this.latest.update(list => list.map(x => (x.is_read ? x : { ...x, is_read: true, read_at: now })));
      }),
    );
  }
}
