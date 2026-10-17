import { Component, inject, signal, computed } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-book-form',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './book-form.component.html',
  styleUrl: './book-form.component.scss',
})
export class BookFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);

  readonly isEditMode = signal(false);

  readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(200)]],
    author: ['', [Validators.required, Validators.maxLength(200)]],
    publishedDate: ['', [Validators.required]],
    description: ['', [Validators.maxLength(500)]],
  });

  readonly descriptionCount = computed(() => {
    return this.form.controls.description.value?.length ?? 0;
  });

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode.set(true);
    }
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    // Backend integration in next step
  }
}
