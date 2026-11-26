import { Pipe, PipeTransform } from '@angular/core';
import { localDate } from '../models/study';

@Pipe({ name: 'deadline', standalone: true })
export class DeadlinePipe implements PipeTransform {
  transform(value: string, today = localDate()): string {
    const day = (date: string) => Date.parse(date + 'T00:00:00Z');
    const remaining = (day(value) - day(today)) / 86400000;
    if (!Number.isFinite(remaining)) return 'Échéance inconnue';
    if (remaining < 0) return 'En retard';
    if (remaining === 0) return 'Aujourd’hui';
    if (remaining === 1) return 'Demain';
    return 'Dans ' + remaining + ' jours';
  }
}
