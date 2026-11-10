// project-list/project-list.ts
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProjectService } from '../project.service';
import { Project } from '../project.model';
import { ConfirmService } from '../../../shared/services/confirm.service';
import { apiError } from '../../../shared/utils/api';

@Component({
  selector: 'app-project-list',
  imports: [RouterLink, FormsModule],
  templateUrl: './project-list.html',
})
export class ProjectList {
  private service = inject(ProjectService);
  private confirm = inject(ConfirmService);

  all = signal<Project[]>([]);
  search = signal('');
  loading = signal(false);
  error = signal<string | null>(null);
  deletingId = signal<number | null>(null);

  items = computed(() => {
    const s = this.search().trim().toLowerCase();
    return s ? this.all().filter(p => p.name.toLowerCase().includes(s)) : this.all();
  });

  constructor() { this.load(); }

  load() {
    this.loading.set(true); this.error.set(null);
    this.service.getAll().subscribe({
      next: p => { this.all.set(p); this.loading.set(false); },
      error: err => { this.error.set(apiError(err, 'فشل تحميل المشاريع')); this.loading.set(false); },
    });
  }

  async remove(p: Project) {
    const ok = await this.confirm.confirm({
      title: 'حذف مشروع',
      message: `هل أنت متأكد من حذف المشروع "${p.name}"؟`,
      confirmText: 'حذف', danger: true,
    });
    if (!ok) return;
    this.deletingId.set(p.id);
    this.service.delete(p.id).subscribe({
      next: () => { this.deletingId.set(null); this.load(); },
      error: err => { this.error.set(apiError(err, 'فشل حذف المشروع')); this.deletingId.set(null); },
    });
  }
}