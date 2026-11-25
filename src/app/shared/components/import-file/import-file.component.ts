// import-file.component.ts
import {
  Component,
  EventEmitter,
  inject,
  input,
  InputSignal,
  Output,
} from '@angular/core';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { MenuItem, MessageService } from 'primeng/api';
import { StepsModule } from 'primeng/steps';
import ExcelJS from 'exceljs';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { CommonModule } from '@angular/common';

interface ColumnaExcel {
  label: string;
  /** Número de columna en el Excel: distingue encabezados repetidos. */
  value: number;
}

interface FilaExcel {
  numero: number;
  celdas: Record<number, any>;
}

/** Campo del sistema y la columna del Excel con la que se relaciona (null = no importar). */
interface CampoRelacionado {
  property: any;
  columna: number | null;
  /** Columna que se relacionó sola al cargar el archivo (para mostrar «Detectada»). */
  columnaAuto?: number | null;
}

type EstadoCampo = 'detectada' | 'relacionada' | 'falta' | 'sin';

type FiltroRegistros = 'listas' | 'existen' | 'errores';

/** Máximo de filas que se pintan en la tabla (el Excel de errores las incluye todas). */
const LIMITE_TABLA = 500;

interface Registro {
  numero: number;
  resumen: string;
  objeto: any;
  /** Motivos por los que no se importa (incluye el de «ya existe»). */
  errores: string[];
  /** Ya está en el sistema: no se importa, pero no cuenta como error. */
  existe: boolean;
  /** Valores que no existen en su catálogo y se crearán al importar. */
  porCrear: { property: any; label: string }[];
}

/** Celda de Excel con error (#N/A, #REF!, ...). */
class ErrorDeCelda {
  constructor(readonly texto: string) {}
  toString() {
    return this.texto;
  }
}

@Component({
  selector: 'app-import-file',
  standalone: true,
  imports: [AppPrimengModule, StepsModule, FormsModule, CommonModule],
  templateUrl: './import-file.component.html',
  styleUrl: './import-file.component.scss',
})
export class ImportFileComponent {
  @Output() imported = new EventEmitter<void>();
  display = false;
  configuration: InputSignal<any> = input({});
  service: any = input.required();
  services: InputSignal<Record<string, any>> = input({});
  messageService = inject(MessageService);

  readonly items: MenuItem[] = [
    { label: 'Cargar archivo' },
    { label: 'Relacionar campos' },
    { label: 'Verificar registros' },
    { label: 'Importar' },
  ];
  active = 0;
  isUpdate = false;

  // Paso 1
  selectedFileName = '';
  leyendo = false;
  errorArchivo = '';
  columnas: ColumnaExcel[] = [];
  filas: FilaExcel[] = [];
  private encabezados = new Map<number, string>();
  private lectura = 0;

  // Paso 2
  campos: CampoRelacionado[] = [];

  // Pasos 3 y 4
  registros: Registro[] = [];
  validos: Registro[] = [];
  conErrores: Registro[] = [];
  yaExisten: Registro[] = [];
  filtro: FiltroRegistros | null = null;
  /** Registros de la tabla según el filtro, y los que de ellos se pintan. */
  totalTabla = 0;
  filasTabla: Registro[] = [];
  catalogosPorCrear: { campo: string; valores: string[] }[] = [];
  verificando = false;
  importando = false;
  importados = 0;
  progress: { current: number; total: number } = { current: 0, total: 0 };

  get ocupado(): boolean {
    return this.verificando || this.importando;
  }

  get porcentaje(): number {
    return this.progress.total ? Math.round((this.progress.current / this.progress.total) * 100) : 0;
  }

  get obligatoriosSinRelacionar(): CampoRelacionado[] {
    return this.campos.filter((c) => c.property.required && c.columna == null);
  }

  get opcionalesSinRelacionar(): CampoRelacionado[] {
    return this.campos.filter((c) => !c.property.required && c.columna == null);
  }

  get columnasSinUsar(): ColumnaExcel[] {
    return this.columnas.filter((col) => !this.campos.some((c) => c.columna === col.value));
  }

  get columnasRepetidas(): ColumnaExcel[] {
    return this.columnas.filter((col) => this.campos.filter((c) => c.columna === col.value).length > 1);
  }

  get puedeVerificar(): boolean {
    return !this.obligatoriosSinRelacionar.length && this.campos.some((c) => c.columna != null);
  }

  handleHide() {
    this.display = false;
    this.isUpdate = false;
    this.reiniciar();
  }

  reiniciar() {
    if (this.ocupado) return;
    this.active = 0;
    this.limpiarArchivo();
  }

  private limpiarArchivo() {
    this.lectura++;
    this.leyendo = false;
    this.selectedFileName = '';
    this.errorArchivo = '';
    this.columnas = [];
    this.filas = [];
    this.campos = [];
    this.limpiarVerificacion();
  }

  private limpiarVerificacion() {
    this.registros = [];
    this.validos = [];
    this.conErrores = [];
    this.yaExisten = [];
    this.filtro = null;
    this.totalTabla = 0;
    this.filasTabla = [];
    this.catalogosPorCrear = [];
    this.importados = 0;
    this.progress = { current: 0, total: 0 };
  }

  // ---------- Paso 1: cargar archivo ----------

  async onUpload(event: Event) {
    const inputFile = event.target as HTMLInputElement;
    const file = inputFile.files?.[0];
    if (!file) return;

    this.limpiarArchivo();
    const lectura = this.lectura;
    this.selectedFileName = file.name;
    this.leyendo = true;

    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(await file.arrayBuffer());
      // Se cerró el diálogo o se eligió otro archivo mientras se leía este.
      if (lectura !== this.lectura) return;
      const worksheet = workbook.worksheets[0];
      if (!worksheet) {
        this.errorArchivo = 'El archivo no tiene hojas.';
      } else {
        this.leerHoja(worksheet);
        if (!this.columnas.length) {
          this.errorArchivo = 'No se detectaron columnas. La primera fila debe tener los encabezados.';
        } else if (!this.filas.length) {
          this.errorArchivo = 'El archivo no tiene filas con datos debajo de los encabezados.';
        }
        this.relacionarAutomaticamente();
      }
    } catch {
      if (lectura === this.lectura) {
        this.errorArchivo = 'No se pudo leer el archivo. Verifica que sea un Excel .xlsx válido.';
      }
    } finally {
      if (lectura === this.lectura) this.leyendo = false;
      // Permite volver a cargar el MISMO archivo y que sí dispare change
      inputFile.value = '';
    }
  }

  private leerHoja(worksheet: ExcelJS.Worksheet) {
    const encabezados = new Map<number, string>();
    worksheet.getRow(1).eachCell((cell, colNumber) => {
      const texto = this.texto(this.valorDeCelda(cell.value));
      if (texto) encabezados.set(colNumber, texto);
    });

    const conDatos = new Set<number>();
    const filas: FilaExcel[] = [];
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const celdas: Record<number, any> = {};
      row.eachCell((cell, colNumber) => {
        const valor = this.valorDeCelda(cell.value);
        if (this.vacio(valor)) return;
        celdas[colNumber] = valor;
        conDatos.add(colNumber);
      });
      // Las filas sin ningún dato no se importan ni cuentan como error.
      if (Object.keys(celdas).length) filas.push({ numero: rowNumber, celdas });
    });

    const numeros = [...new Set([...encabezados.keys(), ...conDatos])].sort((a, b) => a - b);
    const veces = new Map<string, number>();
    for (const titulo of encabezados.values()) veces.set(titulo, (veces.get(titulo) ?? 0) + 1);
    this.columnas = numeros.map((numero) => {
      const letra = worksheet.getColumn(numero).letter;
      const titulo = encabezados.get(numero);
      if (!titulo) return { label: `Columna ${letra} (sin título)`, value: numero };
      return { label: (veces.get(titulo) ?? 0) > 1 ? `${titulo} (columna ${letra})` : titulo, value: numero };
    });
    this.encabezados = encabezados;
    this.filas = filas;
  }

  /** Valor simple de una celda: resuelve fórmulas, hipervínculos y texto con formato. */
  private valorDeCelda(valor: any): any {
    if (typeof valor === 'string') return valor.trim();
    if (valor === null || valor === undefined || typeof valor !== 'object' || valor instanceof Date) return valor;
    if ('richText' in valor) return valor.richText.map((t: any) => t.text).join('').trim();
    if ('error' in valor) return new ErrorDeCelda(String(valor.error));
    if ('formula' in valor || 'sharedFormula' in valor) return this.valorDeCelda(valor.result);
    if ('text' in valor) return this.valorDeCelda(valor.text);
    return undefined;
  }

  // ---------- Paso 2: relacionar campos ----------

  esVisible(item: any): boolean {
    return !!(
      (item.id && (this.isUpdate || item.serviceName)) ||
      (!item.id && !item.update) ||
      (this.isUpdate && item.update)
    );
  }

  private relacionarAutomaticamente() {
    const properties: any[] = (this.configuration().properties ?? []).filter((p: any) => this.esVisible(p));
    this.campos = properties.map((property) => ({ property, columna: null }));
    const usadas = new Set<number>();

    // Primero la columna configurada, luego la etiqueta, el nombre interno y al final los alias.
    const candidatos = (property: any, paso: number): string[] => {
      if (paso === 0) return typeof property.column === 'string' ? [property.column] : property.column?.value ? [property.column.value] : [];
      if (paso === 1) return [property.label];
      if (paso === 2) return [property.nameProperty];
      return Array.isArray(property.aliases) ? property.aliases : [];
    };
    for (let paso = 0; paso < 4; paso++) {
      for (const campo of this.campos) {
        if (campo.columna != null) continue;
        for (const candidato of candidatos(campo.property, paso)) {
          const buscado = typeof candidato === 'string' ? this.normalizar(candidato) : '';
          if (!buscado) continue;
          const encontrado = [...this.encabezados].find(([numero, titulo]) => !usadas.has(numero) && this.normalizar(titulo) === buscado);
          if (encontrado) {
            campo.columna = encontrado[0];
            usadas.add(encontrado[0]);
            break;
          }
        }
      }
    }
    for (const campo of this.campos) campo.columnaAuto = campo.columna;
  }

  estadoCampo(campo: CampoRelacionado): EstadoCampo {
    if (campo.columna == null) return campo.property.required ? 'falta' : 'sin';
    return campo.columna === campo.columnaAuto ? 'detectada' : 'relacionada';
  }

  readonly textoEstado: Record<EstadoCampo, string> = {
    detectada: 'Detectada',
    relacionada: 'Relacionada',
    falta: 'Falta relacionar',
    sin: 'Sin columna',
  };

  /** Primer valor con dato de la columna, para reconocerla al relacionarla. */
  ejemplo(columna: number | null): string {
    if (columna == null) return '';
    const fila = this.filas.find((f) => !this.vacio(f.celdas[columna]));
    return fila ? this.texto(fila.celdas[columna]) : '';
  }

  etiquetas(campos: CampoRelacionado[]): string {
    return campos.map((c) => c.property.label).join(', ');
  }

  etiquetasColumnas(columnas: ColumnaExcel[]): string {
    return columnas.map((c) => c.label).join(', ');
  }

  // ---------- Paso 3: verificar registros ----------

  async next() {
    if (this.ocupado) return;
    if (this.active === 0) {
      if (!this.leyendo && !this.errorArchivo && this.filas.length) this.active = 1;
    } else if (this.active === 1) {
      if (!this.puedeVerificar) return;
      this.active = 2;
      await this.verificar();
    } else if (this.active === 2) {
      if (!this.validos.length) return;
      this.active = 3;
      await this.importarRegistros();
    }
  }

  anterior() {
    if (this.ocupado || this.active === 0 || this.active === 3) return;
    this.active--;
    this.limpiarVerificacion();
  }

  private async verificar() {
    this.limpiarVerificacion();
    this.verificando = true;
    try {
      this.registros = this.filas.map((fila) => this.construirRegistro(fila));
      this.progress = { current: 0, total: this.registros.length };

      const vistos = new Map<string, number>();
      for (const registro of this.registros) {
        if (!registro.errores.length) {
          const unicos = this.unicosConValor(registro.objeto);
          const clave = JSON.stringify(unicos.map((u) => [u.property.nameProperty, u.valor]));
          const primera = unicos.length ? vistos.get(clave) : undefined;
          if (primera !== undefined) {
            registro.errores.push(
              `Repetido en el archivo: mismo ${this.etiquetasUnicos(unicos)} que la fila ${primera}.`
            );
          } else {
            const error = await this.errorSiExiste(registro);
            if (error) registro.errores.push(error);
            else if (unicos.length) vistos.set(clave, registro.numero);
          }
        }
        this.progress.current++;
      }

      this.validos = this.registros.filter((r) => !r.errores.length);
      this.separarNoImportables();
      this.mostrarEnTabla([...this.conErrores, ...this.yaExisten, ...this.validos]);
      this.resumirCatalogos();
    } finally {
      this.verificando = false;
    }
  }

  private separarNoImportables() {
    this.yaExisten = this.registros.filter((r) => r.existe);
    this.conErrores = this.registros.filter((r) => r.errores.length && !r.existe);
  }

  private mostrarEnTabla(registros: Registro[]) {
    this.totalTabla = registros.length;
    this.filasTabla = registros.slice(0, LIMITE_TABLA);
  }

  /** Filtra la tabla de verificación; el mismo filtro otra vez lo quita. */
  alternarFiltro(filtro: FiltroRegistros) {
    this.filtro = this.filtro === filtro ? null : filtro;
    const grupos: Record<FiltroRegistros, Registro[]> = {
      listas: this.validos,
      existen: this.yaExisten,
      errores: this.conErrores,
    };
    this.mostrarEnTabla(
      this.filtro ? grupos[this.filtro] : [...this.conErrores, ...this.yaExisten, ...this.validos]
    );
  }

  private construirRegistro(fila: FilaExcel): Registro {
    const registro: Registro = {
      numero: fila.numero,
      resumen: '',
      objeto: {},
      errores: [],
      existe: false,
      porCrear: [],
    };

    for (const { property, columna } of this.campos) {
      const crudo = columna == null ? undefined : fila.celdas[columna];
      let valor: any = crudo;

      if (crudo instanceof ErrorDeCelda) {
        registro.errores.push(`${property.label}: la celda tiene el error de Excel ${crudo.texto}.`);
        valor = undefined;
      } else if (this.vacio(crudo)) {
        valor = undefined;
        if (property.required) registro.errores.push(`El campo ${property.label} es requerido.`);
      } else {
        if (!registro.resumen) registro.resumen = this.texto(crudo);
        valor = this.convertir(property, crudo, registro);
      }

      this.asignar(registro.objeto, property, valor);
    }
    return registro;
  }

  /** Convierte el valor al tipo del campo; si no se puede, agrega el motivo al registro. */
  private convertir(property: any, crudo: any, registro: Registro): any {
    const texto = this.texto(crudo);
    const invalido = (motivo: string) => {
      registro.errores.push(`${property.label}: ${motivo}`);
      return undefined;
    };

    switch (property.type) {
      case 'text':
        return texto;

      case 'number': {
        const numero = this.aNumero(crudo);
        return numero === null ? invalido(`«${texto}» no es un número válido.`) : numero;
      }

      case 'date': {
        const fecha = this.aFecha(crudo);
        return fecha ?? invalido(`«${texto}» no es una fecha válida (usa dd/mm/aaaa).`);
      }

      case 'enum': {
        if (!property.enumValues?.length) return crudo;
        const opcion = property.enumValues.find(
          (v: any) => this.normalizar(String(v)) === this.normalizar(texto)
        );
        return (
          opcion ?? invalido(`«${texto}» no es una opción válida. Opciones: ${property.enumValues.join(', ')}.`)
        );
      }

      case 'catalog': {
        if (!property.catalogValues) return crudo;
        const buscado = this.normalizarValor(texto);
        const opcion = property.catalogValues.find(
          (o: any) => this.normalizarValor(String(o.label ?? '')) === buscado
        );
        if (opcion) return opcion.value;
        if (property.service && property.createField) {
          registro.porCrear.push({ property, label: texto });
          return undefined;
        }
        return invalido(
          property.catalogValues.length
            ? `«${texto}» no existe en el catálogo.`
            : `«${texto}» no se encontró; el catálogo está vacío o aún no termina de cargar.`
        );
      }

      default:
        return crudo;
    }
  }

  private aNumero(valor: any): number | null {
    if (typeof valor === 'number') return Number.isFinite(valor) ? valor : null;
    if (typeof valor !== 'string') return null;
    let texto = valor.replace(/[$\s]/g, '');
    // Solo se quitan comas cuando son separadores de miles (1,234.50).
    if (/^-?\d{1,3}(,\d{3})+(\.\d+)?$/.test(texto)) texto = texto.replace(/,/g, '');
    return /^-?(\d+\.?\d*|\.\d+)$/.test(texto) ? Number(texto) : null;
  }

  private aFecha(valor: any): Date | null {
    if (valor instanceof Date) return Number.isNaN(valor.getTime()) ? null : valor;
    if (typeof valor === 'number') {
      // Número de serie de Excel (celda de fecha sin formato de fecha).
      return valor >= 1 && valor < 2958466 ? new Date(Math.round((valor - 25569) * 86_400_000)) : null;
    }
    if (typeof valor !== 'string') return null;

    const dma = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(valor);
    if (dma) return this.fechaUtc(+dma[3], +dma[2], +dma[1]);
    const iso = /^(\d{4})-(\d{2})-(\d{2})(T.*)?$/.exec(valor);
    if (!iso) return null;
    const dia = this.fechaUtc(+iso[1], +iso[2], +iso[3]);
    if (!dia || !iso[4]) return dia;
    const conHora = new Date(valor);
    return Number.isNaN(conHora.getTime()) ? null : conHora;
  }

  /** Medianoche UTC, igual que las fechas que entrega ExcelJS; null si el día no existe. */
  private fechaUtc(anio: number, mes: number, dia: number): Date | null {
    const fecha = new Date(Date.UTC(anio, mes - 1, dia));
    return fecha.getUTCFullYear() === anio && fecha.getUTCMonth() === mes - 1 && fecha.getUTCDate() === dia
      ? fecha
      : null;
  }

  private asignar(objeto: any, property: any, valor: any) {
    if (property.parentProperty) {
      objeto[property.parentProperty] ??= {};
      objeto[property.parentProperty][property.nameProperty] = valor;
    } else {
      objeto[property.nameProperty] = valor;
    }
  }

  private leer(objeto: any, property: any): any {
    return property.parentProperty
      ? objeto[property.parentProperty]?.[property.nameProperty]
      : objeto[property.nameProperty];
  }

  private unicosConValor(objeto: any): { property: any; valor: any }[] {
    return this.campos
      .filter((c) => c.property.unique)
      .map(({ property }) => ({ property, valor: this.leer(objeto, property) }))
      .filter((u) => !this.vacio(u.valor));
  }

  private etiquetasUnicos(unicos: { property: any }[]): string {
    return unicos.map((u) => u.property.label).join(', ');
  }

  private get servicio(): any {
    // Solo el servicio de la configuración: algunos módulos pasan en [service] uno que no corresponde
    // a lo que se importa (p. ej. compras con la configuración de almacenes).
    return this.configuration().service;
  }

  /** Solo se buscan duplicados por los campos únicos que traen valor. */
  private async errorSiExiste(registro: Registro): Promise<string | null> {
    const unicos = this.unicosConValor(registro.objeto);
    if (!unicos.length) return null;
    const params =
      '?' + unicos.map((u) => `${u.property.nameProperty}=${encodeURIComponent(u.valor)}`).join('&');
    try {
      const found: any = await firstValueFrom(this.servicio.getAllFilter(params));
      registro.existe = found?.length > 0;
      return registro.existe
        ? `Ya existe un registro con el mismo ${this.etiquetasUnicos(unicos)}.`
        : null;
    } catch (error: any) {
      return 'No se pudo revisar si ya existe: ' + this.mensajeDe(error);
    }
  }

  private resumirCatalogos() {
    const porCampo = new Map<any, Map<string, string>>();
    for (const registro of this.validos) {
      for (const { property, label } of registro.porCrear) {
        const valores = porCampo.get(property) ?? new Map<string, string>();
        if (!valores.has(this.normalizarValor(label))) valores.set(this.normalizarValor(label), label);
        porCampo.set(property, valores);
      }
    }
    this.catalogosPorCrear = [...porCampo].map(([property, valores]) => ({
      campo: property.label,
      valores: [...valores.values()],
    }));
  }

  // ---------- Paso 4: importar ----------

  /** Crea una sola vez cada valor de catálogo faltante y lo asigna a los registros que lo usan. */
  private async crearCatalogos(registros: Registro[]) {
    const grupos = new Map<any, Map<string, { label: string; registros: Registro[] }>>();
    for (const registro of registros) {
      for (const { property, label } of registro.porCrear) {
        const valores = grupos.get(property) ?? new Map<string, { label: string; registros: Registro[] }>();
        const grupo = valores.get(this.normalizarValor(label)) ?? { label, registros: [] };
        grupo.registros.push(registro);
        valores.set(this.normalizarValor(label), grupo);
        grupos.set(property, valores);
      }
    }

    for (const [property, valores] of grupos) {
      for (const grupo of valores.values()) {
        try {
          const result: any = await firstValueFrom(
            property.service.create({ [property.createField]: grupo.label })
          );
          const id = property.getId
            ? property.getId(result)
            : result?.[property.nameProperty] ?? result?.id;
          if (this.vacio(id)) throw new Error('el servidor no devolvió su identificador.');
          for (const registro of grupo.registros) this.asignar(registro.objeto, property, id);
          property.catalogValues?.push({ label: grupo.label, value: id });
        } catch (error: any) {
          const motivo = `${property.label}: no se pudo crear «${grupo.label}» en el catálogo: ${this.mensajeDe(error)}`;
          for (const registro of grupo.registros) registro.errores.push(motivo);
        }
      }
    }
  }

  private async importarRegistros() {
    const registros = this.validos;
    this.importados = 0;
    this.progress = { current: 0, total: registros.length };
    this.importando = true;

    try {
      await this.crearCatalogos(registros);

      for (const registro of registros) {
        if (!registro.errores.length) {
          // Se revisa otra vez: pudo crearse después de la verificación o por una fila anterior.
          const existe = await this.errorSiExiste(registro);
          if (existe) {
            registro.errores.push(existe);
          } else {
            try {
              await firstValueFrom(this.servicio.create(registro.objeto));
              this.importados++;
            } catch (error: any) {
              registro.errores.push('No se importó: ' + this.mensajeDe(error));
            }
          }
        }
        this.progress.current++;
      }
    } finally {
      this.separarNoImportables();
      this.filtro = null;
      this.mostrarEnTabla([...this.conErrores, ...this.yaExisten]);
      this.importando = false;
    }

    const existentes = this.yaExisten.length ? `, ${this.yaExisten.length} ya existían` : '';
    if (!this.conErrores.length) {
      this.messageService.add({
        severity: this.importados ? 'success' : 'info',
        summary: this.importados ? 'Importación completa' : 'No se importó ningún registro',
        detail: `${this.importados} registros importados${existentes}`,
      });
    } else {
      this.messageService.add({
        severity: this.importados ? 'warn' : 'error',
        summary: this.importados ? 'Importación parcial' : 'No se importó ningún registro',
        detail: `${this.importados} importados${existentes}, ${this.conErrores.length} con errores. Revisa el detalle por fila.`,
      });
    }
    this.imported.emit();
  }

  // ---------- Utilidades ----------

  private vacio(valor: any): boolean {
    return valor === undefined || valor === null || valor === '';
  }

  private texto(valor: any): string {
    if (this.vacio(valor)) return '';
    if (valor instanceof Date) {
      return Number.isNaN(valor.getTime()) ? '' : valor.toISOString().slice(0, 10).split('-').reverse().join('/');
    }
    return String(valor).trim();
  }

  /** Para comparar títulos: sin mayúsculas, acentos, espacios ni signos. */
  /** Para valores de catálogo: sin acentos ni mayúsculas ni espacios de más, pero conserva símbolos (m², %, etc.). */
  private normalizarValor(texto: string): string {
    return texto
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();
  }

  private normalizar(texto: string): string {
    return texto
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
  }

  /** Texto legible de un error HTTP o de validación. */
  private mensajeDe(error: any): string {
    const cuerpo = error?.error;
    if (typeof cuerpo === 'string' && cuerpo.trim() && !cuerpo.trim().startsWith('<')) {
      try {
        const json = JSON.parse(cuerpo);
        if (json?.message) return json.message;
      } catch {
        return cuerpo.trim();
      }
    }
    if (cuerpo?.message) return cuerpo.message;
    if (error?.status === 0) return 'no se pudo conectar con el servidor.';
    return error?.message ?? 'error desconocido.';
  }

  async export(list: any[]) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Datos');
    worksheet.columns = this.configuration().columns;
    for (const row of list) {
      const object: any = {};
      for (const column of this.configuration().columns) {
        object[column.key] = row[column.key];
      }
      worksheet.addRow(object);
    }
    await this.descargar(workbook, worksheet, this.configuration().titleDownload);
  }

  /** Excel con las filas con error tal como venían, más una columna con los motivos. */
  async descargarErrores() {
    const filas = new Map(this.filas.map((fila) => [fila.numero, fila]));
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Errores');
    worksheet.addRow([...this.columnas.map((c) => this.encabezados.get(c.value) ?? ''), 'Motivo']);
    for (const registro of this.conErrores) {
      const celdas = filas.get(registro.numero)?.celdas ?? {};
      worksheet.addRow([
        ...this.columnas.map((c) => {
          const valor = celdas[c.value];
          return valor instanceof ErrorDeCelda ? { error: valor.texto } : valor ?? null;
        }),
        registro.errores.join('; '),
      ]);
    }
    const titulo = this.configuration().titleDownload;
    await this.descargar(workbook, worksheet, titulo ? `${titulo}-errores` : 'importacion-errores');
  }

  private async descargar(workbook: ExcelJS.Workbook, worksheet: ExcelJS.Worksheet, nombre: string) {
    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF007ACC' },
      };
    });
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const enlace = document.createElement('a');
    enlace.href = URL.createObjectURL(blob);
    enlace.download = nombre + '.xlsx';
    enlace.click();
    URL.revokeObjectURL(enlace.href);
  }
}
