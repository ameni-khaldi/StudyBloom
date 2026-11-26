import { DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { localDate } from '../../models/study';
import { StudyService } from '../../services/study';
import { PageState, StateComponent } from '../page-state';

@Component({
  imports: [DatePipe, RouterLink, StateComponent],
  template: `
    <header class="page-head"><div><span class="eyebrow">MON PLANNING</span><h1>Calendrier</h1><p>Retrouve les échéances de tes tâches jour par jour.</p></div><button class="quiet" (click)="today()">Aujourd’hui</button></header>
    <sb-state [busy]="busy()" [error]="error()" (retry)="load()">
      <section class="card">
        <div class="row month"><button class="quiet" aria-label="Mois précédent" (click)="move(-1)">←</button><h2>{{ month() | date:'MMMM yyyy' }}</h2><button class="quiet" aria-label="Mois suivant" (click)="move(1)">→</button></div>
        <div class="calendar">
          @for (day of weekdays; track day) { <strong>{{ day }}</strong> }
          @for (day of days(); track day.key) { @if (day.date) {
            <button [class.active]="selected() === day.key" [attr.aria-pressed]="selected() === day.key" [attr.aria-label]="day.key + ' · ' + count(day.key) + ' tâches'" (click)="selected.set(day.key)">{{ day.date }} @if (count(day.key); as total) { <span>{{ total }}</span> }</button>
          } @else { <div></div> } }
        </div>
      </section>
      <section class="card day"><h2>{{ selected() | date:'longDate' }}</h2>
        @for (task of daily(); track task.id) { <p><a [routerLink]="['/tasks', task.id]">{{ task.title }}</a></p> } @empty { <p class="muted">Aucune échéance ce jour.</p> }
      </section>
    </sb-state>`
})
export class CalendarPage extends PageState implements OnInit {
  private readonly study = inject(StudyService);
  protected readonly weekdays = ['Lun.', 'Mar.', 'Mer.', 'Jeu.', 'Ven.', 'Sam.', 'Dim.'];
  protected readonly month = signal(new Date());
  protected readonly selected = signal(localDate());
  protected readonly daily = computed(() => this.study.tasks.items().filter(task => task.dueDate === this.selected()));
  protected readonly days = computed(() => {
    const year = this.month().getFullYear();
    const month = this.month().getMonth();
    const offset = (new Date(year, month, 1).getDay() + 6) % 7;
    return [
      ...Array.from({ length: offset }, (_, index) => ({ key: 'blank-' + index, date: 0 })),
      ...Array.from({ length: new Date(year, month + 1, 0).getDate() }, (_, index) => ({
        key: localDate(new Date(year, month, index + 1)), date: index + 1
      }))
    ];
  });
  ngOnInit() { this.load(); }
  protected load() { this.read(this.study.load()); }
  protected count(date: string) { return this.study.tasks.items().filter(task => task.dueDate === date).length; }
  protected move(direction: number) {
    const date = new Date(this.month().getFullYear(), this.month().getMonth() + direction, 1);
    this.month.set(date); this.selected.set(localDate(date));
  }
  protected today() { this.month.set(new Date()); this.selected.set(localDate()); }
}
