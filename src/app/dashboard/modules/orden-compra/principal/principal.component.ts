import { Component, computed, inject, OnInit, ViewChild } from '@angular/core';
import { BotonRegresarComponent } from '../../../../shared/components/boton-regresar/boton-regresar.component';
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { AlmacenResponseDto } from '../../almacen/services/dtos/almacen.response.dto';
import { ImportFileComponent } from '../../../../shared/components/import-file/import-file.component';
import { DialogEliminarTodoComponent } from '../../../../shared/components/dialog-eliminar-todo/dialog-eliminar-todo.component';
import { DatetimePipe } from "../../../../shared/pipes/datetime.pipe";
import { MenuItem } from 'primeng/api';
import { BadgeEstatusOrdenComponent } from "../../../../shared/components/badge-estatus-orden/badge-estatus-orden.component";
import { BadgePrioridadOrdenComponent } from "../../../../shared/components/badge-prioridad-orden/badge-prioridad-orden.component";
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { OrdenCompraApiService } from '../services/orden-compra.api.service';
import { AppSharedModule } from '@shared/app-shared.module';
import { EliminarComponent } from '../../almacen/eliminar/eliminar.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-principal',
  imports: [
    BotonRegresarComponent,
    HeaderComponent,
    AppPrimengModule,
    EliminarComponent,
    ImportFileComponent,
    DialogEliminarTodoComponent,
    DatetimePipe,
    RouterLink,
    BadgeEstatusOrdenComponent,
    BadgePrioridadOrdenComponent,
    AppSharedModule,
    CommonModule
],
  templateUrl: './principal.component.html',
  styleUrl: './principal.component.scss',
})
export class PrincipalComponent implements OnInit {
  router = inject(Router);
  route = inject(ActivatedRoute);
  items: MenuItem[] | undefined;
  solicitudCompraApiService = inject(OrdenCompraApiService);
  @ViewChild(EliminarComponent) eliminarComponent!: EliminarComponent;
  listaSeleccionada: any[] = [];
  configurationImport = {
    properties: [
      {
        nameProperty: 'id',
        label: 'id',
        column: '',
        id: true,
      },
      {
        nameProperty: 'nombre',
        label: 'Nombre',
        column: '',
        unique: true,
        id: false,
      },
      {
        nameProperty: 'status',
        label: 'Estado',
        column: '',
        id: false,
        update: true,
      },
    ],
    columns: [
      { header: 'id', key: 'id', width: 10 },
      { header: 'Nombre', key: 'nombre', width: 20 },
      { header: 'Estado', key: 'status', width: 20 },
    ],
    titleDownload: 'almacenes',
  };
  listaRegistros = computed(() => {
    if (this.solicitudCompraApiService.listAll().length > 0) {
      return [
        ...this.solicitudCompraApiService.listAll().map((row: any) => ({
          ...row,
          nombreProveedor: row.proveedorNombre,
          fechaUltimaModificacion: new Date(row.updatedAt),
          fechafactura:(row.fechaFacturacion)?new Date(row.fechaFacturacion):null,
          fechaSolicitud: new Date(row.createdAt),
        })).reverse(),
      ];
    }
    return [];
  });
  acciones = [     {
    label: 'Facturar',
    value: 'facturar'
  },
  {
    label: 'Recepcion del producto',
    value: 'recepcion',
  },
  {
    label: 'Cancelar',
    value: 'cancelar'
  },
  ];
  ngOnInit(): void {
    this.solicitudCompraApiService.getAll().subscribe();
    this.items = [
      {
          label: 'Options',
          items: [
              {
                  label: 'Refresh',
                  icon: 'pi pi-refresh'
              },
              {
                  label: 'Export',
                  icon: 'pi pi-upload'
              }
          ]
      }
  ];
  }
  displayUpdate(itemDto: AlmacenResponseDto) {

  }
  displayDelete(itemDto: AlmacenResponseDto) {
    this.eliminarComponent.itemDto.set({
      ...itemDto,
    });
    this.eliminarComponent.display = true;
  }
  displayCreate() {

  }
  searchTable(tableComponent: any, $event: any) {
    tableComponent.filterGlobal($event.target!.value ?? '', 'contains');
  }
  deleteAll() {
    for (const item of this.listaSeleccionada) {
      this.solicitudCompraApiService.delete(item.id).subscribe((resp) => {});
    }
    this.listaSeleccionada = [];
  }
  ejecutarAccion(item: any, accionKey: string) {
    const accion = this.accionesMap[accionKey];
    if (accion) {
      accion(item);
    }
  }
  // Diccionario de acciones
  private accionesMap: { [key: string]: (item: any) => void } = {
    'facturar': (item) => this.facturar(item),
    'cancelar': (item) => this.cancelar(item),
    'recepcion': (item) => this.recepcion(item),
    'detalle': (item) => this.verDetalle(item)
  };
  private facturar(item: any) {
    console.log(item);
    this.router.navigate(['../actualizar-orden-compra', item.idSolicitud],{
      relativeTo: this.route
    });
  }

  private cancelar(item: any) {
    this.solicitudCompraApiService.actualizarEstado(item.id,'CANCELADA').subscribe( resp => {
      alert('Solicitud cancelada');
      this.solicitudCompraApiService.getAll().subscribe();
    });
  }
  private recepcion(item: any) {
    console.log(item);
    this.solicitudCompraApiService.pasarRecepcion(item.idSolicitud).subscribe(resp=>{
      console.log(resp);
      this.solicitudCompraApiService.getAll().subscribe();
    })
    // this.solicitudCompraApiService.actualizarEstado(item.id,'AUTORIZADO').subscribe( resp => {
    //   alert('Solicitud autorizada');
    //   this.solicitudCompraApiService.getAll().subscribe();
    // });
  }
  private completar(item: any) {
    this.solicitudCompraApiService.actualizarEstado(item.id,'ORDEN_COMPLETA').subscribe( resp => {
      alert('Solicitud COMPLETA');
      this.solicitudCompraApiService.getAll().subscribe();
    });
  }

  private verDetalle(item: any) {
    console.log('Detalle:', item);
  }
}
