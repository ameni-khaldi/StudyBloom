import { DatePipe, PercentPipe, UpperCasePipe } from '@angular/common';
import { Component, computed, effect, inject, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { BloomGardenComponent } from '../../components/bloom-garden/bloom-garden';
import { localDate, priorities, statuses, TaskStatus } from '../../models/study';
import { AuthService } from '../../services/auth';
import { StudyService } from '../../services/study';
import { PageState, StateComponent } from '../page-state';

@Component({
  imports: [BloomGardenComponent, DatePipe, PercentPipe, UpperCasePipe, StateComponent, RouterLink],
  template: `
    <header class="page-head"><div><span class="eyebrow">{{ 'Mon espace étudiant' | uppercase }}</span><h1>{{ statistics ? 'Statistiques' : 'Bonjour, ' + firstName + ' !' }}</h1>
      <p>{{ statistics ? 'Suis tes progrès par matière, priorité et statut.' : 'Voici où tu en es dans tes études.' }}</p></div><a routerLink="/tasks/new" class="primary">＋ Nouvelle tâche</a></header>
    <sb-state [busy]="busy()" [error]="error()" (retry)="load()">
      @if (!statistics) { <section class="hero"><div><p class="eyebrow">TON TABLEAU DE BORD</p><h2>Fais fleurir<br>ta réussite.</h2><p>{{ study.tasks.remaining() }} tâches à terminer ce semestre.</p><a class="quiet" routerLink="/tasks">Voir mes tâches →</a></div>
        <svg viewBox="0 0 260 180" class="hero-bloom" aria-hidden="true"><path d="M130 151 Q148 118 130 80" fill="none" stroke="#568264" stroke-width="8"/><path d="M138 134 Q80 129 83 99 Q125 98 138 134M135 125 Q151 94 183 97 Q176 125 135 125" fill="#83ae90"/><ellipse cx="130" cy="153" rx="45" ry="9" fill="#e8ccb3"/><g fill="#e78479"><ellipse cx="130" cy="45" rx="19" ry="29"/><ellipse cx="102" cy="66" rx="18" ry="27" transform="rotate(-54 102 66)"/><ellipse cx="158" cy="66" rx="18" ry="27" transform="rotate(54 158 66)"/><ellipse cx="130" cy="90" rx="26" ry="16"/></g><circle cx="130" cy="68" r="19" fill="#ffdf9e"/><circle cx="124" cy="66" r="2" fill="#304b70"/><circle cx="136" cy="66" r="2" fill="#304b70"/><path d="M125 73Q130 78 135 73" stroke="#304b70" stroke-width="2" fill="none"/><path d="M65 49v17m-8-8h16m122 12v17m-8-8h16" stroke="#b65f55" stroke-width="2"/></svg></section> }
      <div class="metrics">
        @for (metric of metrics(); track metric.label) { <article class="card metric"><span>{{ metric.label }}</span><strong>{{ metric.value }}</strong></article> }
        <article class="card metric"><span>Progression</span><strong>{{ study.tasks.progress() | percent }}</strong></article>
      </div>
      @if (!study.tasks.items().length) { <p class="empty">✿ Ton jardin attend ses premières tâches. <a routerLink="/tasks/new">Créer une tâche</a></p> }
      <div class="dashboard-grid">
        <section class="card"><h2>Répartition des tâches</h2>
          @for (item of distribution(); track item.label) {
            <div class="chart-row"><div class="row"><span>{{ item.label }}</span><strong>{{ item.count }}</strong></div><progress max="1" [value]="item.share" [attr.aria-label]="item.label"></progress></div>
          }
          @if (statistics) { <h2>Priorités</h2>@for (item of byPriority(); track item.label) { <div class="row"><span>{{ item.label }}</span><strong>{{ item.count }}</strong></div> } }
        </section>
        <sb-bloom-garden [progress]="study.tasks.progress()" />
        <section class="card"><h2>Progression par matière</h2>
          @for (item of bySubject(); track item.id) { <div class="chart-row"><div class="row"><a [routerLink]="['/subjects', item.id]">{{ item.name }}</a><strong>{{ item.share | percent }}</strong></div><progress max="1" [value]="item.share" [attr.aria-label]="item.name"></progress></div> }
          @empty { <p class="muted">Aucune matière.</p> }
        </section>
        <section class="card"><h2>{{ statistics ? 'Tâches en retard' : 'Prochaines échéances' }}</h2>
          @for (task of statistics ? study.tasks.overdue() : upcoming(); track task.id) {
            <div class="chart-row row"><a [routerLink]="['/tasks', task.id]">{{ task.title }}</a><span class="tag">{{ task.dueDate | date:'d MMM' }}</span></div>
          } @empty { <p class="muted">Aucune tâche à afficher.</p> }
        </section>
      </div>
    </sb-state>`
})
export class DashboardPage extends PageState implements OnInit {
  protected readonly study = inject(StudyService);
  protected readonly statistics = inject(ActivatedRoute).snapshot.data['statistics'] === true;
  protected readonly firstName = inject(AuthService).currentUser()?.name.split(' ')[0] ?? 'étudiant';
  protected readonly upcoming = computed(() => this.study.tasks.items().filter(task => task.status !== 'done' && task.dueDate >= localDate()).slice(0, 5));
  protected readonly metrics = computed(() => [
    { label: 'Matières', value: this.study.subjects.items().length },
    { label: 'Tâches', value: this.study.tasks.items().length },
    { label: 'Terminées', value: this.study.tasks.done() },
    { label: 'En cours', value: this.study.tasks.items().filter(task => task.status === 'in-progress').length },
    { label: 'En retard', value: this.study.tasks.overdue().length }
  ]);
  protected readonly distribution = computed(() => (Object.keys(statuses) as TaskStatus[]).map(key => {
    const tasks = this.study.tasks.items();
    const count = tasks.filter(task => task.status === key).length;
    return { label: statuses[key], count, share: tasks.length ? count / tasks.length : 0 };
  }));
  protected readonly byPriority = computed(() => Object.entries(priorities).map(([key, label]) => ({
    label, count: this.study.tasks.items().filter(task => task.priority === key).length
  })));
  protected readonly bySubject = computed(() => this.study.subjects.items().map(subject => {
    const tasks = this.study.tasks.items().filter(task => task.subjectId === subject.id);
    return { ...subject, share: tasks.length ? tasks.filter(task => task.status === 'done').length / tasks.length : 0 };
  }));
  constructor() {
    super();
    const title = inject(Title);
    effect(() => title.setTitle(this.busy() || this.error() ? 'StudyBloom' : 'StudyBloom · ' + this.study.tasks.remaining() + ' tâches restantes'));
    this.destroyRef.onDestroy(() => title.setTitle('StudyBloom'));
  }
  ngOnInit() { this.load(); }
  protected load() { this.read(this.study.load()); }
}
