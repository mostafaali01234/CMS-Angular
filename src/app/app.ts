import { Component, effect, inject, signal, untracked } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/AuthService/auth';
import { Sidebar } from './core/layout/sidebar/sidebar';
import { Header } from './core/layout/header/header';
import { ConfirmDialog } from './shared/components/confirm-dialog/confirm-dialog';
import { ToastContainer } from './shared/components/toast-container/toast-container';
import { NotificationService } from './core/services/NotificationService/notification';

@Component({
  imports: [RouterOutlet, Sidebar, Header, ConfirmDialog, ToastContainer],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  auth = inject(AuthService);
  collapsed = signal(false);
  private notifications = inject(NotificationService);

  constructor() {
    // open the live line when a user is logged in (also after a page reload or a login in another tab), close it on logout
    effect(() => {
      if (this.auth.isLoggedIn()) untracked(() => this.notifications.start());
      else this.notifications.stop();
    });
  }
}