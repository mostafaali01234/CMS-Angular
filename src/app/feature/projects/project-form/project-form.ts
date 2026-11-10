// project-form/project-form.ts
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { ProjectService } from '../project.service';
import { apiError } from '../../../shared/utils/api';

@Component({
  selector: 'app-project-form',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './project-form.html',
})
export class ProjectForm implements OnInit {
  private fb = inject(NonNullableFormBuilder);
  private service = inject(ProjectService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  id = signal<number | null>(null);
  loading = signal(false);
  saving = signal(false);
  error = signal<string | null>(null);

  form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    notes: [''],
  });

  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam) return;
    this.id.set(+idParam);
    this.loading.set(true);
    this.service.getById(+idParam).subscribe({
      next: p => { this.form.patchValue({ name: p.name, notes: p.notes ?? '' }); this.loading.set(false); },
      error: err => { this.error.set(apiError(err, 'فشل تحميل المشروع')); this.loading.set(false); },
    });
  }

  invalid(n: 'name' | 'notes') { const c = this.form.controls[n]; return c.invalid && (c.touched || c.dirty); }

  save() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true); this.error.set(null);
    const v = this.form.getRawValue();
    const payload = { id: this.id() ?? 0, name: v.name.trim(), notes: v.notes };   // the server needs the id on update

    const req$: Observable<unknown> = this.id()
      ? this.service.update(this.id()!, payload)
      : this.service.create(payload);

    req$.subscribe({
      next: () => this.router.navigate(['/projects']),
      error: err => { this.error.set(apiError(err, 'فشل حفظ المشروع')); this.saving.set(false); },
    });
  }
}