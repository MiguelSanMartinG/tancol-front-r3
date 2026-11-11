import { CommonModule } from '@angular/common';
import { Component, computed, inject, Input, OnInit, Signal } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { SelectModel } from '@core/common/select.model';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { AppSharedModule } from '@shared/app-shared.module';
import { MessageErrorComponent } from '@shared/components/message-error/message-error.component';
import { DropdownModel } from '@shared/interface/dropdown.model';
import { TipoClienteApiService } from '../../tipo-cliente/services/tipo-cliente.api.service';
import { StatusBinaryReadOnlyComponent } from '@shared/components/status-binary-read-only/status-binary-read-only.component';
import { RegistrarCategoriaProductoComponent } from '../../categoria-producto/registrar/registrar.component';
import { CategoriaNuestrosProductosApiService } from '../../categoria-nuestros-productos/service/categoria-nuestros-productos-api.service';
import { UnidadMedidaService } from '../../unidades-medida/service/unidad-medida.service';

@Component({
  selector: 'app-form',
  templateUrl: './form.component.html',
    styleUrl: './form.component.scss',
  imports:[
    MessageErrorComponent,
    ReactiveFormsModule,
    CommonModule,
    AppSharedModule,
    AppPrimengModule,
StatusBinaryReadOnlyComponent,
      RegistrarCategoriaProductoComponent
  ],
  // styles: [':host{display:contents}'], // Makes component host as if it was not there, can offer less css headaches. Use @HostBinding class approach for easier overrides.
  // host: { class: 'contents' },
})
export class FormComponent implements OnInit {

  @Input() formulario!:FormGroup;
  @Input() update = false;
  // tipoEmpleadoApiService = inject(TipoEmpleadoApiService)
  // departamentoApiService = inject(DepartamentoApiService)
  tipoCliente = inject(TipoClienteApiService);
  titleTooltip:string = 'En el caso de contar con la Constancia de Situación Fiscal (CIF) para facturar la informacion debe ser idpentica a la constancia incluyendo: Mayúsculas y sígnos.'
  isUpload = false;

  categoriaNuestrosProductos = inject(CategoriaNuestrosProductosApiService)
    unidadMedidaApiService = inject (UnidadMedidaService)


  listaTipoClienteSelecccionar: Signal<SelectModel[]> = computed(() => {
      if (this.tipoCliente.listAll().length > 0) {
        return this.tipoCliente.listAll().map((row) => ({
          label: row.nombre,
          value: row.idTiposClientes,
        }));
      } else {
        return [];
      }
    });

  listaCategoriaProductoSelecccionar: Signal<SelectModel[]> = computed(() => {
    if (this.categoriaNuestrosProductos.listAll().length > 0) {
      return this.categoriaNuestrosProductos.listAll().map((row) => ({
        label: row.nombre,
        value: row.idCategoriaComercial,
      }));
    } else {
      return [];
    }
  });

        listaUnidadMedidaSeleccionar: Signal<SelectModel[]> = computed(() => {
    if (this.unidadMedidaApiService.listAll().length > 0) {
      return this.unidadMedidaApiService.listAll().map((row) => ({
        label: row.nombre,
        value: row.idUnidadDeMedida,
      }));
    } else {
      return [];
    }
  });

    ngOnInit(): void {
      this.tipoCliente.getAll().subscribe();
      this.categoriaNuestrosProductos.getAllFilter('?enabled=true').subscribe();
    }

      uploadFile($event: any) {
    const file = $event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        this.formulario.get('image')?.setValue({
          file: file,
          url: event.target?.result as any,
        });
        this.isUpload = true;
      };
    }
  }
}
