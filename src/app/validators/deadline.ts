import { ValidatorFn } from '@angular/forms';
import { localDate } from '../models/study';

export function futureDeadlineValidator(previous?: string): ValidatorFn {
  return control => {
    const value: unknown = control.value;
    return typeof value === 'string' && value && value !== previous && value < localDate() ? { pastDeadline: true } : null;
  };
}
