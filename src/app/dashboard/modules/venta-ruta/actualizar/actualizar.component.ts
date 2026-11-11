import { CommonModule } from '@angular/common';
import { Component, inject, AfterViewInit, ViewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { BotonRegresarComponent } from '@shared/components/boton-regresar/boton-regresar.component';
import { HeaderComponent } from '@shared/components/header/header.component';
import { MessageErrorComponent } from '@shared/components/message-error/message-error.component';
import { MessageService } from 'primeng/api';
import { LocalStorageService } from '@shared/services/local-storage.service';
import { BitacoraPartidaVenta, VentaRutaApiService } from '../services/venta-ruta.api.service';
import { VentaRutaDTO } from '../services/venta-ruta.dto';
import { environment } from '../../../../../environments/environment';
import { FormComponent, PartidaVenta, VentaTrayectoRuta, ComisionesEmpleado } from '../form/form.component';

@Component({
  selector: 'app-venta-ruta-actualizar',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AppPrimengModule,
    HeaderComponent,
    BotonRegresarComponent,
    FormComponent,
    MessageErrorComponent,
    RouterLink
  ],
  templateUrl: './actualizar.component.html',
  styleUrl: './actualizar.component.scss'
})
export class ActualizarComponent implements AfterViewInit {
  fb = inject(FormBuilder);
  ventaRutaService = inject(VentaRutaApiService);
  router = inject(Router);
  route = inject(ActivatedRoute);
  messageService = inject(MessageService);
  localStorage = inject(LocalStorageService);
  @ViewChild(FormComponent) formComponent!: FormComponent;

  formulario = this.fb.group({
    idBitacora:['',Validators.required],
    folio: [{ value: '', disabled: true }],
    reporto: [{ value: this.localStorage.getUserInfo()?.nombre, disabled: true }],
    fecha: [new Date(), Validators.required],
    idUsuario: [this.localStorage.getUserInfo()?.idEmpleado, Validators.required],
    status: ['BORRADOR'],
    bitacoraPartidaVentas: this.fb.array([])
  });

  listaPartidas: PartidaVenta[] = [];
  idRegistro = '';
  readonly = true;

  constructor() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.idRegistro = id;
      }
    });
  }

  ngAfterViewInit(): void {
    if (this.idRegistro) {
      this.cargarDatos(this.idRegistro);
    }
  }

  cargarDatos(id: string) {
    this.ventaRutaService.getOne(id).subscribe(resp => {
      this.readonly = true;
      this.formulario.disable();
      this.formulario.patchValue({
        folio: (resp as any).folio,
        reporto: (resp as any).usuario?.nombre ?? '',
        fecha: resp ? new Date((resp as any).fecha) : new Date(),
        idUsuario: (resp as any).usuario?.idEmpleado ?? '',
        status: (resp as any).status ?? 'GUARDADA'
      });
      this.loadPartidas((resp as any).bitacoraPartidaVentas ?? []);
    });
  }

  loadPartidas(partidas: BitacoraPartidaVenta[]): void {
    this.listaPartidas = [];

    partidas.forEach((partida) => {
      const ayudantesSet = new Set<string>();

      const ventaTrayecto: VentaTrayectoRuta[] = (partida.ventaTrayecto || []).map((trayecto) => {
        const comisiones: ComisionesEmpleado[] = (trayecto.comisionesEmpleados || [])
          .map((comision) => {
            const idEmpleado = comision.empleado?.idEmpleado ?? (comision as any)?.idEmpleado;
            if (!idEmpleado) {
              return null;
            }

            if (idEmpleado !== partida.conductor?.idEmpleado) {
              ayudantesSet.add(idEmpleado);
            }

            return {
              idEmpleado,
              cantidad: Number(comision.comision ?? (comision as any).cantidadConsignada ?? 0),
            };
          })
          .filter((value): value is ComisionesEmpleado => value !== null);

        const productosFueraEspecificacion = (trayecto.productosFueraEspecificacion || []).map((producto) => ({
          idConcepto: producto.concepto?.id ?? 0,
          cantidad: Number(producto.cantidad ?? 0),
        }));

        const unidadMedicion =
          trayecto.unidades?.idUnidadDeMedida ??
          trayecto.unidades?.nombre ??
          null;

        return {
          cantidadLlegada: Number(trayecto.cantidadLlegada ?? 0),
          cantidadSalida: Number(trayecto.cantidadSalida ?? 0),
          comisionesEmpleado: comisiones,
          huecos: Number(trayecto.huecos ?? 0),
          idProducto: trayecto.producto?.idProductoComercial ?? null,
          idUnidadMedicion: unidadMedicion,
          idVenta: trayecto.idVenta ?? null,
          productosFueraEspecificacion,
          mermas: (trayecto.mermas ?? []).map((merma: any) => ({
            idMerma: merma.idMerma ?? null,
            idEmpleado: merma.empleadoResponsable?.idEmpleado ?? null,
            cantidad: Number(merma.cantidad ?? 0),
            rotoPorMaquina: Boolean(merma.rotoPorMaquina),
            idImagenFirma: merma.idImagenFirma ?? null,
          })),
        };
      });

      const firstTrayecto = ventaTrayecto[0];
      const saleCon = Number(firstTrayecto?.cantidadSalida ?? 0);
      const regresaCon = Number(firstTrayecto?.cantidadLlegada ?? 0);
      const partidaVenta: PartidaVenta = {
        id: partida.idPartida,
        chofer: partida.conductor?.idEmpleado ?? null,
        idImagenFirma: partida.idImagenFirma ?? null,
        firma:
          partida.estadoVentaRuta === 'FIRMADO' && partida.idImagenFirma
            ? `${environment.apiUrl}images/${partida.idImagenFirma}`
            : '',
        fechaFirma: (partida as any)?.fechaFirma ?? null,
        fechallegada:partida.createdAt ?? null,
        ruta: partida.ruta?.id ?? null,
        proceso: partida.tipoProceso ?? (partida as any).proceso ?? 'SIN_PROCESO',
        notaAsignada: partida.ruta?.notaAsignada ?? null,
        vehiculo: partida.vehiculo?.id ?? null,
        idUnidadMedicion: partida.vehiculo?.unidadMedida?.nombre ?? null,
        capMax: partida.vehiculo?.capacidadMaxima ?? 0,
        ventaTrayecto,
        estadoVentaRuta: partida.estadoVentaRuta ?? 'PENDIENTE',
        original: partida,
        ayudantes: Array.from(ayudantesSet),
        producto: firstTrayecto?.idProducto ?? null,
        saleCon,
        regresaCon,
        vendidos: saleCon - regresaCon,
      };

      this.listaPartidas.push(partidaVenta);
      this.formComponent?.table?.initRowEdit(partidaVenta);
    });

    this.formComponent?.activateAllRows();
  }

  guardar() {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      this.messageService.add({
        key: 'center',
        severity: 'warn',
        summary: '¡Precaución!',
        detail: 'Hay campos inválidos.'
      });
      return;
    }

    if (this.listaPartidas.length === 0) {
      this.messageService.add({
        key: 'center',
        severity: 'warn',
        summary: '¡Precaución!',
        detail: 'Agrega al menos una partida.'
      });
      return;
    }

    const value = this.formulario.getRawValue();
    // const request: VentaRutaDTO = {
    //   fecha: new Date(value.fecha!).toISOString(),
    //   idUsuario: value.idUsuario!,
    //   status: 'GUARDADA',
    //   bitacoraPartidaVentas: this.listaPartidas.map(p => ({
    //     cantidadLlegada: p.regresaCon,
    //     cantidadSalida: p.saleCon,
    //     huecos: p.huecos,
    //     rotos: p.rotos,
    //     donados: p.donados,
    //     idAyudante: p.ayudantes[0] ?? '',
    //     idConductor: p.chofer ?? '',
    //     idRuta: p.ruta ?? '',
    //     idVehiculo: p.vehiculo ?? '',
    //     idProductoComercial: p.producto ?? ''
    //   }))
    // };

    // this.ventaRutaService.update(request, this.idRegistro).subscribe(() => {
    //   this.formulario.reset();
    //   this.listaPartidas = [];
    //   this.router.navigate(['../principal'], { relativeTo: this.route });
    //   this.messageService.add({
    //     key: 'top-right',
    //     severity: 'success',
    //     summary: '¡Actualización exitosa!',
    //     detail: 'Se ha actualizado la venta por ruta',
    //   });
    // });
  }

  guardarBorrador() {
    const value = this.formulario.getRawValue();
    // const request: VentaRutaDTO = {
    //   fecha: new Date(value.fecha!).toISOString(),
    //   idUsuario: value.idUsuario!,
    //   status: 'BORRADOR',
    //   bitacoraPartidaVentas: this.listaPartidas.map(p => ({
    //     cantidadLlegada: p.regresaCon,
    //     cantidadSalida: p.saleCon,
    //     huecos: p.huecos,
    //     rotos: p.rotos,
    //     donados: p.donados,
    //     idAyudante: p.ayudantes[0] ?? '',
    //     idConductor: p.chofer ?? '',
    //     idRuta: p.ruta ?? '',
    //     idVehiculo: p.vehiculo ?? '',
    //     idProductoComercial: p.producto ?? ''
    //   }))
    // };

    // this.ventaRutaService.update(request, this.idRegistro).subscribe(() => {
    //   this.formulario.reset();
    //   this.listaPartidas = [];
    //   this.router.navigate(['../principal'], { relativeTo: this.route });
    //   this.messageService.add({
    //     key: 'top-right',
    //     severity: 'success',
    //     summary: '¡Registro guardado!',
    //     detail: 'Se ha guardado el borrador de venta por ruta',
    //   });
    // });
  }


}

