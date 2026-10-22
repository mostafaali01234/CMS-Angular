import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { AuthService } from '../../core/services/AuthService/auth';
import { firstValueFrom } from 'rxjs';
import { OrderService } from '../orders/order.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {
  auth = inject(AuthService);
  userName = computed(() => this.auth.claim('name'));
  loading = signal(true);
  error = signal<string | null>(null);
  private orders = inject(OrderService);

  isSuperAdmin = computed(() => this.auth.hasRole('SuperAdmin'));
  userText = computed(() => !this.auth.hasRole('SuperAdmin') ? ' الخاصة بك ' : '');

  totalOrdersToday = signal(0);
  totalOrdersMonthly = signal(0);
  finishedOrdersToday = signal(0);
  finishedOrdersMonthly = signal(0);
  cancelledOrdersToday = signal(0);
  cancelledOrdersMonthly = signal(0);
  maintenanceMonthly = signal(0);
  maintenanceCompletedMonthly = signal(0);
  statGroups = computed(() => [
    {
      key: 'total', title: 'عدد الاوردرات', icon: '📦', tone: 'primary',
      today: this.totalOrdersToday(), month: this.totalOrdersMonthly()
    },
    {
      key: 'finished', title: 'الاوردرات التامة', icon: '✅', tone: 'success',
      today: this.finishedOrdersToday(), month: this.finishedOrdersMonthly()
    },
    {
      key: 'cancelled', title: 'الاوردرات الملغية', icon: '✖', tone: 'danger',
      today: this.cancelledOrdersToday(), month: this.cancelledOrdersMonthly()
    },
    {
      key: 'maint', title: 'الصيانات', icon: '🛠', tone: 'warning',
      today: null, month: this.maintenanceMonthly()
    },
  ]);

  shortcutGroups = computed(() => {
    const isAdmin = this.auth.hasRole('Admin') || this.auth.hasRole('SuperAdmin');

    return [
      {
        title: 'الاوردرات', tone: 'primary',
        items: [
          { icon: '➕', label: 'اوردر جديد', link: '/orders/new' },
          { icon: '🔧', label: 'صيانة جديدة', link: '/orders/maintenance' },
          { icon: '📅', label: 'الاوردرات اليومية', link: '/orders' },
        ],
      },
      ...(isAdmin ? [{
        title: 'المأموريات', tone: 'warning',
        items: [
          { icon: '🚚', label: 'المأموريات', link: null as string | null }, // add route when ready
          { icon: '🗓️', label: 'المأموريات باليوم', link: null as string | null },
        ],
      }] : []),
      {
        title: 'حساباتي', tone: 'success',
        items: [
          { icon: '🧾', label: 'كشف حسابي', link: null as string | null },
          { icon: '💰', label: 'حساب مرتبي', link: null as string | null },
          { icon: '🏦', label: 'خزنتي', link: null as string | null },
        ],
      },
    ];
  });



  async ngOnInit() {
    try {
      const s = await firstValueFrom(this.orders.getStats());
      this.totalOrdersToday.set(s.total_today);
      this.totalOrdersMonthly.set(s.total_month);
      this.finishedOrdersToday.set(s.completed_today);
      this.finishedOrdersMonthly.set(s.completed_month);
      this.cancelledOrdersToday.set(s.cancelled_today);
      this.cancelledOrdersMonthly.set(s.cancelled_month);
      this.maintenanceMonthly.set(s.maintenance_month);
      this.maintenanceCompletedMonthly.set(s.maintenance_completed_month);
    } catch {
      this.error.set('فشل تحميل الإحصائيات');
    } finally {
      this.loading.set(false);
    }
  }
}