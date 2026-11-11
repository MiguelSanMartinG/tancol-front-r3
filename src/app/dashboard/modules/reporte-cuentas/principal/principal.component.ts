import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { AppSharedModule } from '@shared/app-shared.module';
import { BotonRegresarComponent } from '@shared/components/boton-regresar/boton-regresar.component';
import { HeaderComponent } from '@shared/components/header/header.component';
import { ClienteApiService } from '../../cliente/services/cliente.service';
import { NuestrosProductosService } from '../../nuestros-productos/service/nuestros-productos.service';
import { RutasApiService } from '../../rutas/services/rutas-api.service';
import { ConceptoVentaApiService } from '../../concepto-venta/services/concepto-venta.api.service';
import { ReporteCuentasItem, ReporteCuentasRequest, ReporteCuentasService } from '../services/reporte-cuentas.service';
import { SelectModel } from '@core/common/select.model';
import { ExcelExportService, ExportColumn } from '@shared/services/excel.export.service';
import { DateUtilService } from '@shared/services/date-util.service';

@Component({
  selector: 'app-reporte-cuentas',
  standalone: true,
  imports: [
    CommonModule,
    BotonRegresarComponent,
    HeaderComponent,
    AppPrimengModule,
    ReactiveFormsModule,
    AppSharedModule,
  ],
  templateUrl: './principal.component.html',
  styleUrl: './principal.component.scss',
})
export class PrincipalComponent implements OnInit {
  reporteApi = inject(ReporteCuentasService);
  clienteApi = inject(ClienteApiService);
  productosApi = inject(NuestrosProductosService);
  rutasApi = inject(RutasApiService);
  conceptoVentaApi = inject(ConceptoVentaApiService);
  dateUtil = inject(DateUtilService);
  fb = inject(FormBuilder);

  filtro!: FormGroup;
  listaRegistros: ReporteCuentasItem[] = [];
  listaClientes: SelectModel[] = [];
  listaConceptosVenta: SelectModel[] = [];
  listaProductos: SelectModel[] = [];
  listaRutas: SelectModel[] = [];
  listaTipoPago = [
    { label: 'Efectivo', value: 'CONTADO' },
    { label: 'Credito', value: 'CREDITO' },
    { label: 'Donados', value: 'DONACION' },
    { label: 'Vale Codigo', value: 'VALE_CODIGO' },
    { label: 'Vale Sin Codigo', value: 'VALE_S_CODIGO' },
    { label: 'Tarjeta Debito', value: 'T_DEBITO' },
    { label: 'Tarjeta Credito', value: 'T_CREDITO' },
  ];
  opcionesLimite = [
    { label: '10', value: 10 },
    { label: '25', value: 25 },
    { label: '50', value: 50 },
    { label: '100', value: 100 },
    { label: 'Todos', value: null },
  ];
  @ViewChild('table') table!: any;

  configurationExport: { columns: ExportColumn[]; titleDownload: string } = {
    columns: [
      { header: 'Ruta', key: 'nombreRuta', width: 20 },
      { header: 'Fecha', key: 'fecha', width: 20 },
      { header: 'Bloque nota', key: 'bloqueNota', width: 15 },
      { header: 'Venta', key: 'conceptoVenta', width: 22 },
      { header: 'Cantidad', key: 'cantidad', width: 12 },
      { header: 'Importe', key: 'importe', width: 16 },
      { header: 'Cliente', key: 'nombreCliente', width: 25 },
      { header: 'Producto', key: 'nombreProducto', width: 25 },
      { header: 'Precio unitario', key: 'precioUnitario', width: 18 },
      { header: 'Cuenta A', key: 'cuentaA', width: 14 },
      { header: 'Cuenta B', key: 'cuentaB', width: 14 },
      { header: 'Forma de pago', key: 'tipoPago', width: 15 },
      { header: 'Vendedor/Chofer', key: 'vendedor_chofer', width: 25 },
      { header: 'Ayudantes', key: 'ayudantes', width: 30 },
    ],
    titleDownload: 'reporte-cuentas',
  };

  private readonly tipoPagoMap = new Map<string, string>(this.listaTipoPago.map((item) => [item.value, item.label]));

  constructor() {
    const today = new Date();
    this.filtro = this.fb.group({
      fechaInicio: [today],
      fechaFin: [today],
      cancelado: [false],
      descuento: [false],
      f1: [false],
      facturado: [false],
      clientes: [[]],
      conceptosVenta: [[]],
      productos: [[]],
      rutas: [[]],
      tipoPago: [[]],
      limite: [null],
    });

    this.clienteApi.getAllFilter('?enabled=true').subscribe((resp) => {
      this.listaClientes = resp.map((c) => ({ label: c.nombreComercial, value: c.id }));
    });
    this.conceptoVentaApi.getAllFilter('?enabled=true').subscribe((resp) => {
      this.listaConceptosVenta = resp.map((concepto) => ({
        label: concepto.name || concepto.concepto,
        value: concepto.id,
      }));
    });
    this.productosApi.getAllFilter('?enabled=true').subscribe((resp) => {
      this.listaProductos = resp.map((p) => ({ label: p.alias, value: p.idProductoComercial }));
    });
    this.rutasApi.getAll().subscribe((resp) => {
      this.listaRutas = resp.map((r) => ({ label: r.nombre, value: r.id }));
    });
  }

  ngOnInit(): void {
    this.buscar();
  }

  buscar(): void {
    const filtros = this.filtro.value;
    const fechaInicioUtc = filtros.fechaInicio ? this.dateUtil.toUTCStartOfDay(new Date(filtros.fechaInicio)) : undefined;
    const fechaFinUtc = filtros.fechaFin ? this.dateUtil.toUTCEndOfDay(new Date(filtros.fechaFin)) : undefined;

    const body: ReporteCuentasRequest = {
      cancelado: filtros.cancelado,
      conceptosVenta: filtros.conceptosVenta || [],
      descuento: filtros.descuento,
      f1: filtros.f1,
      facturado: filtros.facturado,
      fechaInicio: fechaInicioUtc,
      fechaFin: fechaFinUtc,
      idClientes: filtros.clientes || [],
      idProductosComerciales: filtros.productos || [],
      idRutas: filtros.rutas || [],
      tipoPago: filtros.tipoPago || [],
      x: 'xyz',
    };

    this.reporteApi.getReport(body).subscribe((res) => {
      this.listaRegistros = Array.isArray(res) ? res : [];
      const total = this.listaRegistros.length;
      this.opcionesLimite[this.opcionesLimite.length - 1].value = total;
    });
  }

  cleanTable(): void {
    this.table?.clear();
    this.filtro.reset({
      fechaInicio: new Date(),
      fechaFin: new Date(),
      cancelado: false,
      descuento: false,
      f1: false,
      facturado: false,
      clientes: [],
      conceptosVenta: [],
      productos: [],
      rutas: [],
      tipoPago: [],
      limite: null,
    });
    this.buscar();
  }

  exportar(): void {
    if (!this.listaRegistros.length) return;
    const exportRows = this.listaRegistros.map((item) => ({
      ...item,
      tipoPago: this.getTipoPagoLabel(item.tipoPago),
      importe: this.formatMoney(item.importe),
      precioUnitario: this.formatMoney(item.precioUnitario),
      cuentaA: this.formatMoney(item.cuentaA),
      cuentaB: this.formatMoney(item.cuentaB),
    }));
    ExcelExportService.exportAsExcelFile(exportRows, this.configurationExport.columns, this.configurationExport.titleDownload);
  }

  getTipoPagoLabel(value: string | null | undefined): string {
    if (!value) return '';
    return this.tipoPagoMap.get(value) ?? value;
  }

  getAyudantes(item: ReporteCuentasItem): string[] {
    if (!item?.ayudantes) return ['--'];
    return item.ayudantes
      .split(',')
      .map((part) => part.trim())
      .filter((part) => part.length > 0);
  }

  get registrosVisibles(): ReporteCuentasItem[] {
    const limite = this.filtro.get('limite')?.value;
    return limite ? this.listaRegistros.slice(0, limite) : this.listaRegistros;
  }

  get totalCantidad(): number {
    return this.registrosVisibles.reduce((sum, item) => sum + Number(item.cantidad || 0), 0);
  }

  get totalImporte(): number {
    return this.registrosVisibles.reduce((sum, item) => sum + Number(item.importe || 0), 0);
  }

  get totalCuentaA(): number {
    return this.registrosVisibles.reduce((sum, item) => sum + Number(item.cuentaA || 0), 0);
  }

  get totalCuentaB(): number {
    return this.registrosVisibles.reduce((sum, item) => sum + Number(item.cuentaB || 0), 0);
  }

  formatMoney(value: number | string | null | undefined): string {
    return `$${Number(value ?? 0).toFixed(2)}`;
  }
}
