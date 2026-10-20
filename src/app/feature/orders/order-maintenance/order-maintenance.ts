// order-maintenance/order-maintenance.ts
import { Component, computed, inject, OnDestroy, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { OrderService } from '../order.service';
import { enumLabel, Order } from '../order.model';
import { LookupService } from '../../../shared/services/lookup.service';
import { CustomerOption } from '../../../shared/models/lookup.model';
import { SearchSelect } from '../../../shared/components/search-select/search-select';
import { AuthService } from '../../../core/services/AuthService/auth';
import { apiError } from '../../../shared/utils/api';
import { of } from 'rxjs';
import { LookupItem } from '../../../shared/models/lookup.model';

const CLOSED = ['تام', 'تم_التركيب', 'ملغي', 'محذوف'];

@Component({
    selector: 'app-order-maintenance',
    imports: [FormsModule, RouterLink, DatePipe, DecimalPipe, SearchSelect],
    templateUrl: './order-maintenance.html',
})
export class OrderMaintenance implements OnDestroy {
    private service = inject(OrderService);
    private auth = inject(AuthService);
    private router = inject(Router);

    lookup = inject(LookupService);
    label = enumLabel;
    customerText = (c: CustomerOption) => (c.phone ? `${c.name} - ${c.phone}` : c.name);

    customerId = signal(0);
    orders = signal<Order[]>([]);
    ordersLoading = signal(false);
    ordersError = signal<string | null>(null);

    orderId = signal(0);
    selected = computed(() => this.orders().find(o => o.id === this.orderId()) ?? null);

    maintenance = signal<Order[]>([]);
    maintLoading = signal(false);
    maintError = signal<string | null>(null);
    hasOpenMaintenance = computed(() => this.maintenance().some(m => !CLOSED.includes(m.status ?? '')));

    notes = signal('');
    saving = signal(false);
    error = signal<string | null>(null);
    canMaintain = computed(() => this.selected()?.type === 'تركيب');
    canSubmit = computed(() =>
        this.canMaintain() &&
        !this.maintLoading() &&
        !this.maintError() &&
        !this.hasOpenMaintenance() &&
        !!this.notes().trim() &&
        !this.saving());

    orderOptions = computed<(LookupItem & { search: string })[]>(() =>
        this.orders().map(o => {
            const date = o.installation_date.slice(0, 10);
            const base = [`#${o.id}`, date, this.label(o.category_type), o.country_state_name, o.city_name].filter(Boolean).join(' - ');
            return {
                id: o.id,
                name: base,
                // also searchable by tech and by the order's product names
                search: [base, o.tech_name, ...o.items.map(i => i.product_name ?? '')].join(' '),
            };
        }));

    orderLoader = () => of(this.orderOptions());
    orderSearch = (o: { search: string }) => o.search;

    private ordersSub?: Subscription;
    private maintSub?: Subscription;

    ngOnDestroy() {
        this.ordersSub?.unsubscribe();
        this.maintSub?.unsubscribe();
    }

    onCustomer(id: number) {
        this.ordersSub?.unsubscribe();
        this.maintSub?.unsubscribe();

        this.customerId.set(id);
        this.orders.set([]);
        this.orderId.set(0);
        this.maintenance.set([]);
        this.ordersLoading.set(false);
        this.maintLoading.set(false);
        this.ordersError.set(null);
        this.maintError.set(null);
        this.error.set(null);
        this.notes.set('');
        if (!id) return;

        this.ordersLoading.set(true);
        this.ordersSub = this.service.getDoneByCustomer(id).subscribe({
            next: list => {
                this.orders.set([...list].sort((a, b) => b.installation_date.localeCompare(a.installation_date)));
                this.ordersLoading.set(false);
            },
            error: err => {
                this.ordersError.set(apiError(err, 'فشل تحميل طلبات العميل'));
                this.ordersLoading.set(false);
            },
        });
    }

    onOrder(id: number) {
        this.maintSub?.unsubscribe();

        this.orderId.set(id);
        this.maintenance.set([]);
        this.maintLoading.set(false);
        this.maintError.set(null);
        this.error.set(null);
        if (!id) return;

        this.maintLoading.set(true);
        this.maintSub = this.service.getOldMaintenance(id).subscribe({
            next: list => {
                this.maintenance.set([...list].sort((a, b) => b.installation_date.localeCompare(a.installation_date)));
                this.maintLoading.set(false);
            },
            error: err => {
                this.maintError.set(apiError(err, 'فشل تحميل طلبات الصيانة السابقة'));
                this.maintLoading.set(false);
            },
        });
    }

    submit() {
        const order = this.selected();
        if (!order || this.saving()) return;

        const text = this.notes().trim();
        if (!text) {
            this.error.set('اكتب سبب طلب الصيانة');
            return;
        }
        if (!this.canMaintain()) {
            this.error.set('لا يمكن عمل صيانة لاوردر جملة');
            return;
        }
        if (this.maintLoading() || this.hasOpenMaintenance()) {
            this.error.set('يوجد طلب صيانة مفتوح لهذا الطلب');
            return;
        }

        const auditorId = Number(this.auth.employeeId()) || 0;
        if (!auditorId) {
            this.error.set('تعذر تحديد الموظف الحالي، سجل الدخول مرة اخرى');
            return;
        }

        this.saving.set(true);
        this.error.set(null);

        this.service.createMaintenance({
            old_order_id: order.id,
            auditor_id: auditorId,
            created_by: this.auth.userName() ?? 'System',
            notes: text,
        }).subscribe({
            next: () => this.router.navigate(['/orders']),
            error: err => {
                this.error.set(apiError(err, 'فشل انشاء طلب الصيانة'));
                this.saving.set(false);
            },
        });
    }
}