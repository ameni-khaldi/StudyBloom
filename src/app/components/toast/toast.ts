import { Component, inject, Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly message = signal('');
  private timer?: ReturnType<typeof setTimeout>;
  show(message: string) {
    clearTimeout(this.timer);
    this.message.set(message);
    this.timer = setTimeout(() => this.message.set(''), 4500);
  }
}

@Component({
  selector: 'sb-toast',
  template: `<div class="toast-region" role="status">@if (toast.message()) { <div class="toast">{{ toast.message() }}</div> }</div>`
})
export class ToastComponent { protected readonly toast = inject(ToastService); }
