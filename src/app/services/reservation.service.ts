
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
  businessSlug: string;
}

export interface ReservationDetails {
  id: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  date: string;
  startTime: string;
  endTime: string;
  guests: number;
  tableIds: number[];
  status: string;
  specialRequest: string;
  viewToken: string;

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

  getAvailability(date: string, guests: number, businessSlug: string): Observable<AvailableTimeSlot[]> {
    return this.http.get<AvailableTimeSlot[]>(`${this.apiUrl}/public/business/${businessSlug}/availability/slots`, {
      params: { date, guests }
    });
  }

  createReservation(reservation: ReservationRequest): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/reservations`, reservation);
  }


  getReservationByToken(token: string): Observable<ReservationDetails> {
    return this.http.get<ReservationDetails>(`${this.apiUrl}/public/reservations/view/${token}`);
  }

  cancelReservation(token: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/public/reservations/cancel/${token}`, {});
  }
  getBusinessBookingInfo(businessSlug: string): Observable<{ maxPartySize: number }> {
    return this.http.get<{ maxPartySize: number }>(`${this.apiUrl}/public/business/${businessSlug}/booking-info`);
  }
}
