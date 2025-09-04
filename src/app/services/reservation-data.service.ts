import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ReservationDataService {
  private reservationData: ReservationRequest | null = null;

  setReservationData(data: ReservationRequest) {
    this.reservationData = data;
  }

  getReservationData() {
    return this.reservationData;
  }

  clearReservationData() {
    this.reservationData = null;
  }
}

export interface ReservationRequest {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  date: string;
  time: string;
  guests: number;
  requests?: string;
  zone?: string;
}
