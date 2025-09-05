import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModernCalendarComponent } from './modern-calendar.component';

describe('ModernCalendarComponent', () => {
  let component: ModernCalendarComponent;
  let fixture: ComponentFixture<ModernCalendarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModernCalendarComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ModernCalendarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
