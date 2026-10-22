// order-form/order-form.ts
import { Component, inject, OnInit, signal, viewChild  } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { OrderService } from '../order.service';
import {
  enumLabel, ORDER_SOURCES, ORDER_TYPES, OrderItem, SaveOrder,
} from '../order.model';
import { LookupService } from '../../../shared/services/lookup.service';
import {
  activeOnly, CustomerOption, ProductOption,
} from '../../../shared/models/lookup.model';
import { LookupSelect } from '../../../shared/components/lookup-select/lookup-select';
import { SearchSelect } from '../../../shared/components/search-select/search-select';
import { StateCitySelect } from '../../../shared/components/state-city-select/state-city-select';
import { apiError } from '../../../shared/utils/api';
import { AuthService } from '../../../core/services/AuthService/auth';

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

const buildItemGroup = (fb: NonNullableFormBuilder, i?: OrderItem) =>
  fb.group({
    product_id: [i?.product_id ?? 0, [Validators.min(1)]],
    product_price: [i?.product_price ?? 0, [Validators.required, Validators.min(0)]],
    product_quantity: [i?.product_quantity ?? 1, [Validators.required, Validators.min(0.01)]],
    product_discount: [i?.product_discount ?? 0, [Validators.required, Validators.min(0)]],
  });

type ItemGroup = ReturnType<typeof buildItemGroup>;

@Component({
  selector: 'app-order-form',
  imports: [ReactiveFormsModule, RouterLink, DecimalPipe, LookupSelect, SearchSelect, StateCitySelect],
  templateUrl: './order-form.html',
})
export class OrderForm implements OnInit {
  private fb = inject(FormBuilder);
  private service = inject(OrderService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private auth = inject(AuthService);  
  private auditorId = 0;

  lookup = inject(LookupService);
  activeOnly = activeOnly;
  sources = ORDER_SOURCES;
  types = ORDER_TYPES;
  label = enumLabel;

  id = signal<number | null>(null);
  loading = signal(false);
  saving = signal(false);
  error = signal<string | null>(null);

  private lineId: number | null = null;       // kept on edit, the server assigns it on create
  private attachmentImage = '';

  // customer: show name + phone, search both
  customerText = (c: CustomerOption) => (c.phone ? `${c.name} - ${c.phone}` : c.name);
  // product: show name + barcode, search both
  productText = (p: ProductOption) => (p.barcode ? `${p.name} - ${p.barcode}` : p.name);

  form = this.fb.nonNullable.group({
    installation_date: [new Date().toISOString().slice(0, 10), [Validators.required]],
    source: [ORDER_SOURCES[0], [Validators.required]],
    type: [ORDER_TYPES[0], [Validators.required]],
    customer_id: [0, [Validators.min(1)]],
    city_id: [0, [Validators.min(1)]],
    seller_id: [0, [Validators.min(1)]],
    // auditor_id: [0, [Validators.min(1)]],
    shipping: [false],
    location_notes: ['', [Validators.maxLength(2000)]],
    items: this.fb.array<ItemGroup>([]),
  });

  get items() {
    return this.form.controls.items;
  }

  addItem(i?: OrderItem) {
    this.items.push(buildItemGroup(this.fb.nonNullable, i));
  }

  removeItem(i: number) {
    this.items.removeAt(i);
  }

  onProductPicked(g: ItemGroup, p: ProductOption) {
    g.controls.product_price.setValue(p.sale_price);
  }

  // --- totals shown in the form (the server recalculates them anyway) ---
  lineTotal(g: ItemGroup) {
    const v = g.getRawValue();
    return round2(v.product_price * v.product_quantity);
  }
  lineNet(g: ItemGroup) {
    return round2(this.lineTotal(g) - g.getRawValue().product_discount);
  }
  get total() {
    return round2(this.items.controls.reduce((s, g) => s + this.lineTotal(g), 0));
  }
  get discount() {
    return round2(this.items.controls.reduce((s, g) => s + g.getRawValue().product_discount, 0));
  }
  get netTotal() {
    return round2(this.total - this.discount);
  }
  private locationPicker = viewChild(StateCitySelect);

  onCustomerPicked(c: CustomerOption) {
    if (!c.state_id && !c.city_id) return;                     // customer has no location saved
    this.locationPicker()?.setLocation(c.state_id ?? 0, c.city_id ?? 0);
  }

  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam) {
      this.auditorId = Number(this.auth.employeeId()) || 0;
      this.addItem();
      return;
    }

    this.id.set(+idParam);
    this.loading.set(true);
    this.service.getById(+idParam).subscribe({
      next: o => {
        this.form.patchValue({
          installation_date: o.installation_date.slice(0, 10),
          source: o.source,
          type: o.type,
          customer_id: o.customer_id,
          city_id: o.city_id,
          seller_id: o.seller_id,
        //   auditor_id: o.auditor_id,
          shipping: o.shipping,
          location_notes: o.location_notes ?? '',
        });
        // this.form.controls.auditor_id.disable();   // the server doesn't change the auditor on update
        this.lineId = o.line_id ?? null;
        this.auditorId = o.auditor_id;
        this.attachmentImage = o.attachment_image ?? '';
        o.items.forEach(i => this.addItem(i));
        this.loading.set(false);
      },
      error: err => {
        this.error.set(apiError(err, 'فشل تحميل الطلب'));
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

    if (v.items.length === 0) {
      this.error.set('أضف منتجا واحدا على الأقل');
      return;
    }
    const ids = v.items.map(i => i.product_id);
    if (new Set(ids).size !== ids.length) {
      this.error.set('لا يمكن تكرار نفس المنتج');
      return;
    }
    const bad = this.items.controls.find(g => g.getRawValue().product_discount > this.lineTotal(g));
    if (bad) {
      this.error.set('الخصم لا يمكن أن يتجاوز اجمالي السطر');
      return;
    }

    this.saving.set(true);
    this.error.set(null);

    const payload: SaveOrder = {
      id: this.id() ?? 0,
      installation_date: v.installation_date,
      source: v.source,
      type: v.type,
      shipping: v.shipping,
      customer_id: v.customer_id,
      city_id: v.city_id,
      line_id: this.lineId,
      location_notes: v.location_notes,
      seller_id: v.seller_id,
      auditor_id: this.auditorId,
      attachment_image: this.attachmentImage,
      items: v.items,
    };

    const request$: Observable<unknown> = this.id()
      ? this.service.update(this.id()!, payload)
      : this.service.create(payload);

    request$.subscribe({
      next: () => this.router.navigate(['/orders']),
      error: err => {
        this.error.set(apiError(err, 'فشل حفظ الطلب'));
        this.saving.set(false);
      },
    });
  }

  invalid(name: string) {
    const c = this.form.get(name);
    return !!c && c.invalid && (c.touched || c.dirty);
  }

  invalidAt(i: number, name: string) {
    const c = this.items.at(i).get(name);
    return !!c && c.invalid && (c.touched || c.dirty);
  }
}