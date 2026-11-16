import { Component, computed, ElementRef, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { NotificationService } from '../../services/NotificationService/notification';
import { AppNotification, notificationLink } from '../../../shared/models/notification.model';
import { timeAgo } from '../../../shared/utils/time';

@Component({
  selector: 'app-notification-bell',
  imports: [RouterLink],
  templateUrl: './notification-bell.html',
  styleUrl: './notification-bell.css',
  host: {
    '(document:click)': 'onDocClick($event)',
    '(document:keydown.escape)': 'open.set(false)',
  },
})
export class NotificationBell {
  notifications = inject(NotificationService);
  private router = inject(Router);
  private host = inject<ElementRef<HTMLElement>>(ElementRef);

  open = signal(false);
  timeAgo = timeAgo;
  badge = computed(() => {
    const n = this.notifications.unread();
    return n > 99 ? '99+' : String(n);
  });

  toggle() {
    const next = !this.open();
    this.open.set(next);
    if (next) this.notifications.loadLatest();   // fresh list every time it is opened
  }

  onDocClick(e: Event) {
    if (this.open() && !this.host.nativeElement.contains(e.target as Node)) this.open.set(false);
  }

  go(n: AppNotification) {
    this.notifications.read(n);
    this.open.set(false);
    const link = notificationLink(n);
    if (link) this.router.navigate(link.commands, { queryParams: link.queryParams });
  }

  markAll() {
    this.notifications.markAllRead().subscribe({ error: () => this.notifications.refreshUnread() });
  }
}
