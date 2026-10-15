// product-form/product-form.ts
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { ProductService } from '../product.service';
import {
  PRODUCT_TYPES, SaveProduct, STORAGE_TYPES, UnitCommission,
} from '../product.model';
import { LookupService } from '../../../shared/services/lookup.service';
import { LookupSelect } from '../../../shared/components/lookup-select/lookup-select';
import { apiError } from '../../../shared/utils/api';
import { NonNullableFormBuilder } from '@angular/forms';

const buildCommissionGroup = (fb: NonNullableFormBuilder, c?: UnitCommission) => {
  const pct = [Validators.required, Validators.min(0), Validators.max(100)];
  const amt = [Validators.required, Validators.min(0)];
  return fb.group({
    unit_id: [c?.unit_id ?? 0, [Validators.min(1)]],
    sales_wholesale_comm_percent: [c?.sales_wholesale_comm_percent ?? 0, pct],
    sales_half_wholesale_comm_percent: [c?.sales_half_wholesale_comm_percent ?? 0, pct],
    sales_retail_comm_percent: [c?.sales_retail_comm_percent ?? 0, pct],
    tech_comm: [c?.tech_comm ?? 0, amt],
    assistant_1_comm: [c?.assistant_1_comm ?? 0, amt],
    assistant_2_comm: [c?.assistant_2_comm ?? 0, amt],
    assistant_3_comm: [c?.assistant_3_comm ?? 0, amt],
  });
};

type CommissionGroup = ReturnType<typeof buildCommissionGroup>;

@Component({
  selector: 'app-product-form',
  imports: [ReactiveFormsModule, RouterLink, LookupSelect],
  templateUrl: './product-form.html',
  styleUrl: './product-form.css'
})
export class ProductForm implements OnInit {
  private fb = inject(FormBuilder);
  private service = inject(ProductService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  lookup = inject(LookupService);
  storageTypes = STORAGE_TYPES;
  productTypes = PRODUCT_TYPES;

  id = signal<number | null>(null);
  loading = signal(false);
  saving = signal(false);
  error = signal<string | null>(null);

  form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(150)]],
    description: ['', [Validators.maxLength(2000)]],
    barcode: ['', [Validators.maxLength(50)]],
    category_id: [0, [Validators.min(1)]],               // 0 = no selection
    buy_price: [0, [Validators.required, Validators.min(0)]],
    sale_price: [0, [Validators.required, Validators.min(0)]],
    storage_type: [STORAGE_TYPES[0].value, [Validators.required]],
    product_type: [PRODUCT_TYPES[0].value, [Validators.required]],
    arrange_order: [null as number | null, [Validators.min(0)]],
    inspection_commission_deduction_percent: [0, [Validators.min(0), Validators.max(100)]],
    active: [true],
    has_serial: [false],
    enable_counter: [true],
    enable_add_order: [true],
    unit_commissions: this.fb.array<CommissionGroup>([]),
  });

  get commissions() {
    return this.form.controls.unit_commissions;
  }

//   commissionGroup(c?: UnitCommission) {
//     const pct = [Validators.required, Validators.min(0), Validators.max(100)];
//     const amt = [Validators.required, Validators.min(0)];
//     return this.fb.nonNullable.group({
//       unit_id: [c?.unit_id ?? 0, [Validators.min(1)]],
//       sales_wholesale_comm_percent: [c?.sales_wholesale_comm_percent ?? 0, pct],
//       sales_half_wholesale_comm_percent: [c?.sales_half_wholesale_comm_percent ?? 0, pct],
//       sales_retail_comm_percent: [c?.sales_retail_comm_percent ?? 0, pct],
//       tech_comm: [c?.tech_comm ?? 0, amt],
//       assistant_1_comm: [c?.assistant_1_comm ?? 0, amt],
//       assistant_2_comm: [c?.assistant_2_comm ?? 0, amt],
//       assistant_3_comm: [c?.assistant_3_comm ?? 0, amt],
//     });
//   }
  commissionGroup(c?: UnitCommission) {
    return buildCommissionGroup(this.fb.nonNullable, c);
   }


  addCommission() {
    this.commissions.push(this.commissionGroup());
  }

  removeCommission(i: number) {
    this.commissions.removeAt(i);
  }

  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam) return;

    this.id.set(+idParam);
    this.loading.set(true);
    this.service.getById(+idParam).subscribe({
      next: p => {
        this.form.patchValue({
          name: p.name,
          description: p.description ?? '',
          barcode: p.barcode ?? '',
          category_id: p.category_id,
          buy_price: p.buy_price,
          sale_price: p.sale_price,
          storage_type: p.storage_type,
          product_type: p.product_type,
          arrange_order: p.arrange_order ?? null,
          inspection_commission_deduction_percent: p.inspection_commission_deduction_percent,
          active: p.active,
          has_serial: p.has_serial,
          enable_counter: p.enable_counter,
          enable_add_order: p.enable_add_order,
        });
        (p.unit_commissions ?? []).forEach(c => this.commissions.push(this.commissionGroup(c)));
        this.loading.set(false);
      },
      error: err => {
        this.error.set(apiError(err, 'فشل تحميل المنتج'));
        this.loading.set(false);
      },
    });
  }

  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue();

    // const unitIds = v.unit_commissions.map((c: UnitCommission) => c.unit_id);
    const unitIds = v.unit_commissions.map(c => c.unit_id);
    if (new Set(unitIds).size !== unitIds.length) {
      this.error.set('لا يمكن تكرار نفس الوحدة');
      return;
    }

    this.saving.set(true);
    this.error.set(null);

    const payload: SaveProduct = { ...v, id: this.id() ?? 0 };

    const request$: Observable<unknown> = this.id()
      ? this.service.update(this.id()!, payload)
      : this.service.create(payload);

    request$.subscribe({
      next: () => this.router.navigate(['/products']),
      error: err => {
        this.error.set(apiError(err, 'فشل حفظ المنتج'));
        this.saving.set(false);
      },
    });
  }

  invalid(name: string) {
    const c = this.form.get(name);
    return !!c && c.invalid && (c.touched || c.dirty);
  }

  invalidAt(i: number, name: string) {
    const c = this.commissions.at(i).get(name);
    return !!c && c.invalid && (c.touched || c.dirty);
  }
}