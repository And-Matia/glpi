import { Injectable, signal } from '@angular/core';

export type ToastVariant = 'success' | 'danger' | 'warning' | 'info';

export interface Toast {
  id: number;
  message: string;
  variant: ToastVariant;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly toasts = signal<Toast[]>([]);
  private next = 0;

  show(message: string, variant: ToastVariant = 'info', duration = 3500): void {
    const id = ++this.next;
    this.toasts.update(list => [...list, { id, message, variant }]);
    setTimeout(() => this.dismiss(id), duration);
  }

  success(message: string) { this.show(message, 'success'); }
  error(message: string)   { this.show(message, 'danger');  }
  warning(message: string) { this.show(message, 'warning'); }
  info(message: string)    { this.show(message, 'info');    }

  dismiss(id: number): void {
    this.toasts.update(list => list.filter(t => t.id !== id));
  }
}
