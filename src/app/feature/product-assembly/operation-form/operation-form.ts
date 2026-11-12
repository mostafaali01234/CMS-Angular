// operation-form/operation-form.ts
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { DecimalPipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { map, Observable, shareReplay } from 'rxjs';
import { ProductAssemblyService } from '../product-assembly.service';
import {
  assemblyTypeLabel, AssemblyDefinition, AssemblyOperation, SaveAssemblyOperation,
} from '../product-assembly.model';
import { LookupService } from '../../../shared/services/lookup.service';
import { activeOnly } from '../../../shared/models/lookup.model';
import { LookupSelect } from '../../../shared/components/lookup-select/lookup-select';
import { SearchSelect } from '../../../shared/components/search-select/search-select';
import { today } from '../../../shared/utils/date';
import { apiError } from '../../../shared/utils/api';

// technicians (and their commission) only exist for spring manufacturing
const SPRING_TYPE = 'تصنيع_زمبلكات';

const round = (n: number, digits: number) => {
  const f = 10 ** digits;
  return Math.round(n * f) / f;
};

@Component({
  selector: 'app-assembly-operation-form',
  imports: [ReactiveFormsModule, RouterLink, DecimalPipe, LookupSelect, SearchSelect],
  templateUrl: './operation-form.html',
})
export class OperationForm implements OnInit {
  private fb = inject(FormBuilder);
  private service = inject(ProductAssemblyService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  lookup = inject(LookupService);
  activeOnly = activeOnly;
  typeLabel = assemblyTypeLabel;

  id = signal<number | null>(null);
  loading = signal(false);
  saving = signal(false);
  error = signal<string | null>(null);

  existing = signal<AssemblyOperation | null>(null);        // the saved operation when editing
  definitions = signal<AssemblyDefinition[]>([]);
  definitionsLoaded = signal(false);

  // one request feeds both the product dropdown and the recipe preview
  private definitions$ = this.service.getDefinitions().pipe(shareReplay(1));
  productLoader = () => this.definitions$.pipe(
    map(list => list
      .map(d => ({ id: d.out_product_id, name: d.out_product_name }))
      .sort((a, b) => a.name.localeCompare(b.name, 'ar'))),
  );

  form = this.fb.nonNullable.group({
    out_product_id: [0, [Validators.min(1)]],
    quantity: [1, [Validators.required, Validators.min(0.001)]],
    operation_date: [today(), [Validators.required]],
    out_store_id: [0, [Validators.min(1)]],
    in_store_id: [0, [Validators.min(1)]],
    first_tech_id: [0],
    second_tech_id: [0],
    notes: ['', [Validators.maxLength(2000)]],
  });

  // the controls as signals, so the preview below follows what is typed
  private productId = toSignal(this.form.controls.out_product_id.valueChanges, { initialValue: 0 });
  private quantity = toSignal(this.form.controls.quantity.valueChanges, { initialValue: 1 });
  private firstTech = toSignal(this.form.controls.first_tech_id.valueChanges, { initialValue: 0 });
  private secondTech = toSignal(this.form.controls.second_tech_id.valueChanges, { initialValue: 0 });

  definition = computed(() => this.definitions().find(d => d.out_product_id === this.productId()));

  showTechs = computed(() => this.definition()?.operation_type === SPRING_TYPE);

  /** the product is chosen but has no definition (never defined, or deleted since) */
  missingDefinition = computed(() => this.productId() > 0 && this.definitionsLoaded() && !this.definition());

  /** Editing keeps the recipe the operation was made with, as long as the product is the same one. */
  usesSnapshot = computed(() => {
    const ex = this.existing();
    return !!ex && ex.items.length > 0 && ex.out_product_id === this.productId();
  });

  components = computed(() => {
    const q = Number(this.quantity()) || 0;
    if (this.usesSnapshot()) {
      return this.existing()!.items.map(i => ({
        name: i.product_name, unit: i.unit_quantity, total: round(i.unit_quantity * q, 3),
      }));
    }
    return (this.definition()?.in_product_list ?? []).map(i => ({
      name: i.in_product_name ?? '', unit: i.in_product_quantity, total: round(i.in_product_quantity * q, 3),
    }));
  });

  // what the technicians will earn: quantity x the definition's rate (the server calculates the real amount)
  commissions = computed(() => {
    const d = this.definition();
    const q = Number(this.quantity()) || 0;
    if (!d || !this.showTechs()) return [];
    const rows: { label: string; amount: number }[] = [];
    if (this.firstTech()) rows.push({ label: 'الفني الاول', amount: round(q * d.first_tech_comm, 2) });
    if (this.secondTech()) rows.push({ label: 'الفني الثاني', amount: round(q * d.second_tech_comm, 2) });
    return rows.filter(r => r.amount > 0);
  });

  ngOnInit() {
    this.definitions$.subscribe({
      next: list => { this.definitions.set(list); this.definitionsLoaded.set(true); },
      error: err => this.error.set(apiError(err, 'فشل تحميل تعريفات التجميع')),
    });

    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam) return;

    this.id.set(+idParam);
    this.loading.set(true);
    this.service.getOperation(+idParam).subscribe({
      next: o => {
        this.existing.set(o);
        this.form.patchValue({
          out_product_id: o.out_product_id,
          quantity: o.quantity,
          operation_date: o.operation_date.slice(0, 10),
          out_store_id: o.out_store_id,
          in_store_id: o.in_store_id,
          first_tech_id: o.first_tech_id ?? 0,
          second_tech_id: o.second_tech_id ?? 0,
          notes: o.notes ?? '',
        });
        this.loading.set(false);
      },
      error: err => { this.error.set(apiError(err, 'فشل تحميل العملية')); this.loading.set(false); },
    });
  }

  save() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    const def = this.definition();
    if (!def) { this.error.set('اختر منتجا له تعريف تجميع'); return; }

    const v = this.form.getRawValue();
    const spring = def.operation_type === SPRING_TYPE;
    if (spring && v.second_tech_id && !v.first_tech_id) {
      this.error.set('حدد الفني الاول قبل الفني الثاني');
      return;
    }

    this.saving.set(true);
    this.error.set(null);

    const payload: SaveAssemblyOperation = {
      id: this.id() ?? 0,
      out_product_id: v.out_product_id,
      out_store_id: v.out_store_id,
      in_store_id: v.in_store_id,
      quantity: v.quantity,
      operation_date: v.operation_date,
      operation_type: def.operation_type,          // must match the definition, so it is never typed by hand
      first_tech_id: (spring && v.first_tech_id) || null,     // hidden for other types
      second_tech_id: (spring && v.second_tech_id) || null,
      notes: v.notes,
    };

    const request$: Observable<unknown> = this.id()
      ? this.service.updateOperation(this.id()!, payload)
      : this.service.createOperation(payload);

    request$.subscribe({
      next: () => this.router.navigate(['/product-assembly']),
      error: err => { this.error.set(apiError(err, 'فشل حفظ العملية')); this.saving.set(false); },
    });
  }

  invalid(name: string) {
    const c = this.form.get(name);
    return !!c && c.invalid && (c.touched || c.dirty);
  }
}
