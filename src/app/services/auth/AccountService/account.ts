import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from './../../../../environments/environment.development';

export interface Profile {
  fullName: string;
  email: string;
  phoneNumber: string | null;
}

export interface UserList {
  fullName: string;
  email: string;
  userId: string;
}

@Injectable({ providedIn: 'root' })
export class AccountService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/UserSetup`;

  getProfile() {
    return firstValueFrom(this.http.get<Profile>(`${this.baseUrl}/me`));
  }

  updateProfile(data: { fullName: string; phoneNumber: string | null }) {
    return firstValueFrom(this.http.put<Profile>(`${this.baseUrl}/profile`, data));
  }

  changePassword(data: { currentPassword: string; newPassword: string }) {
    return firstValueFrom(this.http.post<void>(`${this.baseUrl}/change-password`, data));
  }

  getUserListAdmin() {
    return firstValueFrom(this.http.get<UserList[]>(`${this.baseUrl}/list-users/admin`));
  }

  resetPasswordAdmin(data: { userId: string; }) {
    return firstValueFrom(this.http.post<void>(`${this.baseUrl}/change-password/admin`, data));
  }
}