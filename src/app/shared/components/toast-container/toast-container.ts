import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Toast, ToastService } from '../../../core/services/ToastService/toast';

@Component({
  selector: 'app-toast-container',
  templateUrl: './toast-container.html',
  styleUrl: './toast-container.css',
})
export class ToastContainer {
  toasts = inject(ToastService);
  private router = inject(Router);

  open(t: Toast) {
    this.toasts.dismiss(t.id);
    if (t.link) this.router.navigate(t.link.commands, { queryParams: t.link.queryParams });
  }
}
