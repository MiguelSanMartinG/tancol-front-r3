import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { BotonRegresarComponent } from '@shared/components/boton-regresar/boton-regresar.component';
import { DashboardKpiConfig, DashboardKpiConfigService } from '../../../services/dashboard-kpi-config.service';

@Component({
  selector: 'app-configuracion-kpis',
  standalone: true,
  imports: [CommonModule, FormsModule, BotonRegresarComponent],
  templateUrl: './principal.component.html',
  styleUrl: './principal.component.scss',
})
export class PrincipalComponent implements OnInit {
  private readonly configService = inject(DashboardKpiConfigService);
  private readonly router = inject(Router);
  config: DashboardKpiConfig = this.configService.getDefaults();
  loading = true;
  loadFailed = false;
  saving = false;
  saved = false;
  errorMessage = '';

  ngOnInit(): void {
    this.loadConfig();
  }

  loadConfig(): void {
    this.loading = true;
    this.loadFailed = false;
    this.errorMessage = '';
    this.configService.getRemoteConfig().subscribe({
      next: (config) => { this.config = config; this.loading = false; },
      error: (error) => {
        this.config = this.configService.getDefaults();
        this.errorMessage = this.getErrorMessage(error);
        this.loadFailed = true;
        this.loading = false;
      },
    });
  }

  save(): void {
    if (this.loading || this.saving || this.loadFailed) return;
    this.saving = true;
    this.saved = false;
    this.errorMessage = '';
    this.configService.saveRemoteConfig(this.config).subscribe({
      next: (config) => {
        this.config = config;
        this.saving = false;
        this.saved = true;
        setTimeout(() => (this.saved = false), 2500);
      },
      error: (error) => {
        this.saving = false;
        this.errorMessage = this.getErrorMessage(error);
      },
    });
  }

  reset(): void {
    this.config = this.configService.getDefaults();
    this.save();
  }

  goToDashboard(): void { this.router.navigateByUrl('/dashboard/principal/dashboard-reportes'); }

  private getErrorMessage(error: any): string {
    return error?.error?.message
      ?? error?.error?.configuracion
      ?? error?.message
      ?? 'No se pudo cargar la configuración de KPIs.';
  }
}
