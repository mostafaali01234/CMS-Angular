// order-list/order-list.ts
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../order.service';
import { CATEGORY_FILTERS, enumLabel, Order, OrderFilter, OrderNote } from '../order.model';
import { ConfirmService } from '../../../shared/services/confirm.service';
import { LookupService } from '../../../shared/services/lookup.service';
import { EmployeeOption } from '../../../shared/models/lookup.model';
import { AuthService } from '../../../core/services/AuthService/auth';
import { apiError } from '../../../shared/utils/api';
import { map, take, Subject } from 'rxjs';
import { activeOnly } from '../../../shared/models/lookup.model';
import { LookupSelect } from '../../../shared/components/lookup-select/lookup-select';
import { OrderStatus } from '../../../shared/components/order-status/order-status';


@Component({
    selector: 'app-order-list',
    imports: [RouterLink, FormsModule, DatePipe, DecimalPipe, LookupSelect, OrderStatus],    
    templateUrl: './order-list.html',
})
export class OrderList implements OnInit {
    private service = inject(OrderService);
    private confirm = inject(ConfirmService);
    private lookup = inject(LookupService);
    private auth = inject(AuthService);
    private search$ = new Subject<void>();
    private applied = signal<OrderFilter | null>(null);
    private buildFilter(): OrderFilter {
        return {
            page: this.page(), page_size: this.pageSize(),
            date_from: this.dateFrom(), date_to: this.dateTo(),
            search: this.search().trim(),
            items_category: this.itemsCategory(),
            status: this.status(), 
            type: this.type(), 
            source: this.source(),
            seller_id: this.canManage ? this.sellerId() : this.myId(),
            tech_id: this.techFilterId(), 
            country_state_id: this.stateId(),
            category_type: this.categoryFilter(),
        };
    }
    private myId = computed(() => Number(this.auth.employeeId()) || 0);


    activeOnly = activeOnly;


    label = enumLabel;

    orders = signal<Order[]>([]);
    search = signal('');
    dateFrom = signal('');
    dateTo = signal('');
    loading = signal(true);
    error = signal<string | null>(null);
    actionError = signal<string | null>(null);
    busyId = signal<number | null>(null);
    // filters
    itemsCategory = signal('');
    status = signal('');
    type = signal('');
    source = signal('');
    sellerId = signal(0);
    techFilterId = signal(0);
    stateId = signal(0);

    employees = signal<EmployeeOption[]>([]);
    filterEmployees = () =>
        this.canManage
            ? this.lookup.employees()
            : this.lookup.employees().pipe(map(list => list.filter(e => e.id === this.myId())));

    // notes panel (one row open at a time)
    expandedId = signal<number | null>(null);
    notes = signal<Record<number, OrderNote[]>>({});
    notesLoading = signal(false);
    notesError = signal<string | null>(null);
    newNote = signal('');
    savingNote = signal(false);
    categoryFilters = CATEGORY_FILTERS;
    categoryFilter = signal('');
    
    // paging
    page = signal(1);
    pageSize = signal(20);
    totalCount = signal(0);
    totalPages = computed(() => Math.max(1, Math.ceil(this.totalCount() / this.pageSize())));
    pageSizes = [10, 20, 50, 100];

    statuses = ['جديد', 'قيد_التنفيذ', 'تام', 'مؤجل', 'ملغي', 'محذوف', 'تم_التركيب'];
    types = ['جملة', 'تركيب', 'نص_جملة'];
    sources = ['Facebook_صفحة', 'WhatsApp', 'اتصال_مباشر', 'Market_place'];


    /** change tech, cancel and delete are Admin/SuperAdmin on the server */
    get canManage() {
        return this.auth.hasRole('Admin') || this.auth.hasRole('SuperAdmin');
    }
    get colCount() { return this.canManage ? 16 : 15; }

    filtered = computed(() => {
        const q = this.search().trim().toLowerCase();
        const from = this.dateFrom();
        const to = this.dateTo();
        const cat = this.categoryFilter();

        return this.orders().filter(o => {
            const d = (o.installation_date ?? '').slice(0, 10);   // yyyy-MM-dd compares as text
            if (from && d < from) return false;
            if (cat && o.category_type !== cat) return false;
            if (to && d > to) return false;
            if (!q) return true;
            return (
                String(o.id) === q ||
                [o.customer_name, o.city_name, o.line_name, o.seller_name, o.tech_name, o.category_type]
                    .some(v => (v ?? '').toLowerCase().includes(q))
            );
        });
    });

    ngOnInit() {
        // this.search$.pipe(debounceTime(400), takeUntilDestroyed(this.destroyRef))
        //     .subscribe(() => this.applyFilters());
        if (!this.canManage) this.sellerId.set(this.myId());
        this.load();
        if (this.canManage) {
            this.lookup.employees().subscribe({ next: list => this.employees.set(list) });
        }
    }

    doSearch() {
        this.applied.set(this.buildFilter());
        this.page.set(1);
        this.load();
    }

    onSearchChange(v: string) { this.search.set(v); this.search$.next(); }

    applyFilters() { this.page.set(1); this.load(); }

    goTo(p: number) {
        if (p < 1 || p > this.totalPages() || p === this.page()) return;
        this.page.set(p);
        this.load();
    }

    onPageSizeChange(size: number) { this.pageSize.set(+size); this.doSearch(); }

    clearFilters() {
        this.dateFrom.set(''); 
        this.dateTo.set(''); 
        this.search.set('');
        this.itemsCategory.set(''); 
        this.status.set(''); 
        this.type.set(''); 
        this.source.set('');
        this.sellerId.set(this.canManage ? 0 : this.myId());
        this.techFilterId.set(0); 
        this.stateId.set(0); 
        this.categoryFilter.set('');
        this.doSearch();
    }


    load() {
        this.loading.set(true);
        this.error.set(null);
        this.expandedId.set(null);

        const base = this.applied() ?? this.buildFilter();
        this.service.getPaged({ ...base, page: this.page(), page_size: this.pageSize() }).subscribe({
            next: res => {
                this.orders.set(res.data.items);
                this.totalCount.set(res.data.total_count);
                this.loading.set(false);
            },
            error: err => {
                this.error.set(apiError(err, 'فشل تحميل الطلبات'));
                this.loading.set(false);
            },
        });
    }

    get usingDefaultDate() {
        const a = this.applied();
        return !(a?.date_from) && !(a?.date_to);
    }

    clearDates() {
        this.dateFrom.set('');
        this.dateTo.set('');
    }

    private auditorId() {
        return Number(this.auth.employeeId()) || 0;
    }

    // ---------- tech ----------
    techOptions(o: Order) {
        return this.employees().filter(e => e.active || e.id === o.tech_id);
    }


    private setTech(orderId: number, techId: number, techName?: string) {
        this.orders.update(list =>
            list.map(x =>
                x.id === orderId
                    ? { ...x, tech_id: techId, tech_name: techName ?? x.tech_name }
                    : x));
    }

    changeTech(o: Order, techId: number) {
        const previous = o.tech_id ?? 0;
        if (techId === previous) return;

        // "اختر الفني" (0) isn't a valid choice: flip the model so the dropdown goes back
        if (!techId) {
            this.setTech(o.id, 0);
            setTimeout(() => this.setTech(o.id, previous));
            return;
        }

        const auditorId = this.auditorId();
        if (!auditorId) {
            this.actionError.set('تعذر تحديد الموظف الحالي، سجل الدخول مرة اخرى');
            this.setTech(o.id, techId);
            setTimeout(() => this.setTech(o.id, previous));
            return;
        }

        const previousName = o.tech_name;
        this.actionError.set(null);
        this.busyId.set(o.id);
        this.setTech(o.id, techId);                      // optimistic

        this.service.changeTech(o.id, {
            order_id: o.id,
            tech_id: techId,
            tech_name: '',
            status: 'current',
            auditor_id: auditorId,
            created_by: this.auth.userName() ?? undefined,
        }).subscribe({
            next: () => {
                // names come from the cached employees list, so no extra request
                this.lookup.employees().pipe(take(1)).subscribe(list =>
                    this.setTech(o.id, techId, list.find(e => e.id === techId)?.name ?? ''));
                this.busyId.set(null);
            },
            error: err => {
                this.setTech(o.id, previous, previousName);  // put the dropdown back
                this.actionError.set(apiError(err, 'فشل تغيير الفني'));
                this.busyId.set(null);
            },
        });
    }

    // ---------- notes ----------
    noteCount(o: Order) {
        return (this.notes()[o.id] ?? o.notes)?.length ?? 0;
    }

    sortedNotes(id: number) {
        return [...(this.notes()[id] ?? [])]
            .sort((a, b) => (b.created_at_utc ?? '').localeCompare(a.created_at_utc ?? ''));
    }

    toggleNotes(o: Order) {
        if (this.expandedId() === o.id) { this.expandedId.set(null); return; }
        this.expandedId.set(o.id);
        this.newNote.set('');
        this.notesError.set(null);
        this.loadNotes(o.id);
    }

    private loadNotes(id: number) {
        this.notesLoading.set(true);
        this.service.getNotes(id).subscribe({
            next: list => {
                this.notes.update(m => ({ ...m, [id]: list }));
                this.notesLoading.set(false);
            },
            error: err => {
                this.notesError.set(apiError(err, 'فشل تحميل الملاحظات'));
                this.notesLoading.set(false);
            },
        });
    }

    addNote(o: Order) {
        const text = this.newNote().trim();
        if (!text || this.savingNote()) return;

        const auditorId = this.auditorId();
        if (!auditorId) {
            this.notesError.set('تعذر تحديد الموظف الحالي، سجل الدخول مرة اخرى');
            return;
        }

        this.savingNote.set(true);
        this.notesError.set(null);
        this.service.addNote(o.id, {
            order_id: o.id,
            notes: text,
            auditor_id: auditorId,
            created_by: this.auth.userName() ?? undefined,
        }).subscribe({
            next: () => {
                this.newNote.set('');
                this.savingNote.set(false);
                this.loadNotes(o.id);                  // reload instead of guessing the response shape
            },
            error: err => {
                this.notesError.set(apiError(err, 'فشل حفظ الملاحظة'));
                this.savingNote.set(false);
            },
        });
    }

    // ---------- cancel / delete ----------
    async cancel(o: Order) {
        const ok = await this.confirm.confirm({
            title: 'الغاء طلب',
            message: `هل أنت متأكد من الغاء الطلب رقم ${o.id}؟`,
            confirmText: 'الغاء الطلب',
            danger: true,
        });
        if (!ok) return;


        this.actionError.set(null);
        this.busyId.set(o.id);
        this.service.cancel(o.id, {
            order_id: o.id,
            auditor_id: this.auditorId(),
            created_by: this.auth.userName() ?? undefined
        }).subscribe({
            next: () => {
                this.orders.update(list => list.map(x => (x.id === o.id ? { ...x, status: 'ملغي' } : x)));
                this.busyId.set(null);
                this.load();
            },
            error: err => {
                this.actionError.set(apiError(err, 'فشل الغاء الطلب'));
                this.busyId.set(null);
            },
        });
    }

    async remove(o: Order) {
        const ok = await this.confirm.confirm({
            title: 'حذف طلب',
            message: `هل أنت متأكد من حذف الطلب رقم ${o.id}؟ لا يمكن التراجع عن هذا الإجراء.`,
            confirmText: 'حذف',
            danger: true,
        });
        if (!ok) return;

        this.actionError.set(null);
        this.busyId.set(o.id);
        this.service.delete(o.id, {
            order_id: o.id,
            auditor_id: this.auditorId(),
            created_by: this.auth.userName() ?? undefined
        }).subscribe({
            next: () => {
                this.orders.update(list => list.filter(x => x.id !== o.id));
                this.busyId.set(null);
                this.load();
            },
            error: err => {
                this.actionError.set(apiError(err, 'فشل حذف الطلب'));
                this.busyId.set(null);
            },
        });
    }
}