// money-safe-moves.service.ts
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { ApiResponse } from '../../shared/models/api-response.model';
import { PageQuery, Paged } from '../../shared/models/paged.model';
import { unwrap } from '../../shared/utils/api';
import { toParams } from '../../shared/utils/params';
import { MoneySafeMove, MovesFilter, MovesSummary, SafeOption } from './money-safe-moves.model';

@Injectable({ providedIn: 'root' })
export class MoneySafeMovesService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/MoneySafeMove`;

  getSafes(): Observable<SafeOption[]> {
    return this.http.get<ApiResponse<SafeOption[]>>(`${this.baseUrl}/safes`).pipe(map(unwrap));
  }

  getMoves(q: MovesFilter & PageQuery): Observable<Paged<MoneySafeMove, MovesSummary>> {
    return this.http
      .get<ApiResponse<Paged<MoneySafeMove, MovesSummary>>>(this.baseUrl, { params: toParams(q) })
      .pipe(map(unwrap));
  }

  exportMoves(q: MovesFilter): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/export`, { params: toParams(q), responseType: 'blob' });
  }
}