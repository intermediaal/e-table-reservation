import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ReservationConfig {
  isActive: boolean;
  path: string;
  confirmationEmail: string;
  globalStartTime: string;
  globalEndTime: string;
  backgroundPhoto: string;
  icon: string;
}

export interface ReservationHours {
  dayOfWeek: string;
  closed: boolean;
  startTime: string;
  endTime: string;
}

export interface ReservationSettings {
  config: ReservationConfig;
  hours: ReservationHours[];
}

@Injectable({
  providedIn: 'root'
})
export class ReservationSettingsService {

  private apiUrl = 'http://localhost:3030/api/public/reservation-settings';

  constructor(private http: HttpClient) { }

  getSettings(businessSlug: string): Observable<ReservationSettings> {
    return this.http.get<ReservationSettings>(`${this.apiUrl}/${businessSlug}`);
  }
}
