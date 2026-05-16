import { Component, Input } from '@angular/core';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [NgClass],
  templateUrl: './status-badge.component.html',
  styleUrl: './status-badge.component.css',

})
export class StatusBadgeComponent {
  @Input() status: string | null | undefined = '';
  @Input() label?: string;

  get displayLabel(): string {
    const fromLabel = this.label?.trim();
    if (fromLabel) return fromLabel;
    const fromStatus = this.status?.trim();
    if (fromStatus) return fromStatus;
    return '-';
  }

  get statusClass(): string {
    const s = (this.status ?? '').toLowerCase();
    if (['active', 'paid', 'success', 'scheduled'].includes(s)) return 'active';
    if (['frozen'].includes(s)) return 'frozen';
    if (['expired', 'pending', 'partial'].includes(s)) return 'expired';
    if (['cancelled', 'void', 'blacklisted'].includes(s)) return 'cancelled';
    if (['prospect', 'draft'].includes(s)) return 'prospect';
    if (['overdue', 'failed'].includes(s)) return 'overdue';
    return 'default';
  }
}
