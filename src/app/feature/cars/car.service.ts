// car.service.ts
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { ApiResponse } from '../../shared/models/api-response.model';
import { Paged } from '../../shared/models/paged.model';
import { unwrap } from '../../shared/utils/api';
import { toParams } from '../../shared/utils/params';
import { LookupService } from '../../shared/services/lookup.service';
import { Car, CarQuery, SaveCar } from './car.model';

@Injectable({ providedIn: 'root' })
export class CarService {
  private http = inject(HttpClient);
  private lookup = inject(LookupService);
  private baseUrl = `${environment.apiUrl}/car`;

  getPaged(q: CarQuery): Observable<Paged<Car>> {
    return this.http
      .get<ApiResponse<Paged<Car>>>(`${this.baseUrl}/paged`, { params: toParams(q) })
      .pipe(map(unwrap));
  }

  getById(id: number): Observable<Car> {
    return this.http.get<ApiResponse<Car>>(`${this.baseUrl}/${id}`).pipe(map(unwrap));
  }

  // the expense form's car dropdown reads the same list, so every change refreshes it
  create(car: SaveCar): Observable<Car> {
    return this.http.post<ApiResponse<Car>>(this.baseUrl, car).pipe(
      map(unwrap), tap(() => this.lookup.clear('cars')));
  }

  update(id: number, car: SaveCar): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${id}`, car).pipe(tap(() => this.lookup.clear('cars')));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`).pipe(tap(() => this.lookup.clear('cars')));
  }
}