import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { AuthService } from '../../core/auth/auth.service';
import { BranchContextService } from '../../core/branch/branch-context.service';
import { StaffService } from '../../core/services/staff.service';
import { UserRole } from '../../core/models';
import { messageFromHttpError } from '../../core/utils/api-error.util';
import { markFormGroupTouched } from '../../core/utils/form-validation.util';
import { FieldErrorComponent } from '../../shared/components/field-error/field-error.component';

interface RoleOption {
  value: UserRole;
  label: string;
}

const ALL_ROLE_OPTIONS: RoleOption[] = [
  { value: 'RECEPTIONIST', label: 'Receptionist' },
  { value: 'BRANCH_MANAGER', label: 'Branch manager' },
  { value: 'TRAINER', label: 'Trainer' },
  { value: 'ACCOUNTANT', label: 'Accountant' },
  { value: 'SUPER_ADMIN', label: 'Super admin' },
];

function optionalPasswordMinLength(min: number) {
  return (control: AbstractControl) => {
    const value = (control.value as string | null)?.trim() ?? '';
    if (!value) {
      return null;
    }
    return value.length >= min
      ? null
      : { minlength: { requiredLength: min, actualLength: value.length } };
  };
}

@Component({
  selector: 'app-staff-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSlideToggleModule,
    FieldErrorComponent,
  ],
  templateUrl: './staff-form.component.html',
  styleUrl: './staff-form.component.css',
})
export class StaffFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly staffService = inject(StaffService);
  private readonly branchContext = inject(BranchContextService);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly isEdit = signal(false);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly formError = signal<string | null>(null);
  readonly branches = this.branchContext.branches;

  private staffId?: number;

  readonly roleOptions = computed(() => {
    if (this.auth.hasRole('SUPER_ADMIN')) {
      return ALL_ROLE_OPTIONS;
    }
    return ALL_ROLE_OPTIONS.filter((r) => r.value !== 'SUPER_ADMIN');
  });

  readonly form = this.fb.nonNullable.group({
    fullName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    password: ['', [Validators.required, Validators.minLength(6)]],
    roles: [[] as UserRole[], Validators.required],
    branchIds: [[] as number[], Validators.required],
    primaryBranchId: [null as number | null],
    isActive: [true],
  });

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam) {
      return;
    }

    this.isEdit.set(true);
    this.staffId = +idParam;
    this.form.controls.password.clearValidators();
    this.form.controls.password.setValidators([optionalPasswordMinLength(6)]);
    this.form.controls.password.updateValueAndValidity();

    this.loading.set(true);
    this.staffService.getById(this.staffId).subscribe({
      next: (staff) => {
        const branchIds = staff.branchIds ?? [];
        this.form.patchValue({
          fullName: staff.fullName,
          email: staff.email,
          phone: staff.phone ?? '',
          roles: staff.roles,
          branchIds,
          primaryBranchId: staff.primaryBranchId ?? branchIds[0] ?? null,
          isActive: staff.isActive,
        });
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.loading.set(false);
        this.formError.set(messageFromHttpError(err, 'Could not load staff member.'));
      },
    });
  }

  onSubmit(): void {
    if (this.saving() || this.loading()) {
      return;
    }
    if (this.form.invalid) {
      markFormGroupTouched(this.form);
      this.formError.set(null);
      return;
    }

    const raw = this.form.getRawValue();
    const branchIds = raw.branchIds;
    const primaryBranchId = raw.primaryBranchId ?? branchIds[0] ?? null;

    this.saving.set(true);
    this.formError.set(null);

    if (this.isEdit() && this.staffId != null) {
      const password = raw.password.trim();
      this.staffService
        .update(this.staffId, {
          fullName: raw.fullName.trim(),
          email: raw.email.trim().toLowerCase(),
          phone: raw.phone.trim() || undefined,
          ...(password ? { password } : {}),
          roles: raw.roles,
          branchIds,
          primaryBranchId: primaryBranchId ?? undefined,
          isActive: raw.isActive,
        })
        .subscribe({
          next: () => {
            this.saving.set(false);
            this.router.navigate(['/admin/staff']);
          },
          error: (err: unknown) => {
            this.saving.set(false);
            this.formError.set(
              messageFromHttpError(err, 'Could not update staff member. Please try again.')
            );
          },
        });
      return;
    }

    this.staffService
      .create({
        fullName: raw.fullName.trim(),
        email: raw.email.trim().toLowerCase(),
        phone: raw.phone.trim() || undefined,
        password: raw.password,
        roles: raw.roles,
        branchIds,
        primaryBranchId: primaryBranchId ?? undefined,
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.router.navigate(['/admin/staff']);
        },
        error: (err: unknown) => {
          this.saving.set(false);
          this.formError.set(
            messageFromHttpError(err, 'Could not create staff member. Please try again.')
          );
        },
      });
  }
}
