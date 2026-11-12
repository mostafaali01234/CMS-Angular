// operation-list/operation-list.ts
import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductAssemblyService } from '../product-assembly.service';
import {
  ASSEMBLY_TYPES, assemblyTypeLabel, AssemblyOperation, AssemblyOperationFilter,
} from '../product-assembly.model';
import { ConfirmService } from '../../../shared/services/confirm.service';
import { LookupService } from '../../../shared/services/lookup.service';
import { LookupSelect } from '../../../shared/components/lookup-select/lookup-select';
import { SearchSelect } from '../../../shared/components/search-select/search-select';
import { Pager } from '../../../shared/components/pager/pager';
import { localList } from '../../../shared/utils/local-list';
import { today } from '../../../shared/utils/date';
import { apiError } from '../../../shared/utils/api';

@Component({
  selector: 'app-assembly-operation-list',
  imports: [RouterLink, FormsModule, DatePipe, DecimalPipe, LookupSelect, SearchSelect, Pager],
  templateUrl: './operation-list.html',
})
export class OperationList {
  private service = inject(ProductAssemblyService);
  private confirm = inject(ConfirmService);
  lookup = inject(LookupService);

  types = ASSEMBLY_TYPES;
  typeLabel = assemblyTypeLabel;
  assembledProducts = this.service.assembledProducts;   // loader for the product filter

  // the endpoint returns every operation, so the filters and the paging run in the browser
  list = localList<AssemblyOperation, AssemblyOperationFilter>(
    () => this.service.getOperations(),
    (o, f) => {
      const day = o.operation_date.slice(0, 10);
      if (f.dateFrom && day < f.dateFrom) return false;
      if (f.dateTo && day > f.dateTo) return false;
      if (f.productId && o.out_product_id !== f.productId) return false;
      if (f.outStoreId && o.out_store_id !== f.outStoreId) return false;
      if (f.inStoreId && o.in_store_id !== f.inStoreId) return false;
      if (f.operationType && o.operation_type !== f.operationType) return false;

      const q = f.search.trim().toLowerCase();
      if (!q) return true;
      const hay = [
        o.id, o.out_product_name, o.out_store_name, o.in_store_name,
        o.first_tech_name, o.second_tech_name, o.notes,
        ...o.items.map(i => i.product_name),
      ].join(' ').toLowerCase();
      return hay.includes(q);
    },
    // the list opens on today's operations, like the other lists
    () => ({ dateFrom: today(), dateTo: today(), productId: 0, outStoreId: 0, inStoreId: 0, operationType: '', search: '' }),
    {
      sort: (a, b) => b.operation_date.localeCompare(a.operation_date) || b.id - a.id,
      errorText: 'فشل تحميل عمليات التجميع',
    },
  );

  showingToday = computed(() => {
    const a = this.list.applied();
    return a.dateFrom === today() && a.dateTo === today();
  });

  totalQuantity = computed(() => this.list.filtered().reduce((s, o) => s + o.quantity, 0));

  expandedId = signal<number | null>(null);
  actionError = signal<string | null>(null);
  deletingId = signal<number | null>(null);

  constructor() { this.list.reload(); }

  toggle(o: AssemblyOperation) {
    this.expandedId.update(id => (id === o.id ? null : o.id));
  }

  techs(o: AssemblyOperation) {
    return [o.first_tech_name, o.second_tech_name].filter(Boolean).join(' / ');
  }

  async remove(o: AssemblyOperation) {
    const ok = await this.confirm.confirm({
      title: 'حذف عملية تجميع',
      message: `هل أنت متأكد من حذف العملية رقم ${o.id} (${o.out_product_name} × ${o.quantity})؟ سيتم سحب المنتج من مخزن "${o.in_store_name}" وإعادة المكونات الى "${o.out_store_name}". لا يمكن التراجع عن هذا الإجراء.`,
      confirmText: 'حذف',
      danger: true,
    });
    if (!ok) return;

    this.actionError.set(null);
    this.deletingId.set(o.id);
    this.service.deleteOperation(o.id).subscribe({
      next: () => { this.deletingId.set(null); this.list.reload(); },
      error: err => { this.actionError.set(apiError(err, 'فشل حذف العملية')); this.deletingId.set(null); },
    });
  }
}
