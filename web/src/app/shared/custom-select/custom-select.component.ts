import { Component, input, model, computed } from '@angular/core';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';

export interface SelectOption<T = string> {
  value: T;
  label: string;
}

@Component({
  selector: 'app-custom-select',
  standalone: true,
  imports: [NgbDropdownModule],
  templateUrl: './custom-select.component.html',
  styleUrl: './custom-select.component.scss',
})
export class CustomSelectComponent<T = string> {
  readonly options = input.required<SelectOption<T>[]>();
  readonly value = model<T>();
  readonly label = input<string>('');
  readonly placeholder = input<string>('Välj...');
  readonly ariaLabel = input<string>('Välj alternativ');

  readonly selectedOption = computed(() => {
    return this.options().find(opt => opt.value === this.value()) ?? null;
  });

  selectOption(val: T): void {
    this.value.set(val);
  }
}
