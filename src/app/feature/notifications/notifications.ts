import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NotificationService } from '../../core/services/NotificationService/notification';
import { AppNotification, notificationLink } from '../../shared/models/notification.model';
import { Pager } from '../../shared/components/pager/pager';
import { pagedList } from '../../shared/utils/paged-list';
import { timeAgo } from '../../shared/utils/time';

@Component({
  selector: 'app-notifications',
  imports: [FormsModule, Pager],
  templateUrl: './notifications.html',
})
export class Notifications {
  private service = inject(NotificationService);
  private router = inject(Router);

  timeAgo = timeAgo;
  busy = signal(false);

  list = pagedList<AppNotification, { unreadOnly: boolean }>(
    q => this.service.list(q),
    () => ({ unreadOnly: false }),
    20,
    'فشل تحميل الاشعارات',
  );

  constructor() { this.list.reload(); }

  icon(n: AppNotification) {
    return n.type === 'NewMessage' ? '💬' : n.type === 'OrderStatusChanged' ? '📋' : '🔔';
  }

  open(n: AppNotification) {
    if (!n.is_read) {
      this.service.read(n);
      const now = new Date().toISOString();
      this.list.items.update(items => items.map(x => (x.id === n.id ? { ...x, is_read: true, read_at: now } : x)));
    }
    const link = notificationLink(n);
    if (link) this.router.navigate(link.commands, { queryParams: link.queryParams });
  }

  markAll() {
    this.busy.set(true);
    this.service.markAllRead().subscribe({
      next: () => { this.busy.set(false); this.list.reload(); },
      error: () => this.busy.set(false),
    });
  }
}
