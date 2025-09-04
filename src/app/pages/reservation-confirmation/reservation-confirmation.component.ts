import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ReservationDataService } from '../../services/reservation-data.service';
import { Area, ReservationDetails, ReservationRequest, ReservationService } from '../../services/reservation.service';

@Component({
  selector: 'app-reservation-confirmation',
  standalone: true,
  imports: [CommonModule],
  providers: [ReservationService],
  templateUrl: './reservation-confirmation.component.html',
  styleUrls: ['./reservation-confirmation.component.scss']
})
export class ReservationConfirmationComponent implements OnInit {
  reservationData: ReservationDetails | ReservationRequest | null = null;

  reservationId: string | null = null;
  token: string | null = null;
  status: string | null = null;
  isLoading = false;
  cancellationMessage: string | null = null;

  allBookableAreas: Area[] = [];
  businessSlug: string | null = 'intermedia';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private reservationDataService: ReservationDataService,
    private reservationService: ReservationService
  ) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.paramMap.get('token');

    if (this.token) {
      this.loadReservationByToken(this.token);
    } else {
      this.reservationId = this.route.snapshot.queryParamMap.get('id');
      this.reservationData = this.reservationDataService.getReservationData();
      this.status = 'CONFIRMED';
    }

    if (this.businessSlug) {
      this.reservationService.getAvailableAreas(this.businessSlug).subscribe(areas => {
        this.allBookableAreas = areas;
      });
    }
  }

  loadReservationByToken(token: string): void {
    this.isLoading = true;
    this.cancellationMessage = null;
    this.reservationService.getReservationByToken(token).subscribe({
      next: (data) => {
        this.reservationData = data;
        this.reservationId = data.id.toString();
        this.status = data.status;
        this.isLoading = false;
      },
      error: () => {
        this.status = "NOT_FOUND";
        this.isLoading = false;
      }
    });
  }

  cancelReservation(): void {
    if (!this.token || !confirm("Are you sure you want to cancel this reservation? This action cannot be undone.")) {
      return;
    }
    this.isLoading = true;
    this.cancellationMessage = null;

    this.reservationService.cancelReservation(this.token).subscribe({
      next: () => {

        this.loadReservationByToken(this.token!);
        this.cancellationMessage = "Your reservation has been successfully cancelled.";
      },
      error: (err) => {
        this.cancellationMessage = err.error?.message || "Could not cancel reservation.";
        this.isLoading = false;
      }
    });
  }

  goBack(): void {
    this.reservationDataService.clearReservationData();
    this.router.navigate(['/reservation', this.businessSlug || 'intermedia']);
  }

  get fullName(): string { return this.reservationData?.customerName || 'N/A'; }
  get email(): string { return this.reservationData?.customerEmail || 'N/A'; }
  get phone(): string { return this.reservationData?.customerPhone || 'N/A'; }
  get requests(): string {
    if (this.reservationData && 'specialRequest' in this.reservationData) {
      return (this.reservationData as ReservationDetails).specialRequest || 'Nuk ka kërkesa';
    }
    if (this.reservationData && 'requests' in this.reservationData) {
      return (this.reservationData as ReservationRequest).requests || 'Nuk ka kërkesa';
    }
    return 'Nuk ka kërkesa';
  }
  get formattedDate(): string {
    if (!this.reservationData?.date) return 'N/A';
    const d = new Date(this.reservationData.date + 'T00:00:00');
    return d.toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' });
  }  get formattedTime(): string {
    if (this.reservationData && 'startTime' in this.reservationData) {
      return (this.reservationData as ReservationDetails).startTime.substring(0, 5);
    }
    if (this.reservationData && 'time' in this.reservationData) {
      return (this.reservationData as ReservationRequest).time;
    }
    return 'N/A';
  }

  get formattedGuests(): string {
    const guests = this.reservationData?.guests;
    return guests ? `${guests} ${guests > 1 ? 'persona' : 'person'}` : 'N/A';
  }

  get selectedZone(): string {
    if (!this.reservationData) return 'N/A';

    if ('areaId' in this.reservationData) {
      const areaId = (this.reservationData as ReservationRequest).areaId;
      if (areaId === null) return 'Any Available Zone';
      const area = this.allBookableAreas.find(a => a.id === areaId);
      return area ? area.areaName : 'Loading...';
    }

    return 'As Assigned';
  }
}
