import { Component, OnInit, inject, signal } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MOCK_CLASSES } from '../../core/data/mock-data';
import { ClassSchedule } from '../../core/models';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { formatDateTime } from '../../core/utils/date.util';

@Component({
  selector: 'app-classes-list',
  standalone: true,
  imports: [MatTableModule, MatButtonModule, StatusBadgeComponent],
  templateUrl: './classes-list.component.html',
})
export class ClassesListComponent implements OnInit {
  readonly schedules = signal<ClassSchedule[]>([]);
  readonly columns = ['class', 'trainer', 'time', 'capacity', 'status'];
  readonly formatDt = formatDateTime;

  ngOnInit(): void {
    this.schedules.set([...MOCK_CLASSES]);
  }
}
