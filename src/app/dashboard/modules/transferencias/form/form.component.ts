import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, inject, Input, OnInit, ViewChild } from '@angular/core';
import { FormArray, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { SelectModel } from '@core/common/select.model';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { AppSharedModule } from '@shared/app-shared.module';
import { MessageErrorComponent } from '@shared/components/message-error/message-error.component';
import { MessageService } from 'primeng/api';
import { Table } from 'primeng/table';

import { AlmacenApiService } from '../../almacen/services/almacen.api.service';
import { AlmacenResponseDto } from '../../almacen/services/dtos/almacen.response.dto';
import { InventarioService } from '../../inventario/services/inventario.service';
import { ListaTransferencias } from '../registrar/registrar.component';
import { InventarioResponse } from '../../inventario/services/dto/inventario.response';

@Component({
  selector: 'app-form',
  templateUrl: './form.component.html',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AppPrimengModule,
    AppSharedModule,
    MessageErrorComponent
  ]
})
export class FormComponent implements OnInit, AfterViewInit {
  @Input() formulario!: FormGroup;
  @Input() listaPartidas: any[] = [];
  @Input() update = false;
  @ViewChild('table') table!: Table;

  messageService = inject(MessageService);
  almacenApiService = inject(AlmacenApiService);
  inventarioApiService = inject(InventarioService);

  almacenes: AlmacenResponseDto[] = [];
  almacenBaseOptions: SelectModel[] = [];
  almacenDestinoOptions: SelectModel[] = [];

  listaProductos: InventarioResponse[] = [];
  listaSeleccionada: any[] = [];

  ngOnInit(): void {
    this.almacenApiService.getAllFilter('?enabled=true').subscribe({
      next: (response) => {
        this.almacenes = response;
        this.actualizarOpcionesAlmacenes();
      }
    });

    this.formulario.get('almacenBase')?.valueChanges.subscribe(() => {
      this.actualizarOpcionesAlmacenes();
    });

    this.formulario.get('almacenDestino')?.valueChanges.subscribe(() => {
      this.actualizarOpcionesAlmacenes();
    });
  }

  ngAfterViewInit(): void {}

  get partidas(): FormArray {
    return this.formulario.get('partidas') as FormArray;
  }

  actualizarOpcionesAlmacenes(): void {
    const baseId = this.formulario.get('almacenBase')?.value;
    const destinoId = this.formulario.get('almacenDestino')?.value;

    this.almacenBaseOptions = this.almacenes
      .filter(a => a.id !== destinoId)
      .map(a => ({ label: a.nombre, value: a.id }));

    this.almacenDestinoOptions = this.almacenes
      .filter(a => a.id !== baseId)
      .map(a => ({ label: a.nombre, value: a.id }));
  }

  getStock(): void {
    this.listaProductos = []
    const idAlmacen = this.formulario.getRawValue().almacenBase;
    if (!idAlmacen) return;

    this.inventarioApiService.getAllFilter('?idAlmacen=' + idAlmacen).subscribe({
      next: (response) => { 
        console.log(response);
        response.forEach((element:any) => {
          if (element.cantidad > 0) {
            this.listaProductos.push(element)
          }
        });
        // this.listaProductos = <any>response;
      }
    });
  }

  getProductData(item: any): void {
    const selected = item.producto;
    console.log(item);
    // Verificar si ya existe ese producto en otra partida
    const yaExiste = this.listaPartidas.some(p =>
      p !== item && p.producto?.producto?.idProducto === selected?.producto?.idProducto
    );

    console.log(yaExiste);

    if (yaExiste) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Producto duplicado',
        detail: 'Ya se ha agregado este producto a otra partida.'
      });
      item.producto = null;
      item.stock = 0;
      item.unidadMedida = null;
      return;
    }

    item.stock = selected?.cantidad ?? 0;
    item.unidadMedida = selected?.unidadesMedida?.nombre ?? '--';
  }

  addPartidad(): void {
    if (!this.formulario.valid) {
      this.formulario.markAllAsTouched();
      return;
    }

    const idAlmacen = this.formulario.get('almacenBase')?.value;
    if (!idAlmacen) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Almacén base requerido',
        detail: 'Selecciona un almacén base antes de agregar partidas.'
      });
      return;
    }

    if (this.listaProductos.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Sin productos',
        detail: 'No hay productos disponibles para este almacén.'
      });
      return;
    }

    this.listaPartidas.push({
      comentario: '',
      id: crypto.randomUUID(),
      listaProducto: [],
      stock: 0,
      unidadMedida: null,
      producto: null,
      cantidad: 1,
      tipoImpuesto: null
    });

    setTimeout(() => {
      this.table.initRowEdit(this.listaPartidas[this.listaPartidas.length - 1]);
    });
  }

  eliminarPartida(): void {
    this.listaPartidas = this.listaPartidas.filter(p => !this.listaSeleccionada.includes(p));
    this.listaSeleccionada = [];
  }
  validarPartida(item: any): void {
  // Validar duplicados
  const productoId = item.producto?.producto?.idProducto;
  const duplicado = this.listaPartidas.some(p =>
    p !== item && p.producto?.producto?.idProducto === productoId
  );

  if (duplicado) {
    this.messageService.add({
      severity: 'warn',
      summary: 'Producto duplicado',
      detail: 'Ya se ha agregado este producto a otra partida.'
    });
    item.producto = null;
    item.stock = 0;
    item.unidadMedida = null;
    return;
  }

  // Validar que cantidad no supere el stock
  if (item.cantidad > item.stock) {
    this.messageService.add({
      severity: 'warn',
      summary: 'Cantidad excedida',
      detail: `Solo hay ${item.stock} unidades disponibles.`
    });
    item.cantidad = item.stock;
  }
}

}
