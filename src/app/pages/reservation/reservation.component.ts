import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { debounceTime, distinctUntilChanged, filter } from 'rxjs/operators';
import { ReservationService, ReservationRequest, Area, AvailableTimeSlot } from '../../services/reservation.service';
import { ReservationDataService } from '../../services/reservation-data.service';
import {ModernCalendarComponent} from "../modern-calendar/modern-calendar.component";
import {ReservationSettings, ReservationSettingsService} from "../../services/reservation-settings.service";


@Component({
  selector: 'app-reservation',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule, RouterModule, ModernCalendarComponent],
  providers: [ReservationService, ReservationDataService],
  templateUrl: './reservation.component.html',
  styleUrls: ['./reservation.component.scss']
})
export class ReservationComponent implements OnInit {
  private readonly baseUrl = 'http://localhost:3030';

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

  minDate: string;
  reservationSettings: ReservationSettings | null = null;

  currentDate = new Date();
  year = 0;
  month = '';
  days: number[] = [];
  firstDayOffset = 0;
  allPossibleTimes: string[] = [];
  constructor(
    private fb: FormBuilder,
    private reservationService: ReservationService,
    private reservationSettingsService: ReservationSettingsService, // <-- Inject the new service
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
        this.setupCalendar();

        this.loadBusinessSettings();
        this.loadAllBookableAreas();
        this.listenForAvailabilityChanges();
      } else {
        this.errorMessage = "Business not specified in the URL.";
      }
    });
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
      for (let m = 0; m < 60; m += 30) {
        this.allPossibleTimes.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
      }
    }
  }
  loadBusinessSettings(): void {
    if (!this.businessSlug) return;
    this.reservationSettingsService.getSettings(this.businessSlug).subscribe(settings => {
      this.reservationSettings = settings;

      if (!settings.config.isActive) {
        this.errorMessage = "We are sorry, but this restaurant is not currently accepting online reservations.";
        return;
      }

      this.fetchAvailability();
    });
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

  isDayClosed(day: number): boolean {
    if (!this.reservationSettings) return true;

    const dateToCheck = new Date(this.year, this.currentDate.getMonth(), day);
    const dayName = dateToCheck.toLocaleString('en-US', { weekday: 'long' }).toUpperCase();

    const dayHours = this.reservationSettings.hours.find(h => h.dayOfWeek.toUpperCase() === dayName);
    return dayHours ? dayHours.closed : true;
  }
  getSelectedDate(): Date | null {
    const dateValue = this.reservationForm.get('date')?.value;
    if (dateValue) {
      const [year, month, day] = dateValue.split('-').map(Number);
      return new Date(year, month - 1, day);
    }
    return null;
  }

  getMinDate(): Date {
    return new Date(this.minDate + 'T00:00:00');
  }

  onDateSelected(date: Date): void {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;

    this.reservationForm.patchValue({ date: dateString });
  }

  listenForAvailabilityChanges(): void {
    const guests$ = this.reservationForm.get('guests')?.valueChanges.pipe(debounceTime(400), distinctUntilChanged(), filter(val => val > 0));
    const date$ = this.reservationForm.get('date')?.valueChanges.pipe(distinctUntilChanged());

    if (guests$) guests$.subscribe(() => this.fetchAvailabilityIfReady());
    if (date$) date$.subscribe(() => this.fetchAvailabilityIfReady());
  }

  fetchAvailabilityIfReady(): void {
    const guests = this.reservationForm.get('guests')?.value;
    const date = this.reservationForm.get('date')?.value;
    if (guests && date && this.businessSlug) {
      this.fetchAvailability();
    }
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
    this.reservationService.getAvailability(date, guests, this.businessSlug).subscribe({
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
    const selectedTime = this.reservationForm.get('time')?.value;
    if (selectedTime && !this.isTimeAvailable(selectedTime)) {
      this.reservationForm.patchValue({ time: '' });
    }
    const selectedArea = this.reservationForm.get('areaId')?.value;
    if (selectedArea !== null && !this.isAreaAvailableForSelectedTime(selectedArea)) {
      this.reservationForm.patchValue({ areaId: null });
    }
  }

  // generateAllPossibleTimes(): void {
  //   for (let h = 11; h < 23; h++) {
  //     for (let m = 0; m < 60; m += 15) {
  //       this.allPossibleTimes.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
  //     }
  //   }
  // }

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

  selectTime(time: string): void {
    this.reservationForm.patchValue({ time: time });
    const selectedAreaId = this.reservationForm.get('areaId')?.value;
    if (selectedAreaId !== null && !this.isAreaAvailableForSelectedTime(selectedAreaId)) {
      this.reservationForm.patchValue({ areaId: null });
    }
  }

  nextStep(): void {
    if (this.canProceed()) {
      this.currentStep++;
      if (this.currentStep === 3) {
        this.fetchAvailabilityIfReady();
      }
    }
  }

  prevStep(): void {
    if (this.currentStep > 1) this.currentStep--;
  }

  canProceed(): boolean {
    switch (this.currentStep) {
      case 1: return this.reservationForm.get('guests')?.valid ?? false;
      case 2: return this.reservationForm.get('date')?.valid ?? false;
      case 3: return this.reservationForm.get('time')?.valid ?? false;
      case 4: return true; // Zone selection is optional
      default: return true;
    }
  }

  isTimeAvailable(time: string): boolean {
    return this.dailyAvailability.some(slot => slot.time.startsWith(time));
  }

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

  get formattedGuests(): string {
    const guests = this.reservationForm.value.guests;
    if (!guests) return 'Guests';
    return `${guests} ${guests > 1 ? 'people' : 'person'}`;
  }

  get formattedDate(): string {
    const date = this.reservationForm.value.date;
    if (!date) return 'Date';
    const d = new Date(date + 'T00:00:00');
    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
  }

  get formattedTime(): string {
    return this.reservationForm.value.time || 'Time';
  }

  get selectedZoneLabel(): string {
    const areaId = this.reservationForm.value.areaId;
    if (areaId === null) return 'Any Zone';
    const area = this.allBookableAreas.find(a => a.id === areaId);
    return area ? area.areaName : 'Zone';
  }

  onSubmit(): void {
    this.reservationForm.markAllAsTouched();
    if (this.reservationForm.invalid || !this.businessSlug) {
      console.error('Form is invalid or business slug is missing.');
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
      areaId: formValue.areaId,
      businessSlug: this.businessSlug
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
    return !!(control?.hasError(errorName) && (control?.touched || (this.currentStep === 5 && control.invalid)));
  }

  private getTodayString(): string {
    return new Date().toISOString().split('T')[0];
  }

  private prettifySlug(slug: string): string {
    return slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  }
}
