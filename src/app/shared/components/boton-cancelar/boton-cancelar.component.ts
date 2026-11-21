import { Component, inject, input, output, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';

/**
 * Botón «Cancelar» de los formularios. Antes de salir pide confirmación,
 * porque al salir se pierden los datos capturados.
 *
 * - Con `route`, navega relativo a la ruta del formulario (igual que un routerLink).
 * - Sin `route`, emite `exit` para que el formulario decida qué hacer.
 * - `[confirm]="false"` omite la confirmación (vistas de solo lectura).
 */
@Component({
  selector: 'app-boton-cancelar',
  imports: [ButtonModule, DialogModule],
  template: `
    <p-button
      label="Cancelar"
      severity="secondary"
      [outlined]="true"
      styleClass="form-cancel-button"
      [disabled]="disabled()"
      (onClick)="cancelar()"
    />
    <p-dialog
      [visible]="visible()"
      (visibleChange)="visible.set($event)"
      [modal]="true"
      [closable]="false"
      [draggable]="false"
      [resizable]="false"
      [dismissableMask]="true"
      appendTo="body"
      styleClass="form-exit-dialog"
      [style]="{ width: 'min(26rem, calc(100vw - 2rem))' }"
    >
      <ng-template #headless>
        <div class="form-exit-card" role="alertdialog" (keydown.escape)="visible.set(false)" aria-labelledby="form-exit-title" aria-describedby="form-exit-msg">
          <span class="form-exit-icon" aria-hidden="true"><i class="pi pi-exclamation-triangle"></i></span>
          <h3 id="form-exit-title">¿Salir del formulario?</h3>
          <p id="form-exit-msg">Si confirmas, se perderán los datos que no hayas guardado.</p>
          <div class="form-exit-actions">
            <p-button label="Cerrar" severity="secondary" [outlined]="true" (onClick)="visible.set(false)" />
            <p-button label="Salir" icon="pi pi-arrow-left" severity="warn" (onClick)="salir()" />
          </div>
        </div>
      </ng-template>
    </p-dialog>
  `,
})
export class BotonCancelarComponent {
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  /** Ruta relativa al formulario, p. ej. `['../']`. */
  readonly routeTo = input<any[] | string | null>(null, { alias: 'route' });
  readonly disabled = input(false);
  /** false en vistas de solo lectura: sale sin pedir confirmación. */
  readonly confirm = input(true);
  readonly exit = output<void>();
  readonly visible = signal(false);

  cancelar() {
    if (this.confirm()) this.visible.set(true);
    else this.salir();
  }

  salir() {
    this.visible.set(false);
    const destino = this.routeTo();
    if (destino) {
      this.router.navigate(Array.isArray(destino) ? destino : [destino], { relativeTo: this.route });
    } else {
      this.exit.emit();
    }
  }
}
