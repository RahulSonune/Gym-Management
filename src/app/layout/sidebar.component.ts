import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../core/auth/auth.service';
import { environment } from '../../environments/environment';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  roles?: string[];
  section?: 'main' | 'admin';
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, MatListModule, MatIconModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',

})
export class SidebarComponent {
  private readonly auth = inject(AuthService);
  readonly appName = environment.appName;

  private readonly navItems: NavItem[] = [
    { label: 'Dashboard', icon: 'dashboard', route: '/dashboard', section: 'main' },
    { label: 'Members', icon: 'people', route: '/members', section: 'main' },
    { label: 'Check-in', icon: 'login', route: '/attendance/check-in', section: 'main' },
    { label: 'Attendance', icon: 'history', route: '/attendance', section: 'main' },
    { label: 'Sell membership', icon: 'card_membership', route: '/subscriptions/sell', section: 'main' },
    { label: 'Plans', icon: 'inventory_2', route: '/plans', section: 'main' },
    { label: 'Billing', icon: 'receipt_long', route: '/billing', section: 'main' },
    { label: 'Classes', icon: 'event', route: '/classes', section: 'main' },
    { label: 'Reports', icon: 'analytics', route: '/reports', section: 'main', roles: ['BRANCH_MANAGER', 'ACCOUNTANT', 'SUPER_ADMIN'] },
    { label: 'Settings', icon: 'settings', route: '/settings', section: 'main' },
    { label: 'Branches', icon: 'store', route: '/admin/branches', section: 'admin', roles: ['SUPER_ADMIN'] },
    { label: 'Staff', icon: 'badge', route: '/admin/staff', section: 'admin', roles: ['SUPER_ADMIN', 'BRANCH_MANAGER'] },
  ];

  private visibleItems(): NavItem[] {
    return this.navItems.filter(
      (item) => !item.roles?.length || this.auth.hasAnyRole(item.roles)
    );
  }

  mainNav(): NavItem[] {
    return this.visibleItems().filter((i) => i.section !== 'admin');
  }

  adminNav(): NavItem[] {
    return this.visibleItems().filter((i) => i.section === 'admin');
  }
}
