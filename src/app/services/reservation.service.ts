
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Area {
  id: number;
  areaName: string;
  icon: string;
}

export interface AvailableTimeSlot {
  time: string;
  availableAreaIds: number[];
}
export interface ReservationRequest {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  date: string;
  time: string;
  guests: number;
  requests: string;
  areaId: number | null;
}

@Injectable({
  providedIn: 'root'
})
export class ReservationService {
  private apiUrl = 'http://localhost:3030/api';

  constructor(private http: HttpClient) { }

  getAvailableAreas(businessSlug: string): Observable<Area[]> {
    return this.http.get<Area[]>(`${this.apiUrl}/public/business/${businessSlug}/areas`);
  }

  createReservation(reservation: ReservationRequest): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/reservations`, reservation);
  }

  getAvailability(date: string, guests: number): Observable<AvailableTimeSlot[]> {
    return this.http.get<AvailableTimeSlot[]>(`${this.apiUrl}/public/availability/slots`, {
      params: { date, guests }
    });
  }
}
