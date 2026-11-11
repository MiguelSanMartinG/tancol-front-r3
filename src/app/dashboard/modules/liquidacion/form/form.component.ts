import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, OnInit, ViewChild, inject, AfterViewInit, OnChanges, SimpleChanges, ChangeDetectorRef, Signal, computed } from '@angular/core';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { AppSharedModule } from '@shared/app-shared.module';
import { MessageErrorComponent } from '@shared/components/message-error/message-error.component';
import { Table, TableColResizeEvent } from 'primeng/table';
import { RutasApiService } from '../../rutas/services/rutas-api.service';
import { RutasResponse } from '../../rutas/services/rutas.response';
import { EmpleadoApiService } from '../../empleados/services/empleado.api.service';
import { ClienteApiService } from '../../cliente/services/cliente.service';
import { NuestrosProductosService } from '../../nuestros-productos/service/nuestros-productos.service';
import { PrecioClienteProductoService } from '../../cliente/services/precio-cliente-producto.service';
import { SelectModel } from '@core/common/select.model';
import { DropdownModel } from '@shared/interface/dropdown.model';
import { DialogPartidaComponent } from '../dialog-partida/dialog-partida.component';
import { SoloNumerosEnterosDirective } from '@shared/directive/solo-numeros-enteros.directive';
import { LocalStorageService } from '@shared/services/local-storage.service';
import { ChoferSummary, ProductoSummary } from '../actualizar/actualizar.component';
import { ConceptoVentaApiService } from '../../concepto-venta/services/concepto-venta.api.service';
import { LiquidacionApiService } from '../services/liquidacion.api.service';
import { ClienteDTO } from '../../cliente/services/cliente.dto';
import { TipoClienteApiService } from '../../tipo-cliente/services/tipo-cliente.api.service';
import { Dropdown } from 'primeng/dropdown';
// ...existing imports...
import { exportLiquidacionPdf } from './export-liquidacion-pdf';
import { MessageService, ScrollerOptions } from 'primeng/api';
import { NoNegativosDirective } from '@shared/directive/noNegativos.directive';
import { TablaDescuentosResponse, TablaDescuentosService } from '@shared/services/tabla-descuentos.service';
import { FormCuentasComponent } from '../../cuentas/form/form.component';
import { getEmpleadoNombreCompleto } from '../../empleados/services/dtos/empleado.response';

@Component({
  selector: 'app-liquidacion-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AppPrimengModule,
    AppSharedModule,
    MessageErrorComponent,
    NoNegativosDirective,
    FormCuentasComponent
  ],
  templateUrl: './form.component.html',
  styleUrl: './form.component.scss',
})
export class FormComponent implements OnInit, AfterViewInit, OnChanges {
  tablaDescuentos = inject(TablaDescuentosService);
  private _empleadosFull: any[] = [];
  cuentaEdit: boolean = false;

  private isPartidaCancelada(partida: PartidaLiquidacion | null | undefined): boolean {
    return Boolean(partida?.cancelada ?? (partida as any)?.cancelado);
  }

  getMotivoCancelacion(partida: PartidaLiquidacion | null | undefined): string {
    if (!this.isPartidaCancelada(partida)) {
      return '';
    }

    return String(
      partida?.motivoCancelacion ??
      (partida as any)?.motivo ??
      (partida as any)?.razonCancelacion ??
      (partida as any)?.motivoCancelacionPartida ??
      ''
    ).trim();
  }

  private shouldIncludePartidaInSummary(partida: PartidaLiquidacion | null | undefined): boolean {
    if (!partida) {
      return false;
    }

    return !(this.readonly && this.isPartidaCancelada(partida));
  }

  // Devuelve el nombre (label) del concepto de venta usando la id
  getConceptoVentaLabel(id: string): string {
    const found = this.listaConceptoVenta.find(item => String(item.value) === String(id));
    return found ? found.label : id;
  }
  // Método para guardar el formulario (ejemplo)

  getKpisPorFormaPago() {
    const kpis = new Map<string, { label: string; total: number; cantidad: number }>();

    (this.listaPartidas || []).forEach((partida) => {
      if (!this.shouldIncludePartidaInSummary(partida)) {
        return;
      }

      const formaPago = String(partida?.formaPago || '').trim();
      if (!formaPago) {
        return;
      }

      const formaPagoLabel =
        this.listaFormaPago.find((item) => item.code === formaPago)?.name ||
        formaPago;

      if (!kpis.has(formaPago)) {
        kpis.set(formaPago, { label: formaPagoLabel, total: 0, cantidad: 0 });
      }

      const importe = Number(partida?.importe ?? 0);
      const kpi = kpis.get(formaPago)!;
      kpi.total += Number.isFinite(importe) ? importe : 0;
      kpi.cantidad += 1;
    });

    return Array.from(kpis.values()).sort((a, b) => b.total - a.total);
  }

  async generarliquidacionPdf() {
    const jsPDF = (await import('jspdf')).default;
    const doc = new jsPDF();
    const logoDataUrl = await this.loadLogoDataUrl();
    exportLiquidacionPdf(doc, {
      formulario: this.formulario?.getRawValue?.() || {},
      listadoChoferes: this.listadoChoferes || [],
      listaPartidas: this.listaPartidas || [],
      readonly: this.readonly,
      comentarios: this.comentarios || '',
      totalizadorPorProducto: this.totalizadorPorProducto || [],
      totalGeneralImporte: this.totalGeneralImporte || 0,
      totalGeneralDescuentos: this.totalGeneralDescuentos || 0,
      rutas: this.listaRutas || [],
      empleados: this._empleadosFull || [],
      listaConceptoVenta: this.listaConceptoVenta || [],
      listaClientes: this.listaClientes || [],
      listaProductos: this.listaProductos || [],
      usuarioSesion: this.getUsuarioSesionNombre(),
      logoDataUrl,
    });
  }

  private async loadLogoDataUrl(): Promise<string | null> {
    try {
      const response = await fetch('/ST-Logo-16.png');
      if (!response.ok) {
        return null;
      }
      const blob = await response.blob();
      return await new Promise<string | null>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string) || null);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    } catch {
      return null;
    }
  }

  private getUsuarioSesionNombre(): string {
    const userInfo = this.localStorage.getUserInfo();
    if (!userInfo) {
      return 'No disponible';
    }

    return [userInfo.nombre, userInfo.apellidoPaterno].filter(Boolean).join(' ') || 'No disponible';
  }

  // Observaciones fuera del form
  comentarios: string = '';
  onWheelInput(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input) input.blur();
  }
  @Input() formulario!: FormGroup;
  @Input() listaPartidas: PartidaLiquidacion[] = [];
  @Input() readonly = false;
  @Input() puedeCancelarPartidas = false;
  @Input() resumenBloqueado = false;
  @Input() listadoChoferes: ChoferSummary[] = [];
  @Input() listadoProductos: ProductoSummary[] = [];
  @Output() partidaChanged = new EventEmitter<void>();
  @Output() cancelarPartida = new EventEmitter<PartidaLiquidacion>();

  partidaModalVisible = false;
  partidaModal: PartidaLiquidacion | null = null;

  get resumenSoloLectura(): boolean {
    return this.isResumenLocked();
  }

  get resumenDesfasado(): boolean {
    if (!this.resumenBloqueado) {
      return false;
    }
    return this.hasResumenChoferMismatch();
  }

  private isResumenLocked(): boolean {
    return this.readonly || this.resumenBloqueado;
  }

  @ViewChild('table') table!: Table;
  @ViewChild(DialogPartidaComponent) dialogPartida!: DialogPartidaComponent;
  @ViewChild('selCliente') selCliente!: Dropdown;
  ultimaNota = 0;
  notaUpdate = 0;

  conceptoVentaService = inject(ConceptoVentaApiService);
  rutasService = inject(RutasApiService);
  empleadoService = inject(EmpleadoApiService);
  clienteService = inject(ClienteApiService);
  productosService = inject(NuestrosProductosService);
  precioClienteService = inject(PrecioClienteProductoService);
  localStorage = inject(LocalStorageService);
  liquidacionApiService = inject(LiquidacionApiService);
  cdr = inject(ChangeDetectorRef);
    ClienteApiService = inject(ClienteApiService);
  tipoCliente = inject(TipoClienteApiService);
messageService = inject(MessageService);

private _folioAlertShown = false;

lastFiltroCliente = '';
  listaRutas: SelectModel[] = [];
  listaConceptoVenta: SelectModel[] = [];
  rutasData: RutasResponse[] = [];
  private productoRutaSeleccionado = '';
  listaEmpleados: SelectModel[] = [];
  listaClientes: SelectModel[] = [];
  listaChofer: SelectModel[] = [];
  listaAyudantes: SelectModel[] = [];
  listaProductos: { label: string; value: string; price: number }[] = [];
  listaSeleccionada: any[] = [];
  listaTipoVenta: DropdownModel[] = [
    { name: 'Venta diaria', code: 'VENTA_DIARIA' },
    {
      name: 'Nota acomulativa para facturar',
      code: 'NOTA_ACOMULATIVA_FACTURAR',
    },
    { name: 'Acumulativo para crédito', code: 'ACUMULATIVA_CREDITO' },
    { name: 'Tarjeta débito', code: 'TARJETA_DEBITO' },
    { name: 'Tarjeta crédito', code: 'TARJETA_CREDITO' },
    { name: 'Público en general', code: 'PUBLICO_GENERAL' },
    { name: 'Facturar', code: 'FACTURA' },
    { name: 'Crédito interno', code: 'CREDITO_INTERNO' },
  ];
  listaFormaPago: DropdownModel[] = [
    { name: 'Efectivo', code: 'CONTADO' },
    { name: 'Crédito', code: 'CREDITO' },
    { name: 'Donados', code: 'DONACION' },
    { name: 'Vale Código', code: 'VALE_CODIGO' },
    { name: 'Vale Sin Código', code: 'VALE_S_CODIGO' },
    { name: 'Tarjeta Debito', code: 'T_DEBITO' },
    { name: 'Tarjeta Credito', code: 'T_CREDITO' },
  ];

  nombreProductos: ProductoSummary[] = [];
  tipoClienteObject!:DropdownModel;

    //   options: ScrollerOptions = {
    //     delay: 250,
    //     showLoader: true,
    //     lazy: true,
    //     onLazyLoad: this.onLazyLoad.bind(this)
    // };

  private _columnWidthsRestored = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['listaPartidas'] && changes['listaPartidas'].currentValue) {
      setTimeout(() => this.restoreColumnWidths());
      // Recalcular importes y KPIs cuando se hidratan partidas desde edición
      this.recalculateLoadedPartidas();
    }
  }

  public recalculateLoadedPartidas(): void {
    if (!this.listaPartidas?.length) {
      return;
    }

    for (const partida of this.listaPartidas) {
      if (this.isFolioDisabledPartida(partida)) partida.folio = null;
      const precio = Number(partida.precio || 0);
      const cantidad = Number(partida.cantidad || 0);
      partida.importe = precio * cantidad;
      this.validatePrecioVsDescuento(partida);

      if (this.checkFacturaDisabled(partida)) {
        partida.factura = false;
        if (!partida.formaPago) {
          partida.formaPago = 'CONTADO';
        }
      }
    }

    if (!this.isResumenLocked()) {
      this.updateVentaChofer();
    }

    this.listaPartidas = [...this.listaPartidas];
    this.partidaChanged.emit();
  }

  ngOnInit(): void {
    this.rutasService.getAllFilter('?enabled=true').subscribe((resp) => {
      this.rutasData = resp;
      this.listaRutas = resp.map((r) => ({ label: r.nombre, value: r.id }));
    });
    this.empleadoService.getAllFilter('?enabled=true').subscribe((resp) => {
      this._empleadosFull = resp;
      console.log(resp);
      const opcionesEmpleados = resp.map((e) => ({
          label: getEmpleadoNombreCompleto(e),
          value: e.idEmpleado,
        }))
        .sort((a, b) => a.label.localeCompare(b.label));

      this.listaChofer = [...opcionesEmpleados];
      this.listaAyudantes = [...opcionesEmpleados];

      // this.listaChofer = resp.map(e => ({ label: `${e.nombre} ${e.apellidoPaterno || ''} ${e.apellidoMaterno || ''}`.trim(), value: e.idEmpleado }));
      console.log(this.listaChofer);
    });
    this.getClientes();
    this.productosService.getAll().subscribe((resp) => {
      this.listaProductos = resp.map((p) => ({
        label: p.nombre,
        value: p.idProductoComercial,
        price: p.precio ? p.precio : 0,
      }));
    });
    this.conceptoVentaService.getAll().subscribe((resp) => {
      console.log(resp);
      this.listaConceptoVenta = resp.map((p) => ({
        label: p.name,
        value: p.id,
        data: p,
      }));
      this.recalculateLoadedPartidas();
    });
    this.tipoCliente.getAll().subscribe((resp)=>{
      console.log(resp);
      this.tipoClienteObject ={
        code:resp[0].idTiposClientes,
        name:resp[0].nombre
      }
    })

    this.getCuentas()
  }
  cuentas:TablaDescuentosResponse = {a1:0,a2:0,a3:0};
  getCuentas(){
    this.tablaDescuentos.getUltimoDescuento().subscribe({
      next: (response) => {
        console.log(response);
        this.cuentas = response;
        // Sincronizar total y aplicar descuentos automáticos si existen partidas
        this.cuentasTotal = (this.cuentas?.a1 || 0) + (this.cuentas?.a2 || 0) + (this.cuentas?.a3 || 0);
        this.updateDescuentosAutomaticos();
      },
      error: (error) => {
        console.error('Error al obtener el último descuento:', error);
      }
    });
  }

  getClientes(){
    this.clienteService.getAll().subscribe((resp) => {
      this.listaClientes = resp.map((c) => ({
        label: c.nombreComercial,
        value: c.id,
        razonSocial: c.informacionFiscal?.razonSocial || '',
        data: { esEmpleado: c.esEmpleado === true },
      }));
      this.applyDefaultClienteToBlankPartidas();
    });
  }

  ngAfterViewInit(): void {
    this.activateAllRows();
    this.syncHorizontalScroll();
    // this.restoreColumnWidths();
  }

  ngAfterViewChecked(): void {
    if (this.table && !this._columnWidthsRestored) {
      const ths = this.table.el.nativeElement.querySelectorAll('th');
      if (ths.length > 0) {
        this.restoreColumnWidths();
        this._columnWidthsRestored = true;
      }
    }
  }

  activateAllRows(): void {
    if (this.readonly) return;
    if (!this.table) return;
    setTimeout(() => {
      this.listaPartidas.forEach((p) => this.table.initRowEdit(p));
    });
  }

  createBlankPartida(): PartidaLiquidacion {
    const siguienteFolio = this.getSiguienteFolio();
    return {
      id: '',
      conceptoVenta: this.getDefaultConceptoVentaId(),
      factura: false,
      descuento: 0,
      cliente: this.getDefaultClienteId(),
      producto: this.getProductoRutaDefault(),
      cantidad: 0,
      importe: 0,
      folio: siguienteFolio,
      formaPago: 'CONTADO',
      precio: 0,
    };
  }

  addPartida(): void {
    if (this.readonly) return;
    const nuevaPartida = this.createBlankPartida();
    this.notaUpdate = nuevaPartida.folio ?? this.notaUpdate;
    this.listaPartidas.push(nuevaPartida);
    this.setPrecioProducto(nuevaPartida);
    this.renumerarFoliosPartidas();
    setTimeout(() => {
      if (this.table) {
        this.table.initRowEdit(
          this.listaPartidas[this.listaPartidas.length - 1]
        );
      }

          this.validarFoliosPorOrden(); // <-- NUEVO

    });
    // this.updateChoferResumen();
  }

  private getDefaultClienteId(): string {
    const publicoGeneral = this.listaClientes.find((cliente) =>
      this.normalizeClienteLabel(cliente.label) === 'PUBLICO GENERAL'
    );

    return String(publicoGeneral?.value ?? '');
  }

  private getDefaultConceptoVentaId(): string {
    const conceptoPG = this.listaConceptoVenta.find((concepto) =>
      [concepto.label, concepto.data?.concepto, concepto.data?.name]
        .some((value) => String(value ?? '').trim().toUpperCase() === 'PG')
    );

    return String(conceptoPG?.value ?? '');
  }

  private getProductoRutaDefault(): string {
    if (this.productoRutaSeleccionado) return this.productoRutaSeleccionado;

    const idRuta = this.formulario.getRawValue().idRuta;
    const ruta = this.rutasData.find((item) => String(item.id) === String(idRuta));
    return ruta?.productoBase?.idProductoComercial ?? '';
  }

  private applyDefaultClienteToBlankPartidas(): void {
    const defaultClienteId = this.getDefaultClienteId();
    if (!defaultClienteId) {
      return;
    }

    let updated = false;
    for (const partida of this.listaPartidas || []) {
      if (!partida.cliente) {
        partida.cliente = defaultClienteId;
        updated = true;
      }
    }

    if (updated) {
      this.listaPartidas = [...this.listaPartidas];
    }
  }

  private normalizeClienteLabel(value: string | null | undefined): string {
    return (value ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toUpperCase();
  }

  private getNombreEmpleadoPorId(idEmpleado: string, fallback = ''): string {
    const empleado = this._empleadosFull.find((item) => item.idEmpleado === idEmpleado);
    return getEmpleadoNombreCompleto(empleado) || fallback;
  }

  getChoferOptions(chofer: ChoferSummary): SelectModel[] {
    const selectedId = String(chofer?.id ?? '');
    if (!selectedId) {
      return this.listaChofer;
    }

    const options = this.listaChofer.map((option) =>
      option.value === selectedId ? { ...option, disabled: false } : option
    );

    if (options.some((option) => option.value === selectedId)) {
      return options;
    }

    return [
      ...options,
      {
        label: `${chofer?.nombre || selectedId} (desactivado)`,
        value: selectedId,
        disabled: false,
      },
    ].sort((a, b) => a.label.localeCompare(b.label));
  }

  getAyudanteOptions(ayudante: { id: string; nombre?: string }): SelectModel[] {
    const selectedId = String(ayudante?.id ?? '');
    if (!selectedId) {
      return this.listaAyudantes;
    }

    const options = this.listaAyudantes.map((option) =>
      option.value === selectedId ? { ...option, disabled: false } : option
    );

    if (options.some((option) => option.value === selectedId)) {
      return options;
    }

    return [
      ...options,
      {
        label: `${ayudante?.nombre || selectedId} (desactivado)`,
        value: selectedId,
        disabled: false,
      },
    ].sort((a, b) => a.label.localeCompare(b.label));
  }

  eliminarPartida(): void {
    if (this.readonly) return;
    this.listaPartidas = this.listaPartidas.filter(
      (p) => !this.listaSeleccionada.includes(p)
    );
    this.listaSeleccionada = [];
    this.renumerarFoliosPartidas();
    this.updateChoferResumen();
        this.validarFoliosPorOrden(); // <-- NUEVO

  }

  setProducto(item: PartidaLiquidacion): void {
    this.setPrecioProducto(item);
    this.updateVentaChofer();
    this.partidaChanged.emit();
  }

  calcularImporte(item: PartidaLiquidacion): void {
    this.updateVentaChofer();
    const precio = item.precio || 0;
    const cantidad = item.cantidad || 0;
    const descuento = item.descuento || 0;
    item.importe = (precio * cantidad);
    // Validación: el precio no puede ser menor que el descuento
    this.validatePrecioVsDescuento(item);
    // Forzamos re-render de la tabla reasignando la referencia para que ngClass reevalúe
    this.listaPartidas = [...this.listaPartidas];
    this.partidaChanged.emit();
  }

  // get resumen() {
  //   const totalNotas = this.listaPartidas.length;
  //   const totalLiquidado = this.listaPartidas.reduce(
  //     (sum, p) => sum + (p.importe || 0) + (p.huecos || 0) * (p.precioHueco || 0),
  //     0
  //   );
  //   const facturarPartidas = this.listaPartidas.filter(
  //     p => p.tipoVenta === 'FACTURA' || p.tipoVenta === 'NOTA_ACOMULATIVA_FACTURAR'
  //   );
  //   const paraFacturar = facturarPartidas.length;
  //   const totalFacturar = facturarPartidas.reduce(
  //     (sum, p) => sum + (p.importe || 0) + (p.huecos || 0) * (p.precioHueco || 0),
  //     0
  //   );
  //   return { totalNotas, totalLiquidado, paraFacturar, totalFacturar };
  // }

  private setEmpleadosPorRuta(id: string | null) {
    const ruta = this.rutasData.find((r) => r.id === id);
    if (ruta) {
      this.formulario.patchValue(
        {
          idChofer: ruta.choferBase?.idEmpleado ?? '',
          // idAyudante: ruta.empleadosAsignados[0]?.idEmpleado ?? ''
        },
        { emitEvent: false }
      );
    }
  }

  verDetalle(partida: PartidaLiquidacion) {
    this.dialogPartida.open(partida, {
      clientes: this.listaClientes,
      productos: this.listaProductos,
      tipoVenta: this.listaTipoVenta,
      formaPago: this.listaFormaPago,
    });
  }

  solicitarCancelacion(partida: PartidaLiquidacion): void {
    if (!this.readonly || !partida?.id) {
      return;
    }

    this.cancelarPartida.emit(partida);
  }

  onColumnResizeEnd(event: TableColResizeEvent) {
    const widths = Array.from(
      this.table.el.nativeElement.querySelectorAll('th')
    ).map((th: any) => (th as HTMLElement).offsetWidth);
    this.localStorage.setLiquidacionColumnWidths(widths as number[]);
  }

  restoreColumnWidths(): void {
    const widths = this.localStorage.getLiquidacionColumnWidths();
    if (!widths) return;

    const ths = this.table?.el?.nativeElement.querySelectorAll('th');

    if (ths?.length !== widths.length) {
      console.warn('No coinciden columnas:', ths?.length, widths.length);
      return;
    }

    ths.forEach((th: HTMLElement, index: number) => {
      const width = widths[index];
      th.style.width = `${width}px`;
      th.style.minWidth = `${width}px`;
      th.style.maxWidth = `${width}px`;
    });
  }

  changeCliente(item: PartidaLiquidacion) {
    console.log(item);
    if (!item.producto) {
      return;
    }

    const params = `?idCliente=${item.cliente}`;
    const producto = item.producto;
    this.precioClienteService.getAllFilter(params).subscribe((resp) => {
      console.log(resp);
      if (resp && resp.length > 0) {
        const resultado = resp.filter(
          (p) => p.producto.idProductoComercial === item.producto
        );
        console.log(resultado);
        if (resultado) {
          // const precio = resultado[0].descuento
          // item.precioUnitario = precio;
        } else {
          // const prod = this.listaProductos.find(p => p.value === item.producto);
          // item.precioUnitario = prod?.price ?? 0;
        }
        // const data = resp[0];
        // const precio = data.producto?.precio ?? 0;
        // const desc = data.descuento ?? 0;
        // item.precioUnitario = precio;
      } else {
        // const prod = this.listaProductos.find(p => p.value === item.producto);
        // item.precioUnitario = prod?.price ?? 0;
      }
      this.calcularImporte(item);
    });
  }

  moveToNextCell(event: any, rowIndex: number, currentField: string) {
    event.preventDefault();
    // Lógica para pasar al siguiente campo en la tabla
    // Puedes usar ViewChildren para obtener las celdas y enfocar la siguiente
  }

  private updateChoferResumen() {
    if (this.isResumenLocked()) return;
    if (this.listadoChoferes.length === 0) return;

    const map: Record<string, ProductoSummary> = {};
    this.listaPartidas.forEach((p) => {
      if (p.producto && p.cantidad > 0) {
        const prod = this.listaProductos.find((lp) => lp.value === p.producto);
        const nombre = prod?.label || '';
        if (!map[p.producto]) {
          map[p.producto] = { id: p.producto, nombre, cantidad: 0 };
        }
        map[p.producto].cantidad += Number(p.cantidad);
      }
    });

    const productos = Object.values(map);

  this.listadoChoferes = this.listadoChoferes.map((ch) => ({
      ...ch,
      productos: productos,
      ayudantes: ch.ayudantes.map((a) => ({
        ...a,
        productos: productos.map((p) => ({ ...p })),
      })),
  }));
    console.log(this.listadoChoferes);
  }

  changeRuta() {
    const idRuta = this.formulario.getRawValue().idRuta;
    const rutaSeleccionada = this.rutasData.find((item) => String(item.id) === String(idRuta));
    this.productoRutaSeleccionado = rutaSeleccionada?.productoBase?.idProductoComercial ?? '';

    console.log(idRuta);
    this.rutasService.getOne(idRuta).subscribe((resp) => {
      console.log(resp);
      this.productoRutaSeleccionado = resp.productoBase?.idProductoComercial ?? this.productoRutaSeleccionado;
      console.log(this.listadoChoferes);
      this.formulario.patchValue({
        bloqueNota: resp.notaAsignada,
      });

      if (!this.isResumenLocked()) {
        this.listadoChoferes = [];
        this.listadoChoferes.push({
          id: resp.choferBase.idEmpleado,
          nombre: this.getNombreEmpleadoPorId(resp.choferBase.idEmpleado, resp.choferBase.nombre),
          ayudantes: resp.empleadosAsignados
            ? resp.empleadosAsignados?.map((a) => ({
                id: a.idEmpleado,
                nombre: this.getNombreEmpleadoPorId(a.idEmpleado, a.nombre),
                productos: [],
              }))
            : [],
          productos: [],
        });
      }
      this.searchFolio();

      if (!this.isResumenLocked()) {
        this.updateChoferResumen();
      }
    });
  }

  updateVentaChofer() {
    if (this.isResumenLocked()) return;
    console.log('updateVentaChofer', this.listaPartidas);
    // 1) Mapa id → acumulador de cantidades
    const mapa: Record<string, ProductoSummary> = {};
    this.listaPartidas.forEach((p) => {
      if (!p.producto) return;
      const nombre =
        this.listaProductos.find((o) => o.value === p.producto)?.label || '';
      if (!mapa[p.producto]) {
        mapa[p.producto] = { id: p.producto, nombre, cantidad: 0 };
      }
      mapa[p.producto].cantidad += p.cantidad;
    });

    const summaryList = Object.values(mapa);

    // 2) Para cada chofer, respetar manuales
    this.listadoChoferes.forEach((chofer) => {
      chofer.productos = summaryList.map((calc) => {
        const exist = chofer.productos.find((p) => p.id === calc.id);
        return {
          id: calc.id,
          nombre: calc.nombre,
          cantidad: exist?.manual ? exist.cantidad : calc.cantidad,
          manual: exist?.manual || false,
        };
      });

      // 3) Para cada ayudante, igual: si editó manualmente, lo conserva; si no, lo pone en 0
      chofer.ayudantes.forEach((a) => {
        a.productos = summaryList.map((calc) => {
          const exist = a.productos.find((p) => p.id === calc.id);
          return {
            id: calc.id,
            nombre: calc.nombre,
            cantidad: exist?.manual ? exist.cantidad : 0,
            manual: exist?.manual || false,
          };
        });
      });
    });

    // 4) Actualizamos las columnas del header
    this.nombreProductos = summaryList;
    // this.enforceChoferNoExcedePartidas();
    this.enforceChoferesNoExcedenPartidasGlobal();
    this.enforceAyudantesNoExcedenChoferGlobal();


  }

  getCantidad(products: ProductoSummary[], id: string): number {
    const p = products.find((x) => x.id === id);
    return p ? p.cantidad : 0;
  }

  removeAyudante(index: number, index2: number) {
    if (this.isResumenLocked()) return;
    console.log(index);
    console.log(index2);
    // chofer = chofer.ayudantes.filter((_, idx) => idx !== index2);
    this.listadoChoferes[index].ayudantes = this.listadoChoferes[
      index
    ].ayudantes.filter((_, idx) => idx !== index2);
  }

  removeChofer(index: number) {
    if (this.isResumenLocked()) return;
    this.listadoChoferes = this.listadoChoferes.filter(
      (_, idx) => idx !== index
    );
  }

  addChofer() {
    if (this.isResumenLocked()) return;
    console.log(this.listadoChoferes);
    console.log(this.nombreProductos);
  this.listadoChoferes.push({
      ayudantes: [],
      id: '',
      nombre: '',
      productos: this.nombreProductos.map((product) => ({
        cantidad: 0,
        id: product.id,
        nombre: product.nombre,
        idTotalizado: '',
        manual: false,
      })),
  });
  }

  addAyudante(chofer: ChoferSummary) {
    if (this.isResumenLocked()) return;
    console.log(chofer);
    chofer.ayudantes.push({
      id: '',
      nombre: '',
      productos: chofer.productos.map((producto) => ({
        ...producto,
        cantidad: producto.cantidad,
        manual: false,
      })),
    });
  }

  // Llama a esto en ngAfterViewInit() y cada que expandas/cambies filas
  private syncHorizontalScroll() {
    const parent = document.querySelector(
      '.freeze-chofer .p-datatable-wrapper'
    ) as HTMLElement | null;
    const childs = Array.from(
      document.querySelectorAll('.ayudantes-sticky .p-datatable-wrapper')
    ) as HTMLElement[];

    if (!parent) return;
    let lock = false;

    const apply = (src: HTMLElement, x: number) => {
      lock = true;
      if (src === parent) childs.forEach((w) => (w.scrollLeft = x));
      else {
        parent.scrollLeft = x;
        childs.forEach((w) => {
          if (w !== src) w.scrollLeft = x;
        });
      }
      lock = false;
    };

    const onScroll = (el: HTMLElement) =>
      el.addEventListener('scroll', () => {
        if (lock) return;
        apply(el, el.scrollLeft);
      });

    onScroll(parent);
    childs.forEach(onScroll);
  }

  searchFolio() {
    let bloqueNot = this.formulario.getRawValue().bloqueNota;

    if (bloqueNot) {
      this.liquidacionApiService.getNota(bloqueNot).subscribe({
        next: (response) => {
          console.log(response);
          this.ultimaNota = response.lastFolio;
          this.notaUpdate = response.lastFolio;
              this.validarFoliosPorOrden(); // <-- NUEVO

        },
      });
    }
  }

  cuentasTotal: number = 0;
  @ViewChild(FormCuentasComponent) cuentasForm?: FormCuentasComponent;

  onCuentasTotalChange(total: number) {
    this.cuentasTotal = Number(total) || (this.cuentas?.a1 + this.cuentas?.a2 + this.cuentas?.a3) || 0;
    this.updateDescuentosAutomaticos();
  }

  private updateDescuentosAutomaticos() {
    const total = Number(this.cuentasTotal) || (this.cuentas?.a1 + this.cuentas?.a2 + this.cuentas?.a3) || 0;
    let changed = false;
    for (const p of this.listaPartidas) {
      if (this.checkDescuento(p)) {
        p.descuento = total;
        this.calcularImporte(p);
        // Validar precio vs descuento cada vez que cambiamos el descuento
        this.validatePrecioVsDescuento(p);
        changed = true;
      }
      // Si el concepto requiere excluir/forzar factura apagada, aplicarlo
      if (this.checkFacturaDisabled(p)) {
        if (p.factura) {
          p.factura = false;
          changed = true;
        }
        // Prellenar forma de pago con 'CONTADO' si no hay valor (no sobrescribimos selección del usuario)
        if (!p.formaPago) {
          p.formaPago = 'CONTADO';
          changed = true;
        }
      }
    }
    if (changed) {
      this.listaPartidas = [...this.listaPartidas];
      this.partidaChanged.emit();
    }
  }

  changeConceptoVenta(partida: PartidaLiquidacion) {
    if (this.isFolioDisabledPartida(partida)) {
      partida.folio = null;
      this.clearFieldError(partida, 'folio');
    }
    // Si el concepto activa descuento, aplicamos el descuento automáticamente
    if (this.checkDescuento(partida)) {
      partida.descuento = Number(this.cuentasTotal) || (this.cuentas?.a1 + this.cuentas?.a2 + this.cuentas?.a3) || 0;
      this.calcularImporte(partida);
      // Validar precio vs descuento también al cambiar concepto
      this.validatePrecioVsDescuento(partida);
      // Forzar re-render para que la clase de error se aplique inmediatamente
      this.listaPartidas = [...this.listaPartidas];
    }

    // Si el concepto tiene exclude o descuento en true, desactivar la factura y prellenar formaPago
    if (this.checkFacturaDisabled(partida)) {
      partida.factura = false;
      // Prellenamos 'Efectivo' (CONTADO) pero no bloqueamos el control; usuario puede cambiar luego
      partida.formaPago = 'CONTADO';
      this.listaPartidas = [...this.listaPartidas];
    }

    this.partidaChanged.emit();
  }

  openPartidaModal(partida: PartidaLiquidacion): void {
    this.partidaModal = partida;
    this.partidaModalVisible = true;
  }

  closePartidaModal(): void {
    this.partidaModalVisible = false;
    this.partidaModal = null;
  }

  isPartidaModalReadonly(): boolean {
    return !this.partidaModal || this.readonly || this.checkCancelado(this.partidaModal);
  }

  changeFormaPago(partida: PartidaLiquidacion): void {
    const formaPago = this.listaFormaPago.find(
      item => String(item.code) === String(partida?.formaPago)
    );
    const texto = `${partida?.formaPago ?? ''} ${formaPago?.name ?? ''}`
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase();

    if (texto.includes('CREDITO') || texto.includes('DEBITO')) {
      partida.factura = true;
      this.listaPartidas = [...this.listaPartidas];
      this.partidaChanged.emit();
    }
  }

  isFolioDisabledPartida(partida: PartidaLiquidacion | null | undefined): boolean {
    const value = String(partida?.conceptoVenta ?? '').trim().toUpperCase();
    if (value === 'BPSC' || value === 'PGNP') return true;
    const concepto = this.listaConceptoVenta.find(
      item => String(item.value) === String(partida?.conceptoVenta)
    );
    const label = String(concepto?.label ?? '').trim().toUpperCase();
    return label.includes('BPSC') || label.includes('PGNP');
  }


  // Devuelve el objeto de concepto de venta desde el catálogo usando la id
  getObjectConceptoVenta(partida: PartidaLiquidacion) {
    if (!partida?.conceptoVenta) return [];
    // Buscar por id exacta
    return this.listaConceptoVenta.filter((item) => String(item.value) === String(partida.conceptoVenta));
  }

  // Valida que el precio no sea menor que el descuento y setea errores de campo
  private validatePrecioVsDescuento(p: PartidaLiquidacion) {
    const precio = Number(p.precio || 0);
    const descuento = Number(p.descuento || 0);
    if (precio < descuento) {
      this.setFieldError(p, 'precio', 'El precio no puede ser menor que el descuento');
    } else {
      this.clearFieldError(p, 'precio');
    }
  }

  checkDescuento(partida: PartidaLiquidacion) {

    if (partida.conceptoVenta === '') {
      return false;
    }
    let concepto = this.getObjectConceptoVenta(partida);
    console.log(partida);
    if (concepto[0]?.data?.descuento) {
      return true;
    }
    return false;
  }

  checkCancelado(partida: PartidaLiquidacion) {
    let concepto = this.getObjectConceptoVenta(partida);
    if (concepto[0]?.data?.cancelado) {
      return true;
    }
    return false;
  }

  // Si el concepto tiene la propiedad 'exclude' o 'descuento' en true, entonces
  // debemos deshabilitar el checkbox de factura y forzarlo a false.
  checkFacturaDisabled(partida: PartidaLiquidacion) {
    let concepto = this.getObjectConceptoVenta(partida);
    return !!(concepto[0]?.data?.exclude || concepto[0]?.data?.descuento);
  }

  setPrecioProducto(partida: PartidaLiquidacion) {
    const cliente = partida.cliente;
    const producto = partida.producto;
    if (cliente && producto) {
      const params = `?idCliente=${cliente}`;
      this.precioClienteService.getAllFilter(params).subscribe({
        next: (response) => {
          if (response.length) {
            let precio = response.filter(
              (prod) => prod.producto.idProductoComercial === producto
            );
            if (precio.length) {
              partida.precio = precio[0].descuento;
            } else {
              let precio = this.listaProductos.filter(
                (item) => item.value === producto
              );
              partida.precio = precio[0].price;
            }
          } else {
            let precio = this.listaProductos.filter(
              (item) => item.value === producto
            );
            partida.precio = precio[0].price;
          }
          this.calcularImporte(partida);
          this.partidaChanged.emit();
        },
      });
    } else if (producto) {
      let precio = this.listaProductos.filter(
        (item) => item.value === producto
      );
      partida.precio = precio[0].price;
      this.calcularImporte(partida);
      this.partidaChanged.emit();
    } else {
      this.partidaChanged.emit();
    }
  }

/////////////////////////////
// Total por producto a partir de las partidas (tope para Chofer)
private getTotalPartidasPorProducto(): Record<string, number> {
  const totales: Record<string, number> = {};
  for (const p of this.listaPartidas) {
    if (!p.producto) continue;
    const id = p.producto;
    const cant = Number(p.cantidad || 0);
    totales[id] = (totales[id] ?? 0) + cant;
  }
  return totales;
}

private getTotalResumenChoferPorProducto(): Record<string, number> {
  const totales: Record<string, number> = {};
  for (const chofer of this.listadoChoferes || []) {
    chofer.productos?.forEach((prod) => {
      const id = prod?.id;
      if (!id) {
        return;
      }
      const cantidad = Number(prod?.cantidad || 0);
      if (!Number.isFinite(cantidad)) {
        return;
      }
      totales[id] = (totales[id] ?? 0) + cantidad;
    });

    chofer.ayudantes?.forEach((ayudante) => {
      ayudante.productos?.forEach((prod) => {
        const id = prod?.id;
        if (!id) {
          return;
        }
        const cantidad = Number(prod?.cantidad || 0);
        if (!Number.isFinite(cantidad)) {
          return;
        }
        totales[id] = (totales[id] ?? 0) + cantidad;
      });
    });
  }
  return totales;
}

private hasResumenChoferMismatch(): boolean {
  const partidas = this.getTotalPartidasPorProducto();
  const resumen = this.getTotalResumenChoferPorProducto();
  const productos = new Set([...Object.keys(partidas), ...Object.keys(resumen)]);

  for (const id of productos) {
    const totalPartidas = Number(partidas[id] ?? 0);
    const totalResumen = Number(resumen[id] ?? 0);
    if (this.totalsDiffer(totalPartidas, totalResumen)) {
      return true;
    }
  }
  return false;
}

private totalsDiffer(a: number, b: number): boolean {
  return Math.abs(a - b) > 0.0001;
}

// Se llama al editar manualmente un valor del Chofer: clamp <= total de partidas
onEditChoferCantidad(chofer: ChoferSummary, prod: ProductoSummary) {
  if (this.isResumenLocked()) return;
  console.log(prod);
  const totales = this.getTotalPartidasPorProducto();
  console.log('totales',totales);
  const total = Number(totales[prod.id] ?? 0);
  console.log('total',total);
  // cantidad actual del chofer editado (normalizada)
  const current = Number(prod.cantidad || 0);
  console.log('current',current);


  // suma de TODOS los choferes para ese producto
  const sumaTodos = this.listadoChoferes.reduce((acc, ch) => {
    const p = ch.productos?.find(x => x.id === prod.id);
    return acc + Number(p?.cantidad || 0);
  }, 0);
  console.log('sumatodos',sumaTodos);
  // if (current > total || sumaTodos > total) {
  //   console.log('deberia ser 0');
  //   prod.cantidad = 0;
  // }
  // "otros" = todos - el actual
  const sumaOtros = Math.max(0, sumaTodos - current);
  console.log('sumaOtros',sumaOtros);
  // remanente disponible = total - otros
  const remanente = Math.max(0, total - sumaOtros);
  console.log('remanente',remanente);
  // clamp del valor actual al remanente disponible
  setTimeout(() => {
    prod.cantidad = Math.min(current, remanente);
    console.log(prod.cantidad);
    prod.manual = true;
    this.listadoChoferes = [...this.listadoChoferes]
    this.cdr.markForCheck();

  }, 500);

  // refuerzo global por si otros quedaron rebasados
  this.enforceChoferesNoExcedenPartidasGlobal();
  console.log(this.listadoChoferes);
}


// Después de recalcular por cambios en partidas, garantizamos el tope
private enforceChoferNoExcedePartidas() {
  if (this.isResumenLocked()) return;
  const totales = this.getTotalPartidasPorProducto();
  this.listadoChoferes.forEach(ch => {
    ch.productos?.forEach(p => {
      const max = totales[p.id] ?? 0;
      if ((p.cantidad ?? 0) > max) {
        p.cantidad = max;
        p.manual = true; // conserva edición manual pero respetando el tope
      }
    });
  });
}

private enforceChoferesNoExcedenPartidasGlobal() {
  if (this.isResumenLocked()) return;
  const totales = this.getTotalPartidasPorProducto();

  // Itera producto por producto
  const productosIds = new Set<string>();
  this.listadoChoferes.forEach(ch => ch.productos?.forEach(p => productosIds.add(p.id)));

  productosIds.forEach(productId => {
    const total = totales[productId] ?? 0;

    // Primero manuales (prioridad)
    let asignado = 0;
    const manuales: { ch: ChoferSummary; p: ProductoSummary }[] = [];
    const autos: { ch: ChoferSummary; p: ProductoSummary }[] = [];

    this.listadoChoferes.forEach(ch => {
      const p = ch.productos?.find(x => x.id === productId);
      if (!p) return;
      (p.manual ? manuales : autos).push({ ch, p });
    });

    // Clampea manuales
    for (const { p } of manuales) {
      const allowed = Math.max(0, total - asignado);
      if ((p.cantidad ?? 0) > allowed) p.cantidad = allowed;
      asignado += Number(p.cantidad || 0);
      p.manual = true; // conservar estado
    }

    // Clampea automáticos con lo que queda
    for (const { p } of autos) {
      const allowed = Math.max(0, total - asignado);
      if ((p.cantidad ?? 0) > allowed) p.cantidad = allowed;
      asignado += Number(p.cantidad || 0);
      // no tocamos p.manual (sigue false)
    }
  });
}

onEditAyudanteCantidad(chofer: ChoferSummary, ayudante: any, prod: ProductoSummary) {
  if (this.isResumenLocked()) return;
  // Cantidad del chofer para este producto (tope local)
  const topChofer = Number(
    chofer.productos?.find(x => x.id === prod.id)?.cantidad || 0
  );

  // Valor actual del ayudante (ya actualizado por [(ngModel)] al disparar blur)
  const current = Number(prod.cantidad || 0);

  // Suma de TODOS los ayudantes del chofer para este producto
  const sumaAyudantes = chofer.ayudantes.reduce((acc, a) => {
    const p = a.productos?.find(x => x.id === prod.id);
    return acc + Number(p?.cantidad || 0);
  }, 0);

  // "otros" ayudantes = todos - el actual
  const sumaOtros = Math.max(0, sumaAyudantes - current);

  // Remanente disponible = chofer - otros
  const remanente = Math.max(0, topChofer - sumaOtros);

  // Clamp del valor actual al remanente disponible
  prod.cantidad = Math.min(current, remanente);
  prod.manual = true;

  // Refuerzo global por si hay overflow en otros ayudantes o si el chofer cambió
  this.enforceAyudantesNoExcedenChoferGlobal();
}

private enforceAyudantesNoExcedenChoferGlobal() {
  if (this.isResumenLocked()) return;
  // Por cada chofer…
  this.listadoChoferes.forEach(chofer => {
    const productosIds = new Set<string>();
    chofer.productos?.forEach(p => productosIds.add(p.id));

    productosIds.forEach(productId => {
      const topChofer = Number(
        chofer.productos?.find(p => p.id === productId)?.cantidad || 0
      );

      // Recolecta todos los registros de ayudantes para este producto
      const regs: ProductoSummary[] = [];
      chofer.ayudantes.forEach(a => {
        const p = a.productos?.find(x => x.id === productId);
        if (p) regs.push(p);
      });

      // Prioriza manuales
      const manuales = regs.filter(p => !!p.manual);
      const autos = regs.filter(p => !p.manual);

      let asignado = 0;

      // Clampea manuales primero
      for (const p of manuales) {
        const allow = Math.max(0, topChofer - asignado);
        const val = Math.min(Number(p.cantidad || 0), allow);
        p.cantidad = val;
        asignado += val;
        p.manual = true;
      }

      // Luego automáticos con lo que quede
      for (const p of autos) {
        const allow = Math.max(0, topChofer - asignado);
        const val = Math.min(Number(p.cantidad || 0), allow);
        p.cantidad = val;
        asignado += val;
        // p.manual se queda como esté
      }
    });
  });
}

registrarCliente(item:any,partida:any){
  console.log('registrarCliente');
  let form = this.formulario.getRawValue();
    let request:ClienteDTO = {
      comentario:'CREADO DESDE LIQUIDACION',
      correo: '',
      idRuta: form.idRuta,
      diasDeCredito:0,
      fechaAlta: form.fecha,
      nombreComercial: item,
      telefono: '',
      idTipoDeCliente: this.tipoClienteObject.code,
      tipoPago: 'CONTADO',
      informacionFiscal:{
        calle1: '',
        calle2: '',
        codigoPostal: '',
        colonia: '',
        entidadFederativa: '',
        localidad: '',
        municipio: '',
        nombreVialidad: '',
        numeroExterior: '',
        numeroInterior: '',
        razonSocial: '',
        rfc: '',
        tipoContribuyente: null,
        tipoVialidad: '',
      }
}

 console.log(request);

     this.ClienteApiService.create(request)
      .subscribe((resp) => {
          this.selCliente.hide();

        console.log(resp);
        console.log(partida);
        partida.cliente = resp.id
        this.getClientes();
      });


}

// --- Helper: totalizadores solo consideran forma de pago Efectivo ---
private esFormaPagoEfectivo(p: PartidaLiquidacion): boolean {
  if (!p?.formaPago) return false;
  return p.formaPago.toString().toUpperCase() === 'CONTADO';
}

private esConceptoVentaF1(p: PartidaLiquidacion): boolean {
  const concepto = (p?.conceptoVenta ?? '').toString().toUpperCase();
  if (concepto === 'F1') {
    return true;
  }

  const conceptoCatalogo = this.listaConceptoVenta.find(
    (item) => String(item.value) === String(p?.conceptoVenta)
  );
  const label = conceptoCatalogo?.label?.toString().toUpperCase();
  return label === 'F1';
}

// --- TOTALIZADOR: por producto (solo Efectivo) ---
  get totalizadorPorProducto() {
    // [{ id, nombre, cantidad, precioPromedio, total }]
    const mapa = new Map<string, { id: string; nombre: string; cantidad: number; total: number }>();

    for (const p of this.listaPartidas || []) {
      if (!this.shouldIncludePartidaInSummary(p)) continue;
      if (!p?.producto) continue;
      if (!this.esFormaPagoEfectivo(p)) continue;

    const cantidad = Number(p.cantidad || 0);
    const precio = Number(p.precio || 0); // SIN restar descuento
    if (cantidad <= 0 || precio <= 0) continue;

    const cat = this.listaProductos.find(x => x.value === p.producto);
    const nombre = cat?.label || p.producto;
    const key = p.producto;

    if (!mapa.has(key)) {
      mapa.set(key, { id: key, nombre, cantidad: 0, total: 0 });
    }
    const curr = mapa.get(key)!;
    curr.cantidad += cantidad;
    curr.total += precio * cantidad; // sin descuento
  }

  const resultado = Array.from(mapa.values()).map(x => ({
    ...x,
    precioPromedio: x.cantidad > 0 ? x.total / x.cantidad : 0
  }));

  resultado.sort((a, b) => a.nombre.localeCompare(b.nombre));
  return resultado;
}

  get totalGeneralImporte(): number {
    return (this.listaPartidas || [])
      .filter(p => this.shouldIncludePartidaInSummary(p))
      .filter(p => p?.producto && this.esFormaPagoEfectivo(p))
      .reduce((acc, p) => acc + Number(p.precio || 0) * Number(p.cantidad || 0), 0); // sin descuento
  }

get totalizadorConceptoVentaF1() {
  const mapa = new Map<string, { id: string; nombre: string; cantidad: number; total: number }>();

  for (const p of this.listaPartidas || []) {
      if (!this.shouldIncludePartidaInSummary(p)) continue;
      if (!p?.producto) continue;
      if (!this.esConceptoVentaF1(p)) continue;
      if (!this.esFormaPagoEfectivo(p)) continue;

    const cantidad = Number(p.cantidad || 0);
    const precio = Number(p.precio || 0);
    if (cantidad <= 0 || precio <= 0) continue;

    const cat = this.listaProductos.find(x => x.value === p.producto);
    const nombre = cat?.label || p.producto;
    const key = p.producto;

    if (!mapa.has(key)) {
      mapa.set(key, { id: key, nombre, cantidad: 0, total: 0 });
    }
    const curr = mapa.get(key)!;
    curr.cantidad += cantidad;
    curr.total += precio * cantidad;
  }

  const resultado = Array.from(mapa.values()).map(x => ({
    ...x,
    precioPromedio: x.cantidad > 0 ? x.total / x.cantidad : 0
  }));

  resultado.sort((a, b) => a.nombre.localeCompare(b.nombre));
  return resultado;
}

  get totalGeneralConceptoVentaF1(): number {
    return (this.listaPartidas || [])
      .filter(p => this.shouldIncludePartidaInSummary(p))
      .filter(p => p?.producto && this.esConceptoVentaF1(p) && this.esFormaPagoEfectivo(p))
      .reduce((acc, p) => acc + Number(p.precio || 0) * Number(p.cantidad || 0), 0);
  }

get totalizadorDescuentos() {
  const mapa = new Map<string, { id: string; nombre: string; cantidad: number; totalDescuento: number }>();

  for (const p of this.listaPartidas || []) {
      if (!this.shouldIncludePartidaInSummary(p)) continue;
      if (!p?.producto) continue;
      if (!this.esFormaPagoEfectivo(p)) continue;
      const descuentoUnitario = Number(p.descuento || 0);
    if (descuentoUnitario === 0) continue;

    const cantidad = Number(p.cantidad || 0);
    if (cantidad <= 0) continue;

    const cat = this.listaProductos.find(x => x.value === p.producto);
    const nombre = cat?.label || p.producto;
    const key = p.producto;

    if (!mapa.has(key)) {
      mapa.set(key, { id: key, nombre, cantidad: 0, totalDescuento: 0 });
    }
    const curr = mapa.get(key)!;
    curr.cantidad += cantidad;
    curr.totalDescuento += descuentoUnitario * cantidad;
  }

  const resultado = Array.from(mapa.values());
  resultado.sort((a, b) => a.nombre.localeCompare(b.nombre));
  return resultado;
}

  get totalGeneralDescuentos(): number {
    return (this.listaPartidas || [])
      .filter(p => this.shouldIncludePartidaInSummary(p))
      .filter(p => this.esFormaPagoEfectivo(p))
      .reduce((acc, p) => {
      const descuentoUnitario = Number(p.descuento || 0);
      const cantidad = Number(p.cantidad || 0);
      if (descuentoUnitario === 0 || cantidad <= 0) return acc;
      return acc + descuentoUnitario * cantidad;
    }, 0);
}

  get totalNetoLiquidacion(): number {
    return this.totalGeneralImporte - this.totalGeneralDescuentos;
  }

private renumerarFoliosPartidas(): void {
  const base = Number(this.ultimaNota || 0);
  const minimoEsperado = (Number.isFinite(base) ? base : 0) + 1;
  let siguiente = minimoEsperado;

  const primerFolio = Number(this.listaPartidas?.[0]?.folio);
  if (Number.isFinite(primerFolio) && primerFolio > 0) {
    siguiente = Math.max(minimoEsperado, primerFolio);
  }

  for (const partida of this.listaPartidas || []) {
    if (this.isFolioDisabledPartida(partida)) {
      partida.folio = null;
      continue;
    }
    const folioActual = Number(partida.folio);
    if (Number.isFinite(folioActual) && folioActual > 0) {
      siguiente = folioActual + 1;
      continue;
    }

    partida.folio = siguiente;
    siguiente++;
  }

  this.notaUpdate = Math.max(this.notaUpdate, siguiente - 1);
  this.listaPartidas = [...this.listaPartidas];
}

private getSiguienteFolio(): number {
  const ultimo = this.getUltimoFolioPartidas();
  if (Number.isFinite(ultimo) && ultimo > 0) {
    return ultimo + 1;
  }

  const base = Number(this.ultimaNota || 0);
  return (Number.isFinite(base) ? base : 0) + 1;
}

private getUltimoFolioPartidas(): number {
  let ultimo = 0;
  for (const partida of this.listaPartidas || []) {
    if (this.isFolioDisabledPartida(partida)) continue;
    const folio = Number(partida.folio);
    if (Number.isFinite(folio) && folio > 0) {
      ultimo = folio;
    }
  }

  return ultimo;
}

// --- Helpers para manejar errores por campo ---
private setFieldError(p: PartidaLiquidacion, field: string, msg: string) {
  p.errores = p.errores || {};
  p.errores[field] = msg;
  p.hasError = true;
}

private clearFieldError(p: PartidaLiquidacion, field: string) {
  if (p?.errores && p.errores[field]) {
    delete p.errores[field];
  }
  p.hasError = !!(p?.errores && Object.keys(p.errores).length);
}

// --- Valida folios consecutivos por ORDEN de la tabla ---
// Base = ultimaNota + 1; fila 0 espera base, fila 1 espera base+1, etc.
validarFoliosPorOrden() {
  const base = Number(this.ultimaNota || 0);
  const minimoEsperado = (Number.isFinite(base) ? base : 0) + 1;

  const primerFolioCapturado = Number((this.listaPartidas || [])[0]?.folio);
  let esperado = minimoEsperado;

  if (Number.isFinite(primerFolioCapturado) && primerFolioCapturado > 0) {
    esperado = Math.max(minimoEsperado, primerFolioCapturado);
  }

  (this.listaPartidas || []).forEach((p) => {
    if (this.isFolioDisabledPartida(p)) {
      p.folio = null;
      this.clearFieldError(p, 'folio');
      return;
    }
    const f = Number(p.folio);

    // 👇 Si la partida YA existe (tiene id), no la validamos
    if (p.id && p.id !== '') {
      this.clearFieldError(p, 'folio');
      if (Number.isFinite(f) && f > 0) {
        esperado = f + 1;
      }
      return;
    }

    // Validación normal para partidas nuevas
    if (!Number.isFinite(f) || f <= 0 || f !== esperado) {
      this.setFieldError(p, 'folio', `No es consecutivo`);
    } else {
      this.clearFieldError(p, 'folio');
    }

    if (Number.isFinite(f) && f > 0) {
      esperado = f + 1;
    } else {
      esperado++;
    }
  });

  // refresca data binding de la tabla
  this.listaPartidas = [...this.listaPartidas];
}

toggleEdit(){
  if (!this.cuentaEdit) {
      this.cuentaEdit = true;
  }

}
onCuentaEditChange(event:any){
  if (this.cuentaEdit) {
    this.cuentaEdit = false;
  }
}




// ...existing code...




}
export interface PartidaLiquidacion{
  id:string;
  conceptoVenta:string;
  descuento:number;
  cancelada?: boolean;
  motivoCancelacion?: string;
  factura:boolean;
  cliente:string;
  producto:string;
  cantidad:number;
  precio:number;
  importe:number;
  folio:number | null;
  formaPago:string;
  hasError?: boolean;
  errores?: {[key: string]: string};
}



