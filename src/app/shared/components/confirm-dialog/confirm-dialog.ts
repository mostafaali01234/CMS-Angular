// shared/components/confirm-dialog/confirm-dialog.ts
import { Component, effect, ElementRef, HostListener, inject, viewChild } from '@angular/core';
import { ConfirmService } from '../../services/confirm.service';

@Component({
  selector: 'app-confirm-dialog',
  templateUrl: './confirm-dialog.html',
})
export class ConfirmDialog {
  private confirmService = inject(ConfirmService);
  state = this.confirmService.state;
  cancelBtn = viewChild<ElementRef<HTMLButtonElement>>('cancelBtn');

  constructor() {
    // focus the safe option (cancel) whenever the dialog opens
    effect(() => this.cancelBtn()?.nativeElement.focus());
  }

  close(result: boolean) {
    this.confirmService.close(result);
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    if (this.state()) this.close(false);
  }
}