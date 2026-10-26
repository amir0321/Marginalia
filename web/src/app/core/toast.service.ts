import { Injectable, signal } from '@angular/core';
import { Toast, ToastAction } from './models';

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly toasts = signal<Toast[]>([]);

  show(
    message: string,
    type: Toast['type'] = 'info',
    autohide = true,
    action?: ToastAction
  ): string {
    const id = crypto.randomUUID();
    const toast: Toast = { id, message, type, autohide };
    if (action) {
      toast.action = action;
    }
    this.toasts.update(list => [...list, toast]);
    if (autohide) {
      setTimeout(() => this.dismiss(id), 5000);
    }
    return id;
  }

  dismiss(id: string): void {
    this.toasts.update(list => list.filter(t => t.id !== id));
  }
}
