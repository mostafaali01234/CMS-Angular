import { Component, inject, computed, model, signal, effect } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { AuthService } from '../../services/AuthService/auth';

interface NavItem {
  label: string;
  icon: string;
  path?: string;          // leaf items only
  role?: string;          // omit = visible to everyone
  children?: NavItem[];   // makes it a group
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css'
})
export class Sidebar {
  auth = inject(AuthService);
  private router = inject(Router);

  collapsed = model(false);

  private items: NavItem[] = [
    {
      label: 'الرئيسية', icon: '🏠',
      path: '/dashboard'
    },
    {
      label: 'العملاء', icon: '👥',
      children: [
        // { label: 'عملائي', icon: '•', path: '/customers?sellerid=' + this.auth.employeeId() },
        { label: 'كل العملاء', icon: '•', path: '/customers' }
      ]
    },
    {
      label: 'الاوردرات', icon: '📋',
      children: [
        { label: 'اوردر جديد', icon: '•', path: '/orders/new' },
        { label: 'صيانة جديدة', icon: '•', path: '/orders/maintenance' },
        { label: 'الاوردرات اليومية', icon: '•', path: '/orders' },
        // { label: 'اوردرات الفني', icon: '•', path: '/bookings' },
        { label: 'خطوط الاوردرات', icon: '•', role: 'Admin,SuperAdmin', path: '/order-lines' }
      ]
    },
    {
      label: 'المأموريات', icon: '🚚', role: 'Admin,SuperAdmin',
      children: [
        { label: 'كشف المأموريات', icon: '•', path: '/branches' },
        { label: 'المأموريات باليوم', icon: '•', path: '/floors' }
      ]
    },
    {
      label: 'المصروفات', icon: '💸', role: 'Admin,SuperAdmin',
      children: [
        { label: 'مصروف جديد', icon: '•', path: '/shifts' },
        { label: 'كشف المصروفات', icon: '•', path: '/shifts' },
        { label: 'انوع المصروفات', icon: '•', path: '/branches' },
        { label: 'تصنيف المصروفات', icon: '•', path: '/floors' },
      ]
    },
    {
      label: 'الموظفين', icon: '🧑‍💼', role: 'Admin,SuperAdmin',
      children: [
        { label: 'كشف الموظفين', icon: '•', path: '/branches' },
        { label: 'الخصومات/الحوافز', icon: '•', path: '/shifts' },
        { label: 'السلف', icon: '•', path: '/shifts' },
        { label: 'حساب المرتبات', icon: '•', path: '/floors' },
        { label: 'المرتبات المعتمدة', icon: '•', path: '/floors' },
        { label: 'المرتبات المصروفة', icon: '•', path: '/floors' },
      ]
    },
    {
      label: 'الخزن', icon: '💰', role: 'Admin,SuperAdmin',
      children: [
        { label: 'خزنة جديدة', icon: '•', path: '/money-safe/new' },
        { label: 'كشف الخزن', icon: '•', path: '/money-safes' },
        { label: 'الارصدة الافتتاحية للخزن', icon: '•', path: '/money-safe/opening-balance' },
        { label: 'تحويلات بين الخزن', icon: '•', path: '/money-safe-transactions' },
        { label: 'تصنيفات الخزن', icon: '•', path: '/money-safe-categories' },
      ]
    },
    {
      label: 'المخازن', icon: '📦', role: 'Admin,SuperAdmin',
      children: [
        { label: 'كشف المخزان', icon: '•', path: '/stores' },
        { label: 'تحويلات بين المخازن', icon: '•', path: '/store-transactions' },
        { label: 'مخزون كل المحازن', icon: '•', path: '/store/inventory' },
        { label: 'مخزون كل المخازن 2', icon: '•', path: '/store/inventory-details' },
      ]
    },
    {
      label: 'فواتير الشراء', icon: '🧾', role: 'Admin,SuperAdmin',
      children: [
        { label: 'فاتورة شراء جديدة', icon: '•', path: '/buy-invoices/new' },
        { label: 'مرتجع شراء جديد', icon: '•', path: '/buy-invoices/returns/new' },
        { label: 'كشف فواتير/مرتجعات الشراء', icon: '•', path: '/buy-invoices' },
      ]
    },
    {
      label: 'فواتير البيع', icon: '🏷️', role: 'Admin,SuperAdmin',
      children: [
        { label: 'فاتورة بيع جديدة', icon: '•', path: '/sale-invoices/new' },
        { label: 'مرتجع بيع جديد', icon: '•', path: '/sale-invoices/returns/new' },
        { label: 'كشف فواتير/مرتجعات البيع', icon: '•', path: '/sale-invoices' },
        { label: 'تسديد فواتير البيع', icon: '•', path: '/customer-payments' },
      ]
    },
    {
      label: 'المنتجات', icon: '🛍️', role: 'Admin,SuperAdmin',
      children: [
        { label: 'كشف المنتجات', icon: '•', path: '/products' },
        { label: 'تصنيفات المنتجات', icon: '•', path: '/product-categories' },
        { label: 'حركة المنتجات', icon: '•', path: '/shifts' }
      ]
    },
    {
      label: 'السيارات', icon: '🚗', role: 'Admin,SuperAdmin',
      children: [
        { label: 'سيارة جديدة', icon: '•', path: '/shifts' },
        { label: 'كشف السيارات', icon: '•', path: '/branches' },
      ]
    },
    {
      label: 'الموردين', icon: '🤝', role: 'Admin,SuperAdmin',
      children: [
        { label: 'مورد جديد', icon: '•', path: '/suppliers/new' },
        { label: 'كشف الموردين', icon: '•', path: '/suppliers' },
        { label: 'فواتير الموردين', icon: '•', path: '/suppliers/invoices' },
        { label: 'دفعات الموردين', icon: '•', path: '/supplier-payments' },
        { label: 'الارصدة الافتتاحية للموردين', icon: '•', path: '/suppliers/opening-balance' },
      ]
    },
    {
      label: 'التقارير', icon: '📊', role: 'Admin,SuperAdmin',
      children: [
        { label: 'اوردرات غير تامة بفواتير', icon: '•', path: '/bookings/calendar' },
        { label: 'اوردرات مدفوعة بدون فواتير', icon: '•', path: '/bookings/calendar' },
        { label: 'تقرير الفواتير غير المسددة', icon: '•', path: '/bookings/calendar' },
        { label: 'تقرير المبيعات الشهرية', icon: '•', path: '/bookings/new' },
        { label: 'المبيعات بالمحافظات(اوردرات)', icon: '•', path: '/bookings/new' },
        { label: 'المبيعات بالمحافظات(فواتير)', icon: '•', path: '/bookings/new' },
        { label: 'مبيعات الموظفين(اوردرات)', icon: '•', path: '/bookings/new' },
        { label: 'مبيعات الموظفين(فواتير)', icon: '•', path: '/bookings/new' },
        { label: 'تركيبات الفنيين(الاوردرات)', icon: '•', path: '/bookings/new' },
        { label: 'تركيبات الفنيين(الفواتير)', icon: '•', path: '/bookings/new' },
        { label: 'تقرير الصيانات اقل من شهر للتركيب', icon: '•', path: '/bookings/new' },
        { label: 'تقرير المصروفات الشهرية', icon: '•', path: '/bookings/new' },
      ]
    },
    { label: 'اعدادات الحساب', icon: '⚙️', path: '/settings' }
  ];

  /** Items the current user may see; groups with no visible children are dropped. */
  navItems = computed(() => {
    const allowed = (i: NavItem) => !i.role || i.role.split(",").some(role => this.auth.hasRole(role.trim())) //this.auth.hasRole(i.role);

    return this.items
      .filter(allowed)
      .map(i => i.children ? { ...i, children: i.children.filter(allowed) } : i)
      .filter(i => !i.children || i.children.length > 0);
  });

  // current URL as a signal
  private url = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(e => e.urlAfterRedirects),
      startWith(this.router.url)
    ),
    { initialValue: this.router.url }
  );

  private openGroups = signal<ReadonlySet<string>>(new Set());

  constructor() {
    // open the group that contains the current page (also runs on refresh)
    effect(() => {
      const url = this.url();
      const active = this.navItems().find(i => this.childActive(i, url));
      if (active) {
        this.openGroups.set(new Set([active.label]));   // only the active page's group stays open
      }
    });
  }

  isOpen(item: NavItem): boolean {
    return this.openGroups().has(item.label);
  }

  isGroupActive(item: NavItem): boolean {
    return this.childActive(item, this.url());
  }

  toggleGroup(item: NavItem) {
    // a nested menu needs labels, so expand the sidebar first
    if (this.collapsed()) {
      this.collapsed.set(false);
      this.openGroups.set(new Set([item.label]));
      return;
    }

    // open this group and close all the others; clicking the open one closes it
    this.openGroups.set(this.isOpen(item) ? new Set() : new Set([item.label]));
  }

  private childActive(item: NavItem, url: string): boolean {
    const path = url.split('?')[0];
    return !!item.children?.some(c => c.path && (path === c.path || path.startsWith(c.path + '/')));
  }
}