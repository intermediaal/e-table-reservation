
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { debounceTime, distinctUntilChanged, filter } from 'rxjs/operators';
import { ReservationService, ReservationRequest, Area, AvailableTimeSlot } from '../../services/reservation.service';
import { ReservationDataService } from '../../services/reservation-data.service';

@Component({
  selector: 'app-reservation',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule, RouterModule],
  providers: [ReservationService, ReservationDataService],
  templateUrl: './reservation.component.html',
  styleUrls: ['./reservation.component.scss']
})
export class ReservationComponent implements OnInit {
  reservationForm: FormGroup;

  isLoading = false;
  isAvailabilityLoading = false;
  successMessage: string | null = null;
  errorMessage: string | null = null;
  currentStep = 1;
  showMoreGuests = false;

  businessSlug: string | null = null;
  businessName: string = 'our Restaurant';
  allBookableAreas: Area[] = [];
  dailyAvailability: AvailableTimeSlot[] = [];
  allPossibleTimes: string[] = [];
  minDate: string;

  constructor(
    private fb: FormBuilder,
    private reservationService: ReservationService,
    private route: ActivatedRoute,
    private router: Router,
    private reservationDataService: ReservationDataService
  ) {
    const today = new Date();
    this.minDate = today.toISOString().split('T')[0];

    this.reservationForm = this.fb.group({
      guests: [2, [Validators.required, Validators.min(1)]],
      date: [this.getTodayString(), Validators.required],
      time: ['', Validators.required],
      areaId: [null],
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
        this.listenForAvailabilityChanges();
        this.fetchAvailability();
      } else {
        this.errorMessage = "Business not specified. Please check the URL.";
      }
    });
  }

  listenForAvailabilityChanges(): void {
    const guests$ = this.reservationForm.get('guests')?.valueChanges.pipe(debounceTime(400), distinctUntilChanged(), filter(val => val > 0));
    const date$ = this.reservationForm.get('date')?.valueChanges.pipe(distinctUntilChanged());

    if (guests$) guests$.subscribe(() => this.fetchAvailability());
    if (date$) date$.subscribe(() => this.fetchAvailability());
  }

  loadAllBookableAreas(): void {
    if (!this.businessSlug) return;
    this.reservationService.getAvailableAreas(this.businessSlug).subscribe(areas => { this.allBookableAreas = areas; });
  }

  fetchAvailability(): void {
    const guests = this.reservationForm.get('guests')?.value;
    const date = this.reservationForm.get('date')?.value;
    if (!guests || !date || !this.businessSlug) { this.dailyAvailability = []; return; }

    this.isAvailabilityLoading = true;
    this.reservationService.getAvailability(date, guests).subscribe({
      next: (availability) => {
        this.dailyAvailability = availability;
        this.isAvailabilityLoading = false;
        this.validateAndUpdateSelections();
      },
      error: () => { this.isAvailabilityLoading = false; this.errorMessage = "Could not fetch availability."; }
    });
  }

  validateAndUpdateSelections(): void {
    const selectedTime = this.reservationForm.get('time')?.value;
    if (selectedTime && !this.isTimeAvailable(selectedTime)) { this.reservationForm.patchValue({ time: '' }); }
    const selectedArea = this.reservationForm.get('areaId')?.value;
    if (selectedArea !== null && !this.isAreaAvailableForSelectedTime(selectedArea)) { this.reservationForm.patchValue({ areaId: null }); }
  }

  generateAllPossibleTimes(): void {
    for (let h = 11; h < 23; h++) {
      for (let m = 0; m < 60; m += 15) { this.allPossibleTimes.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`); }
    }
  }

  selectGuests(num: number): void { this.reservationForm.patchValue({ guests: num }); this.showMoreGuests = false; }
  selectArea(areaId: number | null): void {
    this.reservationForm.patchValue({ areaId: areaId });
    const selectedTime = this.reservationForm.get('time')?.value;
    if (selectedTime && !this.isTimeAvailableForSelectedArea(selectedTime)) { this.reservationForm.patchValue({ time: '' }); }
  }
  selectTime(time: string): void {
    this.reservationForm.patchValue({ time: time });
    const selectedAreaId = this.reservationForm.get('areaId')?.value;
    if (selectedAreaId !== null && !this.isAreaAvailableForSelectedTime(selectedAreaId)) { this.reservationForm.patchValue({ areaId: null }); }
  }

  nextStep(): void { if (this.canProceed()) this.currentStep++; }
  prevStep(): void { if (this.currentStep > 1) this.currentStep--; }

  canProceed(): boolean {
    switch (this.currentStep) {
      case 1: return (this.reservationForm.get('guests')?.valid && this.reservationForm.get('date')?.valid) ?? false;
      case 2: return this.reservationForm.get('time')?.valid ?? false;
      case 3: return true;
      default: return true;
    }
  }

  isTimeAvailable(time: string): boolean { return this.dailyAvailability.some(slot => slot.time.startsWith(time)); }
  isAreaAvailableForSelectedTime(areaId: number | null): boolean {
    const selectedTime = this.reservationForm.get('time')?.value;
    if (!selectedTime) return true;
    if (areaId === null) return this.dailyAvailability.some(slot => slot.time.startsWith(selectedTime));
    const timeSlot = this.dailyAvailability.find(slot => slot.time.startsWith(selectedTime));
    return !!timeSlot && timeSlot.availableAreaIds.includes(areaId);
  }
  isTimeAvailableForSelectedArea(time: string): boolean {
    const selectedAreaId = this.reservationForm.get('areaId')?.value;
    if (selectedAreaId === null) return this.isTimeAvailable(time);
    const timeSlot = this.dailyAvailability.find(slot => slot.time.startsWith(time));
    return !!timeSlot && timeSlot.availableAreaIds.includes(selectedAreaId);
  }

  get formattedGuestsAndDate(): string {
    const guests = this.reservationForm.value.guests;
    const date = this.reservationForm.value.date;
    if (!guests || !date) return 'Details';
    const d = new Date(date + 'T00:00:00');
    const dateStr = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
    return `${guests} ${guests > 1 ? 'people' : 'person'}, ${dateStr}`;
  }
  get formattedTime(): string { return this.reservationForm.value.time || 'Time'; }
  get selectedZoneLabel(): string {
    const areaId = this.reservationForm.value.areaId;
    if (areaId === null) return 'Any Zone';
    const area = this.allBookableAreas.find(a => a.id === areaId);
    return area ? area.areaName : 'Zone';
  }

  onSubmit(): void {
    this.reservationForm.markAllAsTouched();
    if (this.reservationForm.invalid) { return; }

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

        const token = response.viewToken;
        this.router.navigate(['/view-reservation', token]);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || error.error || 'An error occurred. Please try again.';
      }
    });
  }

  hasError(controlName: string, errorName: string): boolean {
    const control = this.reservationForm.get(controlName);
    return !!(control?.hasError(errorName) && (control?.touched || (this.currentStep === 4 && control.invalid)));
  }

  private getTodayString(): string {
    return new Date().toISOString().split('T')[0];
  }
  private prettifySlug(slug: string): string {
    return slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  }
}
