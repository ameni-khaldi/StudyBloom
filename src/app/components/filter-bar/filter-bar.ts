import { Component, model } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'sb-filter-bar',
  imports: [FormsModule],
  template: `<label class="search"><span aria-hidden="true">⌕</span><input type="search" aria-label="Rechercher par titre" placeholder="Rechercher une tâche…" [ngModel]="value()" (ngModelChange)="value.set($event)"></label>`
})
export class FilterBarComponent { readonly value = model(''); }
