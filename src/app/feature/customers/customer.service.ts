import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { ApiResponse } from '../../shared/models/api-response.model';
import { unwrap } from '../../shared/utils/api';
import { Customer } from './customer.model';

@Injectable({ providedIn: 'root' })
export class CustomerService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/customer`;

  getAll(sellerId: number): Observable<Customer[]> {
    return this.http.get<ApiResponse<Customer[]>>(this.baseUrl + "?sellerId=" + sellerId).pipe(map(unwrap));
  }

  getById(id: number): Observable<Customer> {
    return this.http.get<ApiResponse<Customer>>(`${this.baseUrl}/${id}`).pipe(map(unwrap));
  }

  create(customer: Customer): Observable<Customer> {
    return this.http.post<ApiResponse<Customer>>(this.baseUrl, customer).pipe(map(unwrap));
  }

  update(id: number, customer: Customer): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${id}`, customer);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}