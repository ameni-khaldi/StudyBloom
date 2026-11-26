import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { catchError, debounceTime, distinctUntilChanged, EMPTY, finalize, startWith, Subject, switchMap } from 'rxjs';
import { FilterBarComponent } from '../../components/filter-bar/filter-bar';
import { TaskCardComponent } from '../../components/task-card/task-card';
import { statuses, Task, TaskStatus } from '../../models/study';
import { StudyService } from '../../services/study';
import { PageState, StateComponent } from '../page-state';

@Component({
  imports: [NgTemplateOutlet, RouterLink, FilterBarComponent, TaskCardComponent, StateComponent],
  template: `
    <header class="page-head"><div><span class="eyebrow">MON ORGANISATION</span><h1>Mes tâches</h1><p>Planifie tes échéances et suis ton avancement.</p></div><a class="primary" routerLink="/tasks/new">＋ Nouvelle tâche</a></header>
    <div class="toolbar card">
      <sb-filter-bar [(value)]="searchText" (valueChange)="search.setValue($event.trim())" />
      <select aria-label="Filtrer par matière" (change)="subject.set(subjectFilter.value)" #subjectFilter><option value="">Toutes les matières</option>@for (item of study.subjects.items(); track item.id) { <option [value]="item.id">{{ item.name }}</option> }</select>
      <select aria-label="Filtrer par statut" (change)="status.set(statusFilter.value)" #statusFilter><option value="">Tous les statuts</option>@for (key of keys; track key) { <option [value]="key">{{ statuses[key] }}</option> }</select>
      <select aria-label="Filtrer par priorité" (change)="priority.set(priorityFilter.value)" #priorityFilter><option value="">Toutes les priorités</option><option value="low">Basse</option><option value="medium">Moyenne</option><option value="high">Haute</option></select>
      <select aria-label="Trier par échéance" (change)="descending.set(order.value === 'desc')" #order><option value="asc">Échéance croissante</option><option value="desc">Échéance décroissante</option></select>
      <button type="button" class="quiet" [attr.aria-pressed]="kanban()" (click)="kanban.set(!kanban())">{{ kanban() ? 'Vue liste' : 'Vue Kanban' }}</button>
    </div>
    @if (actionError()) { <p class="notice" role="alert">{{ actionError() }}</p> }
    <sb-state [busy]="busy() || searching()" [error]="error() || searchError()" (retry)="load()">
      @if (kanban()) {
        <div class="kanban">
          @for (key of keys; track key) { <section><h2>{{ statuses[key] }}</h2>
            @for (task of byStatus(key); track task.id) { <ng-container [ngTemplateOutlet]="card" [ngTemplateOutletContext]="{ $implicit: task }" /> }
            @empty { <p class="empty">Aucune tâche dans cette colonne.</p> }
          </section> }
        </div>
      } @else {
        <div class="grid">
          @for (task of visible(); track task.id) { <ng-container [ngTemplateOutlet]="card" [ngTemplateOutletContext]="{ $implicit: task }" /> }
          @empty { <div class="empty">✿ Aucune tâche ne correspond à ces filtres.</div> }
        </div>
      }
    </sb-state>
    <ng-template #card let-task><sb-task-card [task]="task" [subject]="names().get(task.subjectId) ?? 'Matière'" [busy]="saving()" (edit)="edit($event)" (remove)="askRemove($event, confirmation)" (statusChange)="changeStatus(task, $event)" /></ng-template>
    <dialog #confirmation><h2>Supprimer cette tâche ?</h2><p>Cette action est définitive.</p>
      <div class="row"><button class="quiet" (click)="confirmation.close()">Annuler</button><button class="primary" [disabled]="saving()" (click)="remove(confirmation)">Supprimer</button></div>
    </dialog>
  `
})
export class TasksPage extends PageState implements OnInit {
  protected readonly study = inject(StudyService);
  private readonly router = inject(Router);
  protected readonly search = new FormControl('', { nonNullable: true });
  private readonly reloadSearch = new Subject<void>();
  protected readonly searchText = signal('');
  protected readonly searching = signal(false);
  protected readonly searchError = signal('');
  private readonly matches = signal<Task[]>([]);
  protected readonly subject = signal('');
  protected readonly status = signal('');
  protected readonly priority = signal('');
  protected readonly descending = signal(false);
  protected readonly kanban = signal(false);
  protected readonly keys: TaskStatus[] = ['todo', 'in-progress', 'done'];
  protected readonly statuses = statuses;
  protected readonly names = computed(() => new Map(this.study.subjects.items().map(item => [item.id, item.name])));
  protected readonly visible = computed(() => this.matches().filter(task =>
    (!this.subject() || task.subjectId === this.subject()) &&
    (!this.status() || task.status === this.status()) &&
    (!this.priority() || task.priority === this.priority())
  ).sort((a, b) => (this.descending() ? -1 : 1) * a.dueDate.localeCompare(b.dueDate)));
  private selectedId = '';

  ngOnInit() {
    this.reloadSearch.pipe(
      switchMap(() => this.search.valueChanges.pipe(debounceTime(300), startWith(this.search.value), distinctUntilChanged(),
        switchMap(query => {
          this.searching.set(true);
          this.searchError.set('');
          return this.study.tasks.query([...this.names().keys()], query).pipe(
            catchError(() => { this.searchError.set('Recherche indisponible.'); return EMPTY; }),
            finalize(() => this.searching.set(false))
          );
        })
      )),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(tasks => this.matches.set(tasks));
    this.load();
  }
  protected load() { this.read(this.study.load(), () => this.reloadSearch.next()); }
  protected byStatus(key: TaskStatus) { return this.visible().filter(task => task.status === key); }
  protected edit(id: string) { void this.router.navigate(['/tasks', id, 'edit']); }
  protected askRemove(id: string, dialog: HTMLDialogElement) { this.selectedId = id; dialog.showModal(); }
  protected remove(dialog: HTMLDialogElement) {
    this.write(this.study.tasks.remove(this.selectedId), 'Tâche supprimée.', () => this.reloadSearch.next());
    dialog.close();
  }
  protected changeStatus(task: Task, value: string) {
    const status = this.keys.find(key => key === value);
    if (!status || status === task.status) return;
    this.write(this.study.tasks.update(task.id, { status, completedAt: status === 'done' ? new Date().toISOString() : '' }), 'Statut mis à jour.', () => this.reloadSearch.next());
  }
}
