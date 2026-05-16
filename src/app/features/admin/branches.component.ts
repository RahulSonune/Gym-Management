import { Component, signal } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MOCK_BRANCH_DETAILS } from '../../core/data/mock-data';
import { Branch } from '../../core/models';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-branches',
  standalone: true,
  imports: [MatTableModule, StatusBadgeComponent],
  templateUrl: './branches.component.html',
})
export class BranchesComponent {
  readonly branches = signal<Branch[]>([...MOCK_BRANCH_DETAILS]);
  readonly columns = ['code', 'name', 'city', 'phone', 'status'];
}
