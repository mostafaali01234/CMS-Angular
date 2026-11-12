// definition-form/definition-form.ts
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { ProductAssemblyService } from '../product-assembly.service';
import {
  ASSEMBLY_TYPES, AssemblyInProduct, SaveAssemblyDefinition,
} from '../product-assembly.model';
import { LookupService } from '../../../shared/services/lookup.service';
import { activeOnly, ProductOption } from '../../../shared/models/lookup.model';
import { SearchSelect } from '../../../shared/components/search-select/search-select';
import { apiError } from '../../../shared/utils/api';

const rowGroup = (fb: NonNullableFormBuilder, r?: AssemblyInProduct) =>
  fb.group({
    in_product_id: [r?.in_product_id ?? 0, [Validators.min(1)]],
    in_product_quantity: [r?.in_product_quantity ?? 1, [Validators.required, Validators.min(0.001)]],
  });

type RowGroup = ReturnType<typeof rowGroup>;

const SPRING_TYPE = 'تصنيع_زمبلكات';

@Component({
  selector: 'app-assembly-definition-form',
  imports: [ReactiveFormsModule, RouterLink, SearchSelect],
  templateUrl: './definition-form.html',
})
export class DefinitionForm implements OnInit {
  private fb = inject(FormBuilder);
  private service = inject(ProductAssemblyService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  lookup = inject(LookupService);
  types = ASSEMBLY_TYPES;
  productText = (p: ProductOption) => (p.barcode ? `${p.name} - ${p.barcode}` : p.name);

  /** set when editing: the assembled product is the key of the definition, so it cannot change */
  productId = signal<number | null>(null);
  outProductName = signal('');
  loading = signal(false);
  saving = signal(false);
  error = signal<string | null>(null);

  // products that already have a definition cannot get a second one
  private defined = signal<ReadonlySet<number>>(new Set());
  selectableOutProduct = (p: ProductOption) => p.active && !this.defined().has(p.id);
  activeOnly = activeOnly;

  form = this.fb.nonNullable.group({
    out_product_id: [0, [Validators.min(1)]],
    operation_type: [ASSEMBLY_TYPES[0].value as string, [Validators.required]],
    first_tech_comm: [0, [Validators.required, Validators.min(0)]],
    second_tech_comm: [0, [Validators.required, Validators.min(0)]],
    rows: this.fb.array<RowGroup>([]),
  });

  // technician commissions only exist for spring manufacturing
  private operationType = toSignal(this.form.controls.operation_type.valueChanges,
    { initialValue: this.form.controls.operation_type.value });
  showCommissions = computed(() => this.operationType() === SPRING_TYPE);

  get rows() { return this.form.controls.rows; }

  addRow(r?: AssemblyInProduct) { this.rows.push(rowGroup(this.fb.nonNullable, r)); }
  removeRow(i: number) { this.rows.removeAt(i); }

  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('productId');
    if (!idParam) {
      this.addRow();
      this.service.getDefinitions().subscribe({
        next: list => this.defined.set(new Set(list.map(d => d.out_product_id))),
        error: () => { /* the server still refuses a duplicate definition */ },
      });
      return;
    }

    this.productId.set(+idParam);
    this.loading.set(true);
    this.service.getDefinition(+idParam).subscribe({
      next: d => {
        this.outProductName.set(d.out_product_name);
        this.form.patchValue({
          out_product_id: d.out_product_id,
          operation_type: d.operation_type,
          first_tech_comm: d.first_tech_comm,
          second_tech_comm: d.second_tech_comm,
        });
        d.in_product_list.forEach(r => this.addRow(r));
        if (this.rows.length === 0) this.addRow();
        this.loading.set(false);
      },
      error: err => { this.error.set(apiError(err, 'فشل تحميل التعريف')); this.loading.set(false); },
    });
  }

  save() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    const v = this.form.getRawValue();
    if (v.rows.length === 0) { this.error.set('أضف مكونا واحدا على الاقل'); return; }

    const ids = v.rows.map(r => r.in_product_id);
    if (new Set(ids).size !== ids.length) { this.error.set('لا يمكن تكرار نفس المكون'); return; }
    if (ids.includes(v.out_product_id)) { this.error.set('لا يمكن ان يكون المنتج مكونا من مكونات نفسه'); return; }

    this.saving.set(true);
    this.error.set(null);

    const payload: SaveAssemblyDefinition = {
      out_product_id: v.out_product_id,
      operation_type: v.operation_type as SaveAssemblyDefinition['operation_type'],
      // hidden for other types, so they are saved as 0
      first_tech_comm: v.operation_type === SPRING_TYPE ? v.first_tech_comm : 0,
      second_tech_comm: v.operation_type === SPRING_TYPE ? v.second_tech_comm : 0,
      in_product_list: v.rows,
    };

    const request$: Observable<unknown> = this.productId()
      ? this.service.updateDefinition(this.productId()!, payload)
      : this.service.createDefinition(payload);

    request$.subscribe({
      next: () => this.router.navigate(['/product-assembly/definitions']),
      error: err => { this.error.set(apiError(err, 'فشل حفظ التعريف')); this.saving.set(false); },
    });
  }

  invalid(name: string) {
    const c = this.form.get(name);
    return !!c && c.invalid && (c.touched || c.dirty);
  }
  invalidRow(i: number, name: string) {
    const c = this.rows.at(i).get(name);
    return !!c && c.invalid && (c.touched || c.dirty);
  }
}
