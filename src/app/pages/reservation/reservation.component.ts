// src/app/components/reservation/reservation.component.ts

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { ReservationService, ReservationRequest } from '../../services/reservation.service';

@Component({
  selector: 'app-reservation',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule],
  providers: [ReservationService],
  templateUrl: './reservation.component.html',
  styleUrls: ['./reservation.component.scss']
})
export class ReservationComponent {
  reservationForm: FormGroup;
  isLoading = false;
  successMessage: string | null = null;
  errorMessage: string | null = null;
  currentStep = 1;
  showMoreGuests = false;
  days: number[] = Array.from({ length: 30 }, (_, i) => i + 1);
  firstDayOffset: number;
  times: string[] = [];
  zones: string[] = ['North', 'South', 'East', 'West', 'Central']; // Lista e zonave
  selectedZone: string = 'Zone';
  month = 'September 2025';
  year = 2025;
  monthIndex = 8; // 0-based for September

  constructor(
    private fb: FormBuilder,
    private reservationService: ReservationService
  ) {
    this.reservationForm = this.fb.group({
      date: ['', Validators.required],
      time: ['', Validators.required],
      guests: [null, [Validators.required, Validators.min(1)]],
      fullName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{8,15}$/)]],
      requests: [''],
      zone: [''] // Jo e detyrueshme pa Validators.required
    });

    // Calculate first day offset for calendar (week starts on Monday)
    const firstDay = new Date(this.year, this.monthIndex, 1).getDay();
    this.firstDayOffset = firstDay === 0 ? 6 : firstDay - 1; // 0=Sun -> 6 blanks, Mon=1 -> 0 blanks

    // Generate times from 11:00 to 16:45 in 15-min intervals
    for (let h = 11; h <= 16; h++) {
      for (let m = 0; m < 60; m += 15) {
        if (h === 16 && m > 45) break;
        const hh = h.toString().padStart(2, '0');
        const mm = m.toString().padStart(2, '0');
        this.times.push(`${hh}:${mm}`);
      }
    }
  }

  selectGuests(num: number) {
    this.reservationForm.patchValue({ guests: num });
    this.showMoreGuests = false;
  }

  selectZone(zone: string) {
    this.reservationForm.patchValue({ zone: zone });
    this.selectedZone = zone;
  }

  selectDate(day: number) {
    const dayStr = day.toString().padStart(2, '0');
    this.reservationForm.patchValue({ date: `${this.year}-09-${dayStr}` });
  }

  selectTime(time: string) {
    this.reservationForm.patchValue({ time: time });
  }

  nextStep() {
    if (!this.canProceed()) return;
    this.currentStep++;
    this.successMessage = null;
    this.errorMessage = null;
  }

  prevStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.showMoreGuests = false;
    }
    this.successMessage = null;
    this.errorMessage = null;
  }

  canProceed(): boolean {
    switch (this.currentStep) {
      case 1:
        return this.reservationForm.get('guests')?.valid ?? false;
      case 2:
        return true; // Zone është jo e detyrueshme, prandaj kalon automatikisht
      case 3:
        return this.reservationForm.get('date')?.valid ?? false;
      case 4:
        return this.reservationForm.get('time')?.valid ?? false;
      default:
        return true;
    }
  }

  get formattedGuests(): string {
    const guests = this.reservationForm.value.guests;
    return guests ? `${guests} ${guests > 1 ? 'people' : 'person'}` : 'People';
  }

  get formattedDate(): string {
    const date = this.reservationForm.value.date;
    if (!date) return 'Date';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });
  }

  get formattedTime(): string {
    return this.reservationForm.value.time || 'Time';
  }

  onSubmit() {
    if (this.reservationForm.invalid) {
      this.reservationForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.successMessage = null;
    this.errorMessage = null;

    const formValue = this.reservationForm.value;
    const payload: ReservationRequest = {
      customerName: formValue.fullName,
      customerEmail: formValue.email,
      customerPhone: formValue.phone,
      date: formValue.date,
      time: formValue.time,
      guests: formValue.guests,
      requests: formValue.requests,
      zone: formValue.zone || undefined // Zone mund të jetë e papërcaktuar nëse nuk është zgjedhur
    };

    this.reservationService.createReservation(payload).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.successMessage = `Reservation confirmed successfully! Your reservation ID is #${response.id}.`;
        this.reservationForm.reset();
        this.currentStep = 1;
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || error.error || 'An error occurred. Please try again.';
      }
    });
  }

  hasError(controlName: string, errorName: string): boolean {
    return !!(
      this.reservationForm.get(controlName)?.hasError(errorName) &&
      this.reservationForm.get(controlName)?.touched
    );
  }
}
