import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { PartidaLiquidacion } from '../form/form.component';
import { SelectModel } from '@core/common/select.model';
import { DropdownModel } from '@shared/interface/dropdown.model';

@Component({
  selector: 'app-dialog-partida-liquidacion',
  standalone: true,
  imports: [CommonModule, FormsModule, AppPrimengModule],
  templateUrl: './dialog-partida.component.html',
  styleUrl: './dialog-partida.component.scss'
})
export class DialogPartidaComponent {
  display = false;
  partida!: PartidaLiquidacion;

  listaClientes: SelectModel[] = [];
  listaProductos: { label: string; value: string; price: number }[] = [];
  listaTipoVenta: DropdownModel[] = [];
  listaFormaPago: DropdownModel[] = [];

  open(
    partida: PartidaLiquidacion,
    listas: {
      clientes: SelectModel[];
      productos: { label: string; value: string; price: number }[];
      tipoVenta: DropdownModel[];
      formaPago: DropdownModel[];
    }
  ) {
    this.partida = partida;
    this.listaClientes = listas.clientes;
    this.listaProductos = listas.productos;
    this.listaTipoVenta = listas.tipoVenta;
    this.listaFormaPago = listas.formaPago;
    this.display = true;
  }

  calcularImporte() {
    // const precio = this.partida?.precioUnitario || 0;
    const cantidad = this.partida?.cantidad || 0;
    // this.partida.importe = precio * cantidad;
  }

  close() {
    this.display = false;
  }
}
