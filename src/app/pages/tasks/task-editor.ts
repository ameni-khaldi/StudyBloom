import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { localDate, priorities, Priority, statuses, Task, TaskStatus } from '../../models/study';
import { DeadlinePipe } from '../../pipes/deadline';
import { StudyService } from '../../services/study';
import { futureDeadlineValidator } from '../../validators/deadline';
import { PageState, StateComponent } from '../page-state';

@Component({
  imports: [ReactiveFormsModule, RouterLink, DatePipe, DeadlinePipe, StateComponent],
  template: `
    <a routerLink="/tasks" class="back">← Mes tâches</a>
    <header class="page-head"><div><span class="eyebrow">PLANIFICATION</span><h1>{{ detail ? (task()?.title ?? 'Détail de la tâche') : id ? 'Modifier la tâche' : 'Nouvelle tâche' }}</h1></div></header>
    <sb-state [busy]="busy()" [error]="error()" (retry)="load()">
      @if (detail) {
        @if (task(); as item) { <section class="card form-card"><p>{{ item.description || 'Aucune description.' }}</p>
          <dl><dt>Matière</dt><dd>{{ subjectName(item.subjectId) }}</dd><dt>Statut</dt><dd>{{ statuses[item.status] }}</dd><dt>Priorité</dt><dd>{{ priorities[item.priority] }}</dd><dt>Échéance</dt><dd>{{ item.dueDate | date:'longDate' }} · {{ item.dueDate | deadline }}</dd></dl>
          <a class="primary" [routerLink]="['/tasks', item.id, 'edit']">Modifier</a>
        </section> }
      } @else if (!study.subjects.items().length) {
        <div class="empty">Ajoutez une matière avant de créer une tâche. <a routerLink="/subjects">Mes matières</a></div>
      } @else {
        <form class="card form-card" [formGroup]="form" (ngSubmit)="save()">
          <label>Titre <input formControlName="title">@if (form.controls.title.touched && form.controls.title.invalid) { <small>Saisissez un titre de 3 à 100 caractères.</small> }</label>
          <label>Matière <select formControlName="subjectId"><option value="">Choisir une matière</option>@for (subject of study.subjects.items(); track subject.id) { <option [value]="subject.id">{{ subject.name }}</option> }</select>@if (form.controls.subjectId.touched && form.controls.subjectId.invalid) { <small>Choisissez une matière.</small> }</label>
          <label>Description <textarea formControlName="description" rows="4"></textarea>@if (form.controls.description.touched && form.controls.description.invalid) { <small>La limite est de 500 caractères.</small> }</label>
          <label>Échéance <input type="date" formControlName="dueDate">@if (form.controls.dueDate.touched && form.controls.dueDate.invalid) { <small>Saisissez une date à partir d’aujourd’hui.</small> }</label>
          <div class="row"><label>Priorité <select formControlName="priority"><option value="low">Basse</option><option value="medium">Moyenne</option><option value="high">Haute</option></select></label>
          <label>Statut <select formControlName="status"><option value="todo">À faire</option><option value="in-progress">En cours</option><option value="done">Terminée</option></select></label></div>
          @if (actionError()) { <p class="notice" role="alert">{{ actionError() }}</p> }
          <button class="primary" [disabled]="form.invalid || saving()">Enregistrer</button>
        </form>
      }
    </sb-state>`
})
export class TaskEditor extends PageState implements OnInit {
  protected readonly study = inject(StudyService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  protected readonly id = this.route.snapshot.paramMap.get('id');
  protected readonly detail = this.route.snapshot.data['detail'] === true;
  protected readonly task = signal<Task | undefined>(undefined);
  protected readonly statuses = statuses;
  protected readonly priorities = priorities;
  private readonly fb = inject(FormBuilder).nonNullable;
  protected readonly form = this.fb.group({
    title: ['', [Validators.required, Validators.pattern(/\S/), Validators.minLength(3), Validators.maxLength(100)]],
    subjectId: ['', Validators.required],
    description: ['', Validators.maxLength(500)],
    dueDate: [localDate(), [Validators.required, futureDeadlineValidator()]],
    priority: this.fb.control<Priority>('medium'),
    status: this.fb.control<TaskStatus>('todo')
  });
  ngOnInit() { this.load(); }
  protected load() {
    this.read(this.study.load(), tasks => {
      if (!this.id) return;
      const task = tasks.find(item => item.id === this.id);
      if (!task) { this.error.set('Cette tâche est introuvable.'); return; }
      this.task.set(task);
      this.form.controls.dueDate.setValidators([Validators.required, futureDeadlineValidator(task.dueDate)]);
      this.form.patchValue(task);
    });
  }
  protected subjectName(id: string) { return this.study.subjects.items().find(item => item.id === id)?.name; }
  protected save() {
    if (this.form.invalid || this.saving()) return;
    const original = this.task();
    const value = this.form.getRawValue();
    if (!this.subjectName(value.subjectId)) return;
    const completedAt = value.status === 'done' ? original?.completedAt || new Date().toISOString() : '';
    const request = original ? this.study.tasks.update(original.id, { ...value, completedAt })
      : this.study.tasks.create({ ...value, completedAt, createdAt: new Date().toISOString() });
    this.write(request, original ? 'Tâche modifiée.' : 'Tâche créée.', task => void this.router.navigate(['/tasks', task.id]));
  }
}
