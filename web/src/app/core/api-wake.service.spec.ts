import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApiWakeService } from './api-wake.service';
import { ToastService } from './toast.service';

describe('ApiWakeService', () => {
  let service: ApiWakeService;
  let httpMock: HttpTestingController;
  let toastSpy: jasmine.SpyObj<ToastService>;

  beforeEach(() => {
    toastSpy = jasmine.createSpyObj('ToastService', ['show', 'dismiss']);
    toastSpy.show.and.returnValue('wake-toast-id');

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        ApiWakeService,
        { provide: ToastService, useValue: toastSpy },
      ],
    });

    service = TestBed.inject(ApiWakeService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should call GET /api/health immediately (at 0 ms) with relative URL', fakeAsync(() => {
    service.wake();
    tick(0);

    const req = httpMock.expectOne('/api/health');
    expect(req.request.method).toBe('GET');

    req.flush({ status: 'ok' });
    tick(2500);

    expect(toastSpy.show).not.toHaveBeenCalled();
  }));

  it('should not show toast banner if server responds quickly within 2000 ms', fakeAsync(() => {
    service.wake();
    tick(0);

    const req = httpMock.expectOne('/api/health');
    tick(500);
    req.flush({ status: 'ok' });

    tick(3000);

    expect(toastSpy.show).not.toHaveBeenCalled();
    expect(toastSpy.dismiss).not.toHaveBeenCalled();
  }));

  it('should show waking banner if no response within 2000 ms, and dismiss it when healthy', fakeAsync(() => {
    service.wake();
    tick(0);

    const req = httpMock.expectOne('/api/health');

    tick(2000);
    expect(toastSpy.show).toHaveBeenCalledWith(
      'Väcker servern, det kan ta upp till en minut…',
      'info',
      false
    );

    req.flush({ status: 'ok' });

    expect(toastSpy.dismiss).toHaveBeenCalledWith('wake-toast-id');
  }));

  it('should retry every 3000 ms if health ping errors or times out', fakeAsync(() => {
    service.wake();
    tick(0);

    const req1 = httpMock.expectOne('/api/health');
    req1.error(new ProgressEvent('error'));

    tick(2000);
    expect(toastSpy.show).toHaveBeenCalledWith(
      'Väcker servern, det kan ta upp till en minut…',
      'info',
      false
    );

    tick(1000); // 3000 ms total: second retry triggers
    const req2 = httpMock.expectOne('/api/health');
    expect(req2.request.method).toBe('GET');
    req2.flush({ status: 'ok' });

    expect(toastSpy.dismiss).toHaveBeenCalledWith('wake-toast-id');
  }));

  it('should dismiss banner when injector is destroyed before health check resolves', fakeAsync(() => {
    service.wake();
    tick(0);

    const req = httpMock.expectOne('/api/health');
    tick(2000);
    expect(toastSpy.show).toHaveBeenCalled();

    TestBed.resetTestingModule();

    expect(toastSpy.dismiss).toHaveBeenCalledWith('wake-toast-id');
  }));
});
