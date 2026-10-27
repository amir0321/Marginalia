import { TestBed } from '@angular/core/testing';
import { LoadingService } from './loading.service';

describe('LoadingService', () => {
  let service: LoadingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LoadingService);
  });

  it('should be created and have initial isLoading false', () => {
    expect(service).toBeTruthy();
    expect(service.isLoading()).toBeFalse();
  });

  it('should set isLoading to true when start is called', () => {
    service.start();
    expect(service.isLoading()).toBeTrue();
  });

  it('should remain true when multiple starts are called until all are stopped', () => {
    service.start();
    service.start();
    expect(service.isLoading()).toBeTrue();

    service.stop();
    expect(service.isLoading()).toBeTrue();

    service.stop();
    expect(service.isLoading()).toBeFalse();
  });

  it('should not let active request count drop below zero', () => {
    service.stop();
    expect(service.isLoading()).toBeFalse();

    service.start();
    expect(service.isLoading()).toBeTrue();

    service.stop();
    expect(service.isLoading()).toBeFalse();
  });

  it('should reset active requests to zero', () => {
    service.start();
    service.start();
    expect(service.isLoading()).toBeTrue();

    service.reset();
    expect(service.isLoading()).toBeFalse();
  });
});
