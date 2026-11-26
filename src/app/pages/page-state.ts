import { Component, DestroyRef, Directive, inject, input, output, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, EMPTY, finalize, Observable } from 'rxjs';
import { ToastService } from '../components/toast/toast';

@Component({
  selector: 'sb-state',
  template: `@if (busy()) {
    <div class="skeleton" role="status" aria-label="Chargement"></div>
  } @else if (error()) {
    <div class="notice" role="alert">{{ error() }} <button class="quiet" (click)="retry.emit()">Réessayer</button></div>
  } @else { <ng-content /> }`
})
export class StateComponent {
  readonly busy = input.required<boolean>();
  readonly error = input.required<string>();
  readonly retry = output<void>();
}

@Directive()
export abstract class PageState {
  protected readonly destroyRef = inject(DestroyRef);
  protected readonly toast = inject(ToastService);
  protected readonly busy = signal(false);
  protected readonly saving = signal(false);
  protected readonly error = signal('');
  protected readonly actionError = signal('');

  protected read<T>(request: Observable<T>, success?: (value: T) => void) {
    this.error.set('');
    this.run(request, this.busy, this.error, success);
  }
  protected write<T>(request: Observable<T>, message: string, success?: (value: T) => void) {
    this.actionError.set('');
    this.run(request, this.saving, this.actionError, value => {
      this.toast.show(message);
      success?.(value);
    });
  }
  private run<T>(request: Observable<T>, pending: typeof this.busy, error: typeof this.error, success?: (value: T) => void) {
    pending.set(true);
    request.pipe(
      catchError((cause: unknown) => {
        error.set(cause instanceof Error && !(cause instanceof HttpErrorResponse)
          ? cause.message : 'Impossible de communiquer avec StudyBloom. Réessayez.');
        return EMPTY;
      }),
      takeUntilDestroyed(this.destroyRef),
      finalize(() => pending.set(false))
    ).subscribe(value => success?.(value));
  }
}
