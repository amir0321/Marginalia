import { Component, OnInit, inject } from '@angular/core';
import { ShellComponent } from './layout/shell/shell.component';
import { ApiWakeService } from './core/api-wake.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ShellComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  private readonly apiWake = inject(ApiWakeService);

  ngOnInit(): void {
    this.apiWake.wake();
  }
}
