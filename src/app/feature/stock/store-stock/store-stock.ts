// store-stock/store-stock.ts
import { Component, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { StockService } from '../stock.service';
import { StockFilter, StockRow, StockSummary } from '../stock.model';
import { LookupService } from '../../../shared/services/lookup.service';
import { StoreOption } from '../../../shared/models/lookup.model';
import { LookupSelect } from '../../../shared/components/lookup-select/lookup-select';
import { Pager } from '../../../shared/components/pager/pager';
import { pagedList } from '../../../shared/utils/paged-list';

@Component({
  selector: 'app-store-stock',
  imports: [RouterLink, FormsModule, DecimalPipe, LookupSelect, Pager],
  templateUrl: './store-stock.html',
})
export class StoreStock {
  private service = inject(StockService);
  private qp = inject(ActivatedRoute).snapshot.queryParamMap;
  lookup = inject(LookupService);

  stores = signal<StoreOption[]>([]);
  storesLoaded = signal(false);
  private defaultStoreId = 0;

  list = pagedList<StockRow, StockFilter, StockSummary>(
    q => this.service.getStoreStock(q),
    () => ({ storeId:  Number(this.qp.get('store')) || this.defaultStoreId, categoryId: 0, search: '', includeZero: false }),
    20,
    'فشل تحميل المخزون',
  );

  constructor() {
    this.lookup.stores().subscribe({
      next: s => {
        this.stores.set(s);
        this.storesLoaded.set(true);
        this.defaultStoreId = (s.find(x => x.active) ?? s[0])?.id ?? 0;
        if (this.defaultStoreId) this.list.reset();      // the first active store opens by default
      },
      error: () => this.storesLoaded.set(true),
    });
  }
}