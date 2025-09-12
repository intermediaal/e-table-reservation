
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
  reservationDetails: Partial<ReservationDetails> = {};

  isLoading = false;
  cancellationMessage: string | null = null;
  allBookableAreas: Area[] = [];
  businessSlug: string | null = 'intermedia';
  showConfirmModal: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private reservationDataService: ReservationDataService,
    private reservationService: ReservationService
  ) {}

  ngOnInit(): void {
    const token = this.route.snapshot.paramMap.get('token');

    if (token) {
      this.reservationDetails.viewToken = token;
      this.loadReservationByToken(token);
    } else {

      const id = this.route.snapshot.queryParamMap.get('id');
      if (id) {

        const tempData = this.reservationDataService.getReservationData();
        this.reservationDetails = { ...tempData, id: +id };
        this.reservationDetails.status = this.reservationDetails.guests! > 8 ? 'PENDING_APPROVAL' : 'CONFIRMED';
      }
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
        this.reservationDetails = data;
        this.isLoading = false;
      },
      error: () => {
        this.reservationDetails.status = "NOT_FOUND";
        this.isLoading = false;
      }
    });
  }

  cancelReservation(): void {
    if (!this.reservationDetails.viewToken || !confirm("Are you sure you want to cancel?")) { return; }
    this.isLoading = true;
    this.cancellationMessage = null;
    this.reservationService.cancelReservation(this.reservationDetails.viewToken).subscribe({
      next: () => {
        this.loadReservationByToken(this.reservationDetails.viewToken!);
        this.cancellationMessage = "Your reservation has been successfully cancelled.";
      },
      error: (err) => { this.cancellationMessage = err.error?.message || "Could not cancel."; this.isLoading = false; }
    });
  }

  goBack(): void {
    this.reservationDataService.clearReservationData();
    this.router.navigate(['/reservation', this.businessSlug || 'intermedia']);
  }

  get status(): string | null { return this.reservationDetails?.status ?? null; }
  get fullName(): string { return this.reservationDetails?.customerName || 'N/A'; }
  get email(): string { return this.reservationDetails?.customerEmail || 'N/A'; }
  get phone(): string { return this.reservationDetails?.customerPhone || 'N/A'; }
  get requests(): string { return this.reservationDetails?.specialRequest || this.reservationDetails?.specialRequest || 'Nuk ka kërkesa'; }
  get formattedDate(): string {
    if (!this.reservationDetails?.date) return 'N/A';
    const d = new Date(this.reservationDetails.date + 'T00:00:00');
    return d.toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' });
  }
  get formattedTime(): string { return this.reservationDetails?.startTime?.substring(0, 5) || this.reservationDetails?.startTime || 'N/A'; }
  get formattedGuests(): string {
    const guests = this.reservationDetails?.guests;
    return guests ? `${guests} ${guests > 1 ? 'persona' : 'person'}` : 'N/A';
  }
  get selectedZone(): string {
    if (!this.reservationDetails) return 'N/A';
    const areaId = this.reservationDetails;
    if (areaId === null || areaId === undefined) return 'Any Available Zone';
    const area = this.allBookableAreas.find(a => a.id === areaId);
    return area ? area.areaName : 'Loading...';
  }

  closeModal() {

  }

  confirmCancellation() {

  }
}
