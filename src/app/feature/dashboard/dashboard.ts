import { Component, inject, signal, computed, OnInit } from '@angular/core';
// import { DatePipe } from '@angular/common';
import { AuthService } from '../../core/services/AuthService/auth';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  // imports: [DatePipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {
  auth = inject(AuthService);
  userName = computed(() => this.auth.claim('name'));
  // private bookingService = inject(BookingService);

  // bookings = signal<Booking[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  totalOrdersToday = signal(0);
  totalOrdersMonthly = signal(0);
  finishedOrdersToday = signal(0);
  finishedOrdersMonthly = signal(0);
  // totalBookings = computed(() => this.bookings().length);

  // totalGuests = computed(() =>
  //   this.bookings().reduce((sum, b) => sum + b.partySize, 0));

  // todayBookings = computed(() => {
  //   const today = new Date().toDateString();
  //   return this.bookings().filter(b => new Date(b.dateTime).toDateString() === today).length;
  // });

  // recent = computed(() =>
  //   [...this.bookings()]
  //     .sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime())
  //     .slice(0, 5));

  async ngOnInit() {
    try {
      // this.bookings.set(await firstValueFrom(this.bookingService.getAll()));
    } catch {
      this.error.set('Failed to load bookings.');
    } finally {
      this.loading.set(false);
    }
  }
}