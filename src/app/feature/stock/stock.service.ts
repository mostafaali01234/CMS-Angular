// stock.service.ts
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { ApiResponse } from '../../shared/models/api-response.model';
import { PageQuery, Paged } from '../../shared/models/paged.model';
import { unwrap } from '../../shared/utils/api';
import { toParams } from '../../shared/utils/params';
import {
  MatrixFilter, MatrixHeader, MatrixRow, MovesFilter, MovesSummary,
  StockFilter, StockMove, StockRow, StockSummary,
} from './stock.model';

@Injectable({ providedIn: 'root' })
export class StockService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/stock`;

  private get<T>(path: string, q: object): Observable<T> {
    return this.http.get<ApiResponse<T>>(`${this.baseUrl}/${path}`, { params: toParams(q) }).pipe(map(unwrap));
  }

  getStoreStock(q: StockFilter & PageQuery) { return this.get<Paged<StockRow, StockSummary>>('store', q); }
  getMatrix(q: MatrixFilter & PageQuery) { return this.get<Paged<MatrixRow, MatrixHeader>>('matrix', q); }
  getStoreMoves(q: MovesFilter & PageQuery) { return this.get<Paged<StockMove, MovesSummary>>('store-moves', q); }
  getProductMoves(q: MovesFilter & PageQuery) { return this.get<Paged<StockMove, MovesSummary>>('product-moves', q); }

  private blob(path: string, q: object): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${path}`, { params: toParams(q), responseType: 'blob' });
  }

  exportStoreStock(q: StockFilter) { return this.blob('store/export', q); }
  exportMatrix(q: MatrixFilter) { return this.blob('matrix/export', q); }
  exportStoreMoves(q: MovesFilter) { return this.blob('store-moves/export', q); }
  exportProductMoves(q: MovesFilter) { return this.blob('product-moves/export', q); }
}