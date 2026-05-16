import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { StaffService } from '../../core/services/staff.service';
import { StaffUser } from '../../core/models';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { PiiDisplayPipe } from '../../shared/pipes/pii-display.pipe';
import { messageFromHttpError } from '../../core/utils/api-error.util';

@Component({
  selector: 'app-staff',
  standalone: true,
  imports: [
    RouterLink,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    StatusBadgeComponent,
    PiiDisplayPipe,
  ],
  templateUrl: './staff.component.html',
  styleUrl: './staff.component.css',
})
export class StaffComponent implements OnInit {
  private readonly staffService = inject(StaffService);

  readonly staff = signal<StaffUser[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly columns = ['name', 'email', 'roles', 'branches', 'status', 'actions'];

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.staffService.list().subscribe({
      next: (rows) => {
        this.staff.set(rows);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.error.set(messageFromHttpError(err, 'Could not load staff list.'));
        this.loading.set(false);
      },
    });
  }

  formatRoles(roles: string[]): string {
    return roles
      .map((r) =>
        r
          .toLowerCase()
          .split('_')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ')
      )
      .join(', ');
  }
}
