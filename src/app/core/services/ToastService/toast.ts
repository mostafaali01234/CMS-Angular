import { Injectable, signal } from '@angular/core';
import { NavTarget } from '../../../shared/models/notification.model';

export interface Toast {
  id: number;
  title: string;
  body?: string;
  link?: NavTarget;      // clicking the toast goes here
}

/** Small pop-ups in the corner (new notification / new message). */
@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly toasts = signal<Toast[]>([]);
  private seq = 0;

  show(t: Omit<Toast, 'id'>, ms = 6000) {
    const id = ++this.seq;
    this.toasts.update(list => [...list.slice(-3), { ...t, id }]);   // at most 4 on screen
    setTimeout(() => this.dismiss(id), ms);
  }

  dismiss(id: number) {
    this.toasts.update(list => list.filter(x => x.id !== id));
  }
}
