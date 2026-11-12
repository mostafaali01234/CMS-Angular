// definition-list/definition-list.ts
import { Component, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductAssemblyService } from '../product-assembly.service';
import {
  ASSEMBLY_TYPES, assemblyTypeLabel, AssemblyDefinition, AssemblyDefinitionFilter,
} from '../product-assembly.model';
import { ConfirmService } from '../../../shared/services/confirm.service';
import { Pager } from '../../../shared/components/pager/pager';
import { localList } from '../../../shared/utils/local-list';
import { apiError } from '../../../shared/utils/api';

@Component({
  selector: 'app-assembly-definition-list',
  imports: [RouterLink, FormsModule, DecimalPipe, Pager],
  templateUrl: './definition-list.html',
})
export class DefinitionList {
  private service = inject(ProductAssemblyService);
  private confirm = inject(ConfirmService);

  types = ASSEMBLY_TYPES;
  typeLabel = assemblyTypeLabel;

  list = localList<AssemblyDefinition, AssemblyDefinitionFilter>(
    () => this.service.getDefinitions(),
    (d, f) => {
      if (f.operationType && d.operation_type !== f.operationType) return false;
      const q = f.search.trim().toLowerCase();
      if (!q) return true;
      const hay = [d.out_product_name, ...d.in_product_list.map(i => i.in_product_name ?? '')].join(' ').toLowerCase();
      return hay.includes(q);
    },
    () => ({ operationType: '', search: '' }),
    {
      sort: (a, b) => a.out_product_name.localeCompare(b.out_product_name, 'ar'),
      errorText: 'فشل تحميل تعريفات التجميع',
    },
  );

  expandedId = signal<number | null>(null);
  actionError = signal<string | null>(null);
  deletingId = signal<number | null>(null);

  constructor() { this.list.reload(); }

  toggle(d: AssemblyDefinition) {
    this.expandedId.update(id => (id === d.out_product_id ? null : d.out_product_id));
  }

  async remove(d: AssemblyDefinition) {
    const ok = await this.confirm.confirm({
      title: 'حذف تعريف تجميع',
      message: `هل أنت متأكد من حذف تعريف تجميع "${d.out_product_name}"؟ العمليات السابقة تحتفظ بمكوناتها ولن يتأثر مخزونها، لكن لن يمكن تسجيل عمليات جديدة لهذا المنتج.`,
      confirmText: 'حذف',
      danger: true,
    });
    if (!ok) return;

    this.actionError.set(null);
    this.deletingId.set(d.out_product_id);
    this.service.deleteDefinition(d.out_product_id).subscribe({
      next: () => { this.deletingId.set(null); this.list.reload(); },
      error: err => { this.actionError.set(apiError(err, 'فشل حذف التعريف')); this.deletingId.set(null); },
    });
  }
}
