import { Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { HeaderComponent } from '@shared/components/header/header.component';
import { BotonRegresarComponent } from '@shared/components/boton-regresar/boton-regresar.component';
import { DateRangeComponent } from '@shared/components/date-range/date-range.component';
import { InventarioDiarioService } from '../services/inventario-diario.service';
import { ROTO_POR_MAQUINA } from '../services/inventario-diario.models';
import { InventarioDiaComponent } from '../inventario-dia/inventario-dia.component';
import { SolicitudesStockComponent } from '../solicitudes/solicitudes.component';

type Pestana = 'inventario' | 'solicitudes';

/** «Sí» / «No» del filtro Firmado. */
export type FiltroFirmado = 'SI' | 'NO' | null;

/** Inventario diario de insumos: filtros compartidos y pestañas Inventario del día / Solicitudes de stock. */
@Component({
  selector: 'app-inventario-diario-principal',
  imports: [FormsModule, SelectModule, AppPrimengModule, HeaderComponent, BotonRegresarComponent, DateRangeComponent, InventarioDiaComponent, SolicitudesStockComponent],
  templateUrl: './principal.component.html',
  styleUrl: './principal.component.scss',
})
export class InventarioDiarioPrincipalComponent {
  readonly inv = inject(InventarioDiarioService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private destruido = false;

  readonly pestana = signal<Pestana>('inventario');
  /** Null mientras cargan los catálogos. */
  readonly areaId = signal<string | null>(null);
  readonly empleadoId = signal<string | null>(null);
  /** Folio que se resalta al llegar desde la tarjeta. */
  readonly folioResaltado = signal<string | null>(null);
  // Por defecto, el día de hoy.
  readonly inicio = signal<Date | null>(inicioDeHoy());
  readonly fin = signal<Date | null>(finDeHoy());
  readonly rutaId = signal<string | null>(null);
  /** También lo fija el clic en una tarjeta. */
  readonly insumoId = signal<string | null>(null);
  readonly rotoPor = signal<string | null>(null);
  readonly firmado = signal<FiltroFirmado>(null);

  readonly areasOpciones = computed(() => this.inv.areas().map((a) => ({ label: a.nombre, value: a.id })));
  readonly empleadosOpciones = computed(() => this.inv.empleados().map((e) => ({ label: e.nombre, value: e.id })));
  readonly rutasOpciones = computed(() => this.inv.rutas().map((r) => ({ label: r.nombre, value: r.id })));
  readonly rotoPorOpciones = computed(() => [{ label: 'Máquina', value: ROTO_POR_MAQUINA }, ...this.empleadosOpciones()]);
  /** Insumos con tarjeta en el área. */
  readonly insumosOpciones = computed(() =>
    this.inv.cupos().filter((c) => c.areaId === this.areaId()).map((c) => ({ label: c.insumoNombre, value: c.insumoId }))
      .sort((a, b) => a.label.localeCompare(b.label)),
  );
  readonly firmadoOpciones = [{ label: 'Sí', value: 'SI' }, { label: 'No', value: 'NO' }];

  /** Filtros contraídos: a la vista quedan fechas, ruta y empleado. Se recuerda en el navegador. */
  readonly masFiltros = signal(leerMasFiltros());
  /** Filtros con valor que están ocultos al contraer. */
  readonly filtrosOcultosActivos = computed(() => {
    // En Solicitudes no aplican Roto por ni Firmado.
    const valores = this.pestana() === 'inventario' ? [this.insumoId(), this.rotoPor(), this.firmado()] : [this.insumoId()];
    return valores.filter((v) => v !== null).length;
  });

  constructor() {
    effect(() => {
      const abierto = this.masFiltros();
      try {
        localStorage.setItem(CLAVE_MAS_FILTROS, abierto ? '1' : '0');
      } catch {
        // Sin almacenamiento: se recuerda solo en esta visita.
      }
    });
    this.destroyRef.onDestroy(() => (this.destruido = true));
    void this.iniciar();
    this.programarCambioDeDia();
  }

  /**
   * A las 23:59:59 termina el día: si se estaba viendo hoy, la vista pasa al día nuevo y las
   * partidas anteriores solo se consultan con el filtro de fechas.
   */
  private programarCambioDeDia() {
    const ahora = new Date();
    const manana = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() + 1, 0, 0, 1);
    const t = setTimeout(() => {
      const ayer = inicioDeHoy();
      ayer.setDate(ayer.getDate() - 1);
      const inicio = this.inicio();
      if (inicio && inicio.getTime() === ayer.getTime()) {
        this.inicio.set(inicioDeHoy());
        this.fin.set(finDeHoy());
      }
      const area = this.areaId();
      if (area) void this.inv.cargarArea(area);
      this.programarCambioDeDia();
    }, manana.getTime() - ahora.getTime());
    this.destroyRef.onDestroy(() => clearTimeout(t));
  }

  cambiarArea(id: string | null) {
    this.areaId.set(id);
    this.insumoId.set(null);
  }

  private async iniciar() {
    await this.inv.cargarInicial();
    if (this.destruido) return;
    // Primero un área a cargo del usuario; si no tiene, la primera.
    const areas = this.inv.areas();
    const inicial = areas.find((a) => this.inv.esResponsableArea(a.id)) ?? areas[0];
    const folioInicial = this.route.snapshot.queryParamMap.get('folio');
    if (folioInicial) await this.abrirFolio(folioInicial);
    if (this.destruido) return;
    if (!this.areaId()) this.areaId.set(inicial?.id ?? null);

    // Desde la notificación «Respuesta del almacén»: ?folio=SDS-… abre el área y la tarjeta del insumo.
    let ultimo = folioInicial;
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((q) => {
      const folio = q.get('folio');
      if (folio && folio !== ultimo) void this.abrirFolio(folio);
      ultimo = folio;
    });
  }

  private async abrirFolio(folio: string) {
    const s = await this.inv.buscarSolicitud(folio);
    if (!s || this.destruido) return;
    this.areaId.set(s.areaId);
    this.irATarjeta(s.insumoId);
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
    this.rutaId.set(null);
    this.insumoId.set(null);
    this.rotoPor.set(null);
    this.firmado.set(null);
    this.inicio.set(inicioDeHoy());
    this.fin.set(finDeHoy());
  }
}

const CLAVE_MAS_FILTROS = 'tancol:inventario-diario:mas-filtros';

function leerMasFiltros(): boolean {
  try {
    return localStorage.getItem(CLAVE_MAS_FILTROS) === '1';
  } catch {
    return false;
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
