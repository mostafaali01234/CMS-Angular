import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './services/auth/AuthService/auth';
import { Sidebar } from './core/layout/sidebar/sidebar';
import { Header } from './core/layout/header/header';
import { ConfirmDialog } from './shared/components/confirm-dialog/confirm-dialog';

@Component({
  imports: [RouterOutlet, Sidebar, Header, ConfirmDialog],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  auth = inject(AuthService);
  collapsed = signal(false);
}