import { PercentPipe } from '@angular/common';
import { Component, computed, input, signal } from '@angular/core';

@Component({
  selector: 'sb-bloom-garden',
  imports: [PercentPipe],
  template: `<section class="garden card">
    <span class="eyebrow">LE JARDIN DE BLOOMIE</span>
    <h2>{{ stage() }}</h2>
    <svg class="bloom" viewBox="0 0 260 190" role="img" [attr.aria-label]="stage()">
      <ellipse cx="130" cy="160" rx="100" ry="17" fill="#f0dfca"/>
      @if (level() > 0) {
        <path d="M130 154 Q145 123 130 82" fill="none" stroke="#4c8564" stroke-width="7" stroke-linecap="round"/>
        <path d="M137 131 Q96 127 94 100 Q128 98 137 131" fill="#75aa86"/>
      }
      @if (level() > 1) { <path d="M138 120 Q151 87 179 96 Q174 122 138 120" fill="#96bd96"/> }
      @switch (level()) {
        @case (0) { <ellipse cx="130" cy="148" rx="14" ry="9" fill="#b98460" transform="rotate(-18 130 148)"/> }
        @case (3) { <path d="M132 86 Q98 77 112 49 Q129 44 132 55 Q151 42 157 53 Q164 77 132 86" fill="#e78479"/> }
        @case (4) {
          <g fill="#e78479"><ellipse cx="131" cy="48" rx="18" ry="28"/><ellipse cx="103" cy="65" rx="18" ry="28" transform="rotate(-55 103 65)"/><ellipse cx="159" cy="65" rx="18" ry="28" transform="rotate(55 159 65)"/><ellipse cx="131" cy="92" rx="28" ry="18"/></g>
          <circle cx="131" cy="70" r="19" fill="#ffe1a5"/><circle cx="125" cy="68" r="2" fill="#304b70"/><circle cx="137" cy="68" r="2" fill="#304b70"/><path d="M126 75 Q131 80 136 75" fill="none" stroke="#304b70" stroke-width="2"/>
        }
      }
      <path d="M49 64v16m-8-8h16M205 44v16m-8-8h16" stroke="#b65f55" opacity=".5" stroke-width="2"/>
    </svg>
    <div class="row"><span>Progression du jardin</span><strong>{{ progress() | percent }}</strong></div>
    <progress [value]="progress()" max="1" aria-label="Progression du jardin"></progress>
  </section>`
})
export class BloomGardenComponent {
  readonly progress = input.required<number>();
  private readonly stages = signal(['Graine', 'Jeune pousse', 'Plante', 'Bouton floral', 'Fleur épanouie']);
  protected readonly level = computed(() => Math.min(4, Math.max(0, Math.floor(this.progress() * 4))));
  protected readonly stage = computed(() => this.stages()[this.level()]);
}
