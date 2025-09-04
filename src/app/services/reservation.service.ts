// src/app/services/reservation.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ReservationRequest {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  date: string;
  time: string;
  guests: number;
  requests: string;
  zone?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ReservationService {
  private apiUrl = 'http://localhost:3030/api/reservations'; // Adjust port if needed

  constructor(private http: HttpClient) { }

  createReservation(reservation: ReservationRequest): Observable<any> {
    return this.http.post<any>(this.apiUrl, reservation);
  }
}
