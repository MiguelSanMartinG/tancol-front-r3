import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { SignatureCanvasComponent } from '../signature-canvas/signature-canvas.component';
import { base64ToFile } from '@shared/utils/base64-to-file.util';

/**
 * Diálogo de firma genérico (no depende de PartidaVenta).
 * Uso: <app-dialog-firma #dlg header="Firma" [texto]="'Firma de quien recibe: ' + nombre" (firmaConfirmada)="..." />
 * y dlg.open(). Emite el File PNG de la firma al confirmar.
 */
@Component({
  selector: 'app-dialog-firma',
  standalone: true,
  imports: [CommonModule, AppPrimengModule, SignatureCanvasComponent],
  template: `
    <p-dialog
      [header]="header"
      [modal]="true"
      [(visible)]="display"
      [style]="{ width: '32rem' }"
      [breakpoints]="{ '640px': '95vw' }"
      (onShow)="onShow()"
      (onHide)="onHide()"
    >
      @if (mostrarCanvas) {
        <signature-canvas class="firma-canvas" (signed)="onSigned()"></signature-canvas>
      }
      @if (texto) {
        <div class="mt-4 mb-2 text-center">{{ texto }}</div>
      }
      <div class="flex justify-end gap-2 mt-3">
        <p-button label="Limpiar" severity="secondary" [text]="true" (onClick)="limpiar()" />
        <p-button label="Cancelar" severity="secondary" (onClick)="cancelar()" />
        <p-button label="Confirmar firma" [disabled]="!tieneTrazo" (onClick)="confirmar()" />
      </div>
    </p-dialog>
  `,
  styles: [
    `
      .firma-canvas {
        display: block;
        height: 16rem;
      }
      .firma-canvas ::ng-deep > div {
        height: 100%;
      }
    `,
  ],
})
export class DialogFirmaComponent {
  @ViewChild(SignatureCanvasComponent) signaturePad?: SignatureCanvasComponent;

  @Input() header = 'Firma';
  @Input() texto = '';
  @Output() firmaConfirmada = new EventEmitter<File>();
  @Output() cancelado = new EventEmitter<void>();

  display = false;
  /** El canvas se crea al mostrarse el diálogo para que tome el tamaño real. */
  mostrarCanvas = false;
  tieneTrazo = false;
  private confirmado = false;

  open(): void {
    this.tieneTrazo = false;
    this.confirmado = false;
    this.display = true;
  }

  onShow(): void {
    this.mostrarCanvas = true;
  }

  onHide(): void {
    this.mostrarCanvas = false;
    this.tieneTrazo = false;
    if (!this.confirmado) this.cancelado.emit();
  }

  onSigned(): void {
    this.tieneTrazo = !(this.signaturePad?.isEmpty() ?? true);
  }

  limpiar(): void {
    this.signaturePad?.clear();
    this.tieneTrazo = false;
  }

  cancelar(): void {
    this.display = false;
  }

  confirmar(): void {
    if (!this.signaturePad || this.signaturePad.isEmpty()) {
      this.tieneTrazo = false;
      return;
    }
    const file = base64ToFile(this.signaturePad.getBase64(), `firma-${Date.now()}.png`);
    this.confirmado = true;
    this.firmaConfirmada.emit(file);
    this.display = false;
  }
}
