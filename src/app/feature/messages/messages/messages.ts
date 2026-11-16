import { afterRenderEffect, Component, computed, DestroyRef, ElementRef, inject, signal, viewChild } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/AuthService/auth';
import { MessageService } from '../../../core/services/MessageService/message';
import { NotificationService } from '../../../core/services/NotificationService/notification';
import { Contact, Conversation, UserMessage } from '../../../shared/models/notification.model';
import { apiError } from '../../../shared/utils/api';
import { timeAgo } from '../../../shared/utils/time';

type LoadMode = 'initial' | 'older' | 'refresh';

@Component({
  selector: 'app-messages',
  imports: [FormsModule, RouterLink, DatePipe],
  templateUrl: './messages.html',
  styleUrl: './messages.css',
})
export class Messages {
  private api = inject(MessageService);
  private auth = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private notifications = inject(NotificationService);

  private readonly pageSize = 30;
  private scroller = viewChild<ElementRef<HTMLElement>>('scroller');

  // scrolling has to wait until the new messages are drawn, so it runs after rendering
  private scrollTick = signal(0);
  private wantBottom = false;               // jump to the newest message
  private keepFrom: number | null = null;   // older messages were added above: keep the reading position

  timeAgo = timeAgo;

  me = computed(() => this.auth.claim<string>('UserId'));
  conversations = signal<Conversation[]>([]);
  contacts = signal<Contact[]>([]);
  search = signal('');

  activeId = signal<string | null>(null);
  messages = signal<UserMessage[]>([]);      // oldest first (the API sends newest first)
  total = signal(0);
  page = signal(1);
  draft = signal('');
  loadingThread = signal(false);
  sending = signal(false);
  error = signal<string | null>(null);

  hasMore = computed(() => this.messages().length < this.total());
  pickable = computed(() => this.contacts().filter(c => c.user_id !== this.me()));
  shown = computed(() => {
    const q = this.search().trim().toLowerCase();
    return q ? this.conversations().filter(c => c.user_name.toLowerCase().includes(q)) : this.conversations();
  });
  activeName = computed(() => {
    const id = this.activeId();
    if (!id) return '';
    return this.conversations().find(c => c.user_id === id)?.user_name
      || this.contacts().find(c => c.user_id === id)?.name
      || '';
  });

  constructor() {
    this.loadConversations();
    this.api.contacts().subscribe({ next: c => this.contacts.set(c), error: () => {} });

    // /messages?with=<userId> (the pop-up for a new message links here)
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe(p => {
      const w = p.get('with');
      if (w && w !== this.activeId()) this.open(w);
    });

    this.notifications.message$.pipe(takeUntilDestroyed()).subscribe(m => this.onLive(m));
    this.notifications.resync$.pipe(takeUntilDestroyed()).subscribe(() => this.resync());
    inject(DestroyRef).onDestroy(() => this.notifications.activeChat.set(null));

    afterRenderEffect(() => {
      this.messages();
      this.scrollTick();
      const el = this.scroller()?.nativeElement;
      if (!el) return;
      if (this.keepFrom !== null) { el.scrollTop = el.scrollHeight - this.keepFrom; this.keepFrom = null; }
      else if (this.wantBottom) { el.scrollTop = el.scrollHeight; this.wantBottom = false; }
    });
  }

  // ---------------------------------------------------------------- loading

  private loadConversations() {
    this.api.conversations().subscribe({
      next: list => this.conversations.set(list),
      error: err => this.error.set(apiError(err, 'فشل تحميل المحادثات')),
    });
  }

  open(userId: string) {
    this.activeId.set(userId);
    this.notifications.activeChat.set(userId);   // no pop-ups for this person while the chat is open
    this.messages.set([]);
    this.total.set(0);
    this.page.set(1);
    this.draft.set('');
    this.error.set(null);
    this.loadPage(1, 'initial');
  }

  close() {
    this.activeId.set(null);
    this.notifications.activeChat.set(null);
    // forget ?with=... so a later click on the same pop-up opens the chat again
    this.router.navigate([], { queryParams: { with: null }, queryParamsHandling: 'merge', replaceUrl: true });
  }

  loadOlder() { this.loadPage(this.page() + 1, 'older'); }

  private loadPage(p: number, mode: LoadMode) {
    const id = this.activeId();
    if (!id) return;
    this.loadingThread.set(true);

    const heightBefore = this.scroller()?.nativeElement.scrollHeight ?? null;

    this.api.thread(id, p, this.pageSize).subscribe({
      next: r => {
        if (this.activeId() !== id) return;             // the user switched chat meanwhile
        if (mode === 'initial') this.wantBottom = true;
        if (mode === 'older') this.keepFrom = heightBefore;
        this.messages.update(cur => this.merge(cur, [...r.items].reverse()));
        this.total.set(r.total);
        if (mode !== 'refresh') this.page.set(r.page);
        this.loadingThread.set(false);
        if (mode === 'initial') this.markRead(id);
      },
      error: err => { this.error.set(apiError(err, 'فشل تحميل الرسائل')); this.loadingThread.set(false); },
    });
  }

  /** oldest first, no duplicates (a live message can also arrive in a page load) */
  private merge(a: UserMessage[], b: UserMessage[]): UserMessage[] {
    const byId = new Map<number, UserMessage>();
    for (const m of [...a, ...b]) byId.set(m.id, m);
    return [...byId.values()].sort((x, y) => x.id - y.id);
  }

  private markRead(userId: string) {
    this.api.markThreadRead(userId).subscribe({
      next: () => {
        this.conversations.update(l => l.map(c => (c.user_id === userId ? { ...c, unread_count: 0 } : c)));
        this.notifications.refreshUnread();
        this.loadConversations();
      },
      error: () => {},
    });
  }

  // ---------------------------------------------------------------- live

  private onLive(m: UserMessage) {
    const me = this.me();
    const partner = m.sender_user_id === me ? m.recipient_user_id : m.sender_user_id;

    if (partner === this.activeId()) {
      this.messages.update(cur => this.merge(cur, [{ ...m, is_mine: m.sender_user_id === me }]));
      this.total.update(t => t + 1);
      this.scrollDown();
      if (m.sender_user_id !== me) { this.markRead(partner); return; }   // markRead reloads the list
    }
    this.loadConversations();
  }

  /** after a reconnect: whatever arrived while offline is in the database */
  private resync() {
    this.loadConversations();
    if (this.activeId()) this.loadPage(1, 'refresh');
  }

  // ---------------------------------------------------------------- sending

  send() {
    const id = this.activeId();
    const text = this.draft().trim();
    if (!id || !text || this.sending()) return;

    this.sending.set(true);
    this.error.set(null);
    this.api.send(id, text).subscribe({
      next: m => {
        this.messages.update(cur => this.merge(cur, [{ ...m, is_mine: true }]));
        this.total.update(t => t + 1);
        this.draft.set('');
        this.sending.set(false);
        this.scrollDown();
        this.loadConversations();
      },
      error: err => { this.error.set(apiError(err, 'فشل ارسال الرسالة')); this.sending.set(false); },
    });
  }

  onEnter(e: Event) {
    const k = e as KeyboardEvent;
    if (k.shiftKey || k.isComposing) return;     // Shift+Enter = new line; do not break Arabic/IME input
    k.preventDefault();
    this.send();
  }

  onPick(select: HTMLSelectElement) {
    const id = select.value;
    select.value = '';
    if (id) this.open(id);
  }

  private scrollDown() {
    this.wantBottom = true;
    this.scrollTick.update(n => n + 1);
  }
}
