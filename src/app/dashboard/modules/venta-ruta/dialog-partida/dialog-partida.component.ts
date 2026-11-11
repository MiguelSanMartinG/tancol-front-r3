import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Component, EventEmitter, Output, ViewChild, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, FormArray, FormGroup, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { MessageErrorComponent } from '@shared/components/message-error/message-error.component';
import { SelectModel } from '@core/common/select.model';
import { VehiculosResponse } from '../../vehiculos/services/vehiculos.response';
import { PartidaVenta, VentaTrayectoRuta } from '../form/form.component';
import { Merma } from '../services/viaje-dto';
import { RutasApiService } from '../../rutas/services/rutas-api.service';
import { ComisionesEmpleado, ProductosNoConsignados } from '../services/venta-ruta.dto';
import { UploadFileApiService } from '@shared/services/upload-file.api.service';
import { DialogSignatureComponent } from '@shared/components/dialog-signature/dialog-signature.component';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-dialog-partida',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, AppPrimengModule, MessageErrorComponent, DialogSignatureComponent],
  templateUrl: './dialog-partida.component.html',
  styleUrl: './dialog-partida.component.scss'
})
export class DialogPartidaComponent implements OnInit {
  display = false;
  @Output() updatePartida = new EventEmitter<PartidaVenta>();
  @ViewChild(DialogSignatureComponent) dialogSignature!: DialogSignatureComponent;
  fb = inject(FormBuilder);
  rutasService = inject(RutasApiService);
  messageService = inject(MessageService);
  uploadFileApi = inject(UploadFileApiService);
  firmaMermaTarget: FormGroup | null = null;
  firmaMermaPartida = { firma: '' } as PartidaVenta;
  formulario = this.createForm();
  expandedRows: { [key: number]: boolean } = {};

  readonly:boolean = false;
  private createForm() {
    const form = this.fb.group({
      ruta: [null],
      notaAsignada:[{value:'',disabled:true}],
      vehiculo: [null],
      capMax: [{ value: 0, disabled: true }],
      unidadMedida: [{value:'',disabled:true}],
      ventaTrayecto: this.fb.array([] as FormGroup[]),
      chofer: [null],
      ayudantes: [[]],
      // producto: [null],
      // saleCon: [0],
      // regresaCon: [0],
      // vendidos: [{ value: 0, disabled: true }],
      // huecos: [0],
      // rotos: [0],
      // donados: this.fb.array([] as FormGroup[]),
      // comisiones: this.fb.array([] as FormGroup[]),
      // choferCantidad: [{ value: 0, disabled: true }],
    });



    // form.get('ayudantes')?.valueChanges.subscribe(ids => {
    //   console.log('ids',ids);
    //   this.syncComisiones(ids || []);
    // });
    // form.get('saleCon')?.valueChanges.subscribe(() => {
    //   this.calcularVendidos();
    // });
    // form.get('regresaCon')?.valueChanges.subscribe(() => {
    //   this.calcularVendidos();
    // });
    // (form.get('comisiones') as FormArray).valueChanges.subscribe(() => {
    //   this.calcularChoferCantidad();
    // });

    return form;
  }

  /**
   * Referencia a la partida que disparó la apertura del diálogo. Permite
   * sincronizar los cambios realizados en el formulario con el objeto
   * original de la lista.
  */
  partidaOrigen!: PartidaVenta | null;

  listaRutas: SelectModel[] = [];
  listaEmpleados: SelectModel[] = [];
  listaVehiculos: VehiculosResponse[] = [];
  listaProductos: SelectModel[] = [];
  listaAyudantes:SelectModel[] = [];
  listaChoferes:SelectModel[] = [];
  listaMotivos: SelectModel[] = [];
  ngOnInit(): void {
    // Las suscripciones se configuran al crear el formulario
  }

  get comisionesArray(): FormArray {
    return this.formulario.get('ventaTrayecto') as FormArray;
  }

  get donadosArray(): FormArray {
    return this.formulario.get('ventaTrayecto') as FormArray;
  }

  get ventaRuta(): FormArray{
        return this.formulario.get('ventaTrayecto') as FormArray;
  }

  // addDonado(){
  //   const arr = this.donadosArray;
  //   arr.push(this.fb.group({idProductoRemanente:[null],cantidad:[''],idConcepto:['']}))
  // }

  addVentaRuta() {
    const arr = this.ventaRuta;
    const ayudantes: string[] = this.formulario.get('ayudantes')?.value || [];
    const comisiones = ayudantes.map((id) => this.createComisionGroup(id));

    const ventaGroup = this.fb.group({
      idProducto: [],
      cantidadLlegada: [null, [Validators.min(0)]],
      cantidadSalida: [null, [Validators.min(0)]],
      comisionesEmpleado: this.fb.array(comisiones as FormGroup[]),
      productosFueraEspecificacion: this.fb.array([] as FormGroup[]),
      huecos: [null, [Validators.min(0)]],
      idUnidadMedicion: [null],
      idVenta: [null],
      mermas: this.fb.array([] as FormGroup[]),
    });

    arr.push(ventaGroup);
    this.configureVentaRutaGroup(ventaGroup);

    // sync partida source with new row
    this.syncPartida(this.formulario.getRawValue());
  }

  removeVentaRuta(index: number): void {
    if (this.readonly) {
      return;
    }

    this.ventaRuta.removeAt(index);
    this.reindexExpandedRows(index);
    this.syncPartida(this.formulario.getRawValue());
  }




  syncVentaTrayecto(ventaRuta: VentaTrayectoRuta[]) {
    const arr = this.ventaRuta;
    if (ventaRuta) {
      for (const element of ventaRuta) {
        const comisiones = (element.comisionesEmpleado || []).map((c) =>
          this.createComisionGroup(c.idEmpleado, c.cantidad)
        );

        const ventaGroup = this.fb.group({
          idProducto: [element.idProducto],
          cantidadLlegada: [element.cantidadLlegada, [Validators.min(0)]],
          cantidadSalida: [element.cantidadSalida, [Validators.min(0)]],
          comisionesEmpleado: this.fb.array(comisiones as FormGroup[]),
          huecos: [element.huecos, [Validators.min(0)]],
          idUnidadMedicion: [element.idUnidadMedicion],
          idVenta: [element.idVenta],
          productosFueraEspecificacion: this.fb.array(
            (element.productosFueraEspecificacion || []).map((p) =>
              this.fb.group({ idConcepto: [p.idConcepto], cantidad: [p.cantidad] })
            )
          ),
          mermas: this.fb.array(
            (element.mermas ?? []).map((merma) => this.createMermaGroup(merma)) as FormGroup[]
          ),
        });

        arr.push(ventaGroup);
        this.configureVentaRutaGroup(ventaGroup);
      }
    }
  }

  getEmpleadoNombre(id: string): string {
    return this.listaEmpleados.find(e => e.value === id)?.label || '';
  }

  getChoferOptions(): SelectModel[] {
    const selectedId = String(this.formulario.get('chofer')?.value ?? '');
    return this.listaChoferes.map((option) =>
      option.value === selectedId ? { ...option, disabled: false } : option
    );
  }

  getAyudanteOptions(): SelectModel[] {
    const selectedIds = new Set<string>(
      (this.formulario.get('ayudantes')?.value ?? []).map((id: string) => String(id))
    );

    return this.listaAyudantes.map((option) =>
      selectedIds.has(option.value) ? { ...option, disabled: false } : option
    );
  }

  getComisionesControls() {
    return (this.formulario.get('ventaTrayecto') as FormArray).controls as FormGroup[];
    // return (this.formulario.get('comisiones') as FormArray).controls as FormGroup[];
  }
    getDonadosControls() {
    return (this.formulario.get('ventaTrayecto') as FormArray).controls as FormGroup[];
    // return (this.formulario.get('donados') as FormArray).controls as FormGroup[];
  }


  getTrayectosControls(){
    return (this.formulario.get('ventaTrayecto') as FormArray).controls as FormGroup[];
  }

  private reindexExpandedRows(removedIndex: number): void {
    const nextExpandedRows: { [key: number]: boolean } = {};

    Object.entries(this.expandedRows).forEach(([key, value]) => {
      const index = Number(key);
      if (!value || index === removedIndex) {
        return;
      }

      nextExpandedRows[index > removedIndex ? index - 1 : index] = value;
    });

    this.expandedRows = nextExpandedRows;
  }

  /**
   * Copia los datos del formulario a la partida original para mantenerla
   * actualizada en tiempo real.
   */
  private syncPartida(value: any) {
    if (!this.partidaOrigen) return;
    this.partidaOrigen.ruta = value.ruta;
    this.partidaOrigen.notaAsignada = value.notaAsignada;
    this.partidaOrigen.vehiculo = value.vehiculo;
    this.partidaOrigen.capMax = value.capMax ?? 0;
    this.partidaOrigen.idUnidadMedicion = value.unidadMedida;
    this.partidaOrigen.chofer = value.chofer;
    this.partidaOrigen.ventaTrayecto = value.ventaTrayecto ?? [];
    const trayecto = this.partidaOrigen.ventaTrayecto?.[0];
    const salida = Number(trayecto?.cantidadSalida ?? 0);
    const llegada = Number(trayecto?.cantidadLlegada ?? 0);
    const huecos = Number(trayecto?.huecos ?? 0);
    this.partidaOrigen.saleCon = Math.max(salida - huecos, 0);
    this.partidaOrigen.regresaCon = Number.isFinite(llegada) ? llegada : 0;
    this.partidaOrigen.vendidos = Math.max(salida - llegada, 0);
    this.partidaOrigen.producto = trayecto?.idProducto ?? null;
  }

  getSaleCon(rowIndex: number): number {
    const trayecto = this.ventaRuta.at(rowIndex)?.getRawValue();
    return Math.max(Number(trayecto?.cantidadSalida ?? 0) - Number(trayecto?.huecos ?? 0), 0);
  }

  getVendidos(rowIndex: number): number {
    const trayecto = this.ventaRuta.at(rowIndex)?.getRawValue();
    return Math.max(Number(trayecto?.cantidadSalida ?? 0) - Number(trayecto?.cantidadLlegada ?? 0), 0);
  }

  updateSaleCon(rowIndex: number, value: number): void {
    const grupo = this.ventaRuta.at(rowIndex) as FormGroup;
    const saleCon = Math.max(Number(value) || 0, 0);
    const huecos = Math.max(Number(grupo.get('huecos')?.value) || 0, 0);
    grupo.get('cantidadSalida')?.setValue(saleCon + huecos);
  }

  open(partida: PartidaVenta, 
    listas: { rutas: SelectModel[]; choferes:SelectModel[]; ayudantes:SelectModel[]; empleados: SelectModel[]; vehiculos: VehiculosResponse[]; productos: SelectModel[]; motivos:SelectModel[] },
    readonly:boolean = false
  ) {
    console.log('readonlyreadonlyreadonlyreadonlyreadonly',readonly);
    console.log('listas',listas);
    console.log(readonly);
    this.readonly = readonly;
    this.formulario = this.createForm();


    this.withSuppressedAyudanteWarning(() => {
      console.log('open',partida);
      this.formulario.reset();
      // const comisiones = partida.comisiones;
      this.listaRutas = listas.rutas;
      this.listaEmpleados = listas.empleados;
      this.listaVehiculos = listas.vehiculos;
      this.listaProductos = listas.productos;
      this.listaMotivos = listas.motivos;
      this.listaChoferes = listas.choferes;
      this.listaAyudantes = listas.ayudantes;
      // guardamos referencia a la partida para actualizarla en tiempo real
      this.partidaOrigen = partida;

      this.formulario.patchValue({
        ruta: partida.ruta,
        notaAsignada: partida.notaAsignada,
        vehiculo: <any> partida.vehiculo,
        capMax: partida.capMax,
        unidadMedida: partida.idUnidadMedicion,
        chofer: partida.chofer,
        ayudantes:<any>partida.ayudantes
      })
      // this.formulario.patchValue({
      //   ruta: partida.ruta,
      //   chofer: partida.chofer,
      //   ayudantes: (partida as any).ayudantes ?? [],
      //   producto: <any> partida.producto,
      //   unidadMedida:<any> partida?.unidadMedida,
      //   vehiculo: <any> partida.vehiculo,
      //   capMax: partida.capMax,
      //   notaAsignada: partida.notaAsignada ?? '',
      //   saleCon: partida.saleCon,
      //   regresaCon: partida.regresaCon,
      //   vendidos: partida.vendidos,
      //   huecos: (partida as any).huecos ?? 0,
      //   rotos: (partida as any).rotos ?? 0,
      //   // donados: partida.productosNoConsignados,
      //   comisiones: partida.comisiones,
      //   choferCantidad: 0
      // });
      this.syncVentaTrayecto(partida.ventaTrayecto);
      this.syncPartida(this.formulario.getRawValue());
    });

    console.log(this.formulario);
    if (partida.ruta) {
      // this.setRuta(partida.ruta);
    }
    // sincronizamos valores iniciales
    // this.syncPartida(this.formulario.getRawValue());
    this.display = true;
    // setTimeout(() => {
    //       this.formulario.patchValue({comisiones:comisiones,unidadMedida:partida.unidadMedida})
    // console.log(comisiones);
    // }, 300);

 

      if (partida.estadoVentaRuta === 'FIRMADO' || this.readonly) {
     this.formulario.disable();
   }
        // console.log(partida);
        // console.log(this.formulario.getRawValue());

  }

  setRuta(id: string | null) {
    // console.log(item);
    // if (!item.ruta) {
    //   item.chofer = null;
    //   // item.ayudantes = [];
    //   item.vehiculo = null;
    //   item.capMax = 0;
    //   // item.unidadMedida = <any>null;
    //   return;
    // }
    // this.rutasService.getOne(item.ruta).subscribe((resp) => {
    //   console.log('setRuta/getOne',resp);
    //   item.chofer = resp.choferBase.idEmpleado;
    //   // item.ayudantes =
    //   //   resp?.empleadosAsignados?.map((e: any) => e.idEmpleado) ?? [];
    //   item.notaAsignada = resp.notaAsignada ?? null;
    //   item.vehiculo = resp.vehiculosBase?.id ?? null;
    //   item.idUnidadMedicion = resp.vehiculosBase?.unidadMedida?.nombre ?? null;
    //   item.capMax = resp.vehiculosBase?.capacidadMaxima ?? 0;
    //   item.ventaTrayecto[0].idUnidadMedicion = resp.vehiculosBase.unidadMedida.idUnidadDeMedida;
    //   item.ventaTrayecto[0].cantidadSalida = resp.vehiculosBase?.capacidadMaxima;
    //   item.ventaTrayecto[0].idProducto = resp.productoBase?.idProductoComercial ?? null;
    //   // item.ventaTrayecto[0].comisionesEmpleado.push(
    //   //   {
    //   //     idEmpleado: resp.empleadosAsignados[0].idEmpleado,
    //   //     cantidad: 0
    //   //   }
    //   // )
    //   // item.saleCon = resp.vehiculosBase?.capacidadMaxima;
    //   // item.producto = resp.productoBase?.idProductoComercial ?? null;
    //   // item.vendidos = item.saleCon - item.regresaCon;
    //   this.guardarPartida(item);
    // });



    if (!id) {
      this.formulario.patchValue({
        chofer: null,
        notaAsignada:'',
        vehiculo: null,
        capMax: 0,
        unidadMedida:null,
      });
      return;
    }
    this.rutasService.getOne(id).subscribe(resp => {
      const empleados = resp?.empleadosAsignados?.map((e: any) => e.idEmpleado) ?? [];
      this.formulario.patchValue({
        chofer: <any>resp?.choferBase?.idEmpleado ?? null,
        vehiculo: <any>resp.vehiculosBase?.id ?? null,
        capMax: resp.vehiculosBase?.capacidadMaxima ?? 0,
        // saleCon: resp.vehiculosBase?.capacidadMaxima ?? 0,
        // producto: <any>resp.productoBase?.idProductoComercial ?? null,
        notaAsignada: resp.notaAsignada ?? ''
      });
    });
  }

  setVehiculo(id: string | null) {
    const veh = this.listaVehiculos.find(v => v.id === id);
    // this.formulario.patchValue({
    //   capMax: veh?.capacidadMaxima ?? 0,
    //   saleCon: veh?.capacidadMaxima ?? 0,
    //   unidadMedida: veh?.unidadMedida.nombre
    // });
  }

  calcularVendidos() {
    if (this.partidaOrigen) {
      this.syncPartida(this.formulario.getRawValue());
    }
  }
private suppressAyudanteWarning = false;

  private withSuppressedAyudanteWarning<T>(action: () => T): T {
    const previous = this.suppressAyudanteWarning;
    this.suppressAyudanteWarning = true;
    try {
      return action();
    } finally {
      this.suppressAyudanteWarning = previous;
    }
  }

  handleHide() {
    this.withSuppressedAyudanteWarning(() => {
      this.display = false;
      this.partidaOrigen = null;
      this.formulario.reset();
      this.comisionesArray.clear();
    });
  }

    guardar(){
    // Si la partida ya fue firmada o no se estableció ninguna partida, solo cerramos
    if (!this.partidaOrigen || this.partidaOrigen.estadoVentaRuta === 'FIRMADO') {
      this.handleHide();
      return;
    }

    if (!this.validateMermas()) return;

    // Copiamos los datos actuales del formulario a la partida de origen
    this.syncPartida(this.formulario.getRawValue());

    // Emitimos la partida actualizada para que el componente padre la procese
    this.updatePartida.emit(this.partidaOrigen);

    // Cerramos el diálogo y limpiamos
    this.handleHide();
    }

    removeDonado(index: number) {
  this.donadosArray.removeAt(index);
}
  ayudantesChange(ids: string[]) {
    const trayectos = this.ventaRuta.controls as FormGroup[];

    for (const grupo of trayectos) {
      const comisiones = grupo.get('comisionesEmpleado') as FormArray;

      // agregar registros faltantes
      ids.forEach((id) => {
        const existe = comisiones.controls.some(
          (c) => c.get('idEmpleado')?.value === id
        );
        if (!existe) {
          const cantidadInicial = Math.max(
            Number(grupo.get('cantidadSalida')?.value ?? 0) -
              Number(grupo.get('cantidadLlegada')?.value ?? 0),
            0
          );
          const nuevoControl = this.createComisionGroup(id, cantidadInicial);
          comisiones.push(nuevoControl);
          this.configureComisionControl(nuevoControl, grupo);
        }
      });

      // eliminar registros que ya no estan seleccionados
      for (let i = comisiones.length - 1; i >= 0; i--) {
        const control = comisiones.at(i) as FormGroup;
        const idEmpleado = control.get('idEmpleado')?.value;
        if (!ids.includes(idEmpleado)) {
          comisiones.removeAt(i);
        }
      }

      this.validateAyudantesCantidad(grupo);
    }

    // mantener sincronizada la partida origen
    this.syncPartida(this.formulario.getRawValue());
  }

  /** Para agregar nuevas filas en comisiones */
  addComision(rowIndex: number): void {
    const comisiones = this.getComisiones(rowIndex);
    const nuevo = this.createComisionGroup('', 0);
    comisiones.push(nuevo);

    const ventaGrupo = this.ventaRuta.at(rowIndex) as FormGroup;
    this.configureComisionControl(nuevo, ventaGrupo);
    this.validateAyudantesCantidad(ventaGrupo);
    this.syncPartida(this.formulario.getRawValue());
  }

  private createComisionGroup(id: string | null = null, cantidad: number = 0): FormGroup {
    return this.fb.group({
      idEmpleado: [id],
      cantidad: [cantidad, [Validators.min(0)]]
    });
  }

  private configureVentaRutaGroup(grupo: FormGroup): void {
    if ((grupo as any)._ayudanteRulesConfigured) {
      return;
    }
    (grupo as any)._ayudanteRulesConfigured = true;

    const validate = () => this.validateAyudantesCantidad(grupo);

    grupo.get('cantidadSalida')?.valueChanges.subscribe(() => {
      validate();
      this.syncPartida(this.formulario.getRawValue());
    });
    grupo.get('cantidadLlegada')?.valueChanges.subscribe(() => {
      validate();
      this.syncPartida(this.formulario.getRawValue());
    });
    grupo.get('huecos')?.valueChanges.subscribe(() => {
      validate();
      this.syncPartida(this.formulario.getRawValue());
    });

    const comisiones = grupo.get('comisionesEmpleado') as FormArray;
    if (comisiones) {
      comisiones.controls.forEach((control) =>
        this.configureComisionControl(control as FormGroup, grupo)
      );
    }

    validate();
  }

  private configureComisionControl(control: FormGroup, grupo: FormGroup): void {
    if (!control || (control as any)._ayudanteRuleConfigured) {
      return;
    }
    (control as any)._ayudanteRuleConfigured = true;

    const cantidadCtrl = control.get('cantidad');
    if (!cantidadCtrl) {
      return;
    }

    cantidadCtrl.valueChanges.subscribe(() => {
      this.validateAyudantesCantidad(grupo);
      this.syncPartida(this.formulario.getRawValue());
    });
  }

  private validateAyudantesCantidad(grupo: FormGroup): void {
    const salida = Number(grupo.get('cantidadSalida')?.value) || 0;
    const llegada = Number(grupo.get('cantidadLlegada')?.value) || 0;
    const vendidos = Math.max(salida - llegada, 0);
    const comisiones = grupo.get('comisionesEmpleado') as FormArray;
    if (!comisiones) {
      return;
    }

    let adjusted = false;
    let warnedMax = false;
    let warnedMin = false;

    comisiones.controls.forEach((control) => {
      const cantidadCtrl = control.get('cantidad');
      if (!cantidadCtrl) {
        return;
      }

      let value: any = cantidadCtrl.value;
      if (value === '' || value === null || value === undefined) {
        value = 0;
      }
      let numericValue = Number(value);
      if (Number.isNaN(numericValue)) {
        numericValue = 0;
      }

      if (numericValue < 0) {
        cantidadCtrl.setValue(0, { emitEvent: false });
        cantidadCtrl.updateValueAndValidity({ emitEvent: false });
        if (!warnedMin && !this.suppressAyudanteWarning) {
          this.messageService.add({
            severity: 'warn',
            summary: 'Ayudantes',
            detail: 'La cantidad del ayudante no puede ser menor que cero.',
          });
          warnedMin = true;
        }
        adjusted = true;
        numericValue = 0;
      }

      if (numericValue > vendidos) {
        cantidadCtrl.setValue(vendidos, { emitEvent: false });
        cantidadCtrl.updateValueAndValidity({ emitEvent: false });
        if (!warnedMax && !this.suppressAyudanteWarning) {
          this.messageService.add({
            severity: 'warn',
            summary: 'Ayudantes',
            detail: 'La cantidad del ayudante no puede superar la del chofer.',
          });
          warnedMax = true;
        }
        adjusted = true;
      }
    });

  }

  /** Para agregar nuevas filas en productos fuera especificación */
  addProductoFuera(rowIndex: number): void {
    const productos = this.getProductosFuera(rowIndex);
    productos.push(
      this.fb.group({
        idConcepto: [''],
        cantidad: [0]
      })
    );
  }


    /** Getters para arrays internos */
  getComisiones(rowIndex: number): FormArray {
    return this.ventaRuta.at(rowIndex).get('comisionesEmpleado') as FormArray;
  }

  getProductosFuera(rowIndex: number): FormArray {
    return this.ventaRuta.at(rowIndex).get('productosFueraEspecificacion') as FormArray;
  }

  getMermas(rowIndex: number): FormArray {
    return this.ventaRuta.at(rowIndex).get('mermas') as FormArray;
  }

  addMerma(rowIndex: number): void {
    if (this.readonly) return;
    this.getMermas(rowIndex).push(this.createMermaGroup());
  }

  removeMerma(rowIndex: number, mermaIndex: number): void {
    if (this.readonly) return;
    this.getMermas(rowIndex).removeAt(mermaIndex);
  }

  mermaMaquinaChanged(merma: FormGroup): void {
    if (merma.get('rotoPorMaquina')?.value) {
      merma.get('idEmpleado')?.setValue(null);
    }
  }

  openFirmaMerma(merma: FormGroup): void {
    this.firmaMermaTarget = merma;
    this.firmaMermaPartida.firma = merma.get('idImagenFirma')?.value
      ? this.getFirmaUrl(merma.get('idImagenFirma')?.value)
      : '';
    this.dialogSignature.open('Usuario en sesión');
  }

  firmaMermaConfirmada(file: { archivo: File }): void {
    if (!this.firmaMermaTarget) return;

    this.uploadFileApi.create(file.archivo).subscribe({
      next: (response) => {
        this.firmaMermaTarget?.get('idImagenFirma')?.setValue(response.fileName);
        this.firmaMermaTarget = null;
      },
      error: () => this.messageService.add({
        severity: 'error',
        summary: 'Firma',
        detail: 'No se pudo cargar la firma de la merma.',
      }),
    });
  }

  getFirmaUrl(fileName: string | null): string {
    return fileName ? `${environment.apiUrl}images/${fileName}` : '';
  }

  private createMermaGroup(merma?: Partial<Merma>): FormGroup {
    return this.fb.group({
      idMerma: [merma?.idMerma ?? null],
      idEmpleado: [merma?.idEmpleado ?? null],
      cantidad: [Number(merma?.cantidad ?? 0), [Validators.min(1)]],
      rotoPorMaquina: [Boolean(merma?.rotoPorMaquina)],
      idImagenFirma: [merma?.idImagenFirma ?? null],
    });
  }

  private validateMermas(): boolean {
    for (const trayecto of this.getTrayectosControls()) {
      for (const merma of this.getMermas(this.getTrayectosControls().indexOf(trayecto)).getRawValue()) {
        if (Number(merma.cantidad) <= 0) {
          this.messageService.add({ severity: 'warn', summary: 'Mermas', detail: 'La cantidad de merma debe ser mayor a 0.' });
          return false;
        }
        if (merma.rotoPorMaquina && !merma.idImagenFirma) {
          this.messageService.add({ severity: 'warn', summary: 'Mermas', detail: 'La firma es obligatoria cuando el roto es por máquina.' });
          return false;
        }
        if (!merma.rotoPorMaquina && !merma.idEmpleado) {
          this.messageService.add({ severity: 'warn', summary: 'Mermas', detail: 'El responsable es obligatorio cuando el roto no es por máquina.' });
          return false;
        }
      }
    }
    return true;
  }
}

