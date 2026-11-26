import { inject, Injectable } from '@angular/core';
import { switchMap } from 'rxjs';
import { SubjectService, TaskService } from './api';
import { AuthService } from './auth';

@Injectable({ providedIn: 'root' })
export class StudyService {
  readonly subjects = inject(SubjectService);
  readonly tasks = inject(TaskService);
  private readonly auth = inject(AuthService);
  load() {
    return this.subjects.owned(this.auth.currentUser()?.id ?? '__none__').pipe(
      switchMap(subjects => this.tasks.refresh(subjects.map(subject => subject.id)))
    );
  }
}
