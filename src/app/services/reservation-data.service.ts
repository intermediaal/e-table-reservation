import { Injectable } from '@angular/core';

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
export class ReservationDataService {
  private readonly STORAGE_KEY = 'tempReservationData';

  setReservationData(data: ReservationRequest): void {
    sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
  }


  getReservationData(): ReservationRequest | null {
    const dataString = sessionStorage.getItem(this.STORAGE_KEY);
    if (dataString) {
      return JSON.parse(dataString) as ReservationRequest;
    }
    return null;
  }

  clearReservationData(): void {
    sessionStorage.removeItem(this.STORAGE_KEY);
  }
}
