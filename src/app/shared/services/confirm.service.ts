// shared/services/confirm.service.ts
import { Injectable, signal } from '@angular/core';

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}

interface ConfirmState extends ConfirmOptions {
  resolve: (result: boolean) => void;
}

@Injectable({ providedIn: 'root' })
export class ConfirmService {
  state = signal<ConfirmState | null>(null);

  confirm(options: ConfirmOptions): Promise<boolean> {
    this.state()?.resolve(false); // a dialog is already open: dismiss it
    return new Promise<boolean>(resolve => this.state.set({ ...options, resolve }));
  }

  close(result: boolean) {
    const s = this.state();
    this.state.set(null);
    s?.resolve(result);
  }
}