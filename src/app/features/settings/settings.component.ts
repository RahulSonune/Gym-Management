import { Component, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { AuthService } from '../../core/auth/auth.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [MatCardModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css',

})
export class SettingsComponent {
  readonly auth = inject(AuthService);
  readonly environment = environment;
}
