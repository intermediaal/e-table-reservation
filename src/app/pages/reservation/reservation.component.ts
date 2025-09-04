import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { debounceTime, distinctUntilChanged, filter } from 'rxjs/operators';
import { ReservationService, ReservationRequest, Area, AvailableTimeSlot } from '../../services/reservation.service';

@Component({
  selector: 'app-reservation',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule, RouterModule],
  providers: [ReservationService],
  templateUrl: './reservation.component.html',
  styleUrls: ['./reservation.component.scss']
})
export class ReservationComponent implements OnInit {
  reservationForm: FormGroup;

  // State Properties
  isLoading = false;
  isAvailabilityLoading = false;
  successMessage: string | null = null;
  errorMessage: string | null = null;
  currentStep = 1;
  showMoreGuests = false;

  // Dynamic Data
  businessSlug: string | null = null;
  businessName: string = 'our Restaurant';
  allBookableAreas: Area[] = [];
  dailyAvailability: AvailableTimeSlot[] = [];
  allPossibleTimes: string[] = [];

  // Calendar Properties
  currentDate = new Date();
  days: number[] = [];
  firstDayOffset = 0;
  month = '';
  year = 0;

  constructor(
    private fb: FormBuilder,
    private reservationService: ReservationService,
    private route: ActivatedRoute
  ) {
    this.reservationForm = this.fb.group({
      guests: [2, [Validators.required, Validators.min(1)]],
      date: [this.getTodayString(), Validators.required],
      areaId: [null],
      time: ['', Validators.required],
      fullName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9+ ]{8,20}$/)]],
      requests: ['']
    });
    this.generateAllPossibleTimes();
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const slug = params.get('businessSlug');
      if (slug) {
        this.businessSlug = slug;
        this.businessName = this.prettifySlug(slug);
        this.loadAllBookableAreas();
        this.setupCalendar();
        this.listenForAvailabilityChanges();
        this.fetchAvailability();
      } else {
        this.errorMessage = "Business not specified. Please check the URL.";
      }
    });
  }

  listenForAvailabilityChanges(): void {
    this.reservationForm.get('guests')?.valueChanges.pipe(
      debounceTime(400), distinctUntilChanged(), filter(val => val > 0)
    ).subscribe(() => this.fetchAvailability());

    this.reservationForm.get('date')?.valueChanges.pipe(
      distinctUntilChanged()
    ).subscribe(() => this.fetchAvailability());
  }

  loadAllBookableAreas(): void {
    if (!this.businessSlug) return;
    this.reservationService.getAvailableAreas(this.businessSlug).subscribe(areas => {
      this.allBookableAreas = areas;
    });
  }

  fetchAvailability(): void {
    const guests = this.reservationForm.get('guests')?.value;
    const date = this.reservationForm.get('date')?.value;
    if (!guests || !date || !this.businessSlug) {
      this.dailyAvailability = [];
      return;
    }
    this.isAvailabilityLoading = true;
    this.reservationService.getAvailability(date, guests).subscribe({
      next: (availability) => {
        this.dailyAvailability = availability;
        this.isAvailabilityLoading = false;
        this.validateAndUpdateSelections();
      },
      error: () => {
        this.isAvailabilityLoading = false;
        this.errorMessage = "Could not fetch availability.";
      }
    });
  }

  validateAndUpdateSelections(): void {
    this.selectTime(this.reservationForm.get('time')?.value);
    this.selectArea(this.reservationForm.get('areaId')?.value);
  }

  setupCalendar(): void {
    this.year = this.currentDate.getFullYear();
    this.month = this.currentDate.toLocaleString('default', { month: 'long' });
    const monthIndex = this.currentDate.getMonth();
    const daysInMonth = new Date(this.year, monthIndex + 1, 0).getDate();
    this.days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const firstDay = new Date(this.year, monthIndex, 1).getDay();
    this.firstDayOffset = firstDay === 0 ? 6 : firstDay - 1;
  }

  generateAllPossibleTimes(): void {
    for (let h = 11; h < 23; h++) {
      for (let m = 0; m < 60; m += 15) {
        this.allPossibleTimes.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
      }
    }
  }

  selectGuests(num: number): void {
    this.reservationForm.patchValue({ guests: num });
    this.showMoreGuests = false;
  }

  selectArea(areaId: number | null): void {
    this.reservationForm.patchValue({ areaId: areaId });
    const selectedTime = this.reservationForm.get('time')?.value;
    if (selectedTime && !this.isTimeAvailableForSelectedArea(selectedTime)) {
      this.reservationForm.patchValue({ time: '' });
    }
  }

  selectDate(day: number): void {
    const monthStr = (this.currentDate.getMonth() + 1).toString().padStart(2, '0');
    const dayStr = day.toString().padStart(2, '0');
    this.reservationForm.patchValue({ date: `${this.year}-${monthStr}-${dayStr}` });
  }

  selectTime(time: string): void {
    this.reservationForm.patchValue({ time: time });
    const selectedAreaId = this.reservationForm.get('areaId')?.value;
    if (selectedAreaId !== null && !this.isAreaAvailableForSelectedTime(selectedAreaId)) {
      this.reservationForm.patchValue({ areaId: null });
    }
  }

  nextStep(): void { if (this.canProceed()) this.currentStep++; }
  prevStep(): void { if (this.currentStep > 1) this.currentStep--; }

  canProceed(): boolean {
    switch (this.currentStep) {
      case 1: return this.reservationForm.get('guests')?.valid ?? false;
      case 2: return true;
      case 3: return this.reservationForm.get('date')?.valid ?? false;
      case 4: return this.reservationForm.get('time')?.valid ?? false;
      default: return true;
    }
  }

  isTimeAvailable(time: string): boolean {
    return this.dailyAvailability.some(slot => slot.time.startsWith(time));
  }

  isAreaAvailableForSelectedTime(areaId: number | null): boolean {
    const selectedTime = this.reservationForm.get('time')?.value;
    if (!selectedTime) {
      return true;
    }

    if (areaId === null) {
      return this.dailyAvailability.some(slot => slot.time.startsWith(selectedTime));
    }

    const timeSlot = this.dailyAvailability.find(slot => slot.time.startsWith(selectedTime));
    return !!timeSlot && timeSlot.availableAreaIds.includes(areaId);
  }
  isTimeAvailableForSelectedArea(time: string): boolean {
    const selectedAreaId = this.reservationForm.get('areaId')?.value;
    if (selectedAreaId === null) return this.isTimeAvailable(time);
    const timeSlot = this.dailyAvailability.find(slot => slot.time.startsWith(time));
    return !!timeSlot && timeSlot.availableAreaIds.includes(selectedAreaId);
  }

  get formattedGuests(): string {
    const guests = this.reservationForm.value.guests;
    return guests ? `${guests} ${guests > 1 ? 'people' : 'person'}` : 'People';
  }

  get selectedZoneLabel(): string {
    const areaId = this.reservationForm.value.areaId;
    if (areaId === null) return 'Any Zone';
    const area = this.allBookableAreas.find(a => a.id === areaId);
    return area ? area.areaName : 'Zone';
  }

  get formattedDate(): string {
    const date = this.reservationForm.value.date;
    if (!date) return 'Date';
    const d = new Date(date + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });
  }

  get formattedTime(): string {
    return this.reservationForm.value.time || 'Time';
  }


  onSubmit(): void {
    this.reservationForm.markAllAsTouched();

    if (this.reservationForm.invalid) {
      console.error('Form is invalid. Aborting submission.');
      Object.keys(this.reservationForm.controls).forEach(key => {
        const control = this.reservationForm.get(key);
        if (control && control.invalid) {
          console.error(`Control '${key}' is invalid. Errors:`, control.errors);
        }
      });
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
      areaId: formValue.areaId
    };

    this.reservationService.createReservation(payload).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.successMessage = `Reservation confirmed! Your ID is #${response.id}.`;
        this.reservationForm.reset({
          guests: 2,
          date: this.getTodayString(),
          areaId: null
        });
        this.currentStep = 1;
        this.fetchAvailability();
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || error.error || 'An error occurred. Please try again.';
      }
    });
  }

  hasError(controlName: string, errorName: string): boolean {
    const control = this.reservationForm.get(controlName);
    return !!(control?.hasError(errorName) && (control?.touched || (this.currentStep === 5 && control.invalid)));
  }

  private getTodayString(): string {
    const today = new Date();
    const y = today.getFullYear();
    const m = (today.getMonth() + 1).toString().padStart(2, '0');
    const d = today.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  private prettifySlug(slug: string): string {
    return slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  }
}
