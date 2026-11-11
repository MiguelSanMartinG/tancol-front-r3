import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { AppSharedModule } from '@shared/app-shared.module';
import { BotonRegresarComponent } from '@shared/components/boton-regresar/boton-regresar.component';
import { HeaderComponent } from '@shared/components/header/header.component';
import { DateUtilService } from '@shared/services/date-util.service';
import { LocalStorageService } from '@shared/services/local-storage.service';
import { catchError, forkJoin, of } from 'rxjs';
import {
  ReporteGeneralCorridasFilaResponse,
  ReporteGeneralCorridasResponse,
  ReporteGeneralRangoRequest,
  ReporteGeneralService,
  ReporteGeneralTipo,
} from '../services/reporte-general.service';
import { exportReporteGeneralPdf } from './export-reporte-general-pdf';

interface ReporteGeneralSeccion {
  label: string;
  abreviatura?: string;
  subtitulo?: string;
  columnas: string[];
  etiquetas?: Record<string, string>;
}

@Component({
  selector: 'app-reporte-general',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AppPrimengModule,
    AppSharedModule,
    BotonRegresarComponent,
    HeaderComponent,
  ],
  templateUrl: './principal.component.html',
  styleUrl: './principal.component.scss',
})
export class PrincipalComponent implements OnInit {
  private reporteApi = inject(ReporteGeneralService);
  private dateUtil = inject(DateUtilService);
  private localStorage = inject(LocalStorageService);
  private fb = inject(FormBuilder);

  readonly tabs: { label: string; value: ReporteGeneralTipo }[] = [
    { label: 'RG Credito', value: 'rg-credito' },
    { label: 'RG Factura', value: 'rg-factura' },
    { label: 'RG No Factura', value: 'rg-nofactura' },
    { label: 'RG Tarjeta Credito', value: 'rp-tcredito' },
    { label: 'RG Tarjeta Débito', value: 'rp-tdebito' },
  ];

  activeTab: ReporteGeneralTipo = 'rg-credito';
  activeCreditoSeccion = 'RUTA PÚBLICO Y RUTA COMERCIAL';
  activeNoFacturaSubtab: 'general' | 'autoservicio' = 'general';
  loading = false;
  private readonly currencyFormat = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  private reportes: Record<ReporteGeneralTipo, ReporteGeneralCorridasResponse | null> = {
    'rg-credito': null,
    'rg-factura': null,
    'rg-nofactura': null,
    'rp-tcredito': null,
    'rp-tdebito': null,
  };
  private reporteNoFacturaAutoservicio: ReporteGeneralCorridasResponse | null = null;
  errorNoFacturaAutoservicio = false;

  readonly columnasNoFacturaAutoservicio = [
    'e20', 'des_liq20', 'des', 'pg', 'bpsc', 'exp', 'agua_purif', 'agua_pot', 'agua_dm',
    'h5kg', 'h3kg', 'c350', 'c500', 'c1000', 'c1500', 'desc_h5kg', 'e11', 'liq11', 'liq10',
  ];

  private readonly seccionesCredito: ReporteGeneralSeccion[] = [
    { label: 'RUTA PÚBLICO Y RUTA COMERCIAL', abreviatura: '(RP Y RC)', columnas: ['e20', 'pg', 'exp'] },
    { label: 'RUTA HIELO', abreviatura: '(RH)', columnas: ['h5kg', 'h3kg'] },
    { label: 'RUTA BOTELLITAS', abreviatura: '(RB)', columnas: ['c350', 'c500', 'c1000', 'c1500'] },
    { label: 'AGUA A GRANEL', abreviatura: '(A.PUR, A.POT Y A.DM)', columnas: ['agua_purif', 'agua_pot', 'agua_dm'] },
  ];

  private readonly seccionesNoFactura: ReporteGeneralSeccion[] = [
    {
      label: 'RUTA PÚBLICO Y RUTA COMERCIAL',
      abreviatura: '(RP Y RC)',
      columnas: ['des_liq20', 'pg', 'bpsc', 'exp'],
      etiquetas: { des_liq20: 'desc_liq' },
    },
    {
      label: 'RUTA HIELO',
      abreviatura: '(RH)',
      columnas: ['h5kg', 'h3kg', 'desc_h5kg'],
      etiquetas: { desc_h5kg: 'desc_h5kg' },
    },
  ];

  private readonly columnasTarjeta = [
    'pg', 'desliq', 'e20', 'agua_purif', 'agua_pot', 'agua_dm',
    'h5kg', 'h3kg', 'c350', 'c500', 'c1000', 'c1500',
    'desc_hielo', 'env11', 'liq11', 'env10', 'bpsc',
  ];

  filtro = this.fb.group({
    fechaInicio: [this.getPrimerDiaMesActual()],
    fechaFin: [new Date()],
  });

  ngOnInit(): void {
    this.buscar();
  }

  async imprimir(): Promise<void> {
    await exportReporteGeneralPdf({
      fechaInicio: this.filtro.getRawValue().fechaInicio ?? null,
      fechaFin: this.filtro.getRawValue().fechaFin ?? null,
      generadoEn: new Date(),
      usuarioExporta: this.getUsuarioExporta(),
      tabs: this.tabs,
      reportes: this.reportes,
    });
  }

  buscar(): void {
    const form = this.filtro.getRawValue();
    const body: ReporteGeneralRangoRequest = {
      fechaInicio: form.fechaInicio
        ? this.dateUtil.toUTCStartOfDay(new Date(form.fechaInicio))
        : undefined,
      fechaFin: form.fechaFin ? this.dateUtil.toUTCEndOfDay(new Date(form.fechaFin)) : undefined,
    };
    const bodyAutoservicio: ReporteGeneralRangoRequest = {
      fechaInicio: form.fechaInicio ? this.fechaLocal(new Date(form.fechaInicio), false) : undefined,
      fechaFin: form.fechaFin ? this.fechaLocal(new Date(form.fechaFin), true) : undefined,
    };

    this.loading = true;
    forkJoin({
      rgCredito: this.reporteApi.getReporte('rg-credito', body),
      rgFactura: this.reporteApi.getReporte('rg-factura', body),
      rgNoFactura: this.reporteApi.getReporte('rg-nofactura', body),
      rgNoFacturaAutoservicio: this.reporteApi.getReporte('rg-nofactura-autoservicio', bodyAutoservicio)
        .pipe(catchError(() => of(null))),
      rpTCredito: this.reporteApi.getReporte('rp-tcredito', body),
      rpTDebito: this.reporteApi.getReporte('rp-tdebito', body),
    }).subscribe({
      next: (res) => {
        this.reportes['rg-credito'] = res.rgCredito;
        this.reportes['rg-factura'] = res.rgFactura;
        this.reportes['rg-nofactura'] = res.rgNoFactura;
        this.errorNoFacturaAutoservicio = res.rgNoFacturaAutoservicio === null;
        this.reporteNoFacturaAutoservicio = res.rgNoFacturaAutoservicio;
        this.reportes['rp-tcredito'] = res.rpTCredito;
        this.reportes['rp-tdebito'] = res.rpTDebito;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  limpiar(): void {
    const today = new Date();
    this.filtro.reset({
      fechaInicio: this.getPrimerDiaMesActual(),
      fechaFin: today,
    });
    this.buscar();
  }

  onTabChange(value: string | number): void {
    const found = this.tabs.find((tab) => tab.value === value);
    if (found) {
      this.activeTab = found.value;
    }
  }

  getColumnas(tab: ReporteGeneralTipo): string[] {
    const columnas = [...(this.reportes[tab]?.columnas ?? [])];
    if (tab === 'rp-tcredito' || tab === 'rp-tdebito') {
      const definidas = this.columnasTarjeta.filter((columna) =>
        !columnas.some((actual) => this.normalizarColumna(actual) === this.normalizarColumna(columna)),
      );
      return [...columnas, ...definidas].filter((columna) =>
        !['rp-tcredito', 'rp-tdebito'].includes(tab) || !['desliq', 'desc_liq', 'desc_hielo', 'des_hielo', 'desc_h5kg', 'exp'].includes(this.normalizarColumna(columna)),
      );
    }
    return columnas;
  }

  getFilas(tab: ReporteGeneralTipo): ReporteGeneralCorridasFilaResponse[] {
    return this.reportes[tab]?.filas ?? [];
  }

  getFilasNoFacturaAutoservicio(): ReporteGeneralCorridasFilaResponse[] {
    return this.reporteNoFacturaAutoservicio?.filas ?? [];
  }

  getValorTotalNoFacturaAutoservicio(columna: string): number {
    const clave = columna === 'desc_h5kg' ? 'desc_hielo' : columna;
    return this.reporteNoFacturaAutoservicio?.totalesPorColumna?.[clave] ?? 0;
  }

  getValorColumnaNoFacturaAutoservicio(row: ReporteGeneralCorridasFilaResponse, columna: string): number {
    const clave = columna === 'desc_h5kg' ? 'desc_hielo' : columna;
    return this.getValorColumna(row, clave);
  }

  getGranTotalNoFacturaAutoservicio(): number {
    return this.reporteNoFacturaAutoservicio?.granTotal ?? 0;
  }

  getValorColumna(row: ReporteGeneralCorridasFilaResponse, columna: string): number {
    const value = row.columnas?.[columna];
    if (value !== undefined) return value;
    const key = Object.keys(row.columnas ?? {}).find(
      (actual) => this.normalizarColumna(actual) === this.normalizarColumna(columna),
    );
    return key ? row.columnas?.[key] ?? 0 : 0;
  }

  getTotalColumna(tab: ReporteGeneralTipo, columna: string): number {
    if (tab === 'rp-tcredito' || tab === 'rp-tdebito') {
      return this.getFilas(tab).reduce((total, row) => total + this.getValorColumna(row, columna), 0);
    }
    return this.reportes[tab]?.totalesPorColumna?.[columna] ?? 0;
  }

  getGranTotal(tab: ReporteGeneralTipo): number {
    return this.reportes[tab]?.granTotal ?? 0;
  }

  getSeccionesCredito(tab: ReporteGeneralTipo = 'rg-credito'): ReporteGeneralSeccion[] {
    const configuracion: ReporteGeneralSeccion[] = tab === 'rg-nofactura'
      ? this.seccionesNoFactura
      : this.seccionesCredito;
    const columnas = this.getColumnas(tab);
    return configuracion.map((seccion) => ({
      ...seccion,
      columnas: seccion.columnas
        .map((esperada) => columnas.find((actual) => this.normalizarColumna(actual) === esperada)
          ?? (tab === 'rg-nofactura' ? esperada : undefined))
        .filter((columna): columna is string => !!columna),
    }));
  }

  getEtiquetaColumna(seccion: ReporteGeneralSeccion, columna: string): string {
    return seccion.etiquetas?.[columna] ?? columna;
  }

  getTooltipColumnaReporte(
    tab: ReporteGeneralTipo,
    seccion: ReporteGeneralSeccion,
    columna: string,
  ): string | null {
    if (tab !== 'rg-credito' && tab !== 'rg-factura' && tab !== 'rg-nofactura') return null;

    const tooltipComun = {
      empleado: 'Nombre del empleado',
      total: 'Total por empleados',
    }[columna];
    if (tooltipComun) return tooltipComun;

    const tooltipsCredito: Record<string, Record<string, string>> = {
      [this.seccionesCredito[0].label]: {
        e20: 'Ruta: RP y RC; Concepto de venta: PG; Producto: Envase 20 LTS; Forma de pago: Crédito; Factura: Sí',
        pg: 'Ruta: RP y RC; Concepto de venta: PG; Producto: Líquido 20 Lts; Forma de pago: Crédito; Factura: Sí',
        exp: 'Ruta: RP y RC; Concepto de venta: EXP; Producto: Líquido 20 Lts; Forma de pago: Crédito; Factura: Sí',
      },
      [this.seccionesCredito[1].label]: {
        h5kg: 'Ruta: RH; Concepto de venta: PG; Producto: Hielo 5KG; Forma de pago: Crédito; Factura: Sí',
        h3kg: 'Ruta: RH; Concepto de venta: PG; Producto: Hielo 3KG; Forma de pago: Crédito; Factura: Sí',
      },
      [this.seccionesCredito[2].label]: {
        c350: 'Ruta: RB; Concepto de venta: PG; Producto: Caja Botellitas 355 ml; Forma de pago: Crédito; Factura: Sí',
        c500: 'Ruta: RB; Concepto de venta: PG; Producto: Caja Botellitas 500 ml; Forma de pago: Crédito; Factura: Sí',
        c1000: 'Ruta: RB; Concepto de venta: PG; Producto: Caja Botellitas 1l; Forma de pago: Crédito; Factura: Sí',
        c1500: 'Ruta: RB; Concepto de venta: PG; Producto: Caja Botellitas 1500 ml; Forma de pago: Crédito; Factura: Sí',
      },
      [this.seccionesCredito[3].label]: {
        agua_purif: 'Ruta: P1 y P2; Concepto de venta: PG; Producto: Agua Purificada Granel; Forma de pago: Crédito; Factura: Sí',
        agua_pot: 'Ruta: P4; Concepto de venta: PG; Producto: Agua POT Granel; Forma de pago: Crédito; Factura: Sí',
        agua_dm: 'Ruta: PD; Concepto de venta: PG; Producto: Agua DM Granel; Forma de pago: Crédito; Factura: Sí',
      },
    };
    const tooltipsFactura: Record<string, Record<string, string>> = {
      [this.seccionesCredito[0].label]: {
        e20: 'Ruta: RP y RC; Concepto de venta: PG; Producto: Envase 20 l; Forma de pago: Efectivo; Factura: Sí',
        pg: 'Ruta: RP y RC; Concepto de venta: PG; Producto: Líquido 20 l; Forma de pago: Efectivo; Factura: Sí',
        exp: 'Ruta: RP y RC; Concepto de venta: EXP; Producto: Líquido 20 l; Forma de pago: Efectivo; Factura: Sí',
      },
      [this.seccionesCredito[1].label]: {
        h5kg: 'Ruta: RH; Concepto de venta: PG; Producto: Hielo 5KG; Forma de pago: Efectivo; Factura: Sí',
        h3kg: 'Ruta: RH; Concepto de venta: PG; Producto: Hielo 3KG; Forma de pago: Efectivo; Factura: Sí',
      },
      [this.seccionesCredito[2].label]: {
        c350: 'Ruta: RB; Concepto de venta: PG; Producto: Caja Botellitas 355 ml; Forma de pago: Efectivo; Factura: Sí',
        c500: 'Ruta: RB; Concepto de venta: PG; Producto: Caja Botellitas 500 ml; Forma de pago: Efectivo; Factura: Sí',
        c1000: 'Ruta: RB; Concepto de venta: PG; Producto: Caja Botellitas 1l; Forma de pago: Efectivo; Factura: Sí',
        c1500: 'Ruta: RB; Concepto de venta: PG; Producto: Caja Botellitas 1500 ml; Forma de pago: Efectivo; Factura: Sí',
      },
      [this.seccionesCredito[3].label]: {
        agua_purif: 'Ruta: P1 y P2; Concepto de venta: PG; Producto: Agua Purificada Granel; Forma de pago: Efectivo; Factura: Sí',
        agua_pot: 'Ruta: P4; Concepto de venta: PG; Producto: Agua POT Granel; Forma de pago: Efectivo; Factura: Sí',
        agua_dm: 'Ruta: PD; Concepto de venta: PG; Producto: Agua DM Granel; Forma de pago: Efectivo; Factura: Sí',
      },
    };
    const tooltipsNoFactura: Record<string, Record<string, string>> = {
      [this.seccionesNoFactura[0].label]: {
        des_liq20: 'Ruta: RP y RC; Concepto de venta: PG y EXP; Producto: Líquido 20 L; Forma de pago: Vale código; Factura: No',
        desc_liq: 'Ruta: RP y RC; Concepto de venta: PG y EXP; Producto: Líquido 20 L; Forma de pago: Vale código; Factura: No',
        pg: 'Ruta: RP y RC; Concepto de venta: PG; Producto: Líquido 20 L; Forma de pago: Efectivo; Factura: No',
        bpsc: 'Ruta: RP y RC; Concepto de venta: BPSC; Producto: Líquido 20 L; Forma de pago: Efectivo; Factura: No',
        exp: 'Ruta: RP y RC; Concepto de venta: EXP; Producto: Líquido 20 L; Forma de pago: Efectivo; Factura: No',
      },
      [this.seccionesNoFactura[1].label]: {
        h5kg: 'Ruta: RH; Concepto de venta: PG; Producto: Hielo 5Kg; Forma de pago: Efectivo; Factura: No',
        h3kg: 'Ruta: RH; Concepto de venta: PG; Producto: Hielo 3Kg; Forma de pago: Efectivo; Factura: No',
        desc_h5kg: 'Ruta: RH; Concepto de venta: PG; Producto: Hielo 5Kg; Forma de pago: Vale código; Factura: No',
      },
    };
    const tooltipsPorSeccion = tab === 'rg-factura'
      ? tooltipsFactura
      : tab === 'rg-nofactura' ? tooltipsNoFactura : tooltipsCredito;
    return tooltipsPorSeccion[seccion.label]?.[columna] ?? null;
  }

  getTooltipColumnaTarjeta(tab: ReporteGeneralTipo, columna: string): string | null {
    if (tab !== 'rp-tcredito' && tab !== 'rp-tdebito') return null;
    if (columna === 'empleado') return 'Nombre del empleado';
    if (columna === 'total') return 'Total por empleados';

    const productoPorColumna: Record<string, string> = {
      e20: 'Envase 20 L',
      pg: 'Líquido 20 L',
      bpsc: 'Líquido 20 L',
      agua_purif: 'Agua Purificada Granel',
      agua_pot: 'Agua Potable',
      agua_dm: 'Agua DM',
      h5kg: 'Hielo 5KG',
      h3kg: 'Hielo 3KG',
      c350: 'Botellita 355 ml',
      c500: 'Botellita 500 ml',
      c1000: 'Botellita 1l',
      c1500: 'Botellita 1500',
      env11: 'Envase 11 l',
      liq11: 'Líquido 11 l',
      env10: 'Líquido 10 l',
      liq10: 'Líquido 10 l',
    };
    const producto = productoPorColumna[columna];
    if (!producto) return null;

    const concepto = columna === 'bpsc' ? 'BPSC' : 'PG';
    const formaPago = tab === 'rp-tcredito' ? 'Tarjeta crédito' : 'Efectivo';
    return `Ruta: Autoservicio; Concepto de venta: ${concepto}; Producto: ${producto}; Forma de pago: ${formaPago}; Factura: Sí`;
  }

  getTooltipNoFacturaAutoservicio(columna: string): string | null {
    if (columna === 'empleado') return 'Nombre del empleado';
    if (columna === 'total') return 'Total por empleados';

    const descripcionesPorColumna: Record<string, string> = {
      desq_liq: 'Ruta: Autoservicio; Concepto de venta: PG; Producto: Líquido 20 l; Forma de pago: Vale Código; Factura: No',
      des_liq20: 'Ruta: Autoservicio; Concepto de venta: PG; Producto: Líquido 20 l; Forma de pago: Vale Código; Factura: No',
      desc_liq: 'Ruta: Autoservicio; Concepto de venta: PG; Producto: Líquido 20 l; Forma de pago: Vale Código; Factura: No',
      pg: 'Ruta: Autoservicio; Concepto de venta: PG; Producto: Líquido 20 l; Forma de pago: Efectivo; Factura: No',
      bpsc: 'Ruta: Autoservicio; Concepto de venta: BPSC; Producto: Líquido 20 l; Forma de pago: Efectivo; Factura: No',
      agua_purif: 'Ruta: Autoservicio; Concepto de venta: PG; Producto: Agua Purificada Granel; Forma de pago: Efectivo; Factura: No',
      agua_pot: 'Ruta: Autoservicio; Concepto de venta: PG; Producto: Agua Potable; Forma de pago: Efectivo; Factura: No',
      agua_dm: 'Ruta: Autoservicio; Concepto de venta: PG; Producto: Agua DM; Forma de pago: Efectivo; Factura: No',
      h5kg: 'Ruta: Autoservicio; Concepto de venta: PG; Producto: Hielo 5 kg; Forma de pago: Efectivo; Factura: No',
      h3kg: 'Ruta: Autoservicio; Concepto de venta: PG; Producto: Hielo 3kg; Forma de pago: Efectivo; Factura: No',
      liq11: 'Ruta: Autoservicio; Concepto de venta: PG; Producto: Líquido 11 l; Forma de pago: Efectivo; Factura: No',
      liq10: 'Ruta: Autoservicio; Concepto de venta: PG; Producto: Líquido 10 l; Forma de pago: Efectivo; Factura: No',
      e11: 'Ruta: Autoservicio; Concepto de venta: PG; Producto: Envase 11 l; Forma de pago: Efectivo; Factura: No',
      env11: 'Ruta: Autoservicio; Concepto de venta: PG; Producto: Envase 11 l; Forma de pago: Efectivo; Factura: No',
    };
    return descripcionesPorColumna[columna] ?? null;
  }

  getEtiquetaColumnaReporte(tab: ReporteGeneralTipo, columna: string): string {
    if (tab !== 'rp-tcredito' && tab !== 'rp-tdebito') return columna;
    if (['rp-tcredito', 'rp-tdebito'].includes(tab) && this.normalizarColumna(columna) === 'env10') return 'liq10';
    return {
      desliq: 'Líquido 20 lts Vale código',
      desc_hielo: 'Hielo 5kg Vale código',
      des_hielo: 'Hielo 5kg Vale código',
      bpsc: 'BPSC',
    }[this.normalizarColumna(columna)] ?? columna;
  }

  getTotalSeccionCredito(seccion: ReporteGeneralSeccion, tab: ReporteGeneralTipo = 'rg-credito'): number {
    return this.getFilasSeccionCredito(seccion, tab).reduce(
      (total, row) => total + this.getTotalFilaSeccionCredito(row, seccion),
      0,
    );
  }

  getFilasSeccionCredito(
    seccion: ReporteGeneralSeccion,
    tab: ReporteGeneralTipo = 'rg-credito',
  ): ReporteGeneralCorridasFilaResponse[] {
    return this.getFilas(tab).filter((row) => this.getTotalFilaSeccionCredito(row, seccion) !== 0);
  }

  getTotalColumnaCredito(columna: string, tab: ReporteGeneralTipo = 'rg-credito'): number {
    return this.getFilas(tab).reduce((total, row) => total + this.getValorColumna(row, columna), 0);
  }

  getTotalFilaSeccionCredito(
    row: ReporteGeneralCorridasFilaResponse,
    seccion: ReporteGeneralSeccion,
  ): number {
    return seccion.columnas.reduce((total, columna) => total + Number(row.columnas?.[columna] ?? 0), 0);
  }

  private normalizarColumna(columna: string): string {
    return columna.trim().toLowerCase().replace(/\s+/g, '');
  }

  formatCurrency(value: number | null | undefined): string {
    return this.currencyFormat.format(value ?? 0);
  }

  private getUsuarioExporta(): string {
    const userInfo = this.localStorage.getUserInfo();
    return [userInfo?.nombre, userInfo?.apellidoPaterno]
      .filter(Boolean)
      .join(' ')
      .trim() || 'No disponible';
  }

  private getPrimerDiaMesActual(): Date {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  }

  private fechaLocal(date: Date, fin: boolean): string {
    date.setHours(fin ? 23 : 0, fin ? 59 : 0, fin ? 59 : 0, 0);
    return this.dateUtil.toLocalISOString(date).slice(0, 19);
  }
}
