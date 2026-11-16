import { Component, computed, effect, inject, model, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/AuthService/auth';
import { NotificationBell } from '../notification-bell/notification-bell';

type Theme = 'light' | 'dark';

function initialTheme(): Theme {
  try {
    const saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {}
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive, NotificationBell],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {
  auth = inject(AuthService);

  // two-way bound with the parent: <app-header [(collapsed)]="collapsed" />
  collapsed = model(false);
  mobileNavOpen = model(false);

  menuOpen = signal(false);
  theme = signal<Theme>(initialTheme());
  userName = computed(() => this.auth.claim('name'));
  initial = computed(() => String(this.auth.employeeId() ?? '?'));

  constructor() {
    effect(() => {
      const t = this.theme();
      document.documentElement.setAttribute('data-theme', t);
      try { localStorage.setItem('theme', t); } catch {}
    });
  }

  toggle() {
    if (window.matchMedia('(max-width: 768px)').matches) this.mobileNavOpen.update(v => !v);
    else this.collapsed.update(v => !v);
    // this.collapsed.update(v => !v);
  }

  toggleTheme() {
    this.theme.update(t => (t === 'dark' ? 'light' : 'dark'));
  }
}