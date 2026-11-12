import { Injectable, inject, signal } from '@angular/core';
import { LocalStorageService } from '@shared/services/local-storage.service';

@Injectable({ providedIn: 'root' })
export class DashboardShellService {
  private localStorage = inject(LocalStorageService);

  readonly section = signal(this.localStorage.getActiveTab() ?? 1);
  readonly helpOpen = signal(false);
  readonly collapsed = signal(localStorage.getItem('sidebarCollapsed') === '1');
  readonly mobileOpen = signal(false);
  readonly permisosListos = signal(0);

  fijarSeccion(key: number) {
    this.section.set(key);
    this.localStorage.setActiveTab(key);
  }

  toggleCollapsed() {
    this.collapsed.update((value) => !value);
    localStorage.setItem('sidebarCollapsed', this.collapsed() ? '1' : '0');
  }
}
