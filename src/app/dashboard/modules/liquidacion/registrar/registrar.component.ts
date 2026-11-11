import { Component, inject, viewChild, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { MessageErrorComponent } from '@shared/components/message-error/message-error.component';
import { MessageService } from 'primeng/api';
import { HeaderComponent } from '@shared/components/header/header.component';
import { BotonRegresarComponent } from '@shared/components/boton-regresar/boton-regresar.component';
import { LiquidacionApiService } from '../services/liquidacion.api.service';
import { Ayudantes, Chofere, LiquidacionDTO, Partida, Totalizado } from '../services/dtos/liquidacion.dto';
import { CommonModule } from '@angular/common';
import { FormComponent, PartidaLiquidacion } from '../form/form.component';
import { AyudanteSummary, ChoferSummary, ProductoSummary } from '../actualizar/actualizar.component';
import { DateUtilService } from '@shared/services/date-util.service';
import { DialogConfirmComponent } from '@shared/components/dialog-confirm/dialog-confirm.component';

@Component({
  selector: 'app-registrar',
  standalone: true,
  imports: [
    CommonModule,
    AppPrimengModule,
    ReactiveFormsModule,
    MessageErrorComponent,
    HeaderComponent,
    FormComponent,
    DialogConfirmComponent,
    BotonRegresarComponent,
    RouterLink
  ],
  templateUrl: './registrar.component.html',
  styleUrl: './registrar.component.scss',
})
export class RegistrarComponent {
  liquidacionApi = inject(LiquidacionApiService);
  fb = inject(FormBuilder);
  messageService = inject(MessageService);
  router = inject(Router);
  route = inject(ActivatedRoute);
  dateUtil = inject(DateUtilService);

  formulario = this.fb.group({
    folio: [{ value: '', disabled: true }],
    idRuta: ['', Validators.required],
    // idChofer: ['', Validators.required],
    // idAyudante: ['', Validators.required],
    fecha: [new Date(), Validators.required],
    bloqueNota: [''],
    comentarios: ['']
  });

  listaPartidas:PartidaLiquidacion[] = [];
  listadoChoferes:ChoferSummary[] = [];
  @ViewChild('liquidacionForm') liquidacionForm!:FormComponent
  @ViewChild('dialogConfirm') dialogConfirm!: DialogConfirmComponent;
  
  private validarPartidas(): PartidaLiquidacion[] {
    console.log(this.liquidacionForm.listaPartidas);
    const partidasInvalidas: PartidaLiquidacion[] = [];

    for (const partida of this.liquidacionForm.listaPartidas) {
      const conceptoCancelado = this.esConceptoCancelado(partida.conceptoVenta);
      
      // Resetear errores específicos
      (partida as any).hasError = false;
      (partida as any).errores = {};
      
      if (!conceptoCancelado) {
        const errores: any = {};
        
        if (!partida.cliente) errores.cliente = 'Cliente requerido';
        if (!partida.producto) errores.producto = 'Producto requerido';
        if (!partida.conceptoVenta) errores.conceptoVenta = 'Concepto de venta requerido';
        if (partida.cantidad <= 0) errores.cantidad = 'Cantidad debe ser mayor a 0';
        if (partida.precio <= 0) errores.precio = 'Precio debe ser mayor a 0';
        if (!partida.formaPago) errores.formaPago = 'Forma de pago requerido';

        const tieneErrores = Object.keys(errores).length > 0;
        
        if (tieneErrores) {
          (partida as any).hasError = true;
          (partida as any).errores = errores;
          partidasInvalidas.push(partida);
        }
      }
    }

    return partidasInvalidas;
  }

    private esConceptoCancelado(conceptoVentaId: string): boolean {
    if (!this.liquidacionForm?.listaConceptoVenta) return false;

    const concepto = this.liquidacionForm.listaConceptoVenta.find(
      c => c.value === conceptoVentaId
    );

    return concepto?.data?.cancelado || false;
  }

  private contarErroresPorTipo(partidasInvalidas: PartidaLiquidacion[]): {[key: string]: number} {
    const contadores: {[key: string]: number} = {};
    
    partidasInvalidas.forEach(partida => {
      if ((partida as any).errores) {
        Object.keys((partida as any).errores).forEach(campo => {
          contadores[campo] = (contadores[campo] || 0) + 1;
        });
      }
    });
    
    return contadores;
  }

  submit() {
    console.log(this.formulario.getRawValue());
    if (!this.formulario.valid) {
      this.formulario.markAllAsTouched();
      this.messageService.add({
        key: 'center',
        severity: 'warn',
        summary: '¡Precaución!',
        detail: 'Hay campos inválidos o faltan campos por llenar.',
      });
      return;
    }

    const value = this.formulario.getRawValue();
  }

  handleHide() {
    this.formulario.reset();
    this.listaPartidas = [];
    this.router.navigate(['../'], { relativeTo: this.route });
  }

  guardar() {
    this.messageService.clear();

    if (!this.formulario.valid) {
      this.formulario.markAllAsTouched();
      this.messageService.add({
        severity: 'warn',
        summary: 'Formulario inválido',
        detail: 'Por favor complete todos los campos requeridos'
      });
      return;
    }

    const partidasInvalidas = this.validarPartidas();
    if (partidasInvalidas.length > 0) {
      const erroresPorTipo = this.contarErroresPorTipo(partidasInvalidas);
      const detalleErrores = Object.entries(erroresPorTipo)
        .map(([campo, cantidad]) => `${cantidad} ${this.getNombreCampo(campo)}`)
        .join(', ');

      this.messageService.add({
        severity: 'warn',
        summary: 'Partidas inválidas',
        detail: `Se encontraron ${partidasInvalidas.length} partidas con errores: ${detalleErrores}. Revise los campos marcados en rojo.`
      });
      return;
    }

    this.openConfirmLiquidacion();
  }

  confirmarLiquidacion() {
    const partidas = this.liquidacionForm?.listaPartidas ?? [];
    const request = this.buildLiquidacionDTOForPut(
      this.formulario,
      partidas,
      this.liquidacionForm.listadoChoferes,
      this.liquidacionForm.nombreProductos
    );
    request.estado = 'FINALIZADA';
    request.observaciones = this.liquidacionForm.comentarios ?? '';

    this.liquidacionApi.create(request).subscribe({
      next: () => {
        this.messageService.add({
          key: 'top-right',
          severity: 'success',
          summary: '¡Liquidación guardada!',
          detail: 'Se ha guardado la liquidación exitosamente'
        });
        this.handleHide();
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo guardar la liquidación'
        });
      }
    });
  }

  private openConfirmLiquidacion() {
    this.dialogConfirm.icon = 'fa-circle-check';
    this.dialogConfirm.title = '¿Confirmar Liquidación?';
    this.dialogConfirm.description = 'Esta operación establecerá el estado FINALIZADA y bloqueará la edición de partidas, folios y totalizados.';
    this.dialogConfirm.labelBtn = 'Confirmar';
    this.dialogConfirm.display = true;
  }

  private getNombreCampo(campo: string): string {
    const nombres: {[key: string]: string} = {
      'cliente': 'sin cliente',
      'producto': 'sin producto', 
      'conceptoVenta': 'sin concepto de venta',
      'cantidad': 'con cantidad inválida',
      'precio': 'con precio inválido'
    };
    
    return nombres[campo] || campo;
  }

  buildLiquidacionDTOForPut(
    formulario: FormGroup,
    listaPartidas: PartidaLiquidacion[],
    listadoChoferes: ChoferSummary[],
    nombreProductos: ProductoSummary[]
  ): LiquidacionDTO {
    const v = formulario.getRawValue();
    console.log(v);
    console.log(listaPartidas);
      const fechaControl = v.fecha!;
  const fechaDate = fechaControl instanceof Date ? fechaControl : new Date(fechaControl as string);

    return {
      bloqueNota: v.bloqueNota ?? '',
      estado: 'PENDIENTE',
      fecha: this.dateUtil.toLocalISOString(fechaDate),
      idRuta: v.idRuta,
      observaciones: v.comentarios ?? '',
      partida: listaPartidas
        .slice()
        .sort((a, b) => (a.folio ?? Number.MAX_SAFE_INTEGER) - (b.folio ?? Number.MAX_SAFE_INTEGER))
        .map(p => ({
          cantidad: p.cantidad,
          descuento: p.descuento,
          folio: this.liquidacionForm.isFolioDisabledPartida(p) ? null : p.folio,
          formaPago: p.formaPago ?? 'CONTADO',
          idCliente: p.cliente,
          idConceptoVenta: p.conceptoVenta,
          idPartida: p.id,
          idProducto: p.producto,
          precio: p.precio,
          factura: p.factura
        })),
      totalizados: this.buildTotalizadosForPut(listadoChoferes, nombreProductos),
    };
  }

  buildTotalizadosForPut(
    listadoChoferes: ChoferSummary[],
    nombreProductos: ProductoSummary[]
  ): Totalizado[] {
    const totalizadoIdByProd = new Map<string, string>(
      nombreProductos.map(p => [p.id, p.idTotalizado ?? ''])
    );

    const byProducto = new Map<string, Map<string, { total: number; ayudantes: Map<string, number> }>>();

    for (const ch of listadoChoferes ?? []) {
      const chProd = new Map<string, number>();
      for (const p of ch.productos ?? []) {
        chProd.set(p.id, (chProd.get(p.id) ?? 0) + (p.cantidad ?? 0));
      }

      const vistos = new Set<string>(chProd.keys());
      for (const ay of ch.ayudantes ?? []) {
        for (const p of ay.productos ?? []) vistos.add(p.id);
      }

      for (const idProducto of vistos) {
        if (!byProducto.has(idProducto)) byProducto.set(idProducto, new Map());
        const mapChoferes = byProducto.get(idProducto)!;

        if (!mapChoferes.has(ch.id)) {
          mapChoferes.set(ch.id, { total: 0, ayudantes: new Map() });
        }
        const entry = mapChoferes.get(ch.id)!;

        entry.total += chProd.get(idProducto) ?? 0;

        for (const ay of ch.ayudantes ?? []) {
          const prodAy = (ay.productos ?? []).find(p => p.id === idProducto);
          const cant = prodAy?.cantidad ?? 0;
          if (cant) entry.ayudantes.set(ay.id, (entry.ayudantes.get(ay.id) ?? 0) + cant);
        }
      }
    }

    const out: Totalizado[] = [];
    for (const [idProducto, choferesMap] of byProducto) {
      const choferes: Chofere[] = [];
      for (const [idEmpleado, info] of choferesMap) {
        const sumaAy = Array.from(info.ayudantes.values()).reduce((a, b) => a + b, 0);
        if (info.total !== 0 || sumaAy !== 0) {
          const ayudantes: Ayudantes[] = Array.from(info.ayudantes.entries())
            .map(([idAy, total]) => ({ idEmpleado: idAy, total }));
          choferes.push({ idEmpleado, total: info.total, ayudantes });
        }
      }

      const idTotalizado = totalizadoIdByProd.get(idProducto) ?? '';

      out.push({
        idProducto,
        idTotalizado,
        choferes,
      });
    }

    out.sort((a, b) => a.idProducto.localeCompare(b.idProducto));
    return out;
  }

  borrador() {
    const raw = this.formulario.getRawValue();
    console.log(raw);
 // Normaliza a Date por si el control trae string ISO
  const fechaControl = raw.fecha!;
  const fechaDate = fechaControl instanceof Date ? fechaControl : new Date(fechaControl as string);

  const dto: LiquidacionDTO = {
    bloqueNota: raw.bloqueNota ?? '',
    estado: 'PENDIENTE',
    // 👉 manda siempre ISO UTC
    fecha: this.dateUtil.toLocalISOString(fechaDate),
    idRuta: raw.idRuta!,
    observaciones: this.liquidacionForm.comentarios ?? '',
    partida: this.buildPartidas(this.liquidacionForm?.listaPartidas ?? []),
    totalizados: this.buildTotalizadosFromListado(this.liquidacionForm.listadoChoferes),
  };

  console.log('borrador', dto);

    this.liquidacionApi.create(dto).subscribe({
      next: () => {
        this.messageService.add({
          key: 'top-right',
          severity:'success',
          summary: '¡Borrador guardado!',
          detail: 'Se ha guardado la liquidación'
        });
        this.handleHide();
      }
    });
  }
  

buildPartidas(lista: PartidaLiquidacion[]): Partida[] {
  return [...(lista ?? [])]
    .sort((a, b) => (a.folio ?? Number.MAX_SAFE_INTEGER) - (b.folio ?? Number.MAX_SAFE_INTEGER))
    .map(p => ({
      cantidad: p.cantidad,
      descuento: p.descuento,
      folio: this.liquidacionForm.isFolioDisabledPartida(p) ? null : p.folio,
      formaPago: (p.formaPago)?p.formaPago:'CONTADO',
      idCliente: p.cliente,           // aquí asumo que ya es ID
      idConceptoVenta: p.conceptoVenta, // asumo que ya es ID
      idPartida: p.id,
      idProducto: p.producto,         // asumo que ya es ID
      precio: p.precio,
      factura: p.factura
    }));
}

buildTotalizadosFromListado(listadoChoferes: ChoferSummary[]): Totalizado[] {
  const byProducto = new Map<string, Map<string, { total: number; ayudantes: Map<string, number> }>>();

  for (const chofer of listadoChoferes ?? []) {
    const totalPorProductoChofer = new Map<string, number>();
    for (const p of chofer.productos ?? []) {
      totalPorProductoChofer.set(p.id, (totalPorProductoChofer.get(p.id) ?? 0) + (p.cantidad ?? 0));
    }

    const productosVistos = new Set<string>(totalPorProductoChofer.keys());
    for (const ay of chofer.ayudantes ?? []) {
      for (const p of ay.productos ?? []) productosVistos.add(p.id);
    }

    for (const idProducto of productosVistos) {
      if (!byProducto.has(idProducto)) byProducto.set(idProducto, new Map());
      const mapChoferes = byProducto.get(idProducto)!;

      if (!mapChoferes.has(chofer.id)) {
        mapChoferes.set(chofer.id, { total: 0, ayudantes: new Map() });
      }
      const entry = mapChoferes.get(chofer.id)!;

      entry.total += totalPorProductoChofer.get(idProducto) ?? 0;

      for (const ay of chofer.ayudantes ?? []) {
        const prodAy = (ay.productos ?? []).find(p => p.id === idProducto);
        const cant = prodAy?.cantidad ?? 0;
        if (cant !== 0) {
          entry.ayudantes.set(ay.id, (entry.ayudantes.get(ay.id) ?? 0) + cant);
        }
      }
    }
  }

  const totalizados: Totalizado[] = [];
  for (const [idProducto, choferesMap] of byProducto) {
    const choferes: Chofere[] = [];

    for (const [idEmpleado, info] of choferesMap) {
      const sumaAy = Array.from(info.ayudantes.values()).reduce((a, b) => a + b, 0);
      if (info.total !== 0 || sumaAy !== 0) {
        const ayudantes: Ayudantes[] = Array.from(info.ayudantes.entries())
          .map(([idEmpleadoAy, total]) => ({ idEmpleado: idEmpleadoAy, total }));
        choferes.push({ idEmpleado, total: info.total, ayudantes });
      }
    }

    choferes.sort((a, b) => a.idEmpleado.localeCompare(b.idEmpleado));
    for (const c of choferes) c.ayudantes.sort((a, b) => a.idEmpleado.localeCompare(b.idEmpleado));

    totalizados.push({
      idProducto,
      idTotalizado: "", // vacío como pediste
      choferes,
    });
  }

  totalizados.sort((a, b) => a.idProducto.localeCompare(b.idProducto));
  return totalizados;
}


}



