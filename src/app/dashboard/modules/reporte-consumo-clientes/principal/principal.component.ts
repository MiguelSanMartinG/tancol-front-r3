import { Component, OnInit, ViewChild, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { BotonRegresarComponent } from '@shared/components/boton-regresar/boton-regresar.component';
import { HeaderComponent } from '@shared/components/header/header.component';
import { ConsumoCliente, ReporteConsumoClientesService } from '../services/reporte-consumo-clientes.service';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from 'primeng/api';
import { AppSharedModule } from '@shared/app-shared.module';
import { ClienteApiService } from '../../cliente/services/cliente.service';
import { SelectModel } from '@core/common/select.model';
import { ProductoApiService } from '../../producto/services/producto.api.service';
import { NuestrosProductosService } from '../../nuestros-productos/service/nuestros-productos.service';
import { ExcelExportService, ExportColumn } from '@shared/services/excel.export.service';
import { DateUtilService } from '@shared/services/date-util.service';

@Component({
  selector: 'app-reporte-consumo-clientes',
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
  styleUrl: './principal.component.scss'
})
export class PrincipalComponent implements OnInit {
  reporteApi = inject(ReporteConsumoClientesService);
  clienteApi = inject(ClienteApiService);
  productosTancolApi = inject(NuestrosProductosService)
  // excelExportService = inject(ExcelExportService)
  fb = inject(FormBuilder)
  dateUtil = inject(DateUtilService);
  filtro!:FormGroup;
  listaClientes: SelectModel[] = [];
  listaProductos: SelectModel[] = [];
  listaRegistros: ConsumoCliente[] = [];
  opcionesLimite = [
  { label: '10', value: 10 },
  { label: '25', value: 25 },
  { label: '50', value: 50 },
  { label: '100', value: 100 },
  { label: 'Todos', value: null } // null significa “sin límite”
  ];
  @ViewChild('table') table!: any;
configurationExport: {
  columns: ExportColumn[];
  titleDownload: string;
} = {
  columns: [
    { header: 'Cliente', key: 'nombreComercial', width: 30 },
    { header: 'Producto', key: 'alias', width: 30 },
    { header: 'Cantidad vendida', key: 'cantidadVendida', width: 20 },
  ],
  titleDownload: 'reporte-consumo-clientes',
};


  constructor(){
    this.filtro = this.fb.group({
      fechaInicio: [new Date()],
      fechaFin: [new Date()],
      cliente:[[]],
      producto:[[]],
      limite: [null],
    })

    this.clienteApi.getAllFilter('?enabled=true').subscribe(resp => {
      this.listaClientes = resp.map(c => ({ label: c.nombreComercial, value: c.id }));
    });
    this.productosTancolApi.getAllFilter('?enabled=true').subscribe(resp=>{
      this.listaProductos = resp.map(p => ({ label: p.alias,value: p.idProductoComercial}))
    })
  }

  ngOnInit(): void {
    this.buscar();
    // this.clienteApi.getAllFilter('?enabled=true')
  }

  buscar(): void {
  const filtros = this.filtro.value;
  // this.listaRegistros = [];

  const size = filtros.limite ?? undefined; // null = sin límite
  const page = 0; // siempre 0 porque es un reporte

  this.reporteApi.getAll({
    fechaInicio: this.dateUtil.toUTCStartOfDay(new Date(filtros.fechaInicio)),
    fechaFin: this.dateUtil.toUTCEndOfDay(new Date(filtros.fechaFin)),
    cliente: filtros.cliente || [],
    producto: filtros.producto || [],
    size,
    page,
  }).subscribe((res) => {
    this.listaRegistros = res;
    this.opcionesLimite[this.opcionesLimite.length - 1].value = res.length;
  });
}

cleanTable(){
  this.table.clear()
this.filtro.reset({ fechaInicio: new Date(), fechaFin: new Date(), cliente: [], producto: [], limite: null });

    this.buscar();
}

exportar(): void {
  if (!this.listaRegistros.length) return;

  ExcelExportService.exportAsExcelFile(
    this.listaRegistros,
    this.configurationExport.columns,
    this.configurationExport.titleDownload
  );
}
}
