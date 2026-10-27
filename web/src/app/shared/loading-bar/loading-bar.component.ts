import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { LoadingService } from '../../core/loading.service';

@Component({
  selector: 'app-loading-bar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './loading-bar.component.html',
  styleUrl: './loading-bar.component.scss',
})
export class LoadingBarComponent {
  private readonly loadingService = inject(LoadingService);
  readonly isLoading = this.loadingService.isLoading;
}
