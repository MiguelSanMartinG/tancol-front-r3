import { CommonModule } from '@angular/common';
import { Component, computed, inject, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { BotonRegresarComponent } from '@shared/components/boton-regresar/boton-regresar.component';
import { HeaderComponent } from '@shared/components/header/header.component';
import { StatusBinaryReadOnlyComponent } from '@shared/components/status-binary-read-only/status-binary-read-only.component';
import { DatetimePipe } from '@shared/pipes/datetime.pipe';
import { RegistrarComponent } from '../../departamento/registrar/registrar.component';
import { TransferenciaService } from '../service/transferencia.service';
import { TransferenciaResponse } from '../service/transferencia.response';


@Component({
  selector: 'app-principal',
  templateUrl: './principal.component.html',
  // styles: [':host{display:contents}'], // Makes component host as if it was not there, can offer less css headaches. Use @HostBinding class approach for easier overrides.
  // host: { class: 'contents' },
  imports: [
    CommonModule,
        BotonRegresarComponent,
        HeaderComponent,
        AppPrimengModule,
        RegistrarComponent,
        DatetimePipe,
        StatusBinaryReadOnlyComponent,
        // EliminarComponent
  ],
  styleUrl: './principal.component.scss',

})
export class PrincipalComponent {
  // @HostBinding('class') protected readonly class = 'contents'; // Makes component host as if it was not there, can offer less css headaches. Assumes .contents{display:contents} css class exits
  update = false;
  transferenciaService = inject(TransferenciaService);
  // @ViewChild(EliminarComponent) eliminarComponent!: EliminarComponent;
  tableList:TableListCliente[] = []

  constructor(
    private router:Router,
    private route: ActivatedRoute
  ){}

listaRegistros = computed(() => {
  const data = this.transferenciaService.listAll();
  if (data.length > 0) {
    return data.map(row => ({
      id: row.idTransferencia,
      base:row.transferencias[0]?.nombreAlmacenOrigen,
      destino:row.transferencias[0]?.nombreAlmacenDestino,
      // base:row.transferencias[0].,
      // destino:row.comentario,
      entrego:row.idEmpleado.nombre,
      entregoel:row.fechaTransferencia,
      // nombreComercial: row.nombreComercial,
      // razonSocial: row.informacionFiscal?.razonSocial || '',
      // tipoClienteNombre: row.tipoDeCliente?.nombre || '',
      // telefono: row.telefono,
      // fechaAlta: row.fechaAlta,
      // createdAt: row.createdAt,
      // updatedAt: row.updatedAt || row.createdAt,
      data:row
    }));
  }
  return [];
});





  ngOnInit(): void {
    this.transferenciaService.getAll().subscribe();
  }
  displayUpdate(itemDto: TransferenciaResponse) {
    console.log(itemDto);
    this.router.navigate(['../consultar/',itemDto.idTransferencia], { relativeTo: this.route });

  }
  displayDelete(itemDto: TransferenciaResponse) {
    // this.eliminarComponent.itemDto.set({
    //   ...itemDto
    // });
    // this.eliminarComponent.display = true;
  }
  displayCreate() {
    this.router.navigate(['../crear'], { relativeTo: this.route });

  }
  searchTable(tableComponent: any, $event: any){
    tableComponent.filterGlobal($event.target!.value ?? '', 'contains')
  }

}

export interface TableListCliente{
  nombreComercial:string;
  razonSocial:string;
  tipoCliente:string;
  telefono:string;
  clienteDesde:string;
  creado:string;
  modificado:string;
  id:string;
}