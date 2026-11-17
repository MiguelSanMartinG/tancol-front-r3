import { Component, computed, input, model, output } from '@angular/core';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { AvisoConsumo } from './alerta-consumo';
import { LITROS_POR_M3, formatoLitros, formatoM3 } from './equivalencia-m3.pipe';

/**
 * Confirmación previa a guardar cualquier lectura de medidor:
 * "Estás por ingresar X LTS (Y m3) en el medidor NOMBRE. ¿Estás seguro?".
 * Si la lectura sale de lo común (aviso != null) muestra además el aviso ámbar;
 * no bloquea: el usuario puede revisar el valor o guardar de todos modos.
 */
@Component({
  selector: 'app-confirmar-consumo',
  standalone: true,
  imports: [AppPrimengModule],
  template: `
    <p-dialog
      header="Confirmar lectura"
      [(visible)]="visible"
      [modal]="true"
      [style]="{ width: '30rem', maxWidth: '94vw' }"
      [draggable]="false"
      [resizable]="false"
      appendTo="body"
    >
      <p class="text-sm leading-relaxed text-slate-700">
        Estás por ingresar <b>{{ litrosTexto() }} LTS</b> ({{ m3Texto() }} m3) en el medidor
        <b>{{ nombreMedidor() }}</b>. ¿Estás seguro?
      </p>
      @if (aviso(); as avisoActual) {
        <div class="mt-4 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">
          <i class="pi pi-exclamation-triangle mt-0.5 text-amber-600" aria-hidden="true"></i>
          <p class="text-sm leading-relaxed">{{ avisoActual.mensaje }}</p>
        </div>
      }
      <ng-template #footer>
        <p-button label="Cancelar" severity="secondary" [outlined]="true" (onClick)="visible.set(false)" />
        @if (aviso()) {
          <p-button label="Guardar de todos modos" severity="warn" (onClick)="confirmar()" />
        } @else {
          <p-button label="Sí, guardar" (onClick)="confirmar()" />
        }
      </ng-template>
    </p-dialog>
  `,
})
export class ConfirmarConsumoComponent {
  readonly visible = model(false);
  readonly aviso = input<AvisoConsumo | null>(null);
  readonly nombreMedidor = input<string>('');
  readonly lecturaLitros = input<number>(0);
  readonly confirmado = output<void>();

  readonly litrosTexto = computed(() => formatoLitros.format(this.lecturaLitros() ?? 0));
  readonly m3Texto = computed(() => formatoM3.format((this.lecturaLitros() ?? 0) / LITROS_POR_M3));

  confirmar() {
    this.visible.set(false);
    this.confirmado.emit();
  }
}
