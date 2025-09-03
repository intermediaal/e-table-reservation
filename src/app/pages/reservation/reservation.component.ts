
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { ReservationService, ReservationRequest } from '../../services/reservation.service';

@Component({
  selector: 'app-reservation',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    HttpClientModule
  ],
  providers: [
    ReservationService
  ],
  templateUrl: './reservation.component.html',
  styleUrls: ['./reservation.component.scss']
})
export class ReservationComponent implements OnInit {
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
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9\+\-\s\(\)]{8,15}$/)]],
      requests: ['']
    });
  }

  ngOnInit() {
    const today = new Date().toISOString().split('T')[0];
    const dateControl = this.reservationForm.get('date');
    if (dateControl) {
      dateControl.setValue(today);
    }

    const now = new Date();
    now.setHours(now.getHours() + 1);
    const defaultTime = now.toTimeString().slice(0, 5);
    const timeControl = this.reservationForm.get('time');
    if (timeControl) {
      timeControl.setValue(defaultTime);
    }
  }

  onSubmit() {
    this.clearMessages();

    if (this.reservationForm.invalid) {
      this.reservationForm.markAllAsTouched();
      this.scrollToFirstError();
      return;
    }

    if (!this.isValidDateTime()) {
      this.errorMessage = 'Ju lutem zgjidhni një datë dhe orë të ardhshme.';
      return;
    }

    this.isLoading = true;

    const formValue = this.reservationForm.value;
    const payload: ReservationRequest = {
      customerName: formValue.fullName,
      customerEmail: formValue.email,
      customerPhone: formValue.phone,
      date: formValue.date,
      time: formValue.time,
      guests: formValue.guests
    };

    this.reservationService.createReservation(payload).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.successMessage = `🎉 Rezervimi u konfirmua me sukses! ID e rezervimit tuaj është #${response.id}.`;
        this.reservationForm.reset();
        this.scrollToTop();

        setTimeout(() => {
          this.ngOnInit();
        }, 100);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = this.getErrorMessage(error);
        this.scrollToTop();
      }
    });
  }

  private isValidDateTime(): boolean {
    const selectedDate = this.reservationForm.get('date')?.value;
    const selectedTime = this.reservationForm.get('time')?.value;

    if (!selectedDate || !selectedTime) {
      return false;
    }

    const selectedDateTime = new Date(`${selectedDate}T${selectedTime}`);
    const now = new Date();

    return selectedDateTime > now;
  }

  private getErrorMessage(error: any): string {
    if (error.error?.message) {
      return error.error.message;
    }

    if (error.error && typeof error.error === 'string') {
      return error.error;
    }

    if (error.status === 0) {
      return 'Nuk mund të lidhemi me serverin. Ju lutem kontrolloni lidhjen tuaj të internetit.';
    }

    if (error.status >= 500) {
      return 'Ka ndodhur një gabim në server. Ju lutem provoni përsëri pas pak minutash.';
    }

    if (error.status === 400) {
      return 'Të dhënat e dërguara nuk janë të vlefshme. Ju lutem kontrolloni të gjitha fushat.';
    }

    return 'Ka ndodhur një gabim. Ju lutem provoni përsëri.';
  }

  private clearMessages(): void {
    this.successMessage = null;
    this.errorMessage = null;
  }

  private scrollToFirstError(): void {
    const firstError = document.querySelector('.form-control.error');
    if (firstError) {
      firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  private scrollToTop(): void {
    document.querySelector('.reservation-card')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }

  hasError(controlName: string, errorName: string): boolean {
    const control = this.reservationForm.get(controlName);
    return !!(control?.hasError(errorName) && control?.touched);
  }

  getControlValue(controlName: string): any {
    return this.reservationForm.get(controlName)?.value;
  }

  isControlValid(controlName: string): boolean {
    const control = this.reservationForm.get(controlName);
    return !!(control?.valid && control?.touched);
  }
}
