import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-reservation',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './reservation.component.html',
  styleUrls: ['./reservation.component.scss']
})
export class ReservationComponent {
  reservationForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.reservationForm = this.fb.group({
      date: ['', Validators.required],
      time: ['', Validators.required],
      guests: [1, [Validators.required, Validators.min(1)]],
      fullName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{8,15}$/)]],
      requests: ['']
    });
  }

  onSubmit() {
    if (this.reservationForm.valid) {
      console.log('Rezervimi:', this.reservationForm.value);
      // TODO: Lidhe me API backend
    } else {
      this.reservationForm.markAllAsTouched();
    }
  }

  // helper për error messages
  hasError(controlName: string, errorName: string): boolean {
    return <boolean>(
      this.reservationForm.get(controlName)?.hasError(errorName) &&
      this.reservationForm.get(controlName)?.touched
    );
  }
}
