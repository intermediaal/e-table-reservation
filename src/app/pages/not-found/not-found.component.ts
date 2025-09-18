import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Location } from '@angular/common';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="not-found-container text-center">
      <img src="assets/images/undraw_page-not-found_6wni (1).svg" alt="Not Found" class="not-found-img" />
      <h1 class="text-danger mt-4">Oops! Page Not Found</h1>
      <p class="mb-4">The page you're looking for doesn't exist or was moved.</p>
      <button (click)="goBack()" class="btn btn-primary btn-soft-primary waves-effect waves-light">
        <i class="bi bi-arrow-left me-2"></i>
        <span>We'll redirect you back</span>
      </button>
    </div>
  `,
  styles: [
    `
      .not-found-container {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        padding: 20px;
        background-color: #f8f9fa;
      }

      .not-found-img {
        max-width: 300px;
        width: 100%;
        margin-bottom: 20px;
      }

      .btn-soft-primary {
        background-color: rgba(91, 115, 232, .25);
        border-color: rgba(91, 115, 232, .25);
        color: #5b73e8;
      }

      .btn:hover {
        color: var(--bs-btn-hover-color);
        background-color: var(--bs-btn-hover-bg);
        border-color: var(--bs-btn-hover-border-color);
      }

      .text-danger {
        font-weight: 700;
        font-size: 2.5rem;
      }

      p {
        font-size: 1.1rem;
        color: #6c757d;
      }

      .bi-arrow-left {
        font-size: 1.2rem;
      }
    `
  ]
})
export class NotFoundComponent {
  constructor(private location: Location) {}

  goBack(): void {
    this.location.back();
  }
}
