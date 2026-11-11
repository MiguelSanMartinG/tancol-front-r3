import { Component, computed, inject, OnInit, signal, ViewChild } from '@angular/core';
import { BotonRegresarComponent } from '../../../../shared/components/boton-regresar/boton-regresar.component';
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { AlmacenResponseDto } from '../../almacen/services/dtos/almacen.response.dto';
import { ImportFileComponent } from '../../../../shared/components/import-file/import-file.component';
import { DialogEliminarTodoComponent } from '../../../../shared/components/dialog-eliminar-todo/dialog-eliminar-todo.component';
import { DatetimePipe } from "../../../../shared/pipes/datetime.pipe";
import { MenuItem } from 'primeng/api';
import { OrdenApiService } from '../services/solicitud-compra.api.service';
import { BadgeEstatusOrdenComponent } from "../../../../shared/components/badge-estatus-orden/badge-estatus-orden.component";
import { BadgePrioridadOrdenComponent } from "../../../../shared/components/badge-prioridad-orden/badge-prioridad-orden.component";
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CardModule } from 'primeng/card';
import { FilterBarComponent } from '@shared/components/filter-bar/filter-bar.component';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ProveedorApiService } from '../../proveedor/services/proveedor.api.service';
import { debounceTime } from 'rxjs';
import { DialogConfirmComponent } from '@shared/components/dialog-confirm/dialog-confirm.component';
import { DialogOptionComponent } from '@shared/components/dialog-option/dialog-option.component';
import { EliminarComponent } from '../../almacen/eliminar/eliminar.component';

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
    CardModule,
    FilterBarComponent,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DialogConfirmComponent,
    DialogOptionComponent
],
  templateUrl: './principal.component.html',
  styleUrl: './principal.component.scss',
})
export class PrincipalComponent implements OnInit {
  //Filtros
  fechaInicioFiltro:string = '';
  fechaFinFiltro:string = '';
    fb = inject(FormBuilder);
    formFilter = this.fb.group({
      fechaInicio: [''],
      fechaFin: [''],
      proveedor: [''],
      razonSocial: [''],
      estatus: [''],
    });
    formTrigger = signal(0);

  apiProveedores = inject(ProveedorApiService);


  //--------

  router = inject(Router);
  route = inject(ActivatedRoute);
  items: MenuItem[] | undefined;
  solicitudCompraApiService = inject(OrdenApiService);
  @ViewChild(EliminarComponent) eliminarComponent!: EliminarComponent;
    @ViewChild('dialogConfirm') dialogConfirm!:DialogConfirmComponent;
    @ViewChild('dialogOption') dialogOption!:DialogOptionComponent;

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
    this.formTrigger();
    const registros = this.solicitudCompraApiService.listAll();
    const filtros = this.formFilter.getRawValue();
  
    if (registros.length === 0) return [];
  
    return registros
      .map((row) => ({
        ...row,
        nombreProveedor: row.proveedor?.nombreComercial,
        fechaUltimaModificacion: new Date(row.fechaModificacionSolicitud),
        fechaSolicitud: new Date(row.fechaCreacionSolicitud),
      }))
      .filter((item) => {
        console.log(item);
        const coincideProveedor = filtros.proveedor ? item.proveedor.idProveedor === filtros.proveedor : true;
        const coincideRazon = filtros.razonSocial
          ? item.proveedor.infoFiscal.razonSocial?.toLowerCase().includes(filtros.razonSocial.toLowerCase())
          : true;
        const coincideFecha = filtros.fechaInicio
          ? new Date(item.fechaSolicitud).toDateString() === new Date(filtros.fechaInicio).toDateString()
          : true;
          const coincideFechaFin = filtros.fechaFin
          ? new Date(item.fechaModificacionSolicitud).toDateString() === new Date(filtros.fechaFin).toDateString()
          : true;
          const coicideStatus = filtros.estatus?item.solicitudEstatus === filtros.estatus :true
        // const coincidePrioridad = filtros. ? item.prioridad === filtros.prioridad : true;
        // const coincideTitulo = filtros.razonSocial
        //   ? item.proveedor.infoFiscal.razonSocial?.toLowerCase().includes(filtros..toLowerCase())
        //   : true;
  
        return coincideProveedor && coincideRazon && coincideFecha && coincideFechaFin && coicideStatus;
      })
      .reverse();
  });

  // 4picadillo
  // 2pollo
  // rajas
  // calabaza

  


  // listaRegistros = computed(() => {
  //   if (this.solicitudCompraApiService.listAll().length > 0) {
  //     return [
  //       ...this.solicitudCompraApiService.listAll().map((row) => ({
  //         ...row,
  //         nombreProveedor: row.proveedor.nombreComercial,
  //         fechaUltimaModificacion: new Date(row.fechaModificacionSolicitud),
  //         fechaSolicitud: new Date(row.fechaCreacionSolicitud),
  //       })).reverse(),
  //     ];
  //   }
  //   return [];
  // });
  acciones = [     
    
  {
    label: 'Pendiente',
    value: 'PENDIENTE'
  },
  {
    label: 'Borrador',
    value: 'BORRADOR'
  },
  {
    label: 'Cancelada',
    value: 'CANCELADA'
  },
  {
    label: 'Autorizada',
    value: 'AUTORIZADO',
  },
  {
    label: 'Completada',
    value: 'ORDEN_COMPLETADA'
  },
  ];


  actions = [     {
    label: 'Modificar',
    value: 'editar'
  },
  {
    label: 'Cancelar',
    value: 'cancelar'
  },
  {
    label: 'Autorizar',
    value: 'autorizar',
  },
  {
    label: 'Completar',
    value: 'completar'
  },
  ];

  ngOnInit(): void {
    this.solicitudCompraApiService.getAll().subscribe();
    this.apiProveedores.getAll().subscribe();
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

  this.formFilter.valueChanges
    .pipe(debounceTime(300))
    .subscribe(() => {
      this.formTrigger.update(v => v + 1);
    });

  }

    onFiltroCambiado(valores: any) {
      console.log('Formulario cambió:', valores);
      // Aquí haces tu lógica de filtro
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
    'editar': (item) => this.editar(item),
    'cancelar': (item) => this.cancelar(item),
    'autorizar': (item) => this.autorizar(item),
    'completar': (item) => this.completar(item),
    'detalle': (item) => this.verDetalle(item)
  };
  private editar(item: any) {
    this.router.navigate(['../actualizar-solicitud-compra', item.idSolicitud],{
      relativeTo: this.route
    });
  }

  tempitem:any;
  private cancelar(item: any) {
    this.tempitem = item;
    this.cancelConfirm();


  }
  private autorizar(item: any) {
    this.solicitudCompraApiService.actualizarEstado(item.idSolicitud,'AUTORIZADO').subscribe( resp => {
      // alert('Solicitud autorizada');
      this.solicitudCompraApiService.getAll().subscribe((response)=>{
        this.dialogConfirm.display = true;
        this.dialogConfirm.icon = 'fa-solid fa-circle-check';
        this.dialogConfirm.labelBtn = 'Cerrar'
        this.dialogConfirm.title = 'Solicitud autorizada';
        this.dialogConfirm.description = '';
      });


      // this.solicitudCompraApiService.getAll().subscribe();
    });
  }
  private completar(item: any) {
    this.solicitudCompraApiService.actualizarEstado(item.idSolicitud,'COMPLETADA').subscribe( resp => {
      // alert('Solicitud COMPLETA');
      this.solicitudCompraApiService.getAll().subscribe((respnse)=>{
        this.dialogConfirm.display = true;
        this.dialogConfirm.icon = 'fa-solid fa-circle-check';
        this.dialogConfirm.labelBtn = 'Cerrar'
        this.dialogConfirm.title = 'Solicitud Completa';
        this.dialogConfirm.description = '';
      });

    });
  }

  private verDetalle(item: any) {
    console.log('Detalle:', item);
  }

  filtro(){}

  cancelConfirm(){
    this.dialogOption.display = true;
    this.dialogOption.id = 'cancel';
    this.dialogOption.icon = 'fa-solid fa-triangle-exclamation';
    this.dialogOption.color = 'orange';
    this.dialogOption.title = 'Confirmar cancelación de solcitud,'
    this.dialogOption.description = 'Esta acción cancelara de forma permanente la solicitud de compra.';
    this.dialogOption.option1label = 'Cerrar';
    this.dialogOption.option1Severity = 'primary';
    this.dialogOption.option2label = 'Cancelar';
  }
  
  option1(event:any){
    if (event === 'cancel') {
      this.dialogOption.display = false;
    }
  }
  option2(event:any){
    if (event === 'cancel') {
      this.dialogOption.display = false;
      this.solicitudCompraApiService.actualizarEstado(this.tempitem.idSolicitud,'CANCELADA').subscribe( resp => {
        this.solicitudCompraApiService.getAll().subscribe((response)=>{
          this.dialogConfirm.display = true;
          this.dialogConfirm.icon = 'fa-solid fa-circle-check';
          this.dialogConfirm.labelBtn = 'Cerrar'
          this.dialogConfirm.title = 'Solicitud Cancelada';
          this.dialogConfirm.description = '';
        });
      });

    }




  }

}
