import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { loadingInterceptor } from './loading.interceptor';
import { LoadingService } from './loading.service';

describe('loadingInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let loadingSpy: jasmine.SpyObj<LoadingService>;

  beforeEach(() => {
    loadingSpy = jasmine.createSpyObj<LoadingService>('LoadingService', ['start', 'stop']);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([loadingInterceptor])),
        provideHttpClientTesting(),
        { provide: LoadingService, useValue: loadingSpy },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should call start and stop for /api endpoints on success', () => {
    http.get('/api/books').subscribe();

    expect(loadingSpy.start).toHaveBeenCalledTimes(1);
    expect(loadingSpy.stop).not.toHaveBeenCalled();

    const req = httpMock.expectOne('/api/books');
    req.flush([]);

    expect(loadingSpy.stop).toHaveBeenCalledTimes(1);
  });

  it('should call start and stop for /api endpoints on error', () => {
    http.get('/api/books/1').subscribe({ error: () => {} });

    expect(loadingSpy.start).toHaveBeenCalledTimes(1);
    expect(loadingSpy.stop).not.toHaveBeenCalled();

    const req = httpMock.expectOne('/api/books/1');
    req.flush('Not Found', { status: 404, statusText: 'Not Found' });

    expect(loadingSpy.stop).toHaveBeenCalledTimes(1);
  });

  it('should ignore /api/health and not call start or stop', () => {
    http.get('/api/health').subscribe();

    expect(loadingSpy.start).not.toHaveBeenCalled();

    const req = httpMock.expectOne('/api/health');
    req.flush({ status: 'ok' });

    expect(loadingSpy.stop).not.toHaveBeenCalled();
  });

  it('should ignore non-/api requests and not call start or stop', () => {
    http.get('/assets/i18n/sv.json').subscribe();

    expect(loadingSpy.start).not.toHaveBeenCalled();

    const req = httpMock.expectOne('/assets/i18n/sv.json');
    req.flush({});

    expect(loadingSpy.stop).not.toHaveBeenCalled();
  });

  it('should track multiple concurrent requests', () => {
    http.get('/api/books').subscribe();
    http.get('/api/quotes').subscribe();

    expect(loadingSpy.start).toHaveBeenCalledTimes(2);

    const req1 = httpMock.expectOne('/api/books');
    const req2 = httpMock.expectOne('/api/quotes');

    req1.flush([]);
    expect(loadingSpy.stop).toHaveBeenCalledTimes(1);

    req2.flush([]);
    expect(loadingSpy.stop).toHaveBeenCalledTimes(2);
  });
});
