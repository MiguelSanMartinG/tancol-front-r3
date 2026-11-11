import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { HeaderComponent } from '@shared/components/header/header.component';
import { ClienteApiService } from '../services/cliente.service';
import { ClienteResponse } from '../services/cliente.response';
import { NuestrosProductosService } from '../../nuestros-productos/service/nuestros-productos.service';
import { PrecioClienteDTO, PrecioClienteProductoService } from '../services/precio-cliente-producto.service';
import { AppSharedModule } from '@shared/app-shared.module';
import { MessageService } from 'primeng/api';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-producto',
  standalone: true,
  templateUrl: './producto.component.html',
  imports: [
    CommonModule, 
    AppPrimengModule, 
    ReactiveFormsModule, 
    HeaderComponent,    
    AppSharedModule,
  ],
  styleUrl: './producto.component.scss'
})
export class ProductoComponent {
  clienteService = inject(ClienteApiService);
  productosService = inject(NuestrosProductosService);
  precioService = inject(PrecioClienteProductoService);
    messageService = inject(MessageService);
  
  fb = inject(FormBuilder);
  router = inject(Router);
  route = inject(ActivatedRoute);

  cliente = signal<ClienteResponse | null>(null);
  nombreComercialAnterior = '-';
  razonSocialAnterior = '-';
  listaProductos: { label: string; value: any }[] = [];

  form = this.fb.group({
    productos: this.fb.array([])
  });

  get productos(): FormArray {
    return this.form.get('productos') as FormArray;
  }

  constructor() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.cargarDatos(id);
      }
    });
    // this.addProducto();
    this.productosService.getAll().subscribe(resp => {
      this.listaProductos = resp.map(r => ({ label: r.nombre, value:{
        idProductoComercial:r.idProductoComercial,
        nombre:r.nombre,
        precio:r.precio
      } }));
    });
  }

  availableProductos(index: number) {
    const selectedIds = this.productos.controls
      .filter((_, i) => i !== index)
      .map(ctrl => (ctrl.get('producto')!.value as any)?.idProductoComercial)
      .filter(Boolean);
    return this.listaProductos.filter(opt =>
      !selectedIds.includes(opt.value?.idProductoComercial)
    );
  }

  private cargarDatos(id: string) {
    this.clienteService.getOne(id).subscribe(resp => {
      this.cliente.set(resp);
    });

    forkJoin({
      historialNombre: this.clienteService.getUltimoNombreComercial(id),
      historialRazon: this.clienteService.getUltimaRazonSocial(id),
    }).subscribe(({ historialNombre, historialRazon }) => {
      this.nombreComercialAnterior = historialNombre || '-';
      this.razonSocialAnterior = historialRazon || '-';
    });

    this.precioService.getAllFilter('?idCliente='+id).subscribe({
      next:(resp)=>{
        console.log(resp);
        if (resp.length) {
          let index = 0;

          for (const element of resp ) {
                this.productos.push(
      this.fb.group({
        id:[element.idPrecio],
        producto: [element.producto, Validators.required],
        precio: [{ value: element.producto.precio, disabled: true }],
        descuento: [element.descuento, [Validators.required, Validators.min(0)]],
        precioFinal: [{ value: 0, disabled: true }]
      })
    );
    console.log(this.productos);
          this.setProducto(index);
          index++;
          }
        }else{
          this.addProducto();
        }
      }
    })
  }

  addProducto() {
    this.productos.push(
      this.fb.group({
        id:[null],
        producto: [null, Validators.required],
        precio: [{ value: 0, disabled: true }],
        descuento: [0, [Validators.required, Validators.min(0)]],
        precioFinal: [{ value: 0, disabled: true }]
      })
    );
  }

  removeProducto(index: number) {
    this.productos.removeAt(index);
  }

  setProducto(index: number) {
    const control = this.productos.at(index) as FormGroup;
    const prod = control.get('producto')!.value as any;
    console.log(prod);
    if (prod) {
      control.get('precio')!.setValue(prod.precio);
      this.updatePrecioFinal(index);
    } else {
      control.get('precio')!.setValue(0);
      control.get('precioFinal')!.setValue(0);
    }
  }

  updatePrecioFinal(index: number) {
    
    const control = this.productos.at(index) as FormGroup;
    const precio = Number(control.get('precio')!.value) || 0;
    console.log(precio);
 
    let desc = Number(control.get('descuento')!.value) || 0;
           if (desc < 0) {
      control.get('descuento')!.setValue(Math.abs(desc))
      desc = Number(control.get('descuento')!.value) || 0;
    }
    const final = precio - (precio * desc) / 100;
    control.get('precioFinal')!.setValue(final);

  }

  submit() {
    console.log(this.form);
    console.log(this.cliente());
 
    if (this.form.invalid || !this.cliente()) {
      this.form.markAllAsTouched();
            this.messageService.clear();
      this.messageService.add({
        key: 'top-right',
        severity: 'error',
        summary: 'Falta informacón',
        detail: 'Verifica la información ya que se encuentra incompleta.',
      });
      return;
    }

    // Validate descuentos not empty or zero
    const invalidDiscount = this.productos.controls.some(ctrl => {
      const val = Number(ctrl.get('descuento')!.value);
      return isNaN(val) || val <= 0;
    });
    if (invalidDiscount) {
      this.messageService.clear();
      this.messageService.add({
        key: 'top-right',
        severity: 'error',
        summary: 'Descuento inválido',
        detail: 'Todos los descuentos deben ser mayores a 0.',
      });
      return;
    }

    let form = this.form.getRawValue();
    console.log(form);

let productos: PrecioClienteDTO[] = form.productos.map((item:any) => ({
  descuento: item.descuento,
  idPrecioCliente: item.id,
  idProducto: item.producto.idProductoComercial
}));

console.log(productos);

  this.precioService.update(productos,this.cliente()?.id as string).subscribe({
        next: (resp) => {
          console.log(resp);
                  this.messageService.clear();
        this.messageService.add({
          key: 'top-right',
          severity: 'success',
          summary: '¡Registro exitoso!',
          detail: 'Se ha registrado el descuento correctamente.',
        });
          // this.saveProduct(resp.fileName);
        },
      })
  }
}
