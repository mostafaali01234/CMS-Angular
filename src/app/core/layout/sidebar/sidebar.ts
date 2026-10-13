import { Component, inject, computed, model, signal, effect } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { AuthService } from '../../../services/auth/AuthService/auth';

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
      label: 'العملاء', icon: '🏬',
      children: [
        { label: 'عملائي', icon: '•', path: '/customers' },
        { label: 'كل العملاء', role: 'Admin,SuperAdmin', icon: '•', path: '/customers' },
        { label: 'العملاء الدائمين', icon: '•', path: '/shifts' }
      ]
    },
    {
      label: 'الاوردرات', icon: '📅',
      children: [
        { label: 'اوردر جديد',  icon: '•', path: '/bookings/new' },
        { label: 'صيانة جديدة',  icon: '•', path: '/bookings/new' },
        { label: 'الاوردرات اليومية', icon: '•', path: '/bookings' },
        { label: 'اوردرات الفني', icon: '•', path: '/bookings' },
        { label: 'خطوط الاوردرات', icon: '•', path: '/bookings' }
      ]
    },
    {
      label: 'المأموريات', icon: '🏬', role: 'Admin,SuperAdmin',
      children: [
        { label: 'كشف المأموريات', icon: '•', path: '/branches' },
        { label: 'المأموريات باليوم', icon: '•', path: '/floors' }
      ]
    },
    {
      label: 'المصروفات', icon: '🏬', role: 'Admin,SuperAdmin',
      children: [
        { label: 'مصروف جديد', icon: '•', path: '/shifts' },
        { label: 'كشف المصروفات', icon: '•', path: '/shifts' },
        { label: 'انوع المصروفات', icon: '•', path: '/branches' },
        { label: 'تصنيف المصروفات', icon: '•', path: '/floors' },
      ]
    },
    {
      label: 'الموظفين', icon: '🏬', role: 'Admin,SuperAdmin',
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
      label: 'الخزن', icon: '🏬', role: 'Admin,SuperAdmin',
      children: [
        { label: 'خزنة جديدة', icon: '•', path: '/shifts' },
        { label: 'كشف الخزن', icon: '•', path: '/branches' },
        { label: 'الارصدة الافتتاحية للخزن', icon: '•', path: '/floors' },
        { label: 'تحويلات بين الخزن', icon: '•', path: '/shifts' },
        { label: 'تصنيفات الخزن', icon: '•', path: '/floors' },
      ]
    },
    {
      label: 'المخازن', icon: '🏬', role: 'Admin,SuperAdmin',
      children: [
        { label: 'كشف المخزان', icon: '•', path: '/branches' },
        { label: 'تحويلات بين المخازن', icon: '•', path: '/shifts' },
        { label: 'مخزون كل المحازن', icon: '•', path: '/shifts' },
        { label: 'مخزون كل المخازن 2', icon: '•', path: '/floors' },
      ]
    },
    {
      label: 'فواتير الشراء', icon: '🏬', role: 'Admin,SuperAdmin',
      children: [
        { label: 'كشف فواتير الشراء', icon: '•', path: '/branches' },
        { label: 'فاتورة شراء جديدة', icon: '•', path: '/shifts' },
        { label: 'كشف مرتجعات الشراء', icon: '•', path: '/shifts' },
        { label: 'مرتجع شراء جديد', icon: '•', path: '/floors' },
      ]
    },
    {
      label: 'فواتير البيع', icon: '🏬', role: 'Admin,SuperAdmin',
      children: [
        { label: 'كشف فواتير البيع', icon: '•', path: '/branches' },
        { label: 'فاتورة بيع جديدة', icon: '•', path: '/shifts' },
        { label: 'تسديد فواتير البيع', icon: '•', path: '/floors' },
        { label: 'كشف مرتجعات البيع', icon: '•', path: '/shifts' },
        { label: 'مرتجع بيع جديد', icon: '•', path: '/floors' },
      ]
    },
    {
      label: 'المنتجات', icon: '🏬', role: 'Admin,SuperAdmin',
      children: [
        { label: 'منتج جديد', icon: '•', path: '/branches' },
        { label: 'كشف المنتجات', icon: '•', path: '/shifts' },
        { label: 'تصنيفات المنتجات', icon: '•', path: '/floors' },
        { label: 'حركة المنتجات', icon: '•', path: '/shifts' }
      ]
    },
    {
      label: 'السيارات', icon: '🏬', role: 'Admin,SuperAdmin',
      children: [
        { label: 'سيارة جديدة', icon: '•', path: '/shifts' },
        { label: 'كشف السيارات', icon: '•', path: '/branches' },
      ]
    },
    {
      label: 'الموردين', icon: '🏬', role: 'Admin,SuperAdmin',
      children: [
        { label: 'مورد جديد', icon: '•', path: '/shifts' },
        { label: 'كشف الموردين', icon: '•', path: '/branches' },
        { label: 'فواتير الموردين', icon: '•', path: '/branches' },
        { label: 'دفعات الموردين', icon: '•', path: '/branches' },
        { label: 'الارصدة الافتتاحية للموردين', icon: '•', path: '/branches' },
      ]
    },
    {
      label: 'التقارير', icon: '📅', role: 'Admin,SuperAdmin',
      children: [
        { label: 'اوردرات غير تامة بفواتير', icon: '•', path: '/bookings/calendar' },
        { label: 'اوردرات مدفوعة بدون فواتير', icon: '•', path: '/bookings/calendar' },
        { label: 'تقرير الفواتير غير المسددة', icon: '•', path: '/bookings/calendar' },
        { label: 'تقرير المبيعات الشهرية',  icon: '•', path: '/bookings/new' },
        { label: 'المبيعات بالمحافظات(اوردرات)',  icon: '•', path: '/bookings/new' },
        { label: 'المبيعات بالمحافظات(فواتير)',  icon: '•', path: '/bookings/new' },
        { label: 'مبيعات الموظفين(اوردرات)',  icon: '•', path: '/bookings/new' },
        { label: 'مبيعات الموظفين(فواتير)',  icon: '•', path: '/bookings/new' },
        { label: 'تركيبات الفنيين(الاوردرات)',  icon: '•', path: '/bookings/new' },
        { label: 'تركيبات الفنيين(الفواتير)',  icon: '•', path: '/bookings/new' },
        { label: 'تقرير الصيانات اقل من شهر للتركيب',  icon: '•', path: '/bookings/new' },
        { label: 'تقرير المصروفات الشهرية',  icon: '•', path: '/bookings/new' },
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
        this.openGroups.update(s => (s.has(active.label) ? s : new Set(s).add(active.label)));
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
      this.openGroups.update(s => new Set(s).add(item.label));
      return;
    }

    this.openGroups.update(s => {
      const next = new Set(s);
      next.has(item.label) ? next.delete(item.label) : next.add(item.label);
      return next;
    });
  }

  private childActive(item: NavItem, url: string): boolean {
    const path = url.split('?')[0];
    return !!item.children?.some(c => c.path && (path === c.path || path.startsWith(c.path + '/')));
  }
}