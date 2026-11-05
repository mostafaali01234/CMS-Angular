// product-moves/product-moves.ts
import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { StockService } from '../stock.service';
import { docLink, MovesFilter, MovesSummary, OPERATION_TYPES, operationLabel, StockMove } from '../stock.model';
import { LookupService } from '../../../shared/services/lookup.service';
import { ProductOption } from '../../../shared/models/lookup.model';
import { SearchSelect } from '../../../shared/components/search-select/search-select';
import { Pager } from '../../../shared/components/pager/pager';
import { pagedList } from '../../../shared/utils/paged-list';
import { today } from '../../../shared/utils/date';
import { exportFile } from '../../../shared/utils/download';

@Component({
  selector: 'app-product-moves',
  imports: [RouterLink, FormsModule, DatePipe, DecimalPipe, SearchSelect, Pager],
  templateUrl: './product-moves.html',
})
export class ProductMoves {
  private service = inject(StockService);
  private qp = inject(ActivatedRoute).snapshot.queryParamMap;
  lookup = inject(LookupService);
  exporting = signal(false);
  exportError = signal<string | null>(null);


  operations = OPERATION_TYPES;
  opLabel = operationLabel;
  docLink = docLink;
  productText = (p: ProductOption) => (p.barcode ? `${p.name} - ${p.barcode}` : p.name);

  list = pagedList<StockMove, MovesFilter, MovesSummary>(
    q => this.service.getProductMoves(q),
    () => {
      const fromLink = !!this.qp.get('product');
      return {
        storeId: 0,
        productId: Number(this.qp.get('product')) || 0,
        orderId: '', operationType: '',
        dateFrom: fromLink ? '' : today(), dateTo: fromLink ? '' : today(),
      };
    },
    20,
    'فشل تحميل الحركات',
  );

  showingToday = computed(() => {
    const a = this.list.applied();
    return a.dateFrom === today() && a.dateTo === today();
  });

  party = (m: StockMove) => m.customer_name ?? m.supplier_name ?? '';

  constructor() { this.list.reload(); }

  exportExcel() {
    exportFile(this.service.exportProductMoves(this.list.applied()), `product-moves-${today()}.xlsx`,
      { busy: this.exporting, error: this.exportError });
  }
}