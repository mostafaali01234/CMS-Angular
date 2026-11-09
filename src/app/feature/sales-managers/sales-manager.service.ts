// sales-manager.service.ts
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { ApiResponse } from '../../shared/models/api-response.model';
import { unwrap } from '../../shared/utils/api';
import { SalesManagerGroup } from './sales-manager.model';

@Injectable({ providedIn: 'root' })
export class SalesManagerService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/sales-manager-groups`;

  getAll(): Observable<SalesManagerGroup[]> {
    return this.http.get<ApiResponse<SalesManagerGroup[]>>(this.baseUrl).pipe(map(unwrap));
  }
  getById(id: number): Observable<SalesManagerGroup> {
    return this.http.get<ApiResponse<SalesManagerGroup>>(`${this.baseUrl}/${id}`).pipe(map(unwrap));
  }
  create(g: Partial<SalesManagerGroup>): Observable<SalesManagerGroup> {
    return this.http.post<ApiResponse<SalesManagerGroup>>(this.baseUrl, g).pipe(map(unwrap));
  }
  update(id: number, g: Partial<SalesManagerGroup>): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${id}`, g);
  }
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}