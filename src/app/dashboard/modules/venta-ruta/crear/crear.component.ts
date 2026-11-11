import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { HeaderComponent } from '@shared/components/header/header.component';
import { BotonRegresarComponent } from '@shared/components/boton-regresar/boton-regresar.component';
import { BitacoraPartidaVenta, BitacoraRutaResponse, ComisionEmpleadoResponse, ProductosFueraEspecificacionResponse, VentaRutaApiService } from '../services/venta-ruta.api.service';
import { FormComponent, PartidaVenta, VentaTrayectoRuta } from '../form/form.component';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MessageService } from 'primeng/api';
import { MessageErrorComponent } from '@shared/components/message-error/message-error.component';
import { LocalStorageService } from '@shared/services/local-storage.service';
import { environment } from '../../../../../environments/environment';
import { LiquidacionApiService } from '../../liquidacion/services/liquidacion.api.service';

@Component({
  selector: 'app-venta-ruta-crear',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AppPrimengModule,
    HeaderComponent,
    BotonRegresarComponent,
    FormComponent,
    RouterLink
  ],
  templateUrl: './crear.component.html',
  styleUrl: './crear.component.scss'
})
export class CrearComponent implements OnInit {

  fb = inject(FormBuilder);
  ventaRutaService = inject(VentaRutaApiService);
  router = inject(Router);
  route = inject(ActivatedRoute);
  messageService = inject(MessageService);
  localStorage = inject(LocalStorageService);
  liquidacionApi = inject(LiquidacionApiService);

  formulario = this.fb.group({
    idBitacora:['',Validators.required],
    folio: [{ value: '', disabled: true }],
    reporto: [{ value: this.localStorage.getUserInfo()?.nombre, disabled: true }],
    fecha: [{ value: new Date(), disabled: true }, Validators.required],
    idUsuario: [this.localStorage.getUserInfo()?.idEmpleado, Validators.required],
    status: ['BORRADOR'],
    bitacoraPartidaVentas: this.fb.array([])
  });

  listaPartidas: PartidaVenta[] = [];
    @ViewChild('form') form!: FormComponent;
  

    ngOnInit(): void {
      // const hoy = new Date().toISOString().slice(0, 10)
      const hoy = new Date();
      const fechaLocal = `${hoy.getFullYear()}-${(hoy.getMonth() + 1).toString().padStart(2, '0')}-${hoy.getDate().toString().padStart(2, '0')}`;

      console.log(fechaLocal); // Esto te dará la fecha real local: "2025-06-22"
      // console.log(hoy); // "2025-06-25"

    this.ventaRutaService.check(fechaLocal).subscribe({
      next:(resp)=>{
        console.log(resp);
        if (resp) {
          console.log('HAY REGISTRO');
          this.formulario.patchValue({
            folio:resp.folio,
            fecha: new Date(resp.fecha),
            idBitacora:resp.idBitacora
          })
          if (resp.bitacoraPartidaVentas) {
            this.loadPartidas(resp.bitacoraPartidaVentas);
          }

        }else{
          this.ventaRutaService.create({fecha:fechaLocal}).subscribe({
            next:(response:BitacoraRutaResponse)=>{
              this.formulario.patchValue({
                folio:response.folio,
                fecha: new Date(response.fecha),
                idBitacora:response.idBitacora
              })

              console.log(response);
            }
          })
          console.log('NO HAY REGISTRO');
        }
      }
    })
  }

  loadPartidas(partidas:any[]){
    this.listaPartidas = []
    console.log('partida original',partidas);
    let index = 0
    for (const partida of partidas) {
      console.log('PARTID',partida);
      let ayudantesArray:string[] = []

      setTimeout(() => {
        let ventaTrayecto: VentaTrayectoRuta[] = []

        for (const element of partida.ventaTrayecto) {
          for (const ayudante of element.comisionesEmpleados) {
            ayudantesArray.push(ayudante.empleado.idEmpleado)
          }

          ventaTrayecto.push({
            cantidadLlegada: element.cantidadLlegada,
            cantidadSalida: element.cantidadSalida,
            comisionesEmpleado: element.comisionesEmpleados.map(
              (ce: ComisionEmpleadoResponse) => ({
                idEmpleado: ce.empleado.idEmpleado,
                cantidad: ce.comision,
              })
            ),
            huecos: element.huecos,
            idProducto: element.producto?.idProductoComercial,
            idUnidadMedicion: element.unidades,
            idVenta: element.idVenta,
            productosFueraEspecificacion: element.productosFueraEspecificacion.map(
              (pfe: ProductosFueraEspecificacionResponse) =>({
                cantidad: pfe.cantidad,
                idConcepto: pfe.concepto.id
              })
            ),
            mermas: (element.mermas ?? []).map((merma: any) => ({
              idMerma: merma.idMerma ?? null,
              idEmpleado: merma.empleadoResponsable?.idEmpleado ?? null,
              cantidad: Number(merma.cantidad ?? 0),
              rotoPorMaquina: Boolean(merma.rotoPorMaquina),
              idImagenFirma: merma.idImagenFirma ?? null,
            })),
          });
        }




        const firstTrayecto = ventaTrayecto[0];
        const saleCon = Number(firstTrayecto?.cantidadSalida ?? 0);
        const regresaCon = Number(firstTrayecto?.cantidadLlegada ?? 0);

        this.listaPartidas.push({
          id: partida.idPartida,
          chofer: partida.conductor?.idEmpleado,
          ruta: partida.ruta?.id,
          proceso: partida.tipoProceso ?? (partida as any).proceso ?? 'SIN_PROCESO',
          vehiculo:partida.vehiculo?.id,
          idUnidadMedicion: partida.vehiculo?.unidadMedida?.nombre,
          capMax:partida.vehiculo?.capacidadMaxima,
          estadoVentaRuta:partida.estadoVentaRuta,
          mandadoALiquidacion: Boolean((partida as any).mandadoALiquidacion),
          comentario: partida.comentario ?? '',
          idImagenFirma:partida.idImagenFirma,
          firma: (partida as any).estadoVentaRuta === 'FIRMADO' && (partida as any).idImagenFirma
            ? `${environment.apiUrl}images/${(partida as any).idImagenFirma}`
            : '',
          fechaFirma: (partida as any)?.fechaFirma ?? null,
          fechallegada:partida.createdAt ?? null,
          notaAsignada: partida.ruta?.notaAsignada ?? null,
          ventaTrayecto:ventaTrayecto,
          original: partida,
          ayudantes:ayudantesArray,
          producto: firstTrayecto?.idProducto ?? null,
          saleCon,
          regresaCon,
          vendidos: saleCon - regresaCon,
        })

        this.form.table.initRowEdit(this.listaPartidas[index]);
        index++
        if (index === partidas.length) this.actualizarBloqueoConteo();
        console.log(this.listaPartidas);
      }, 500);

      // const ayudantes = (partida.comisionesEmpleados || [])
      //   .filter(c => c.empleado?.idEmpleado !== partida.conductor?.idEmpleado)
      //   .map(c => c.empleado.idEmpleado);
      // const comisiones = (partida.comisionesEmpleados || [])
      //   .filter(c => c.empleado?.idEmpleado !== partida.conductor?.idEmpleado)
      //   .map(c => ({ idEmpleado: c.empleado.idEmpleado, cantidad: c.cantidadConsignada }));
      // let rezagos = []

  //     if (partida?.rezago) {
  //             for (const element of partida?.rezago) {
  //       rezagos.push({
  //           cantidad:element.cantidad,
  //           idConcepto:element.conceptos.id,
  // idProductoRemanente:element.idProductoNoConsignados
  //       })
  //     }
  //     }


      // console.log(rezagos);


      // setTimeout(() => {
      //         this.listaPartidas.push({
      //     id: partida.idPartida,
      //     ruta: partida.ruta?.id,
      //     notaAsignada: partida.ruta?.notaAsignada ?? null,
      //     chofer: partida.conductor?.idEmpleado,
      //     ayudantes,
      //     vehiculo: partida.vehiculo?.id,
      //     producto: partida.productoComercial?.idProductoComercial,
      //     capMax: partida.vehiculo?.capacidadMaxima,
      //     saleCon: partida.cantidadSalida,
      //     regresaCon: partida.cantidadLlegada,
      //     vendidos: partida.vendidos ?? partida.cantidadSalida - partida.cantidadLlegada,
      //     huecos: partida.huecos ?? 0,
      //     rotos: (partida as any).rotos ?? 0,
      //     donados: (partida as any).donados ?? 0,
      //   unidadMedida: partida.vehiculo?.unidadMedida?.nombre,
      //   firma:
      //     (partida as any).estadoVentaRuta === 'FIRMADO' && (partida as any).idImagenFirma
      //       ? `${environment.apiUrl}images/${(partida as any).idImagenFirma}`
      //       : '',
      //   idImagenFirma: (partida as any).idImagenFirma ?? null,
      //   estadoVentaRuta: (partida as any).estadoVentaRuta ?? 'PENDIENTE',
      //   comisiones,
      //   productosNoConsignados:rezagos,
      //   original:partida
      // })

      // this.form.table.initRowEdit(this.listaPartidas[index]);
      // index++
      //     console.log(this.listaPartidas);

      // }, 500);
    }

  }


  guardar() {
    return;
    // if (this.formulario.invalid) {
    //   this.formulario.markAllAsTouched();
    //   this.messageService.add({
    //     key: 'center',
    //     severity: 'warn',
    //     summary: '¡Precaución!',
    //     detail: 'Hay campos inválidos.',
    //   });
    //   return;
    // }

    // if (this.listaPartidas.length === 0) {
    //   this.messageService.add({
    //     key: 'center',
    //     severity: 'warn',
    //     summary: '¡Precaución!',
    //     detail: 'Agrega al menos una partida.'
    //   });
    //   return;
    // }

    // const value = this.formulario.getRawValue();



  }

  guardarBorrador() {
    console.log(this.listaPartidas);

  }

  private actualizarBloqueoConteo(): void {
    this.liquidacionApi.getAll().subscribe((liquidaciones) => {
      const fechaBitacora = this.fechaDia(this.formulario.getRawValue().fecha);
      for (const partida of this.listaPartidas) {
        const liquidacionCerrada = liquidaciones.some((liquidacion) =>
          String(liquidacion.ruta?.id ?? '') === String(partida.ruta ?? '') &&
          this.fechaDia(liquidacion.fecha) === fechaBitacora &&
          ['FINALIZADA', 'CANCELADA'].includes(liquidacion.estadosLiquidacion)
        );
        partida.liquidacionCerrada = Boolean(partida.mandadoALiquidacion && liquidacionCerrada);
      }
    });
  }

  private fechaDia(value: unknown): string {
    if (!value) return '';
    if (value instanceof Date) {
      return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
    }
    return String(value).slice(0, 10);
  }

}


