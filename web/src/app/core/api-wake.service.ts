import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ToastService } from './toast.service';
import { interval, switchMap, takeWhile, timeout, catchError, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ApiWakeService {
  private readonly http = inject(HttpClient);
  private readonly toast = inject(ToastService);

  wake(): void {
    let bannerShown = false;
    let toastId: string | null = null;
    let resolved = false;

    const slowTimer = setTimeout(() => {
      if (!resolved) {
        bannerShown = true;
        toastId = this.toast.show(
          'Väcker servern, det kan ta upp till en minut…',
          'info',
          false
        );
      }
    }, 2000);

    interval(3000)
      .pipe(
        takeWhile(() => !resolved),
        switchMap(() =>
          this.http.get('/api/health').pipe(
            timeout(3000),
            catchError(() => of(null))
          )
        ),
        takeWhile((_, index) => index < 30)
      )
      .subscribe({
        next: res => {
          if (res !== null) {
            resolved = true;
            clearTimeout(slowTimer);
            if (bannerShown && toastId) {
              this.toast.dismiss(toastId);
            }
          }
        },
      });
  }
}
