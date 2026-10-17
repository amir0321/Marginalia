import { Injectable, signal } from '@angular/core';
import { Toast } from './models';

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly toasts = signal<Toast[]>([]);

  show(message: string, type: Toast['type'] = 'info', autohide = true): string {
    const id = crypto.randomUUID();
    this.toasts.update(list => [...list, { id, message, type, autohide }]);
    if (autohide) {
      setTimeout(() => this.dismiss(id), 5000);
    }
    return id;
  }

  dismiss(id: string): void {
    this.toasts.update(list => list.filter(t => t.id !== id));
  }
}
