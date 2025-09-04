import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ReservationDataService, ReservationRequest } from '../../services/reservation-data.service';

@Component({
  selector: 'app-reservation-confirmation',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reservation-confirmation.component.html',
  styleUrls: ['./reservation-confirmation.component.scss']
})
export class ReservationConfirmationComponent implements OnInit {
  reservationId: string | null = null;
  reservationData: ReservationRequest | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private reservationDataService: ReservationDataService
  ) {}

  ngOnInit() {
    this.reservationId = this.route.snapshot.queryParamMap.get('id');
    this.reservationData = this.reservationDataService.getReservationData();
  }

  goBack() {
    this.reservationDataService.clearReservationData();
    this.router.navigate(['/']);
  }

  get fullName() {
    return this.reservationData?.customerName || '';
  }

  get email() {
    return this.reservationData?.customerEmail || '';
  }

  get phone() {
    return this.reservationData?.customerPhone || '';
  }

  get requests() {
    return this.reservationData?.requests || '';
  }

  get formattedDate() {
    if (!this.reservationData?.date) return 'Date';
    const d = new Date(this.reservationData.date);
    return d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });
  }

  get formattedTime() {
    return this.reservationData?.time || 'Time';
  }

  get formattedGuests() {
    const guests = this.reservationData?.guests;
    return guests ? `${guests} ${guests > 1 ? 'person' : 'person'}` : 'People';
  }

  get selectedZone() {
    return this.reservationData?.zone || 'Zone';
  }
}
