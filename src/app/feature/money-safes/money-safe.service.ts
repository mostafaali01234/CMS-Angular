// money-safe.service.ts
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { ApiResponse } from '../../shared/models/api-response.model';
import { unwrap } from '../../shared/utils/api';
import { MoneySafe, SaveMoneySafe } from './money-safe.model';

@Injectable({ providedIn: 'root' })
export class MoneySafeService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/moneySafe`;

  getAll(): Observable<MoneySafe[]> {
    return this.http.get<ApiResponse<MoneySafe[]>>(this.baseUrl).pipe(map(unwrap));
  }

  getById(id: number): Observable<MoneySafe> {
    return this.http.get<ApiResponse<MoneySafe>>(`${this.baseUrl}/${id}`).pipe(map(unwrap));
  }

  create(safe: SaveMoneySafe): Observable<MoneySafe> {
    return this.http.post<ApiResponse<MoneySafe>>(this.baseUrl, safe).pipe(map(unwrap));
  }

  update(id: number, safe: SaveMoneySafe): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${id}`, safe);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}