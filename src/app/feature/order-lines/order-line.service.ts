// order-line.service.ts
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { ApiResponse } from '../../shared/models/api-response.model';
import { unwrap } from '../../shared/utils/api';
import { OrderLine, SaveOrderLine } from './order-line.model';

@Injectable({ providedIn: 'root' })
export class OrderLineService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/orderLine`;

  getAll(): Observable<OrderLine[]> {
    return this.http.get<ApiResponse<OrderLine[]>>(this.baseUrl).pipe(map(unwrap));
  }

  getById(id: number): Observable<OrderLine> {
    return this.http.get<ApiResponse<OrderLine>>(`${this.baseUrl}/${id}`).pipe(map(unwrap));
  }

  create(line: SaveOrderLine): Observable<OrderLine> {
    return this.http.post<ApiResponse<OrderLine>>(this.baseUrl, line).pipe(map(unwrap));
  }

  update(id: number, line: SaveOrderLine): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${id}`, line);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  addCities(id: number, cityIds: number[]): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${id}/cities`, cityIds);
  }

  addCategories(id: number, categoryIds: number[]): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${id}/categories`, categoryIds);
  }
}