// src/app/pages/reservation-confirmation/reservation-confirmation.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ReservationDataService } from '../../services/reservation-data.service';
import { Area, ReservationDetails, ReservationRequest, ReservationService } from '../../services/reservation.service';
import { ReservationSettingsService, ReservationSettings } from "../../services/reservation-settings.service";

@Component({
  selector: 'app-reservation-confirmation',
  standalone: true,
  imports: [CommonModule],
  providers: [ReservationService],
  templateUrl: './reservation-confirmation.component.html',
  styleUrls: ['./reservation-confirmation.component.scss']
})
export class ReservationConfirmationComponent implements OnInit {
  reservationDetails: Partial<ReservationDetails & ReservationRequest> = {};

  isLoading = true;
  cancellationMessage: string | null = null;
  allBookableAreas: Area[] = [];
  businessSlug: string | null = null;
  showConfirmModal = false;
  reservationSettings: ReservationSettings | null = null;
  private readonly baseUrl = 'http://localhost:3030';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private reservationDataService: ReservationDataService,
    private reservationService: ReservationService,
    private reservationSettingsService: ReservationSettingsService
  ) {}

  ngOnInit(): void {
    const token = this.route.snapshot.paramMap.get('token');
    this.businessSlug = this.route.snapshot.queryParamMap.get('businessSlug'); // Merr nga query params

    if (token) {
      this.reservationDetails.viewToken = token;
      this.loadReservationByToken(token);
    } else {
      const id = this.route.snapshot.queryParamMap.get('id');
      if (id) {
        const tempData = this.reservationDataService.getReservationData();
        this.reservationDetails = { ...tempData, id: +id };
        const maxGuests = 8;
        this.reservationDetails.status = this.reservationDetails.guests! > maxGuests ? 'PENDING_APPROVAL' : 'CONFIRMED';
        this.isLoading = false;
      } else {
        this.reservationDetails.status = 'NOT_FOUND';
        this.isLoading = false;
      }
    }

    if (this.businessSlug) {
      this.reservationSettingsService.getSettings(this.businessSlug).subscribe(settings => {
        this.reservationSettings = settings;
      }, error => {
        console.error('Error loading reservation settings:', error);
      });
    }
  }


  loadReservationByToken(token: string): void {
    this.cancellationMessage = null;
    this.reservationService.getReservationByToken(token).subscribe({
      next: (data) => {
        this.reservationDetails = data;
        this.isLoading = false;
        console.log('Reservation details loaded:', data);
      },
      error: (error) => {
        console.error('Error loading reservation:', error);
        this.reservationDetails.status = "NOT_FOUND";
        this.isLoading = false;
      }
    });
  }

  cancelReservation(): void {
    this.showConfirmModal = true;
  }

  goBack(): void {
    this.reservationDataService.clearReservationData();
    const slug = this.businessSlug || 'default'; // Përdor një vlerë default nëse mungon
    this.router.navigate(['/reservation', this.businessSlug]);
  }


  get status(): string | null { return this.reservationDetails?.status ?? null; }
  get reservationId(): number | null { return this.reservationDetails?.id ?? null; }
  get fullName(): string { return this.reservationDetails?.customerName || 'N/A'; }
  get email(): string { return this.reservationDetails?.customerEmail || 'N/A'; }
  get phone(): string { return this.reservationDetails?.customerPhone || 'N/A'; }

  get requests(): string {
    return this.reservationDetails?.specialRequest || this.reservationDetails?.requests || 'Nuk ka kërkesa';
  }

  get formattedDate(): string {
    if (!this.reservationDetails?.date) return 'N/A';
    const d = new Date(this.reservationDetails.date + 'T00:00:00');
    return d.toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  get formattedTime(): string {
    return this.reservationDetails?.startTime?.substring(0, 5) || this.reservationDetails?.time || 'N/A';
  }

  get formattedGuests(): string {
    const guests = this.reservationDetails?.guests;
    return guests ? `${guests} ${guests > 1 ? 'persona' : 'person'}` : 'N/A';
  }
  get backgroundImageUrl(): string | null {
    if (this.reservationSettings && this.reservationSettings.config.backgroundPhoto) {
      const filename = this.reservationSettings.config.backgroundPhoto;
      return `url(${this.baseUrl}/${filename.replace(/\\/g, '/')})`;
    }
    return null;
  }

  getImageUrl(filename: string): string {
    if (!filename) return '';
    return `${this.baseUrl}/${filename.replace(/\\/g, '/')}`;
  }

  get selectedZone(): string {
    if (!this.reservationDetails) return 'N/A';

    const areaId = this.reservationDetails.areaId;

    if (areaId === null || areaId === undefined) {
      return 'Any Available Zone';
    }

    if (this.allBookableAreas.length === 0) {
      return 'Loading...';
    }

    const area = this.allBookableAreas.find(a => a.id === areaId);
    return area ? area.areaName : `Unknown Zone (ID: ${areaId})`;
  }

  closeModal(): void {
    this.showConfirmModal = false;
  }

  confirmCancellation(): void {
    this.showConfirmModal = false;

    if (!this.reservationDetails.viewToken) { return; }

    this.isLoading = true;
    this.cancellationMessage = null;
    this.reservationService.cancelReservation(this.reservationDetails.viewToken).subscribe({
      next: () => {
        this.loadReservationByToken(this.reservationDetails.viewToken!);
        this.cancellationMessage = "Your reservation has been successfully cancelled.";
      },
      error: (err) => {
        this.cancellationMessage = err.error?.message || "Could not cancel.";
        this.isLoading = false;
      }
    });
  }
}
