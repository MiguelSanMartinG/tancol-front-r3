import { CommonModule } from '@angular/common';
import {
  Component,
  Input,
  OnInit,
  DoCheck,
  ViewChild,
  AfterViewInit,
  inject,
  SimpleChanges,
} from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { MessageErrorComponent } from '@shared/components/message-error/message-error.component';
import { AppSharedModule } from '@shared/app-shared.module';
import { Table, TableColResizeEvent } from 'primeng/table';
import { MessageService } from 'primeng/api';
import { RutasApiService } from '../../rutas/services/rutas-api.service';
import { EmpleadoApiService } from '../../empleados/services/empleado.api.service';
import { VehiculosApiService } from '../../vehiculos/services/vehiculos-api.service';
import { UnidadMedidaService } from '../../unidades-medida/service/unidad-medida.service';
import { SelectModel } from '@core/common/select.model';
import { VehiculosResponse } from '../../vehiculos/services/vehiculos.response';
import { NuestrosProductosService } from '../../nuestros-productos/service/nuestros-productos.service';
import { DialogPartidaComponent } from '../dialog-partida/dialog-partida.component';
import { DialogSignatureComponent } from '@shared/components/dialog-signature/dialog-signature.component';
import { UploadFileApiService } from '@shared/services/upload-file.api.service';
import { VentaRutaApiService } from '../services/venta-ruta.api.service';
import {
  PartidaBitacoraDTO,
  PartidaBitacoraRutaService,
} from '../services/partida-bitacora-ruta.service';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { FueraEspecificacionApiService } from '../../fuera-especificacion/services/fuera-especificacion.api.service';
import { LocalStorageService } from '@shared/services/local-storage.service';
import { SoloNumerosEnterosDirective } from '@shared/directive/solo-numeros-enteros.directive';
import { ViajeService } from '../services/viaje.service';
import { Merma, VentaTrayecto, ViajeDto } from '../services/viaje-dto';
import { parse } from 'uuid';
import { DatetimePipe } from '@shared/pipes/datetime.pipe';
import { EmpleadoResponseDto, getEmpleadoNombreCompleto } from '../../empleados/services/dtos/empleado.response';
import { environment } from '../../../../../environments/environment';
@Component({
  selector: 'app-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AppPrimengModule,
    AppSharedModule,
    MessageErrorComponent,
    DialogPartidaComponent,
    DialogSignatureComponent,
    SoloNumerosEnterosDirective,
    DatetimePipe,
  ],
  templateUrl: './form.component.html',
  styleUrl: './form.component.scss',
})
export class FormComponent implements OnInit, AfterViewInit, DoCheck {
  @Input() formulario!: FormGroup;
  @Input() listaPartidas: PartidaVenta[] = [];
  @Input() readonly = false;
  @ViewChild('table') table!: Table;
  @ViewChild(DialogPartidaComponent) dialogPartida!: DialogPartidaComponent;
  @ViewChild(DialogSignatureComponent)
  dialogSignature!: DialogSignatureComponent;
  localStorage = inject(LocalStorageService);

  uploadFileApi = inject(UploadFileApiService);

  itemFirma!: PartidaVenta;

  rutasService = inject(RutasApiService);
  empleadoService = inject(EmpleadoApiService);
  vehiculoService = inject(VehiculosApiService);
  unidadService = inject(UnidadMedidaService);
  messageService = inject(MessageService);
  productosService = inject(NuestrosProductosService);
  ventaRutaService = inject(VentaRutaApiService);
  partidaBitacoraService = inject(PartidaBitacoraRutaService);
  viajeService = inject(ViajeService);
  fueraEspecificacionApiService = inject(FueraEspecificacionApiService);

  listaRutas: SelectModel[] = [];
  rutaFiltro: string[] = [];
  filtrosPartidas = {
    fechaLlegada: '',
    procesos: [] as string[],
    ayudantes: '',
    choferes: [] as string[],
    productos: [] as string[],
    vehiculos: [] as string[],
    capMax: '',
    saleCon: '',
    regresaCon: '',
    vendidos: '',
    fechaFirma: '',
  };
  activeFilterColumn = '';
  listaProcesos: SelectModel[] = [
    { label: 'Manual1', value: 'MANUAL_1' },
    { label: 'Manual2', value: 'MANUAL_2' },
    { label: 'Autoservicio', value: 'AUTOSERVICIO' },
    { label: 'Las Torres', value: 'TORRES' },
    { label: 'Automático', value: 'AUTOMATICO' },
    { label: 'Sin Proceso', value: 'SIN_PROCESO' },
  ];
  listaProductos: SelectModel[] = [];
  listaEmpleados: SelectModel[] = [];
  listaVehiculos: SelectModel[] = [];
  listaUnidades: SelectModel[] = [];
  listaMotivos: SelectModel[] = [];
  listaSeleccionada: any[] = [];

  listaAyudantes: SelectModel[] = [];
  listaChoferes: SelectModel[] = [];
  private empleadosCatalogo = new Map<string, EmpleadoResponseDto>();
  private employeeReferenceSignature = '';

  get partidasFiltradas(): PartidaVenta[] {
    return this.listaPartidas.filter((partida) =>
      (!this.rutaFiltro.length || this.rutaFiltro.includes(String(partida.ruta ?? ''))) &&
      (!this.filtrosPartidas.procesos.length || this.filtrosPartidas.procesos.includes(String(partida.proceso ?? ''))) &&
      (!this.filtrosPartidas.choferes.length || this.filtrosPartidas.choferes.includes(String(partida.chofer ?? ''))) &&
      (!this.filtrosPartidas.productos.length || this.filtrosPartidas.productos.includes(String(partida.producto ?? ''))) &&
      (!this.filtrosPartidas.vehiculos.length || this.filtrosPartidas.vehiculos.includes(String(partida.vehiculo ?? ''))) &&
      this.matchesPartidaText(partida.fechallegada, this.filtrosPartidas.fechaLlegada) &&
      this.matchesPartidaText(this.getAyudantesFilterText(partida), this.filtrosPartidas.ayudantes) &&
      this.matchesPartidaText(partida.capMax, this.filtrosPartidas.capMax) &&
      this.matchesPartidaText(partida.saleCon, this.filtrosPartidas.saleCon) &&
      this.matchesPartidaText(partida.regresaCon, this.filtrosPartidas.regresaCon) &&
      this.matchesPartidaText(partida.vendidos, this.filtrosPartidas.vendidos) &&
      this.matchesPartidaText(partida.fechaFirma, this.filtrosPartidas.fechaFirma)
    );
  }

  get totalizadoresVenta(): { porRutaProducto: TotalRutaProducto[]; porEmpleado: TotalEmpleadoVenta[] } {
    const productos = new Map<string, TotalRutaProducto>();
    const empleados = new Map<string, TotalEmpleadoVenta>();

    for (const partida of this.partidasFiltradas) {
      for (const trayecto of partida.ventaTrayecto ?? []) {
        const vendidos = Math.max(
          Number(trayecto.cantidadSalida ?? 0) - Number(trayecto.cantidadLlegada ?? 0),
          0
        );
        if (!Number.isFinite(vendidos) || vendidos === 0) continue;

        const producto = this.listaProductos.find((option) => option.value === trayecto.idProducto);
        const ruta = this.listaRutas.find((option) => option.value === partida.ruta)?.label ?? 'Sin ruta';
        const nombreProducto = producto?.label ?? 'Sin producto';
        const unidad = producto?.data?.unidadMedidaDefault?.nombre ?? 'Unidad sin configurar';
        const productoKey = JSON.stringify([ruta, nombreProducto, unidad]);
        const totalProducto = productos.get(productoKey) ?? { ruta, producto: nombreProducto, unidad, cantidad: 0 };
        totalProducto.cantidad += vendidos;
        productos.set(productoKey, totalProducto);

        const sumarEmpleado = (idEmpleado: string, tipo: 'Chofer' | 'Ayudante', cantidad: number) => {
          if (!idEmpleado || !Number.isFinite(cantidad) || cantidad <= 0) return;
          const empleado = this.listaEmpleados.find((option) => option.value === idEmpleado);
          const nombre = empleado?.label ?? idEmpleado;
          const key = JSON.stringify([tipo, idEmpleado, unidad]);
          const total = empleados.get(key) ?? { nombre, tipo, unidad, cantidad: 0 };
          total.cantidad += cantidad;
          empleados.set(key, total);
        };

        sumarEmpleado(String(partida.chofer ?? ''), 'Chofer', vendidos);
        for (const ayudante of partida.ayudantes ?? []) {
          const comision = trayecto.comisionesEmpleado
            ?.filter((item) => item.idEmpleado === ayudante)
            .reduce((total, item) => total + Number(item.cantidad ?? 0), 0) ?? 0;
          sumarEmpleado(ayudante, 'Ayudante', comision);
        }
      }
    }

    return { porRutaProducto: Array.from(productos.values()), porEmpleado: Array.from(empleados.values()) };
  }

  private matchesPartidaText(value: unknown, filter: string): boolean {
    return !filter.trim() || String(value ?? '').toLowerCase().includes(filter.trim().toLowerCase());
  }

  private getAyudantesFilterText(partida: PartidaVenta): string {
    return (partida.ayudantes ?? [])
      .map((id) => this.listaAyudantes.find((option) => String(option.value) === String(id))?.label ?? id)
      .join(' ');
  }

  get activeFilterLabel(): string {
    const labels: Record<string, string> = {
      fechaLlegada: 'Fecha llegada',
      ruta: 'Ruta',
      proceso: 'Proceso',
      procesos: 'Proceso',
      ayudantes: 'Ayudantes',
      chofer: 'Chofer',
      choferes: 'Chofer',
      producto: 'Producto',
      productos: 'Producto',
      vehiculo: 'Vehículo',
      vehiculos: 'Vehículo',
      capMax: 'Cap. máx.',
      saleCon: 'Sale con',
      regresaCon: 'Regresa con',
      vendidos: 'Vendidos',
      fechaFirma: 'Fecha firma',
    };
    return labels[this.activeFilterColumn] ?? '';
  }

  openColumnFilter(column: string, popover: any, event: Event): void {
    this.activeFilterColumn = column;
    popover.toggle(event);
  }

  isColumnFiltered(column: string): boolean {
    const value = column === 'ruta'
      ? this.rutaFiltro
      : (this.filtrosPartidas as any)[column];
    return Array.isArray(value) ? value.length > 0 : !!String(value ?? '').trim();
  }

  vehiculosResponse: VehiculosResponse[] = [];
  desactivar:boolean = false;

  ngOnInit(): void {
    this.rutasService.getAllFilter('?enabled=true').subscribe((resp) => {
      this.listaRutas = resp.map((r) => ({ label: r.nombre, value: r.id }));
    });
    this.empleadoService.getAllFilter('?enabled=true').subscribe((resp) => {
      this.empleadosCatalogo = new Map(
        resp.map((empleado) => [empleado.idEmpleado, empleado])
      );
      this.loadReferencedDisabledEmployees();
    });
    this.vehiculoService.getAll().subscribe((resp) => {
      this.vehiculosResponse = resp;
      this.listaVehiculos = resp.map((e) => ({ label: e.nombre, value: e.id }));
    });
    this.unidadService.getAll().subscribe((resp) => {
      this.listaUnidades = resp.map((u) => ({
        label: u.nombre,
        value: u.nombre,
      }));
    });
    this.productosService.getAll().subscribe((resp) => {
      this.listaProductos = resp.map((p) => ({
        label: p.nombre,
        value: p.idProductoComercial,
        data: p,
      }));
    });
    this.fueraEspecificacionApiService.getAll().subscribe((resp) => {
      this.listaMotivos = resp.map((p) => ({ label: p.motivo, value: p.id }));
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['listaPartidas'] && changes['listaPartidas'].currentValue) {
      setTimeout(() => this.restoreColumnWidths());
      this.loadReferencedDisabledEmployees();
    }
  }

  ngDoCheck(): void {
    const nextSignature = this.buildEmployeeReferenceSignature();
    if (nextSignature !== this.employeeReferenceSignature) {
      this.employeeReferenceSignature = nextSignature;
      this.loadReferencedDisabledEmployees();
    }
  }

  private loadReferencedDisabledEmployees(): void {
    for (const partida of this.listaPartidas ?? []) {
      this.mergeEmpleadoFromBitacora(partida.chofer, partida.original?.conductor);

      for (const trayecto of partida.original?.ventaTrayecto ?? []) {
        for (const comision of trayecto.comisionesEmpleados ?? []) {
          this.mergeEmpleadoFromBitacora(
            comision?.empleado?.idEmpleado,
            comision?.empleado
          );
        }
        for (const merma of trayecto.mermas ?? []) {
          this.mergeEmpleadoFromBitacora(
            merma?.empleadoResponsable?.idEmpleado ?? merma?.idEmpleado,
            merma?.empleadoResponsable
          );
        }
      }
    }

    this.refreshEmployeeOptions();

    for (const partida of this.listaPartidas ?? []) {
      this.ensureChoferOptionForPartida(partida);
    }
  }

  private buildEmployeeReferenceSignature(): string {
    return (this.listaPartidas ?? [])
      .map((partida) => {
        const ayudantes = (partida.ayudantes ?? []).join(',');
        const choferOriginal = partida.original?.conductor?.idEmpleado ?? '';
        const responsables = (partida.original?.ventaTrayecto ?? [])
          .flatMap((trayecto: any) => (trayecto.mermas ?? []).map((merma: any) => merma?.empleadoResponsable?.idEmpleado ?? merma?.idEmpleado ?? ''))
          .join(',');
        return `${partida.id ?? 'new'}|${partida.chofer ?? ''}|${choferOriginal}|${ayudantes}|${responsables}`;
      })
      .join('||');
  }

  private mergeEmpleadoFromBitacora(idEmpleado?: string | null, empleado?: any): void {
    if (!idEmpleado || this.empleadosCatalogo.has(idEmpleado) || !empleado) {
      return;
    }

    this.empleadosCatalogo.set(idEmpleado, {
      idEmpleado,
      nombre: empleado.nombre ?? '',
      apellidoPaterno: empleado.apellidoPaterno ?? '',
      apellidoMaterno: empleado.apellidoMaterno ?? '',
      email: empleado.email ?? '',
      telefono: empleado.telefono ?? '',
      role: empleado.role ?? { id: 0, name: '' },
      departamento: empleado.departamento ?? {
        id: '',
        idDepartamento: '',
        alias: '',
        nombre: '',
        descripcion: '',
        empleados: [],
      },
      tipoEmpleado: empleado.tipoEmpleado ?? {
        idTipoEmpleado: '',
        nombre: '',
        alias: '',
        enabled: false,
        createdAt: '',
        updatedAt: '',
        empleados: null,
      },
      createdAt: empleado.createdAt ?? '',
      updatedAt: empleado.updatedAt ?? '',
      enabled: false,
    });
  }

  private refreshEmployeeOptions(): void {
    const empleados = Array.from(this.empleadosCatalogo.values()).sort((a, b) =>
      this.getEmpleadoOptionLabel(a).localeCompare(this.getEmpleadoOptionLabel(b))
    );

    this.listaEmpleados = empleados.map((empleado) =>
      this.toEmpleadoOption(empleado)
    );

    const opcionesEmpleados = empleados.map((empleado) => this.toEmpleadoOption(empleado));
    this.listaAyudantes = [...opcionesEmpleados];
    this.listaChoferes = [...opcionesEmpleados];
  }

  private ensureChoferOptionForPartida(partida: PartidaVenta): void {
    const idChofer = String(partida.chofer ?? '');
    if (!idChofer || this.listaChoferes.some((option) => option.value === idChofer)) {
      return;
    }

    const empleadoCatalogo = this.empleadosCatalogo.get(idChofer);
    if (empleadoCatalogo) {
      this.listaChoferes = [...this.listaChoferes, this.toEmpleadoOption(empleadoCatalogo)]
        .sort((a, b) => a.label.localeCompare(b.label));
      return;
    }

    const choferOriginal = partida.original?.conductor;
    if (choferOriginal?.idEmpleado === idChofer) {
      this.mergeEmpleadoFromBitacora(idChofer, choferOriginal);
      const empleado = this.empleadosCatalogo.get(idChofer);
      if (empleado) {
        this.listaChoferes = [...this.listaChoferes, this.toEmpleadoOption(empleado)]
          .sort((a, b) => a.label.localeCompare(b.label));
      }
    }
  }

  getChoferOptions(item: PartidaVenta): SelectModel[] {
    this.ensureChoferOptionForPartida(item);

    const idChofer = String(item?.chofer ?? '');
    if (!idChofer) {
      return this.listaChoferes;
    }

    if (this.listaChoferes.some((option) => option.value === idChofer)) {
      return this.listaChoferes.map((option) =>
        option.value === idChofer ? { ...option, disabled: false } : option
      );
    }

    const choferOriginal = item?.original?.conductor;
    if (choferOriginal?.idEmpleado === idChofer) {
      const nombre = getEmpleadoNombreCompleto(choferOriginal) || choferOriginal.nombre || idChofer;
      return [
        ...this.listaChoferes,
        {
          label: `${nombre} (desactivado)`,
          value: idChofer,
          disabled: false,
        },
      ].sort((a, b) => a.label.localeCompare(b.label));
    }

    return this.listaChoferes;
  }

  private toEmpleadoOption(empleado: EmpleadoResponseDto): SelectModel {
    return {
      label: this.getEmpleadoOptionLabel(empleado),
      value: empleado.idEmpleado,
      disabled: !empleado.enabled,
      data: empleado,
    };
  }

  private getEmpleadoOptionLabel(empleado: EmpleadoResponseDto): string {
    const nombreCompleto = getEmpleadoNombreCompleto(empleado) || empleado.nombre;
    return empleado.enabled ? nombreCompleto : `${nombreCompleto} (desactivado)`;
  }

  restoreColumnWidths(): void {
    console.log('restoreColumnWidths');
    const widths = this.localStorage.getBitacoraVentaColumnWidths();
    if (!widths) return;

    const ths = this.table.el.nativeElement.querySelectorAll('th');

    if (ths.length !== widths.length) {
      console.log('No coinciden columnas:', ths.length, widths.length);
      return;
    }

    ths.forEach((th: HTMLElement, index: number) => {
      const width = widths[index];
      th.style.width = `${width}px`;
      th.style.minWidth = `${width}px`;
      th.style.maxWidth = `${width}px`;
    });
  }

  ngAfterViewInit(): void {
    this.activateAllRows();
  }

  activateAllRows(): void {
    if (this.readonly) return;
    if (!this.table) return;
    setTimeout(() => {
      this.listaPartidas.forEach((p) => this.table.initRowEdit(p));
    });
  }

addPartida(): void {
  if (this.readonly) return;

  const nueva = {
    id: null,
    chofer: null,
    idImagenFirma: null,
    firma: '',
    fechaFirma: null,
    fechallegada: null,
    ruta: null,
    proceso:'SIN_PROCESO',
    notaAsignada: null,
    vehiculo: null,
    idUnidadMedicion: null,
    capMax: 0,
    ventaTrayecto: [
      {
        cantidadLlegada: 0,
        cantidadSalida: 0,
        comisionesEmpleado: [],
        huecos: 0,
        idProducto: null,
        idUnidadMedicion: null,
        idVenta: null,
        productosFueraEspecificacion: [],
        mermas: [],
      },
    ],
    ayudantes: [],
    estadoVentaRuta: 'PENDIENTE',
    producto: null,
    saleCon: 0,
    regresaCon: 0,
    vendidos: 0,
  };

  this.listaPartidas.unshift(nueva);

  // ✅ ahora sí: la nueva es "nueva" (o listaPartidas[0])
  this.syncPartidaResumen(nueva);

  setTimeout(() => {
    this.guardarPartida(nueva, false, (res) => {
      console.log('Guardado completo:', res);
      nueva.fechallegada = res.createdAt;
      nueva.proceso = res?.tipoProceso ?? res?.proceso ?? nueva.proceso;
      // ✅ edita SOLO la nueva fila
      this.table.initRowEdit(nueva);
    });
  }, 100);
}


  guardando:boolean = false;
  guardarPartida(
    item: PartidaVenta,
    skip: boolean = false,
    callback?: (res: any) => void
  ) {
    console.log('guardarPartida/item',item);
    this.syncPartidaResumen(item);
    if (this.guardando) {
      return;
    }

    this.guardando = true;

    let form = this.formulario.getRawValue();

    let venta:VentaTrayecto[] = []
    for (const element of item.ventaTrayecto) {
      console.log('element',element);

      for (const comision of element.comisionesEmpleado) {
        comision.cantidad = parseFloat(comision?.cantidad.toString())
      }

      for (const fueraEspecificacion of element.productosFueraEspecificacion) {
        fueraEspecificacion.cantidad = parseFloat(fueraEspecificacion?.cantidad.toString())
      }

      venta.push({
        cantidadLlegada:parseFloat(element.cantidadLlegada?.toString()),
        cantidadSalida:parseFloat(element.cantidadSalida?.toString()),
        comisionesEmpleado:element.comisionesEmpleado,
        huecos:parseFloat(element.huecos?.toString()),
        idProducto:element.idProducto,
        idUnidadMedicion:element.idUnidadMedicion,
        idVenta:element.idVenta,
        productosFueraEspecificacion:element.productosFueraEspecificacion,
        mermas: (element.mermas ?? []).map((merma) => ({
          idMerma: merma.idMerma ?? null,
          idEmpleado: merma.rotoPorMaquina ? null : merma.idEmpleado ?? null,
          cantidad: Number(merma.cantidad),
          rotoPorMaquina: Boolean(merma.rotoPorMaquina),
          idImagenFirma: merma.idImagenFirma ?? null,
        }))
      })
    }
    console.log(this.desactivar);
    let request: ViajeDto = {
      comentario: item.comentario ?? '',
      idBitacora: form.idBitacora,
      idChofer: item.chofer,
      idImagenFirma: item.idImagenFirma ?? '',
      idRuta: item.ruta,
      proceso: item.proceso,
      idVehiculo: item.vehiculo,
      ventaTrayecto: venta,
      autoGenerar:!this.desactivar,
      tipoProceso: item.proceso,
    };
    console.log('request',request);

    if (item.id) {
      console.log('tiene id');
      this.viajeService.update(request,item.id, skip).subscribe({
         next: (response) => {
          console.log(response);
          const previous = item.original ?? {};
          item.original = {
            ...previous,
            ...response,
            ruta: response.ruta ?? (response.idRuta ? { ...previous.ruta, id: response.idRuta } : previous.ruta),
            conductor: response.conductor ?? (response.idChofer ? { ...previous.conductor, idEmpleado: response.idChofer } : previous.conductor),
            vehiculo: response.vehiculo ?? (response.idVehiculo ? { ...previous.vehiculo, id: response.idVehiculo } : previous.vehiculo),
          };
          item.id = response.idPartida ?? response.id ?? item.id;
          item.mandadoALiquidacion = Boolean(response.mandadoALiquidacion ?? item.mandadoALiquidacion);
          item.comentario = response.comentario ?? item.comentario;
          if (response.mandadoALiquidacion === true && form.fecha) {
            const fecha = form.fecha instanceof Date
              ? `${form.fecha.getFullYear()}-${String(form.fecha.getMonth() + 1).padStart(2, '0')}-${String(form.fecha.getDate()).padStart(2, '0')}`
              : String(form.fecha).slice(0, 10);
            this.viajeService.notificarConteoLiquidacionActualizado(request.idRuta, fecha);
          }
          item.proceso = response?.tipoProceso ?? response?.proceso ?? item.proceso;
          const fechaFirma = (response as any)?.fechaFirma;
          if (fechaFirma) {
            item.fechaFirma = fechaFirma;
          } else if (item.estadoVentaRuta === 'FIRMADO' && !item.fechaFirma) {
            item.fechaFirma = new Date().toISOString();
          }
          this.guardando = false
          callback?.(response);
        },
        error: (error) => {
          this.guardando = false;
          this.restorePartidaFromOriginal(item);
          this.messageService.add({
            key: 'center',
            severity: 'error',
            summary: 'No se pudo guardar la bitácora',
            detail: error?.error?.message ?? error?.message ?? 'Ocurrió un error al guardar el viaje.',
            life: 8000,
          });
        },
      })
    } else {
      this.viajeService.create(request).subscribe({
         next: (response) => {
          console.log(response);
          item.id = response.idPartida;
          item.proceso = response?.tipoProceso ?? response?.proceso ?? item.proceso;
          const fechaFirma = (response as any)?.fechaFirma;
          if (fechaFirma) {
            item.fechaFirma = fechaFirma;
          }
                    this.guardando = false
          callback?.(response);
        },
        error: (error) => {
          this.guardando = false;
          this.messageService.add({
            key: 'center',
            severity: 'error',
            summary: 'No se pudo guardar la bitácora',
            detail: error?.error?.message ?? error?.message ?? 'Ocurrió un error al guardar el viaje.',
            life: 8000,
          });
        },
      })
    }
  }

  private restorePartidaFromOriginal(item: PartidaVenta): void {
    const original = item.original;
    if (!original) return;

    item.id = original.idPartida ?? original.id ?? item.id;
    item.chofer = original.idChofer ?? original.conductor?.idEmpleado ?? null;
    item.idImagenFirma = original.idImagenFirma ?? null;
    item.firma = item.idImagenFirma ? `${environment.apiUrl}images/${item.idImagenFirma}` : '';
    item.fechaFirma = original.fechaFirma ?? item.fechaFirma;
    item.ruta = original.idRuta ?? original.ruta?.id ?? null;
    item.proceso = original.tipoProceso ?? original.proceso ?? 'SIN_PROCESO';
    item.notaAsignada = original.ruta?.notaAsignada ?? null;
    item.vehiculo = original.idVehiculo ?? original.vehiculo?.id ?? null;
    item.idUnidadMedicion = original.vehiculo?.unidadMedida?.nombre ?? null;
    item.capMax = Number(original.vehiculo?.capacidadMaxima ?? 0);
    item.estadoVentaRuta = original.estadoVentaRuta ?? 'PENDIENTE';
    item.mandadoALiquidacion = Boolean(original.mandadoALiquidacion);
    item.comentario = original.comentario ?? '';
    item.ventaTrayecto = (original.ventaTrayecto ?? []).map((trayecto: any) => ({
      cantidadLlegada: Number(trayecto.cantidadLlegada ?? 0),
      cantidadSalida: Number(trayecto.cantidadSalida ?? 0),
      comisionesEmpleado: (trayecto.comisionesEmpleados ?? trayecto.comisionesEmpleado ?? []).map((comision: any) => ({
        idEmpleado: comision.empleado?.idEmpleado ?? comision.idEmpleado,
        cantidad: Number(comision.comision ?? comision.cantidad ?? 0),
      })),
      huecos: Number(trayecto.huecos ?? 0),
      idProducto: trayecto.producto?.idProductoComercial ?? trayecto.idProducto ?? null,
      idUnidadMedicion: trayecto.unidades?.idUnidadDeMedida ?? trayecto.idUnidadMedicion ?? null,
      idVenta: trayecto.idVenta ?? null,
      productosFueraEspecificacion: (trayecto.productosFueraEspecificacion ?? []).map((producto: any) => ({
        idConcepto: producto.concepto?.id ?? producto.idConcepto ?? 0,
        cantidad: Number(producto.cantidad ?? 0),
      })),
      mermas: (trayecto.mermas ?? []).map((merma: any) => ({
        idMerma: merma.idMerma ?? null,
        idEmpleado: merma.empleadoResponsable?.idEmpleado ?? merma.idEmpleado ?? null,
        cantidad: Number(merma.cantidad ?? 0),
        rotoPorMaquina: Boolean(merma.rotoPorMaquina),
        idImagenFirma: merma.idImagenFirma ?? null,
      })),
    }));
    item.ayudantes = Array.from(new Set(
      item.ventaTrayecto.flatMap((trayecto) => trayecto.comisionesEmpleado.map((comision) => comision.idEmpleado))
        .filter((idEmpleado) => idEmpleado && idEmpleado !== item.chofer)
    ));
    this.syncPartidaResumen(item);
  }

  eliminarPartida(): void {
    if (this.readonly) return;

    const partidasAEliminar = this.listaSeleccionada.filter(
      (element) => element.estadoVentaRuta !== 'FIRMADO'
    );

    if (partidasAEliminar.length === 0) return;

    const eliminaciones$ = partidasAEliminar.map((element) =>
      this.viajeService.delete(element.id).pipe(
        catchError((err) => {
          console.error('Error al eliminar partida', element.id, err);
          return of(null);
        })
      )
    );

    forkJoin(eliminaciones$).subscribe(() => {
      // ✅ Solo eliminamos las que sí se eliminaron (no FIRMADO)
      this.listaPartidas = this.listaPartidas.filter(
        (p) => !partidasAEliminar.some((e) => e.id === p.id)
      );

      this.listaSeleccionada = [];

      console.log('Solo se eliminaron las partidas no firmadas');
    });
  }

  setRuta(item: PartidaVenta): void {
    console.log(item);
    if (!item.ruta) {
      item.chofer = null;
      item.ayudantes = [];
      item.vehiculo = null;
      item.capMax = 0;
      // item.unidadMedida = <any>null;
      return;
    }
    this.rutasService.getOne(item.ruta).subscribe((resp) => {
      console.log('setRuta/getOne',resp);
      item.chofer = resp.choferBase.idEmpleado;
      this.mergeEmpleadoFromBitacora(resp.choferBase.idEmpleado, resp.choferBase);
      this.refreshEmployeeOptions();
      this.ensureChoferOptionForPartida(item);
      item.ayudantes = [];
      for (const ayudante of resp.empleadosAsignados) {
        item.ayudantes.push(ayudante.idEmpleado)
      }
      // item.ayudantes =
      //   resp?.empleadosAsignados?.map((e: any) => e.idEmpleado) ?? [];
      item.notaAsignada = resp.notaAsignada ?? null;
      item.vehiculo = resp.vehiculosBase?.id ?? null;
      item.idUnidadMedicion = resp.vehiculosBase?.unidadMedida?.nombre ?? null;
      item.capMax = resp.vehiculosBase?.capacidadMaxima ?? 0;
      const trayecto = this.ensureFirstVentaTrayecto(item);
      trayecto.idUnidadMedicion = resp.vehiculosBase.unidadMedida.idUnidadDeMedida;
      trayecto.cantidadSalida = resp.vehiculosBase?.capacidadMaxima;
      trayecto.idProducto = resp.productoBase?.idProductoComercial ?? null;

      for (const trayecto of item.ventaTrayecto) {
        trayecto.comisionesEmpleado = []
        const vendidos = Math.max(
          Number(trayecto.cantidadSalida ?? 0) - Number(trayecto.cantidadLlegada ?? 0),
          0
        );
        for (const ayudante of item.ayudantes) {
          trayecto.comisionesEmpleado.push({
            cantidad: vendidos,
            idEmpleado: ayudante
          })
        }
      }
      this.syncPartidaResumen(item);
      this.guardarPartida(item);
    });
  }

  setProceso(item: PartidaVenta): void {
    console.log('setProceso', item);
        this.syncPartidaResumen(item);
    this.guardarPartida(item);
  }

  setVehiculo(item: PartidaVenta): void {
    console.log('setVehiculo', item);
    const veh = this.vehiculosResponse.find((v) => v.id === item.vehiculo);
    item.capMax = veh?.capacidadMaxima ?? 0;
    // item.saleCon = veh?.capacidadMaxima ?? 0;
    // item.unidadMedida = <any>veh?.unidadMedida?.nombre ?? null;
    this.syncPartidaResumen(item);
    this.guardarPartida(item);
  }

  calcularVendidos(item: PartidaVenta): void {
    // const salida = item.saleCon || 0;
    // const llegada = item.regresaCon || 0;

    // if (llegada > salida) {
    //   this.messageService.add({
    //     severity: 'warn',
    //     summary: '¡Precaución!',
    //     detail:
    //       'Regresa con producto no puede ser mayor que Sale con producto.',
    //   });
    //   item.regresaCon = salida;
    //   return;
    // }

    // item.vendidos = salida - (item.regresaCon || 0);
    this.syncPartidaResumen(item);
    setTimeout(() => {
      this.guardarPartida(item, true);
    }, 500);
  }

  getFirstVentaTrayecto(item: PartidaVenta): VentaTrayectoRuta | null {
    return item?.ventaTrayecto?.[0] ?? null;
  }

  updatePrimaryProducto(item: PartidaVenta, idProducto: string | null): void {
    const trayecto = this.ensureFirstVentaTrayecto(item);
    trayecto.idProducto = idProducto;
    this.syncPartidaResumen(item);
    this.guardarPartida(item);
  }

  updatePrimaryCantidadSalida(item: PartidaVenta, cantidadSalida: number): void {
    const trayecto = this.ensureFirstVentaTrayecto(item);
    trayecto.cantidadSalida = cantidadSalida;
    this.syncPartidaResumen(item);
    this.guardarPartida(item, true);
  }

  updatePrimaryCantidadLlegada(item: PartidaVenta, cantidadLlegada: number): void {
    const trayecto = this.ensureFirstVentaTrayecto(item);
    trayecto.cantidadLlegada = cantidadLlegada;
    this.calcularVendidos(item);
  }

  private syncPartidaResumen(item: PartidaVenta): void {
    const trayecto = item?.ventaTrayecto?.[0];
    const salida = Number(trayecto?.cantidadSalida ?? 0);
    const llegada = Number(trayecto?.cantidadLlegada ?? 0);
    const huecos = Number(trayecto?.huecos ?? 0);
    const saleCon = Math.max(salida - huecos, 0);
    const vendidosSinHuecos = Math.max(salida - llegada, 0);
    const vendidos = Math.max(salida - llegada, 0);

    item.saleCon = Number.isFinite(saleCon) ? saleCon : 0;
    item.regresaCon = Number.isFinite(llegada) ? llegada : 0;
    item.vendidos = Number.isFinite(vendidos) ? vendidos : 0;
    for (const comision of trayecto?.comisionesEmpleado ?? []) {
      const cantidad = Number(comision.cantidad);
      if (cantidad === salida || cantidad === vendidosSinHuecos) {
        comision.cantidad = item.vendidos;
      }
    }
    item.producto = trayecto?.idProducto ?? null;
  }

  private ensureFirstVentaTrayecto(item: PartidaVenta): VentaTrayectoRuta {
    if (!item.ventaTrayecto?.length) {
      item.ventaTrayecto = [this.createEmptyVentaTrayecto()];
    }

    return item.ventaTrayecto[0];
  }

  private createEmptyVentaTrayecto(): VentaTrayectoRuta {
    return {
      cantidadLlegada: 0,
      cantidadSalida: 0,
      comisionesEmpleado: [],
      huecos: 0,
      idProducto: null,
      idUnidadMedicion: null,
      idVenta: null,
      productosFueraEspecificacion: [],
      mermas: [],
    };
  }

  setRutaRO(item: any) {
    console.log(item);
    const found = this.listaRutas.find((r) => r.value === item);
    console.log(found);
    return found?.label;
  }

  setProcesoRO(item: any) {
    console.log(item);
    const found = this.listaProcesos.find((r) => r.value === item);
    console.log(found);
    return found?.label;
  }

  setChoferRO(item: any) {
    console.log(this.listaEmpleados);
    const found = this.listaEmpleados.find((e) => e.value === item.chofer);
    if (!found && item?.original?.conductor?.idEmpleado === item?.chofer) {
      return getEmpleadoNombreCompleto(item.original.conductor) || item.original.conductor?.nombre;
    }
    console.log(found);
    return found?.label;
  }

  setayudanteRO(item: any) {
    console.log(this.listaEmpleados);
    const found = this.listaEmpleados.filter((e) =>
      (item.ayudantes || []).includes(e.value)
    );
    console.log(found);
    return found.map((f) => f.label).join(', ');
  }

  setAyudantes(item: PartidaVenta, ids: string[]): void {
    const ayudantes = ids ?? [];
    item.ayudantes = ayudantes;

    for (const trayecto of item.ventaTrayecto ?? []) {
      const actuales = new Map(
        (trayecto.comisionesEmpleado ?? []).map((comision) => [comision.idEmpleado, comision])
      );
      const vendidos = Math.max(
        Number(trayecto.cantidadSalida ?? 0) - Number(trayecto.cantidadLlegada ?? 0),
        0
      );

      trayecto.comisionesEmpleado = ayudantes.map((idEmpleado) =>
        actuales.get(idEmpleado) ?? {
          idEmpleado,
          cantidad: vendidos,
        }
      );
    }

    this.syncPartidaResumen(item);
    this.guardarPartida(item);
  }

  getProductRO(item: any) {
    console.log(this.listaEmpleados);
    const productId =
      item.producto ??
      item?.ventaTrayecto?.[0]?.idProducto ??
      null;
    const found = this.listaProductos.find((e) => e.value === productId);
    console.log(found);
    return found?.label;
  }

  getVehicleRO(item: any) {
    console.log(this.listaProductos);
    const found = this.vehiculosResponse.find((e) => e.id === item.vehiculo);
    console.log(found);
    return found?.nombre;
  }

  verDetalle(item: PartidaVenta): void {
    console.log('v', item);
    this.listaSeleccionada = [item];
    this.dialogPartida.open(
      item,
      {
        rutas: this.listaRutas,
        choferes: this.listaChoferes,
        ayudantes: this.listaAyudantes,
        empleados: this.listaEmpleados,
        vehiculos: this.vehiculosResponse,
        productos: this.listaProductos,
        motivos: this.listaMotivos,
      },
      (item.estadoVentaRuta === 'FIRMADO')?true:false
    );
  }

  openFirma(item: PartidaVenta): void {
    console.log(item);
    if (this.readonly && !item.idImagenFirma) return;
    this.itemFirma = item;
    let chofer = this.listaChoferes.filter((cho) => cho.value === item.chofer);
    console.log(chofer);
    this.dialogSignature.open(chofer[0].label);
  }

  firmaConfirmada(file: {archivo: File, desactivar: boolean}): void {
    console.log('firmaConfirmada',file);
    if (!this.itemFirma) return;
    this.uploadFileApi.create(file.archivo).subscribe((resp) => {
      this.itemFirma!.idImagenFirma = resp?.fileName ?? 'error';
      this.itemFirma!.estadoVentaRuta = 'FIRMADO';
      this.itemFirma!.fechaFirma = new Date().toISOString();
      this.desactivar = file.desactivar;
      this.guardarPartida(this.itemFirma!);
    });
  }

  onColumnResizeEnd(event: TableColResizeEvent) {
    console.log(event);
    const widths = Array.from(
      this.table.el.nativeElement.querySelectorAll('th')
    ).map((th: any) => (th as HTMLElement).offsetWidth);
    this.localStorage.setBitacoraVentaColumnWidths(widths as number[]);
  }
  onPositiveIntegerKeydown(event: KeyboardEvent) {
    const allowedKeys = [
      'Backspace',
      'Delete',
      'ArrowLeft',
      'ArrowRight',
      'Tab',
    ];
    // Si es tecla de navegación o edición, permitimos
    if (allowedKeys.includes(event.key)) {
      return;
    }
    // Si no es dígito 0–9 lo bloqueamos
    if (!/^[0-9]$/.test(event.key)) {
      event.preventDefault();
    }
  }
}

interface TotalRutaProducto {
  ruta: string;
  producto: string;
  unidad: string;
  cantidad: number;
}

interface TotalEmpleadoVenta {
  nombre: string;
  tipo: 'Chofer' | 'Ayudante';
  unidad: string;
  cantidad: number;
}

export interface PartidaVenta {
  id: string | null;
  chofer: any | null;
  idImagenFirma: string | null;
  firma: string;
  fechaFirma: string | null;
  fechallegada: string | null;
  ruta: any | null;
  proceso:string;
  notaAsignada: string | null;
  vehiculo: string | null;
  idUnidadMedicion: string | null;
  capMax:number;
  ventaTrayecto: VentaTrayectoRuta[];
  estadoVentaRuta: string;
  original?: any;
  mandadoALiquidacion?: boolean;
  liquidacionCerrada?: boolean;
  comentario?: string;
  ayudantes: string[];
  producto: string | null;
  saleCon: number;
  regresaCon: number;
  vendidos: number;
  // huecos: number;
  // rotos: number;
  // donados: number;
  // unidadMedida: string;
  // producto: string | null;

  // comisiones?: ComisionesEmpleado[];
  // productosNoConsignados: ProductosNoConsignados[];
}
// export interface ProductosNoConsignados {
//   cantidad: number;
//   idConcepto: any;
//   idProductoRemanente: any;
// }
export interface VentaTrayectoRuta {
  cantidadLlegada: number;
  cantidadSalida: number;
  comisionesEmpleado: ComisionesEmpleado[];
  huecos: number;
  idProducto: string | null;
  idUnidadMedicion: string | null;
  idVenta: string | null;
  productosFueraEspecificacion: ProductosFueraEspecificacion[];
  mermas: Merma[];
}

export interface ProductosFueraEspecificacion {
  cantidad: number;
  idConcepto: number;
}

export interface ComisionesEmpleado {
  cantidad: number;
  idEmpleado: string;
}
