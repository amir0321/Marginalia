import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ToastService } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ToastService);
  });

  it('should be created with an empty toast list', () => {
    expect(service).toBeTruthy();
    expect(service.toasts()).toEqual([]);
  });

  it('should add a toast with default type and return an id', () => {
    const id = service.show('Bok sparad', 'success', false);
    expect(id).toBeTruthy();
    expect(service.toasts().length).toBe(1);
    expect(service.toasts()[0]).toEqual({
      id,
      message: 'Bok sparad',
      type: 'success',
      autohide: false
    });
  });

  it('should dismiss a toast by id', () => {
    const id1 = service.show('Första meddelandet', 'info', false);
    const id2 = service.show('Andra meddelandet', 'danger', false);
    expect(service.toasts().length).toBe(2);

    service.dismiss(id1);
    expect(service.toasts().length).toBe(1);
    expect(service.toasts()[0].id).toBe(id2);
  });

  it('should automatically dismiss toast after 5000ms when autohide is true', fakeAsync(() => {
    service.show('Automatiskt meddelande', 'info', true);
    expect(service.toasts().length).toBe(1);

    tick(4999);
    expect(service.toasts().length).toBe(1);

    tick(1);
    expect(service.toasts().length).toBe(0);
  }));

  it('should support toast with an action callback', () => {
    let actionTriggered = false;
    const id = service.show('Bok raderad', 'success', false, {
      label: 'Ångra',
      onClick: () => { actionTriggered = true; },
    });

    const toast = service.toasts().find(t => t.id === id);
    expect(toast?.action?.label).toBe('Ångra');

    toast?.action?.onClick();
    expect(actionTriggered).toBeTrue();
  });
});
