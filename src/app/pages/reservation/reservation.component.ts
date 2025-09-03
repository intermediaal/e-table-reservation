// src/app/components/reservation/reservation.component.ts

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { ReservationService, ReservationRequest } from '../../services/reservation.service';

@Component({
  selector: 'app-reservation',
  standalone: true,
  imports: [ CommonModule, ReactiveFormsModule, HttpClientModule ],
  providers: [ ReservationService ],
  templateUrl: './reservation.component.html',
  styleUrls: ['./reservation.component.scss']
})
export class ReservationComponent {
  reservationForm: FormGroup;
  isLoading = false;
  successMessage: string | null = null;
  errorMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private reservationService: ReservationService
  ) {
    this.reservationForm = this.fb.group({
      date: ['', Validators.required],
      time: ['', Validators.required],
      guests: [1, [Validators.required, Validators.min(1)]],
      fullName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{8,15}$/)]],

      // --- CHECK #1: Make sure this line exists in your form definition ---
      requests: ['']
    });
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

      // --- CHECK #2: Make sure this line exists to add the data to the payload ---
      requests: formValue.requests
    };

    this.reservationService.createReservation(payload).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.successMessage = `Rezervimi u konfirmua me sukses! ID e rezervimit tuaj është #${response.id}.`;
        this.reservationForm.reset();
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || error.error || 'Ka ndodhur një gabim. Ju lutem provoni përsëri.';
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
