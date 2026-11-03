import { Injectable, inject, DestroyRef, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ToastService } from './toast.service';
import {
  Observable,
  ReplaySubject,
  timer,
  exhaustMap,
  take,
  takeWhile,
  tap,
  timeout,
  catchError,
  of,
} from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ApiWakeService {
  private readonly http = inject(HttpClient);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly _isAwake = signal(false);
  private readonly _isWaking = signal(false);
  private readonly _isSlowWake = signal(false);

  readonly isAwake = this._isAwake.asReadonly();
  readonly isWaking = this._isWaking.asReadonly();
  readonly isSlowWake = this._isSlowWake.asReadonly();

  private wakeResult$: Observable<boolean> | null = null;
  private cleanupCurrentWake: (() => void) | null = null;

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.cleanupCurrentWake?.();
    });
  }

  wake(): Observable<boolean> {
    if (this.wakeResult$) {
      return this.wakeResult$;
    }

    let bannerShown = false;
    let toastId: string | null = null;
    let resolved = false;
    const resultSubject = new ReplaySubject<boolean>(1);
    this.wakeResult$ = resultSubject.asObservable();

    this._isAwake.set(false);
    this._isWaking.set(true);
    this._isSlowWake.set(false);

    const slowTimer = setTimeout(() => {
      if (!resolved) {
        bannerShown = true;
        this._isSlowWake.set(true);
        toastId = this.toast.show(
          'Väcker servern, det kan ta upp till en minut…',
          'info',
          false
        );
      }
    }, 2000);

    const cleanup = (): void => {
      clearTimeout(slowTimer);
      if (bannerShown && toastId) {
        this.toast.dismiss(toastId);
        toastId = null;
        bannerShown = false;
      }
      this._isWaking.set(false);
      this._isSlowWake.set(false);
      this.wakeResult$ = null;
      this.cleanupCurrentWake = null;
    };

    this.cleanupCurrentWake = cleanup;

    timer(0, 3000)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        take(30),
        exhaustMap(() =>
          this.http.get('/api/health').pipe(
            timeout(10000),
            catchError(() => of(null))
          )
        ),
        tap(res => {
          if (res !== null) {
            resolved = true;
            this._isAwake.set(true);
            cleanup();
            resultSubject.next(true);
            resultSubject.complete();
          }
        }),
        takeWhile(res => res === null)
      )
      .subscribe({
        complete: () => {
          if (!resolved) {
            cleanup();
            resultSubject.next(false);
            resultSubject.complete();
          }
        },
      });

    return resultSubject.asObservable();
  }

  waitUntilAwake(): Observable<boolean> {
    if (this._isAwake()) {
      return of(true);
    }
    if (this.wakeResult$) {
      return this.wakeResult$;
    }
    return of(true);
  }

  wakeAndWait(): Observable<boolean> {
    this._isAwake.set(false);
    return this.wake();
  }
}
