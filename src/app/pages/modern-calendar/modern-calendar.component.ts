import { Component, Input, Output, EventEmitter, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

interface CalendarDay {
  date: Date;
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  isPast: boolean;
}

@Component({
  selector: 'app-modern-calendar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modern-calendar">
      <div class="calendar-header">
        <button type="button" class="nav-button" (click)="previousMonth()" [disabled]="!canNavigateToPrevious()">
          <i class="uil uil-angle-left"></i>
        </button>
        <h3 class="month-year">{{ currentMonthYear }}</h3>
        <button type="button" class="nav-button" (click)="nextMonth()">
          <i class="uil uil-angle-right"></i>
        </button>
      </div>

      <div class="calendar-weekdays">
        <div class="weekday" *ngFor="let day of weekdays">{{ day }}</div>
      </div>

      <div class="calendar-grid">
        <button
          type="button"
          *ngFor="let day of calendarDays"
          class="calendar-day"
          [ngClass]="{
            'other-month': !day.isCurrentMonth,
            'today': day.isToday,
            'selected': day.isSelected,
            'past': day.isPast
          }"
          [disabled]="day.isPast || !day.isCurrentMonth"
          (click)="selectDate(day)"
        >
          {{ day.day }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .modern-calendar {
      background: white;
      border-radius: 12px;
      padding: 28px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      max-width: 520px;
      width: 100%;
      margin: 0 auto;
    }

    .calendar-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 24px;
    }

    .nav-button {
      background: none;
      border: none;
      padding: 10px;
      border-radius: 8px;
      cursor: pointer;
      color: #6b7280;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
    }

    .nav-button:hover:not(:disabled) {
      background-color: #f3f4f6;
      color: #374151;
    }

    .nav-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .month-year {
      font-size: 20px;
      font-weight: 600;
      color: #1f2937;
      margin: 0;
    }

    .calendar-weekdays {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 4px;
      margin-bottom: 12px;
    }

    .weekday {
      text-align: center;
      font-size: 14px;
      font-weight: 600;
      color: #6b7280;
      padding: 12px 6px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .calendar-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 6px;
    }

    .calendar-day {
      aspect-ratio: 1;
      border: none;
      background: none;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      font-weight: 500;
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.2s ease;
      color: #374151;
      position: relative;
      min-height: 48px;
    }

    .calendar-day:hover:not(:disabled):not(.past) {
      background-color: #e5e7eb;
    }

    .calendar-day.other-month {
      color: #d1d5db;
    }

    .calendar-day.today {
      background-color: #dbeafe;
      color: #003087;
      font-weight: 600;
    }

    .calendar-day.selected {
      background-color: #003087;
      color: white;
      font-weight: 600;
    }

    .calendar-day.selected:hover {
      background-color: #00235c;
    }

    .calendar-day.past {
      color: #d1d5db;
      cursor: not-allowed;
    }

    .calendar-day:disabled {
      cursor: not-allowed;
    }

    .calendar-day.today.selected {
      background-color: #00235c;
    }
  `]
})
export class ModernCalendarComponent implements OnInit, OnChanges {
  @Input() selectedDate: Date | null = null;
  @Input() minDate: Date | null = null;
  @Output() dateSelected = new EventEmitter<Date>();

  currentDate = new Date();
  viewDate = new Date();
  calendarDays: CalendarDay[] = [];

  // English weekdays
  weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  ngOnInit() {
    this.generateCalendar();
  }

  ngOnChanges() {
    this.generateCalendar();
  }

  get currentMonthYear(): string {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return `${months[this.viewDate.getMonth()]} ${this.viewDate.getFullYear()}`;
  }

  private getDateString(date: Date): string {
    return date.getFullYear() + '-' +
      String(date.getMonth() + 1).padStart(2, '0') + '-' +
      String(date.getDate()).padStart(2, '0');
  }

  private getSelectedDateString(): string | null {
    if (!this.selectedDate) return null;
    return this.getDateString(this.selectedDate);
  }

  generateCalendar() {
    const year = this.viewDate.getFullYear();
    const month = this.viewDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);

    const dayOfWeek = (firstDay.getDay() + 6) % 7;
    startDate.setDate(startDate.getDate() - dayOfWeek);

    const days: CalendarDay[] = [];
    const today = new Date();
    const todayString = this.getDateString(today);
    const selectedDateString = this.getSelectedDateString();

    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);

      const dateString = this.getDateString(date);
      const isCurrentMonth = date.getMonth() === month;
      const isToday = dateString === todayString;
      const isSelected = selectedDateString ? dateString === selectedDateString : false;

      const isPast = this.minDate ? date < this.minDate : date < today;

      days.push({
        date: new Date(date),
        day: date.getDate(),
        isCurrentMonth,
        isToday,
        isSelected,
        isPast
      });
    }

    this.calendarDays = days;
  }

  selectDate(day: CalendarDay) {
    if (day.isPast || !day.isCurrentMonth) return;

    this.selectedDate = day.date;
    this.dateSelected.emit(day.date);
    this.generateCalendar();
  }

  previousMonth() {
    this.viewDate.setMonth(this.viewDate.getMonth() - 1);
    this.generateCalendar();
  }

  nextMonth() {
    this.viewDate.setMonth(this.viewDate.getMonth() + 1);
    this.generateCalendar();
  }

  canNavigateToPrevious(): boolean {
    if (!this.minDate) return true;

    const prevMonth = new Date(this.viewDate);
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    prevMonth.setDate(1);

    const minMonth = new Date(this.minDate);
    minMonth.setDate(1);

    return prevMonth >= minMonth;
  }
}
