// stock-matrix/stock-matrix.ts
import { Component, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { StockService } from '../stock.service';
import { MatrixFilter, MatrixHeader, MatrixRow } from '../stock.model';
import { LookupService } from '../../../shared/services/lookup.service';
import { LookupSelect } from '../../../shared/components/lookup-select/lookup-select';
import { Pager } from '../../../shared/components/pager/pager';
import { pagedList } from '../../../shared/utils/paged-list';

@Component({
  selector: 'app-stock-matrix',
  imports: [RouterLink, FormsModule, DecimalPipe, LookupSelect, Pager],
  templateUrl: './stock-matrix.html',
})
export class StockMatrix {
  private service = inject(StockService);
  lookup = inject(LookupService);

  list = pagedList<MatrixRow, MatrixFilter, MatrixHeader>(
    q => this.service.getMatrix(q),
    () => ({ categoryId: 0, search: '', includeZero: false }),
    50,
    'فشل تحميل المخزون',
  );

  constructor() { this.list.reload(); }
}