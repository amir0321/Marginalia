import { HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { LoadingService } from './loading.service';

export const loadingInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const isTracked = req.url.startsWith('/api') && !req.url.startsWith('/api/health');

  if (!isTracked) {
    return next(req);
  }

  const loadingService = inject(LoadingService);
  loadingService.start();

  return next(req).pipe(
    finalize(() => {
      loadingService.stop();
    })
  );
};
