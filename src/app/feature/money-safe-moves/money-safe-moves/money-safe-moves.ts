// money-safe-moves/money-safe-moves.ts
import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MoneySafeMovesService } from '../money-safe-moves.service';
import { MOVE_LABELS, MoneySafeMove, MovesFilter, MovesSummary, SafeOption } from '../money-safe-moves.model';
import { Pager } from '../../../shared/components/pager/pager';
import { pagedList } from '../../../shared/utils/paged-list';
import { today } from '../../../shared/utils/date';
import { ActivatedRoute } from '@angular/router';
import { exportFile } from '../../../shared/utils/download';


@Component({
  selector: 'app-money-safe-moves',
  imports: [FormsModule, DatePipe, DecimalPipe, Pager],
  templateUrl: './money-safe-moves.html',
})
export class MoneySafeMovesPage {
  private service = inject(MoneySafeMovesService);

  labels = MOVE_LABELS;
  private qp = inject(ActivatedRoute).snapshot.queryParamMap;

  safes = signal<SafeOption[]>([]);
  safesLoaded = signal(false);
  private defaultSafeId = 0;

  exporting = signal(false);
  exportError = signal<string | null>(null);

  // admin: every safe. employee: only the safes he manages (the server decides)
  single = computed(() => this.safes().length === 1);
  multiCurrency = computed(() => !!this.list.summary()?.is_multi_currency);

  // the dates start as today, so the page opens on today's moves
  list = pagedList<MoneySafeMove, MovesFilter, MovesSummary>(
    q => this.service.getMoves(q),
    () => ({ moneySafeId: Number(this.qp.get('moneySafeId')) || this.defaultSafeId , dateFrom: today(), dateTo: today() }),
    20,
    'فشل تحميل حركات الخزنة',
  );

  showingToday = computed(() => {
    const a = this.list.applied();
    return a.dateFrom === today() && a.dateTo === today();
  });

  constructor() { this.loadSafes(); }

  loadSafes(keepSelection = false) {
    this.service.getSafes().subscribe({
      next: s => {
        this.safes.set(s);
        this.safesLoaded.set(true);
        this.defaultSafeId = s[0]?.id ?? 0;
        if (!keepSelection && this.defaultSafeId) this.list.reset();
      },
      error: () => this.safesLoaded.set(true),
    });
  }

  // current balance of the selected safe, from the list of safes
  selected = computed(() => this.safes().find(s => s.id === this.list.form().moneySafeId) ?? null);

  exportExcel() {
    const a = this.list.applied();          // the filters that are on screen, not the unsaved edits
    if (!a.moneySafeId) return;
    exportFile(this.service.exportMoves(a),
      `money-safe-${a.moneySafeId}-${today()}.xlsx`,
      { busy: this.exporting, error: this.exportError });
  }
}