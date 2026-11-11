import { CommonModule } from '@angular/common';
import { Component, computed, inject, Input, OnInit, Signal } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { SelectModel } from '@core/common/select.model';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { AppSharedModule } from '@shared/app-shared.module';
import { MessageErrorComponent } from '@shared/components/message-error/message-error.component';
import { DropdownModel } from '@shared/interface/dropdown.model';
import { InventarioInicialService } from '../services/inventario-inicial.service';
import { AlmacenApiService } from '../../almacen/services/almacen.api.service';
import { ProductoApiService } from '../../producto/services/producto.api.service';
import { UnidadMedidaService } from '../../unidades-medida/service/unidad-medida.service';
import { ProveedorApiService } from '../../proveedor/services/proveedor.api.service';

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

      
  ],
  // styles: [':host{display:contents}'], // Makes component host as if it was not there, can offer less css headaches. Use @HostBinding class approach for easier overrides.
  // host: { class: 'contents' },
})
export class FormComponent implements OnInit {

  @Input() formulario!:FormGroup;
  // tipoEmpleadoApiService = inject(TipoEmpleadoApiService)
  // departamentoApiService = inject(DepartamentoApiService)
  inventarioInicialApi = inject(InventarioInicialService);
  almacenApi = inject(AlmacenApiService);
  productoApi = inject(ProductoApiService);
  unidadMedidaApi = inject(UnidadMedidaService)
  proveedorApi = inject(ProveedorApiService)

  listaAlmacenSeleccionar: Signal<SelectModel[]> = computed(() => {
      if (this.almacenApi.listAll().length > 0) {
        console.log('sis');
        return this.almacenApi.listAll().map((row) => ({
          label: row.nombre,
          value: row.id,
        }));
      } else {
        console.log('non');
        return [];
      }
    });

    listaProductoSeleccionar: Signal<SelectModel[]> = computed(() => {
      if (this.productoApi.listProducto().length > 0) {
        return this.productoApi.listProducto().map((row) => ({
          label: row.nombre,
          value: row.idProducto,
        }));
      } else {
        return [];
      }
    });

    listaUnidadMedidaSeleccionar: Signal<SelectModel[]> = computed(() => {
      if (this.unidadMedidaApi.listAll().length > 0) {
        return this.unidadMedidaApi.listAll().map((row) => ({
          label: row.nombre,
          value: row.idUnidadDeMedida,
        }));
      } else {
        return [];
      }
    });

        listaProveedorSeleccionar: Signal<SelectModel[]> = computed(() => {
      if (this.proveedorApi.listProveedor().length > 0) {
        return this.proveedorApi.listProveedor().map((row) => ({
          label: row.nombreComercial,
          value: row.idProveedor,
        }));
      } else {
        return [];
      }
    });


    ngOnInit(): void {
      this.almacenApi.getAllFilter('?enabled=true').subscribe();
      this.productoApi.getAllFilter('?enabled=true').subscribe();
      this.unidadMedidaApi.getAllFilter('?enabled=true').subscribe();
      this.proveedorApi.getAll().subscribe();

    }

    setUnidad(){
      const producto = this.productoApi.listProducto().find(
  (p) => p.idProducto === this.formulario.getRawValue().producto
);
console.log(producto);
this.formulario.patchValue({unidadMedida:producto?.unidadMedidaDefault.idUnidadDeMedida})
    }
  // @HostBinding('class') protected readonly class = 'contents'; // Makes component host as if it was not there, can offer less css headaches. Assumes .contents{display:contents} css class exits
  // constructor() {}
}
