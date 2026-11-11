import { CommonModule } from '@angular/common';
import { Component, AfterViewInit, ViewChild, inject, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { BotonRegresarComponent } from '@shared/components/boton-regresar/boton-regresar.component';
import { HeaderComponent } from '@shared/components/header/header.component';
import { MessageService } from 'primeng/api';
import { LiquidacionApiService } from '../services/liquidacion.api.service';
import { Ayudantes, CancelarPartidaRequest, Chofere, LiquidacionDTO, Totalizado } from '../services/dtos/liquidacion.dto';
import { FormComponent, PartidaLiquidacion } from '../form/form.component';
import { AppSharedModule } from '@shared/app-shared.module';
import { EmpleadoApiService } from '../../empleados/services/empleado.api.service';
import { getEmpleadoNombreCompleto } from '../../empleados/services/dtos/empleado.response';
import { forkJoin } from 'rxjs';
import { DateUtilService } from '@shared/services/date-util.service';
import { DialogConfirmComponent } from '@shared/components/dialog-confirm/dialog-confirm.component';
import { NoNegativosDirective } from '@shared/directive/noNegativos.directive';
import { PermisosAvanzadosService } from '@app/core/services/permisos-avanzados.service';
import { ViajeService } from '../../venta-ruta/services/viaje.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-liquidacion-actualizar',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    AppSharedModule,
    AppPrimengModule,
    HeaderComponent,
    BotonRegresarComponent,
    FormComponent,
    DialogConfirmComponent,
    RouterLink,
    NoNegativosDirective,
  ],
  templateUrl: './actualizar.component.html',
  styleUrl: './actualizar.component.scss',
})
export class ActualizarComponent implements AfterViewInit, OnDestroy {
  liquidacionApi = inject(LiquidacionApiService);
  viajeService = inject(ViajeService);
  empleadoApi = inject(EmpleadoApiService);
  
  fb = inject(FormBuilder);
  messageService = inject(MessageService);
  router = inject(Router);
  route = inject(ActivatedRoute);
  dateUtil = inject(DateUtilService);
  permisosAvanzados = inject(PermisosAvanzadosService);
  @ViewChild(FormComponent) formComponent!: FormComponent;
  @ViewChild('liquidacionForm') liquidacionForm!: FormComponent;
  @ViewChild('dialogConfirm') dialogConfirm!: DialogConfirmComponent;

  formulario = this.fb.group({
    folio: [{ value: '', disabled: true }],
    idRuta: ['', Validators.required],
    fecha: [new Date(), Validators.required],
    bloqueNota: ['', Validators.required],
    comentarios: [''],
  });

  idRegistro = '';
  readonly = false;
  puedeCancelarPartidas = false;
  estadoLiquidacion = '';
  resumenBloqueado = false;
  listadoProductos: ProductoSummary[] = [];
  listadoChoferes: ChoferSummary[] = [];
  listaPartidas: PartidaLiquidacion[] = [];
  cancelacionForm = this.fb.group({
    motivo: ['', Validators.required],
  });
  cancelacionLiquidacionForm = this.fb.group({ motivo: ['', Validators.required] });
  mostrarModalCancelacionLiquidacion = false;
  cancelandoLiquidacion = false;
  mostrarModalCancelacion = false;
  cancelandoPartida = false;
  partidaSeleccionadaParaCancelar: PartidaLiquidacion | null = null;
  nuevaPartidaReemplazo: PartidaLiquidacion | null = null;
  erroresNuevaPartida: Record<string, string> = {};
  lastFiltroClienteCancelacion = '';
  private empleadosMap = new Map<string, string>();
  private conteoActualizadoSubscription?: Subscription;

  constructor() {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) this.idRegistro = id;
    });
  }

  ngAfterViewInit(): void {
    this.conteoActualizadoSubscription = this.viajeService.liquidacionConteoActualizado.subscribe(({ idRuta, fecha }) => {
      const actual = this.formulario.getRawValue();
      if (
        String(actual.idRuta ?? '') === String(idRuta ?? '') &&
        this.fechaDia(actual.fecha) === fecha
      ) {
        this.loadLiquidacion();
      }
    });
    this.permisosAvanzados.tiene('CANCELAR_LIQUIDACION').subscribe((respuesta) => {
      this.puedeCancelarPartidas = respuesta.tienePermiso;
    });
    if (this.idRegistro) {
      this.loadLiquidacion();
    }
  }

  ngOnDestroy(): void {
    this.conteoActualizadoSubscription?.unsubscribe();
  }

  private fechaDia(value: unknown): string {
    if (!value) return '';
    if (value instanceof Date) {
      return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
    }
    return String(value).slice(0, 10);
  }

  loadLiquidacion() {
    forkJoin({
      liquidacion: this.liquidacionApi.getOne(this.idRegistro),
      empleados: this.empleadoApi.getAllFilter('?enabled=true'),
    }).subscribe({
      next: ({ liquidacion: response, empleados }) => {
        this.empleadosMap = new Map(
          empleados.map((empleado) => [empleado.idEmpleado, getEmpleadoNombreCompleto(empleado)])
        );
        console.log(response);
        // Verificar si la liquidación está finalizada
        this.readonly = ['FINALIZADA', 'CANCELADA'].includes(response.estadosLiquidacion);
        this.estadoLiquidacion = response.estadosLiquidacion;
        this.resumenBloqueado = Boolean(response?.origenBitacora);
        
        const { formularioValues, listaPartidas, listadoChoferes, nombreProductos } = this.mapEditResponseToSources(response);
        console.log('listadoChoferes',listadoChoferes);

        this.formulario.patchValue(formularioValues);
        this.listaPartidas = listaPartidas;
        this.listadoChoferes = listadoChoferes;
        this.liquidacionForm.nombreProductos = nombreProductos;
        this.liquidacionForm.resumenBloqueado = this.resumenBloqueado;
        this.liquidacionForm.comentarios = response.observaciones ?? '';
        this.liquidacionForm.searchFolio();
        this.liquidacionForm.recalculateLoadedPartidas();

        // Deshabilitar formulario si está finalizada
        if (this.readonly) {
          this.formulario.disable();
        }
      }
    });
  }

  openCancelarPartida(partida: PartidaLiquidacion): void {
    if (!this.puedeCancelarPartidas) return;
    this.partidaSeleccionadaParaCancelar = partida;
    this.erroresNuevaPartida = {};
    this.lastFiltroClienteCancelacion = '';
    this.nuevaPartidaReemplazo = this.buildNuevaPartidaReemplazo(partida);
    this.cancelacionForm.reset({ motivo: '' });
    this.mostrarModalCancelacion = true;
  }

  abrirCancelacionLiquidacion(): void {
    if (!this.puedeCancelarPartidas || this.estadoLiquidacion === 'CANCELADA') return;
    this.cancelacionLiquidacionForm.reset({ motivo: '' });
    this.mostrarModalCancelacionLiquidacion = true;
  }

  cerrarCancelacionLiquidacion(): void {
    this.mostrarModalCancelacionLiquidacion = false;
    this.cancelacionLiquidacionForm.reset({ motivo: '' });
  }

  confirmarCancelacionLiquidacion(): void {
    if (this.cancelacionLiquidacionForm.invalid) {
      this.cancelacionLiquidacionForm.markAllAsTouched();
      return;
    }

    const motivo = String(this.cancelacionLiquidacionForm.getRawValue().motivo ?? '').trim();
    if (!motivo) return;

    this.cancelandoLiquidacion = true;
    this.liquidacionApi.cancelar(this.idRegistro, motivo).subscribe({
      next: () => {
        this.cancelandoLiquidacion = false;
        this.cerrarCancelacionLiquidacion();
        this.messageService.add({ severity: 'success', summary: 'Liquidación cancelada' });
        this.loadLiquidacion();
      },
      error: (error) => {
        this.cancelandoLiquidacion = false;
        this.messageService.add({
          severity: 'error',
          summary: error?.status === 403 ? 'Sin permiso' : 'Error',
          detail: error?.status === 403 ? 'No tienes permiso para cancelar liquidaciones.' : 'No se pudo cancelar la liquidación.',
        });
      },
    });
  }

  cerrarModalCancelacion(): void {
    this.mostrarModalCancelacion = false;
    this.partidaSeleccionadaParaCancelar = null;
    this.nuevaPartidaReemplazo = null;
    this.erroresNuevaPartida = {};
    this.lastFiltroClienteCancelacion = '';
    this.cancelacionForm.reset({ motivo: '' });
  }

  onConceptoVentaReemplazoChange(): void {
    if (!this.nuevaPartidaReemplazo) {
      return;
    }

    this.liquidacionForm.changeConceptoVenta(this.nuevaPartidaReemplazo);
  }

  onFormaPagoReemplazoChange(): void {
    if (!this.nuevaPartidaReemplazo) return;
    this.liquidacionForm.changeFormaPago(this.nuevaPartidaReemplazo);
  }

  onProductoReemplazoChange(): void {
    if (!this.nuevaPartidaReemplazo) {
      return;
    }

    this.liquidacionForm.setProducto(this.nuevaPartidaReemplazo);
  }

  onClienteReemplazoChange(): void {
    if (!this.nuevaPartidaReemplazo) {
      return;
    }

    this.liquidacionForm.setPrecioProducto(this.nuevaPartidaReemplazo);
  }

  recalcularImporteReemplazo(): void {
    if (!this.nuevaPartidaReemplazo) {
      return;
    }

    this.liquidacionForm.calcularImporte(this.nuevaPartidaReemplazo);
  }

  confirmarCancelacionPartida(): void {
    if (!this.partidaSeleccionadaParaCancelar?.id || !this.nuevaPartidaReemplazo) {
      return;
    }

    if (this.cancelacionForm.invalid) {
      this.cancelacionForm.markAllAsTouched();
      return;
    }

    const motivo = String(this.cancelacionForm.getRawValue().motivo ?? '').trim();
    if (!motivo) {
      this.cancelacionForm.get('motivo')?.setErrors({ required: true });
      return;
    }

    const errores = this.validarNuevaPartida(this.nuevaPartidaReemplazo);
    if (Object.keys(errores).length > 0) {
      this.erroresNuevaPartida = errores;
      return;
    }

    this.erroresNuevaPartida = {};
    const request = this.buildCancelarPartidaRequest(motivo, this.nuevaPartidaReemplazo);

    this.cancelandoPartida = true;
    this.liquidacionApi
      .cancelarPartida(this.idRegistro, this.partidaSeleccionadaParaCancelar.id, request)
      .subscribe({
        next: () => {
          this.cancelandoPartida = false;
          this.cerrarModalCancelacion();
          this.messageService.add({
            key: 'top-right',
            severity: 'success',
            summary: 'Partida cancelada',
            detail: 'La partida se canceló y se registró la nueva partida de reemplazo.',
          });
          this.loadLiquidacion();
        },
        error: (error) => {
          this.cancelandoPartida = false;
          this.messageService.add({
            key: 'top-right',
            severity: 'error',
            summary: error?.status === 403 ? 'Sin permiso' : 'Error',
            detail: error?.status === 403 ? 'No tienes permiso para cancelar liquidaciones.' : 'No se pudo cancelar la partida.',
          });
        },
      });
  }

  private buildNuevaPartidaReemplazo(partidaOriginal: PartidaLiquidacion): PartidaLiquidacion {
    const base = this.liquidacionForm.createBlankPartida();

    return {
      ...base,
      conceptoVenta: partidaOriginal.conceptoVenta,
      descuento: partidaOriginal.descuento ?? 0,
      factura: partidaOriginal.factura ?? false,
      cliente: partidaOriginal.cliente || base.cliente,
      producto: partidaOriginal.producto,
      cantidad: partidaOriginal.cantidad ?? 0,
      precio: partidaOriginal.precio ?? 0,
      importe: partidaOriginal.importe ?? 0,
      formaPago: partidaOriginal.formaPago || base.formaPago,
    };
  }

  private validarNuevaPartida(partida: PartidaLiquidacion): Record<string, string> {
    const errores: Record<string, string> = {};

    if (!partida.conceptoVenta) {
      errores['conceptoVenta'] = 'Concepto de venta requerido';
    }
    if (!partida.cliente) {
      errores['cliente'] = 'Cliente requerido';
    }
    if (!partida.producto) {
      errores['producto'] = 'Producto requerido';
    }
    if (!partida.formaPago) {
      errores['formaPago'] = 'Forma de pago requerida';
    }
    if (!this.liquidacionForm.isFolioDisabledPartida(partida) && (!partida.folio || partida.folio <= 0)) {
      errores['folio'] = 'Folio inválido';
    }
    if (!partida.cantidad || partida.cantidad <= 0) {
      errores['cantidad'] = 'Cantidad debe ser mayor a 0';
    }
    if (!partida.precio || partida.precio <= 0) {
      errores['precio'] = 'Precio debe ser mayor a 0';
    }

    return errores;
  }

  private buildCancelarPartidaRequest(
    motivo: string,
    partida: PartidaLiquidacion
  ): CancelarPartidaRequest {
    return {
      motivo,
      nuevaPartida: {
        cantidad: partida.cantidad,
        descuento: partida.descuento ?? 0,
        factura: !!partida.factura,
        folio: this.liquidacionForm.isFolioDisabledPartida(partida) ? null : partida.folio,
        formaPago: partida.formaPago || 'CONTADO',
        idCliente: partida.cliente,
        idConceptoVenta: partida.conceptoVenta,
        idPartida: partida.id || '',
        idProducto: partida.producto,
        precio: partida.precio,
      },
    };
  }

  private getNombreEmpleadoPorId(idEmpleado: string | undefined, fallback = ''): string {
    if (!idEmpleado) {
      return fallback;
    }

    return this.empleadosMap.get(idEmpleado) ?? fallback;
  }

  mapToNombreProductos(resp: any, includePartidas = false): ProductoSummary[] {
    const totalizados: any[] = resp?.totalizados ?? [];
    const map = new Map<string, ProductoSummary>();

    for (const t of totalizados) {
      const idProducto = t?.producto?.idProductoComercial;
      const nombre = t?.producto?.nombre ?? '';
      const idTotalizado = t?.id ?? '';
      if (!idProducto) continue;

      if (!map.has(idProducto)) {
        map.set(idProducto, {
          id: idProducto,
          idTotalizado,
          nombre,
          cantidad: 0,
          manual: true,
        });
      } else {
        const curr = map.get(idProducto)!;
        if (!curr.idTotalizado && idTotalizado) curr.idTotalizado = idTotalizado;
      }
    }

    if (includePartidas) {
      const partidas: any[] = resp?.partidas ?? [];
      for (const partida of partidas) {
        const prod = partida?.productoComercial;
        const idProducto = prod?.idProductoComercial;
        if (!idProducto) continue;

        if (!map.has(idProducto)) {
          map.set(idProducto, {
            id: idProducto,
            idTotalizado: '',
            nombre: prod?.nombre ?? '',
            cantidad: 0,
            manual: true,
          });
        }
      }
    }

    return Array.from(map.values()).sort((a, b) => a.nombre.localeCompare(b.nombre));
  }

  mapToListadoChoferes(resp: any, nombreProductos: ProductoSummary[]): ChoferSummary[] {
    const totalizados: any[] = resp?.totalizados ?? [];

    type ProdAgg = { id: string; nombre: string; cantidad: number; manual?: boolean };
    type AyAgg = { id: string; nombre: string; productos: Map<string, ProdAgg> };
    type ChoAgg = { id: string; nombre: string; productos: Map<string, ProdAgg>; ayudantes: Map<string, AyAgg> };

    const choferesMap = new Map<string, ChoAgg>();

    const upsertProd = (map: Map<string, ProdAgg>, id: string, nombre: string, cant: number) => {
      const curr = map.get(id);
      if (!curr) {
        map.set(id, { id, nombre, cantidad: cant ?? 0, manual: true });
      } else {
        curr.cantidad = (curr.cantidad ?? 0) + (cant ?? 0);
      }
    };

    for (const t of totalizados) {
      const prodId = t?.producto?.idProductoComercial;
      const prodNombre = t?.producto?.nombre ?? '';
      if (!prodId) continue;

      for (const ch of t?.choferes ?? []) {
        const chId = ch?.empleado?.idEmpleado;
        const chNombre = this.getNombreEmpleadoPorId(
          chId,
          getEmpleadoNombreCompleto(ch?.empleado) || ch?.empleado?.nombre || ''
        );
        const chTotal = ch?.total ?? 0;

        if (!chId) continue;

        if (!choferesMap.has(chId)) {
          choferesMap.set(chId, {
            id: chId,
            nombre: chNombre,
            productos: new Map<string, ProdAgg>(),
            ayudantes: new Map<string, AyAgg>(),
          });
        }
        const chAgg = choferesMap.get(chId)!;

        if (chTotal && chTotal !== 0) {
          upsertProd(chAgg.productos, prodId, prodNombre, chTotal);
        }

        for (const ay of ch?.ayudantes ?? []) {
          const ayId = ay?.empleado?.idEmpleado;
          const ayNombre = this.getNombreEmpleadoPorId(
            ayId,
            getEmpleadoNombreCompleto(ay?.empleado) || ay?.empleado?.nombre || ''
          );
          const ayTotal = ay?.total ?? 0;
          if (!ayId) continue;

          if (!chAgg.ayudantes.has(ayId)) {
            chAgg.ayudantes.set(ayId, {
              id: ayId,
              nombre: ayNombre,
              productos: new Map<string, ProdAgg>(),
            });
          }
          const ayAgg = chAgg.ayudantes.get(ayId)!;
          upsertProd(ayAgg.productos, prodId, prodNombre, ayTotal);
        }
      }
    }

    const listado: ChoferSummary[] = [];
    for (const [, ch] of choferesMap) {
      const productos: ProductoSummary[] = nombreProductos.map(np => {
        const prod = ch.productos.get(np.id);
        return prod
          ? { id: prod.id, nombre: prod.nombre, cantidad: prod.cantidad, manual: true }
          : { id: np.id, nombre: np.nombre, cantidad: 0, manual: true };
      });

      const ayudantes: AyudanteSummary[] = [];
      for (const [, ay] of ch.ayudantes) {
        const prodsAy: ProductoSummary[] = nombreProductos.map(np => {
          const prod = ay.productos.get(np.id);
          return prod
            ? { id: prod.id, nombre: prod.nombre, cantidad: prod.cantidad, manual: true }
            : { id: np.id, nombre: np.nombre, cantidad: 0, manual: true };
        });

        ayudantes.push({
          id: ay.id,
          nombre: ay.nombre,
          productos: prodsAy,
        });
      }

      listado.push({
        id: ch.id,
        nombre: ch.nombre,
        productos,
        ayudantes,
      });
    }

    return listado.sort((a, b) => (a.nombre ?? '').localeCompare(b.nombre ?? ''));
  }

  mapToFormularioValues(resp: any) {
    const ruta = resp?.ruta ?? {};

    return {
      folio: resp?.folio ?? '',
      idRuta: ruta?.id ?? '',
      fecha: this.dateUtil.fromApiDateTime(resp?.fecha) ?? new Date(),
      bloqueNota: resp?.bloqueNota ?? '',
      comentarios: resp?.observaciones ?? ''
    };
  }

  mapToListaPartidas(resp: any): PartidaLiquidacion[] {
    const partidas: any[] = resp?.partidas ?? [];
    const out: PartidaLiquidacion[] = partidas.map(p => ({
      id: p?.idPartida,
      conceptoVenta: p?.conceptosVentas?.id,
      descuento: p?.descuento ?? 0,
      cancelada: p?.cancelada ?? p?.cancelado ?? false,
      motivoCancelacion:
        p?.motivoCancelacion ??
        p?.motivo ??
        p?.razonCancelacion ??
        p?.motivoCancelacionPartida ??
        '',
      factura: !!p?.factura,
      cliente: p?.cliente?.id,
      producto: p?.productoComercial?.idProductoComercial,
      cantidad: p?.cantidad ?? 0,
      precio: p?.precio ?? 0,
      importe: p?.importe ?? 0,
      folio: p?.folio ?? 0,
      formaPago: p?.formaPago ?? 'CONTADO',
    }));

    out.sort((a, b) => (a.folio ?? 0) - (b.folio ?? 0));
    return out;
  }

  mapEditResponseToSources(resp: any) {
    const origenBitacora = Boolean(resp?.origenBitacora);
    const nombreProductos = this.mapToNombreProductos(resp, !origenBitacora);
    return {
      formularioValues: this.mapToFormularioValues(resp),
      listaPartidas: this.mapToListaPartidas(resp),
      listadoChoferes: this.mapToListadoChoferes(resp, nombreProductos),
      nombreProductos,
    };
  }

  buildLiquidacionDTOForPut(
    formulario: FormGroup,
    listaPartidas: PartidaLiquidacion[],
    listadoChoferes: ChoferSummary[],
    nombreProductos: ProductoSummary[]
  ): LiquidacionDTO {
    const v = formulario.getRawValue();
     // Normaliza a Date por si el control trae string ISO
  const fechaControl = v.fecha!;
  const fechaDate = fechaControl instanceof Date ? fechaControl : new Date(fechaControl as string);
    return {
      bloqueNota: v.bloqueNota ?? '',
      estado: 'PENDIENTE',
      fecha: this.dateUtil.toLocalISOString(fechaDate),
      idRuta: v.idRuta,
      observaciones: v.comentarios ?? '',
      partida: listaPartidas
        .slice()
        .sort((a, b) => (a.folio ?? Number.MAX_SAFE_INTEGER) - (b.folio ?? Number.MAX_SAFE_INTEGER))
        .map(p => ({
          cantidad: p.cantidad,
          descuento: p.descuento,
          folio: this.liquidacionForm.isFolioDisabledPartida(p) ? null : p.folio,
          formaPago: (p.formaPago)?p.formaPago: 'CONTADO',
          idCliente: p.cliente,
          idConceptoVenta: p.conceptoVenta,
          idPartida: p.id,
          idProducto: p.producto,
          precio: p.precio,
          factura: p.factura
        })),
      totalizados: this.buildTotalizadosForPut(listadoChoferes, nombreProductos),
    };
  }

  buildTotalizadosForPut(
    listadoChoferes: ChoferSummary[],
    nombreProductos: ProductoSummary[]
  ): Totalizado[] {
    const totalizadoIdByProd = new Map<string, string>(
      nombreProductos.map(p => [p.id, p.idTotalizado ?? ''])
    );

    const byProducto = new Map<string, Map<string, { total: number; ayudantes: Map<string, number> }>>();

    for (const ch of listadoChoferes ?? []) {
      const chProd = new Map<string, number>();
      for (const p of ch.productos ?? []) {
        chProd.set(p.id, (chProd.get(p.id) ?? 0) + (p.cantidad ?? 0));
      }

      const vistos = new Set<string>(chProd.keys());
      for (const ay of ch.ayudantes ?? []) {
        for (const p of ay.productos ?? []) vistos.add(p.id);
      }

      for (const idProducto of vistos) {
        if (!byProducto.has(idProducto)) byProducto.set(idProducto, new Map());
        const mapChoferes = byProducto.get(idProducto)!;

        if (!mapChoferes.has(ch.id)) {
          mapChoferes.set(ch.id, { total: 0, ayudantes: new Map() });
        }
        const entry = mapChoferes.get(ch.id)!;

        entry.total += chProd.get(idProducto) ?? 0;

        for (const ay of ch.ayudantes ?? []) {
          const prodAy = (ay.productos ?? []).find(p => p.id === idProducto);
          const cant = prodAy?.cantidad ?? 0;
          if (cant) entry.ayudantes.set(ay.id, (entry.ayudantes.get(ay.id) ?? 0) + cant);
        }
      }
    }

    const out: Totalizado[] = [];
    for (const [idProducto, choferesMap] of byProducto) {
      const choferes: Chofere[] = [];
      for (const [idEmpleado, info] of choferesMap) {
        const sumaAy = Array.from(info.ayudantes.values()).reduce((a, b) => a + b, 0);
        if (info.total !== 0 || sumaAy !== 0) {
          const ayudantes: Ayudantes[] = Array.from(info.ayudantes.entries())
            .map(([idAy, total]) => ({ idEmpleado: idAy, total }));
          choferes.push({ idEmpleado, total: info.total, ayudantes });
        }
      }

      const idTotalizado = totalizadoIdByProd.get(idProducto) ?? '';

      out.push({
        idProducto,
        idTotalizado,
        choferes,
      });
    }

    out.sort((a, b) => a.idProducto.localeCompare(b.idProducto));
    return out;
  }

  guardar() {
    this.messageService.clear();

    if (!this.formulario.valid) {
      this.formulario.markAllAsTouched();
      this.messageService.add({
        severity: 'warn',
        summary: 'Formulario inválido',
        detail: 'Por favor complete todos los campos requeridos'
      });
      return;
    }

    const partidasInvalidas = this.validarPartidas();
    if (partidasInvalidas.length > 0) {
      const erroresPorTipo = this.contarErroresPorTipo(partidasInvalidas);
      const detalleErrores = Object.entries(erroresPorTipo)
        .map(([campo, cantidad]) => `${cantidad} ${this.getNombreCampo(campo)}`)
        .join(', ');

      this.messageService.add({
        severity: 'warn',
        summary: 'Partidas inválidas',
        detail: `Se encontraron ${partidasInvalidas.length} partidas con errores: ${detalleErrores}. Revise los campos marcados en rojo.`
      });
      return;
    }

    this.openConfirmLiquidacion();
  }

  confirmarLiquidacion() {
    const partidas = this.liquidacionForm?.listaPartidas ?? [];
    let request = this.buildLiquidacionDTOForPut(
      this.formulario,
      partidas,
      this.liquidacionForm.listadoChoferes,
      this.liquidacionForm.nombreProductos
    );
    request.observaciones = this.liquidacionForm.comentarios ?? '';
    request.estado = 'FINALIZADA';

    this.liquidacionApi.update(request, this.idRegistro).subscribe({
      next: () => {
        this.messageService.add({
          key: 'top-right',
          severity: 'success',
          summary: '¡Liquidación guardada!',
          detail: 'Se ha guardado la liquidación exitosamente'
        });
        this.handleHide();
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo guardar la liquidación'
        });
      }
    });
  }

  private openConfirmLiquidacion() {
    this.dialogConfirm.icon = 'fa-circle-check';
    this.dialogConfirm.title = '¿Confirmar Liquidación?';
    this.dialogConfirm.description = 'Esta operación establecerá el estado FINALIZADA y bloqueará la edición de partidas, folios y totalizados.';
    this.dialogConfirm.labelBtn = 'Confirmar';
    this.dialogConfirm.display = true;
  }

  borrador() {
    let request = this.buildLiquidacionDTOForPut(
      this.formulario,
      this.liquidacionForm.listaPartidas,
      this.liquidacionForm.listadoChoferes,
      this.liquidacionForm.nombreProductos
    );

        request.observaciones = this.liquidacionForm.comentarios ?? '';

    console.log(this.liquidacionForm.listaPartidas);
    this.liquidacionApi.update(request, this.idRegistro).subscribe({
      next: () => {
        this.messageService.add({
          key: 'top-right',
          severity: 'success',
          summary: '¡Borrador guardado!',
          detail: 'Se ha guardado la liquidación'
        });
        this.handleHide();
      }
    });
  }

  private validarPartidas(): PartidaLiquidacion[] {
    const partidasInvalidas: PartidaLiquidacion[] = [];

    for (const partida of this.liquidacionForm.listaPartidas) {
      console.log(partida);
      const conceptoCancelado = this.esConceptoCancelado(partida.conceptoVenta);
      
      // Resetear errores específicos
      (partida as any).hasError = false;
      (partida as any).errores = {};
      
      if (!conceptoCancelado) {
        const errores: any = {};
        
        if (!partida.cliente) errores.cliente = 'Cliente requerido';
        if (!partida.producto) errores.producto = 'Producto requerido';
        if (!partida.conceptoVenta) errores.conceptoVenta = 'Concepto de venta requerido';
        if (partida.cantidad <= 0) errores.cantidad = 'Cantidad debe ser mayor a 0';
        if (partida.precio <= 0) errores.precio = 'Precio debe ser mayor a 0';

        const tieneErrores = Object.keys(errores).length > 0;
        
        if (tieneErrores) {
          (partida as any).hasError = true;
          (partida as any).errores = errores;
          partidasInvalidas.push(partida);
        }
      }
    }

    return partidasInvalidas;
  }

  private esConceptoCancelado(conceptoVentaId: string): boolean {
    if (!this.liquidacionForm?.listaConceptoVenta) return false;

    const concepto = this.liquidacionForm.listaConceptoVenta.find(
      c => c.value === conceptoVentaId
    );

    return concepto?.data?.cancelado || false;
  }

  validarPartidasEnTiempoReal() {
    this.validarPartidas();
  }

  private contarErroresPorTipo(partidasInvalidas: PartidaLiquidacion[]): {[key: string]: number} {
    const contadores: {[key: string]: number} = {};
    
    partidasInvalidas.forEach(partida => {
      if ((partida as any).errores) {
        Object.keys((partida as any).errores).forEach(campo => {
          contadores[campo] = (contadores[campo] || 0) + 1;
        });
      }
    });
    
    return contadores;
  }

  private getNombreCampo(campo: string): string {
    const nombres: {[key: string]: string} = {
      'cliente': 'sin cliente',
      'producto': 'sin producto', 
      'conceptoVenta': 'sin concepto de venta',
      'cantidad': 'con cantidad inválida',
      'precio': 'con precio inválido'
    };
    
    return nombres[campo] || campo;
  }


  handleHide() {
    this.formulario.reset();
    this.listaPartidas = [];
    this.router.navigate(['../../'], { relativeTo: this.route });
  }

  getNombreCliente(idCliente: string | undefined): string {
    if (!idCliente) {
      return '-';
    }

    const partida = this.liquidacionForm?.listaClientes?.find((item) => String(item.value) === String(idCliente));
    return partida?.label ?? idCliente;
  }

  getNombreProducto(idProducto: string | undefined): string {
    if (!idProducto) {
      return '-';
    }

    const producto = this.liquidacionForm?.listaProductos?.find((item) => String(item.value) === String(idProducto));
    return producto?.label ?? idProducto;
  }

  getNombreConcepto(idConcepto: string | undefined): string {
    if (!idConcepto) {
      return '-';
    }

    const concepto = this.liquidacionForm?.listaConceptoVenta?.find((item) => String(item.value) === String(idConcepto));
    return concepto?.label ?? idConcepto;
  }

  getNombreFormaPago(value: string | undefined): string {
    if (!value) {
      return '-';
    }

    const formaPago = this.liquidacionForm?.listaFormaPago?.find((item) => String(item.code) === String(value));
    return formaPago?.name ?? value;
  }
}

export interface ProductoSummary {
  id: string;
  idTotalizado?: string;
  nombre: string;
  cantidad: number;
  manual?: boolean;
}

export interface AyudanteSummary {
  id: string;
  nombre: string;
  productos: ProductoSummary[];
}

export interface ChoferSummary {
  id: string;
  nombre: string;
  productos: ProductoSummary[];
  ayudantes: AyudanteSummary[];
}
