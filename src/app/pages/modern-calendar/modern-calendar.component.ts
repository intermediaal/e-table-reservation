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
  templateUrl: './modern-calendar.component.html',
  styleUrls: ['./modern-calendar.component.scss']
})


export class ModernCalendarComponent implements OnInit, OnChanges {
  @Input() selectedDate: Date | null = null;
  @Input() minDate: Date | null = null;
  @Output() dateSelected = new EventEmitter<Date>();

  currentDate = new Date();
  viewDate = new Date();
  calendarDays: CalendarDay[] = [];

  weekdays = ['Hën', 'Mar', 'Mër', 'Enj', 'Pre', 'Sht', 'Die'];

  ngOnInit() {
    this.generateCalendar();
  }

  ngOnChanges() {
    this.generateCalendar();
  }

  get currentMonthYear(): string {
    const months = [
      'Janar', 'Shkurt', 'Mars', 'Prill', 'Maj', 'Qershor',
      'Korrik', 'Gusht', 'Shtator', 'Tetor', 'Nëntor', 'Dhjetor'
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
