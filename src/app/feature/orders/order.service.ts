// order.service.ts
import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { ApiResponse } from '../../shared/models/api-response.model';
import { unwrap } from '../../shared/utils/api';
import { CancelOrder, ChangeOrderTech, Order, OrderFilter, OrderNote, Paged, PagedResponse, SaveMaintenance, SaveOrder, SaveOrderNote } from './order.model';

@Injectable({ providedIn: 'root' })
export class OrderService {
    private http = inject(HttpClient);
    private baseUrl = `${environment.apiUrl}/order`;

    getAll(): Observable<Order[]> {
        return this.http.get<ApiResponse<Order[]>>(this.baseUrl).pipe(map(unwrap));
    }

    getPaged(f: OrderFilter) {
        let params = new HttpParams();
        for (const [k, v] of Object.entries(f)) {
            if (v !== undefined && v !== null && v !== '' && v !== 0) params = params.set(k, String(v));
        }
        return this.http.get<PagedResponse<Order>>(this.baseUrl, { params });
    }

    getById(id: number): Observable<Order> {
        return this.http.get<ApiResponse<Order>>(`${this.baseUrl}/${id}`).pipe(map(unwrap));
    }

    create(order: SaveOrder): Observable<Order> {
        return this.http.post<ApiResponse<Order>>(this.baseUrl, order).pipe(map(unwrap));
    }

    update(id: number, order: SaveOrder): Observable<void> {
        return this.http.put<void>(`${this.baseUrl}/${id}`, order);
    }

    cancel(id: number, body: CancelOrder): Observable<void> {
        return this.http.put<void>(`${this.baseUrl}/${id}/cancel`, body);
    }

    delete(id: number, body: CancelOrder): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/${id}`, { body: body });
    }

    getNotes(id: number): Observable<OrderNote[]> {
        return this.http.get<ApiResponse<OrderNote[]>>(`${this.baseUrl}/${id}/Notes`).pipe(map(unwrap));
    }

    addNote(id: number, note: SaveOrderNote): Observable<void> {
        return this.http.post<unknown>(`${this.baseUrl}/${id}/Notes`, note).pipe(map(() => undefined));
    }

    changeTech(id: number, body: ChangeOrderTech): Observable<void> {
        return this.http.post<unknown>(`${this.baseUrl}/${id}/Tech`, body).pipe(map(() => undefined));
    }

    getDoneByCustomer(customerId: number): Observable<Order[]> {
        return this.http.get<ApiResponse<Order[]>>(`${this.baseUrl}/CustomerDone/${customerId}`).pipe(map(unwrap));
    }

    getOldMaintenance(orderId: number): Observable<Order[]> {
        return this.http.get<ApiResponse<Order[]>>(`${this.baseUrl}/Maintenance/${orderId}`).pipe(map(unwrap));
    }

    createMaintenance(body: SaveMaintenance): Observable<Order> {
        return this.http.post<ApiResponse<Order>>(`${this.baseUrl}/Maintenance`, body).pipe(map(unwrap));
    }
}