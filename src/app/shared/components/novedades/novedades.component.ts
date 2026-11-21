import { Component, inject } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { NovedadesService } from '../../../core/version/novedades.service';

/** Tarjeta «Novedades» con la versión vigente y su lista de cambios. */
@Component({
  selector: 'app-novedades',
  imports: [ButtonModule, DialogModule],
  template: `
    <p-dialog
      [visible]="novedades.visible()"
      (visibleChange)="!$event && novedades.cerrar()"
      [modal]="true"
      [closable]="false"
      [draggable]="false"
      [resizable]="false"
      appendTo="body"
      styleClass="form-exit-dialog"
      [style]="{ width: 'min(34rem, calc(100vw - 2rem))' }"
    >
      <ng-template #headless>
        <div class="novedades-card" role="dialog" aria-labelledby="novedades-title" (keydown.escape)="novedades.cerrar()">
          <div class="novedades-head">
            <span class="novedades-icon" aria-hidden="true"><i class="fa-solid fa-rocket"></i></span>
            <div>
              <h3 id="novedades-title">Novedades del sistema</h3>
              <p>
                <span class="novedades-version">Versión {{ novedades.version }}</span>
                <span class="novedades-fecha">{{ novedades.fechaLegible() }}</span>
              </p>
            </div>
          </div>
          <ul class="novedades-lista">
            @for (cambio of novedades.actual.cambios; track $index) {
              <li><i class="pi pi-check" aria-hidden="true"></i><span>{{ cambio }}</span></li>
            }
          </ul>
          <div class="novedades-actions">
            <p-button label="Entendido" icon="pi pi-check" (onClick)="novedades.cerrar()" />
          </div>
        </div>
      </ng-template>
    </p-dialog>
  `,
})
export class NovedadesComponent {
  readonly novedades = inject(NovedadesService);
}
