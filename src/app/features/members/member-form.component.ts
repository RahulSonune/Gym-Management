import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MemberService } from '../../core/services/member.service';
import { BranchContextService } from '../../core/branch/branch-context.service';
import { messageFromHttpError } from '../../core/utils/api-error.util';
import { markFormGroupTouched } from '../../core/utils/form-validation.util';
import { FieldErrorComponent } from '../../shared/components/field-error/field-error.component';

@Component({
  selector: 'app-member-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    FieldErrorComponent,
  ],
  templateUrl: './member-form.component.html',
  styleUrl: './member-form.component.css',

})
export class MemberFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly memberService = inject(MemberService);
  private readonly branchContext = inject(BranchContextService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly isEdit = signal(false);
  readonly saving = signal(false);
  /** Server error (duplicate phone, validation, etc.) */
  readonly formError = signal<string | null>(null);
  private memberId?: number;

  readonly form = this.fb.nonNullable.group({
    firstName: ['', Validators.required],
    lastName: [''],
    phone: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
    email: ['', Validators.email],
    gender: [''],
    dateOfBirth: [''],
    emergencyContactName: [''],
    emergencyContactPhone: [''],
    source: ['WALK_IN'],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEdit.set(true);
      this.memberId = +id;
      this.memberService.getById(this.memberId).subscribe((m) => {
        this.form.patchValue({
          firstName: m.firstName,
          lastName: m.lastName ?? '',
          phone: m.phone,
          email: m.email ?? '',
          gender: m.gender ?? '',
          dateOfBirth: m.dateOfBirth ?? '',
          emergencyContactName: m.emergencyContactName ?? '',
          emergencyContactPhone: m.emergencyContactPhone ?? '',
          source: m.source ?? 'WALK_IN',
        });
      });
    }
  }

  onSubmit(): void {
    if (this.saving()) return;
    if (this.form.invalid) {
      markFormGroupTouched(this.form);
      return;
    }
    this.formError.set(null);
    this.saving.set(true);
    const data = {
      ...this.form.getRawValue(),
      branchId: this.branchContext.selectedBranchId() ?? 1,
    };
    const req = this.isEdit() && this.memberId
      ? this.memberService.update(this.memberId, data)
      : this.memberService.create(data);
    req.subscribe({
      next: (m) => {
        this.saving.set(false);
        this.router.navigate(['/members', m.id]);
      },
      error: (err: unknown) => {
        this.saving.set(false);
        this.formError.set(
          messageFromHttpError(
            err,
            this.isEdit()
              ? 'Could not update this member.'
              : 'Could not register this member.'
          )
        );
      },
    });
  }
}
