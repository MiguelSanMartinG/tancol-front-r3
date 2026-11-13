import { Component, input, model, output } from '@angular/core';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { AvisoConsumo } from './alerta-consumo';

/**
 * Confirmación al guardar una lectura fuera de lo común. No bloquea: el usuario
 * puede revisar el valor o guardar de todos modos.
 */
@Component({
  selector: 'app-confirmar-consumo',
  standalone: true,
  imports: [AppPrimengModule],
  template: `
    <p-dialog
      header="Lectura fuera de lo común"
      [(visible)]="visible"
      [modal]="true"
      [style]="{ width: '30rem', maxWidth: '94vw' }"
      [draggable]="false"
      [resizable]="false"
      appendTo="body"
    >
      <div class="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">
        <i class="pi pi-exclamation-triangle mt-0.5 text-amber-600" aria-hidden="true"></i>
        <p class="text-sm leading-relaxed">{{ aviso()?.mensaje }}</p>
      </div>
      <p class="mt-4 text-sm text-slate-600">
        Revisa que la lectura esté bien capturada. Si es correcta, puedes guardarla de todos modos.
      </p>
      <ng-template #footer>
        <p-button label="Revisar lectura" severity="secondary" [text]="true" (onClick)="visible.set(false)" />
        <p-button label="Guardar de todos modos" severity="warn" (onClick)="confirmar()" />
      </ng-template>
    </p-dialog>
  `,
})
export class ConfirmarConsumoComponent {
  readonly visible = model(false);
  readonly aviso = input<AvisoConsumo | null>(null);
  readonly confirmado = output<void>();

  confirmar() {
    this.visible.set(false);
    this.confirmado.emit();
  }
}
