import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { BotonRegresarComponent } from '@shared/components/boton-regresar/boton-regresar.component';
import { HeaderComponent } from '@shared/components/header/header.component';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { AppSharedModule } from '@shared/app-shared.module';
import { ReporteVolumenVentasClienteService, VolumenVentasClienteItem, VolumenVentasClienteRequest } from '../services/reporte-volumen-ventas-cliente.service';
import { ClienteApiService } from '../../cliente/services/cliente.service';
import { NuestrosProductosService } from '../../nuestros-productos/service/nuestros-productos.service';
import { SelectModel } from '@core/common/select.model';
import { ExcelExportService, ExportColumn } from '@shared/services/excel.export.service';
import { DateUtilService } from '@shared/services/date-util.service';

@Component({
  selector: 'app-reporte-volumen-ventas-cliente',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AppPrimengModule, BotonRegresarComponent, HeaderComponent, AppSharedModule],
  templateUrl: './principal.component.html',
  styleUrl: './principal.component.scss',
})
export class PrincipalComponent implements OnInit {
  fb = inject(FormBuilder);
  reporteApi = inject(ReporteVolumenVentasClienteService);
  clientesApi = inject(ClienteApiService);
  productosApi = inject(NuestrosProductosService);
  dateUtil = inject(DateUtilService);

  filtro!: FormGroup;
  listaRegistros: VolumenVentasClienteItem[] = [];
  listaClientes: SelectModel[] = [];
  listaProductos: SelectModel[] = [];
  opcionesLimite = [
    { label: '10', value: 10 },
    { label: '25', value: 25 },
    { label: '50', value: 50 },
    { label: '100', value: 100 },
    { label: 'Todos', value: null },
  ];
  @ViewChild('table') table!: any;

  constructor() {
    this.filtro = this.fb.group({
      fechaInicio: [new Date(), Validators.required],
      fechaFin: [new Date(), Validators.required],
      clientes: [[]],
      productos: [[]],
      limite: [null],
    });
  }

  ngOnInit(): void {
    this.clientesApi.getAllFilter('?enabled=true').subscribe((resp) => {
      this.listaClientes = resp.map((c) => ({ label: c.nombreComercial, value: c.id }));
    });
    this.productosApi.getAllFilter('?enabled=true').subscribe((resp) => {
      this.listaProductos = resp.map((p) => ({ label: p.alias, value: p.idProductoComercial }));
    });
    this.buscar();
  }

  buscar(): void {
    if (this.filtro.invalid) {
      this.filtro.markAllAsTouched();
      return;
    }
    const filtros = this.filtro.value;
    const body: VolumenVentasClienteRequest = {
      fechaInicio: this.dateUtil.toUTCStartOfDay(new Date(filtros.fechaInicio)),
      fechaFin: this.dateUtil.toUTCEndOfDay(new Date(filtros.fechaFin)),
      idCliente: filtros.clientes || [],
      idProductosComerciales: filtros.productos || [],
    };
    this.reporteApi.getReporte(body).subscribe((res) => {
      this.listaRegistros = res ?? [];
      const total = this.listaRegistros.length;
      this.opcionesLimite[this.opcionesLimite.length - 1].value = total;
      this.table?.reset();
    });
  }

  cleanTable(): void {
    this.table?.clear();
    this.filtro.reset({
      fechaInicio: new Date(),
      fechaFin: new Date(),
      clientes: [],
      productos: [],
      limite: null,
    });
    this.listaRegistros = [];
    this.buscar();
  }

  limiteActual(): number | null {
    const v = this.filtro.get('limite')?.value;
    if (v === null || v === undefined) return null;
    return Number(v);
  }

  exportar(): void {
    if (!this.listaRegistros.length) return;
    const exportRows = this.listaRegistros.map((item) => ({
      alias: item.alias ?? '',
      nombre: item.nombre ?? '',
      nombreComercial: item.nombreComercial ?? '',
      razonSocial: item.razonSocial ?? '',
      cantidadVendida: item.cantidadVendida,
    }));
    const columns: ExportColumn[] = [
      { header: 'Alias', key: 'alias', width: 16 },
      { header: 'Nombre', key: 'nombre', width: 25 },
      { header: 'Nombre comercial', key: 'nombreComercial', width: 30 },
      { header: 'Razón social', key: 'razonSocial', width: 30 },
      { header: 'Cantidad vendida', key: 'cantidadVendida', width: 18 },
    ];
    ExcelExportService.exportAsExcelFile(exportRows, columns, 'reporte-ventas-por-cliente');
  }

}
