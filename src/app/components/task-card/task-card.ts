import { DatePipe } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { priorities, statuses, Task, TaskStatus } from '../../models/study';
import { DeadlinePipe } from '../../pipes/deadline';

@Component({
  selector: 'sb-task-card',
  imports: [RouterLink, DatePipe, DeadlinePipe],
  template: `
    <article class="card task">
      <div class="row"><span class="tag">{{ subject() }}</span><span [class]="'tag ' + task().priority">{{ priorities[task().priority] }}</span></div>
      <h3><a [routerLink]="['/tasks', task().id]">{{ task().title }}</a></h3>
      <p class="muted">{{ task().dueDate | date:'d MMM yyyy' }} · {{ task().status === 'done' ? 'Terminée' : (task().dueDate | deadline) }}</p>
      <div class="row">
        <select aria-label="Statut" [value]="task().status" [disabled]="busy()" (change)="requestStatus(statusSelect)" #statusSelect>
          @for (key of keys; track key) { <option [value]="key">{{ statuses[key] }}</option> }
        </select>
        <button type="button" class="quiet" [disabled]="busy()" (click)="edit.emit(task().id)">Modifier</button>
        <button type="button" class="quiet danger" [disabled]="busy()" (click)="remove.emit(task().id)">Supprimer</button>
      </div>
    </article>`
})
export class TaskCardComponent {
  readonly task = input.required<Task>();
  readonly subject = input.required<string>();
  readonly busy = input(false);
  readonly edit = output<string>();
  readonly remove = output<string>();
  readonly statusChange = output<string>();
  protected readonly statuses = statuses;
  protected readonly priorities = priorities;
  protected readonly keys: TaskStatus[] = ['todo', 'in-progress', 'done'];
  protected requestStatus(select: HTMLSelectElement) {
    const status = select.value;
    select.value = this.task().status;
    this.statusChange.emit(status);
  }
}
