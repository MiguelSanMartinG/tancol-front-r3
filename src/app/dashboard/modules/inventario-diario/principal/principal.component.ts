import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { HeaderComponent } from '@shared/components/header/header.component';
import { BotonRegresarComponent } from '@shared/components/boton-regresar/boton-regresar.component';
import { DateRangeComponent } from '@shared/components/date-range/date-range.component';
import { InventarioDiarioService } from '../services/inventario-diario.service';
import { InventarioDiaComponent } from '../inventario-dia/inventario-dia.component';
import { SolicitudesStockComponent } from '../solicitudes/solicitudes.component';

type Pestana = 'inventario' | 'solicitudes';

/** Inventario diario de insumos: filtros compartidos y pestañas Inventario del día / Solicitudes de stock. */
@Component({
  selector: 'app-inventario-diario-principal',
  imports: [FormsModule, SelectModule, HeaderComponent, BotonRegresarComponent, DateRangeComponent, InventarioDiaComponent, SolicitudesStockComponent],
  templateUrl: './principal.component.html',
  styleUrl: './principal.component.scss',
})
export class InventarioDiarioPrincipalComponent {
  readonly inv = inject(InventarioDiarioService);

  readonly pestana = signal<Pestana>('inventario');
  readonly areaId = signal(this.inv.areas[0].id);
  readonly empleadoId = signal<string | null>(null);
  /** Folio que se resalta al llegar desde la tarjeta. */
  readonly folioResaltado = signal<string | null>(null);
  // Por defecto, el día de hoy.
  readonly inicio = signal<Date | null>(inicioDeHoy());
  readonly fin = signal<Date | null>(finDeHoy());

  readonly areasOpciones = this.inv.areas.map((a) => ({ label: a.nombre, value: a.id }));
  readonly empleadosOpciones = this.inv.empleados.map((e) => ({ label: e.nombre, value: e.id }));

  constructor() {
    // Desde la notificación «Respuesta del almacén»: ?folio=SDS-… abre el área y la tarjeta del insumo.
    inject(ActivatedRoute).queryParamMap.subscribe((q) => {
      const folio = q.get('folio');
      const s = folio ? this.inv.solicitudes().find((x) => x.folio === folio) : null;
      if (!s) return;
      this.areaId.set(s.areaId);
      this.irATarjeta(s.insumoId);
    });
  }

  get areaActual() {
    return this.inv.area(this.areaId());
  }

  /** Insumo cuya tarjeta se enfoca al volver desde Solicitudes. */
  readonly insumoEnfocado = signal<{ insumoId: string } | null>(null);

  irATarjeta(insumoId: string) {
    this.insumoEnfocado.set({ insumoId });
    this.pestana.set('inventario');
  }

  irASolicitudes(folio: string | null) {
    this.folioResaltado.set(folio);
    this.pestana.set('solicitudes');
  }

  limpiarFiltros() {
    this.empleadoId.set(null);
    this.inicio.set(inicioDeHoy());
    this.fin.set(finDeHoy());
  }
}

function inicioDeHoy() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function finDeHoy() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}
