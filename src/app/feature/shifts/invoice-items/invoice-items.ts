import { Component, inject, model } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InvItem, lineNet } from '../shift.model';
import { LookupService } from '../../../shared/services/lookup.service';
import { activeOnly, ProductOption } from '../../../shared/models/lookup.model';
import { SearchSelect } from '../../../shared/components/search-select/search-select';

@Component({
  selector: 'app-invoice-items',
  imports: [FormsModule, DecimalPipe, SearchSelect],
  template: `
    <div class="ui-table-wrap">
      <table class="ui-table" style="margin-top: 8px">
        <thead>
          <tr><th style="min-width: 260px">المنتج</th><th>الكمية</th><th>السعر</th><th>الخصم</th><th>الاجمالي</th><th></th></tr>
        </thead>
        <tbody>
          @for (it of items(); track $index; let i = $index) {
            <tr>
              <td>
                <app-search-select [ngModel]="it.product_id" (ngModelChange)="set(i, { product_id: +$event })"
                                   [loader]="lookup.products" [filter]="activeOnly" [display]="productText"
                                   placeholder="ابحث بالاسم أو الباركود..." />
              </td>
              <td><input type="number" step="any" class="ui-input" style="width: 90px"
                         [ngModel]="it.product_quantity" (ngModelChange)="set(i, { product_quantity: +$event })" /></td>
              <td><input type="number" step="any" class="ui-input" style="width: 110px"
                         [ngModel]="it.product_price" (ngModelChange)="set(i, { product_price: +$event })" /></td>
              <td><input type="number" step="any" class="ui-input" style="width: 90px"
                         [ngModel]="it.product_discount" (ngModelChange)="set(i, { product_discount: +$event })" /></td>
              <td class="strong">{{ net(it) | number:'1.0-2' }}</td>
              <td><button type="button" class="ui-btn ui-btn-danger sm" (click)="remove(i)">×</button></td>
            </tr>
          } @empty {
            <tr><td colspan="6" class="ui-muted center">لا توجد اصناف</td></tr>
          }
        </tbody>
      </table>
    </div>
    <button type="button" class="ui-btn ui-btn-outline sm" style="margin-top: 8px" (click)="add()">+ اضافة صنف</button>
  `,
})
export class InvoiceItems {
  items = model.required<InvItem[]>();
  lookup = inject(LookupService);
  activeOnly = activeOnly;
  net = lineNet;
  productText = (p: ProductOption) => (p.barcode ? `${p.name} - ${p.barcode}` : p.name);

  add() {
    // a new line copies the price type of the first line, because I haven't seen PriceType
    const pt = this.items()[0]?.price_type ?? 0;
    this.items.update(a => [...a, {
      id: 0, product_id: 0, product_name: '', store_id: 0, product_quantity: 1, product_price: 0,
      product_discount: 0, product_notes: '', price_type: pt, original_item_id: null, project_id: null,
    }]);
  }
  remove(i: number) { this.items.update(a => a.filter((_, k) => k !== i)); }
  set(i: number, p: Partial<InvItem>) { this.items.update(a => a.map((x, k) => (k === i ? { ...x, ...p } : x))); }
}