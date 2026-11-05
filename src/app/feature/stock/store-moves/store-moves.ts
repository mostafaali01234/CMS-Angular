// store-moves/store-moves.ts
import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { StockService } from '../stock.service';
import { docLink, MovesFilter, MovesSummary, OPERATION_TYPES, operationLabel, StockMove } from '../stock.model';
import { LookupService } from '../../../shared/services/lookup.service';
import { ProductOption, StoreOption } from '../../../shared/models/lookup.model';
import { SearchSelect } from '../../../shared/components/search-select/search-select';
import { Pager } from '../../../shared/components/pager/pager';
import { pagedList } from '../../../shared/utils/paged-list';
import { today } from '../../../shared/utils/date';
import { exportFile } from '../../../shared/utils/download';

@Component({
  selector: 'app-store-moves',
  imports: [RouterLink, FormsModule, DatePipe, DecimalPipe, SearchSelect, Pager],
  templateUrl: './store-moves.html',
})
export class StoreMoves {
  private service = inject(StockService);
  private qp = inject(ActivatedRoute).snapshot.queryParamMap;
  lookup = inject(LookupService);
  exporting = signal(false);
  exportError = signal<string | null>(null);


  operations = OPERATION_TYPES;
  opLabel = operationLabel;
  docLink = docLink;
  productText = (p: ProductOption) => (p.barcode ? `${p.name} - ${p.barcode}` : p.name);

  stores = signal<StoreOption[]>([]);
  storesLoaded = signal(false);
  private defaultStoreId = 0;

  list = pagedList<StockMove, MovesFilter, MovesSummary>(
    q => this.service.getStoreMoves(q),
    () => {
      const fromLink = !!this.qp.get('product');
      return {
        storeId: Number(this.qp.get('store')) || this.defaultStoreId,
        productId: Number(this.qp.get('product')) || 0,
        orderId: '', operationType: '',
        dateFrom: fromLink ? '' : today(), dateTo: fromLink ? '' : today(),
      };
    },
    20,
    'فشل تحميل العمليات',
  );

  showingToday = computed(() => {
    const a = this.list.applied();
    return a.dateFrom === today() && a.dateTo === today();
  });

  constructor() {
    this.lookup.stores().subscribe({
      next: s => {
        this.stores.set(s);
        this.storesLoaded.set(true);
        this.defaultStoreId = (s.find(x => x.active) ?? s[0])?.id ?? 0;
        if (this.defaultStoreId || this.qp.get('store')) this.list.reset();
      },
      error: () => this.storesLoaded.set(true),
    });
  }

  exportExcel() {
    exportFile(this.service.exportStoreMoves(this.list.applied()), `store-moves-${today()}.xlsx`,
      { busy: this.exporting, error: this.exportError });
  }
}