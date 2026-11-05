// employee.service.ts
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { ApiResponse } from '../../shared/models/api-response.model';
import { Paged } from '../../shared/models/paged.model';
import { unwrap } from '../../shared/utils/api';
import { toParams } from '../../shared/utils/params';
import { Employee, EmployeeListItem, EmployeeQuery, SaveEmployee } from './employee.model';

@Injectable({ providedIn: 'root' })
export class EmployeeService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/employee`;

  getPaged(q: EmployeeQuery): Observable<Paged<EmployeeListItem>> {
    return this.http
      .get<ApiResponse<Paged<EmployeeListItem>>>(`${this.baseUrl}/paged`, { params: toParams(q) })
      .pipe(map(unwrap));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  getById(id: number): Observable<Employee> {
    return this.http.get<ApiResponse<Employee>>(`${this.baseUrl}/${id}`).pipe(map(unwrap));
  }

  create(e: SaveEmployee): Observable<Employee> {
    return this.http.post<ApiResponse<Employee>>(this.baseUrl, e).pipe(map(unwrap));
  }

  update(id: number, e: SaveEmployee): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${id}`, e);
  }
}