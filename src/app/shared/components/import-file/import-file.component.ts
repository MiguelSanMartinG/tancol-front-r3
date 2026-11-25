// import-file.component.ts
import {
  Component,
  computed,
  effect,
  EventEmitter,
  inject,
  Input,
  input,
  InputSignal,
  Output,
  signal,
  untracked,
} from '@angular/core';
import { AppPrimengModule } from '@shared/app-primeng/app-primeng.module';
import { MenuItem, MessageService } from 'primeng/api';
import { StepsModule } from 'primeng/steps';
import ExcelJS from 'exceljs';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { CommonModule } from '@angular/common';

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
  items: MenuItem[] | undefined = [
    { label: 'Cargar archivo' },
    { label: 'Mapear columnas' },
    { label: 'Verificar registros' },
    { label: 'Hecho' },
  ];
selectedFile: File | null = null;
selectedFileName: string = '';

  listaColumnasArchivo: { label: string; value: string }[] = [];

  configuration: InputSignal<any> = input({});

  totalCompleted = 0;
  active: number = 0;
  service: any = input.required();
  listRawData: any[] = [];
  listSelect: any[] = [];
  listData: any[] = [];
  isUpdate = false;
  erroresData: { fila: any; numero?: number; errores: string[] }[] = [];
  /** Número de fila del Excel de cada registro (para decir en qué fila falló). */
  private filas = new Map<any, number>();
  importados = 0;
  catalogOptions: Record<string, any[]> = {};
  services: InputSignal<Record<string, any>> = input({});
  progress: { current: number; total: number } = { current: 0, total: 0 };
  messageService = inject(MessageService);

  handleHide() {
    this.display = false;
    this.active = 0;
    this.totalCompleted = 0;
    this.isUpdate = false;
  }

async onUpload(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];

  if (!file) return;

  // Guarda referencia para UI/validación
  this.selectedFile = file;
  this.selectedFileName = file.name;

  const workbook = new ExcelJS.Workbook();
  const buffer = await file.arrayBuffer();
  await workbook.xlsx.load(buffer);
  const worksheet = workbook.worksheets[0];

  const headers: string[] = [];
  worksheet.getRow(1).eachCell((cell) => {
    headers.push(String(cell.value ?? '').trim());
  });

  // OJO: si tu configuration() es signal/computed, esto es medio "mutante".
  // Lo dejo como lo traes para no romperte nada.
  this.configuration().properties = this.configuration().properties.map((row: any) => {
    const find = headers.find(
      (data) => data.toLowerCase() === row.label.toLowerCase()
    );
    row.column = find ? { label: find, value: find } : 'n/a';
    return row;
  });

  this.listSelect = headers.map((row) => ({ label: row, value: row }));

  const rowsAsObjects: any[] = [];
  this.filas = new Map();
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      const rowData: any = {};
      row.eachCell((cell, colNumber) => {
        const rawValue = cell.value;

        const valor =
          typeof rawValue === 'object' &&
          rawValue !== null &&
          'text' in (rawValue as any)
            ? (rawValue as any).text
            : rawValue;
        rowData[headers[colNumber - 1]] = typeof valor === 'string' ? valor.trim() : valor;
      });

      // Las filas sin ningún dato no se importan ni cuentan como error.
      if (Object.values(rowData).every((v) => v === null || v === undefined || v === '')) return;
      this.filas.set(rowData, rowNumber);
      rowsAsObjects.push(rowData);
    }
  });

  this.listRawData = rowsAsObjects;

  // Permite volver a cargar el MISMO archivo y que sí dispare change
  input.value = '';
}

  async validate() {
    this.listData = [];
    this.erroresData = [];
    this.importados = 0;

    for (const row of this.listRawData) {
      const object: any = {};
      const errores: string[] = [];

      for (const property of this.configuration().properties) {
        if (
          (property.id && (this.isUpdate || property.serviceName)) ||
          (!property.id && !property.update) ||
          (this.isUpdate && property.update)
        ) {
          const columnKey =
            typeof property.column === 'object'
              ? property.column.value
              : property.column;
          let value = row[columnKey];

          if (property.type === 'date' && value) {
            const date = new Date(value);
            value = date;
          }

          if (property.type === 'catalog' && property.catalogValues) {
            const normalizedValue = (value ?? '')
              .toString()
              .trim()
              .toLowerCase();
            const match = property.catalogValues.find(
              (opt: any) => opt.label.toLowerCase().trim() === normalizedValue
            );

            if (match) {
              value = match.value;
            } else {
              object[`__fallback_${property.nameProperty}`] = value;
              value = normalizedValue;
            }
          }

          if (
            property.required &&
            (value === undefined || value === null || value === '')
          ) {
            errores.push(`El campo ${property.label} es requerido`);
          }

          if (property.parentProperty) {
  object[property.parentProperty] ??= {};
  object[property.parentProperty][property.nameProperty] = value;
} else {
  object[property.nameProperty] = value;
}
        }
      }

      this.filas.set(object, this.filas.get(row) ?? 0);
      if (errores.length) {
        this.erroresData.push({ fila: row, numero: this.filas.get(row), errores });
      } else {
        this.listData.push(object);
      }
    }
    // this.next();
  }

  // async next() {
  //   console.log(this.active);
  //   if (this.active === 1) this.validate();
  //   else if (this.active === 2) await this.createFallbackCatalogs();
  //   else if (this.active === 3) this.importarRegistros();
  //   this.active++;
  //   setTimeout(() => {
  //     if (this.active === 2) {
  //     this.next()
  //   }
  //   }, 1000);
  // }
async next() {
  if (this.active === 0) {
    this.active = 1;
  }else if (this.active === 1) {
    this.validate(); // valida y carga listData + errores
    this.active = 2; // mostrar pantalla "Organizando información"
    await this.createFallbackCatalogs(); // espera a crear los catálogos y sigue solo si es necesario
  } else if (this.active === 3) {
    await this.importarRegistros(); // importa registros con progreso
    this.active = 4; // mostrar mensaje final
  }
}

  async createFallbackCatalogs() {
  const grouped: Record<string, { property: any; label: string; rows: any[] }> = {};

  for (const row of this.listData) {
    for (const property of this.configuration().properties) {
      const key = `__fallback_${property.nameProperty}`;
      if (property.type === 'catalog' && row[key] && property.service) {
        const fallbackLabel = row[key];
        const compositeKey = `${property.nameProperty}::${fallbackLabel}`;

        if (!grouped[compositeKey]) {
          grouped[compositeKey] = {
            property,
            label: fallbackLabel,
            rows: [],
          };
        }
        grouped[compositeKey].rows.push(row);
      }
    }
  }

  // ✅ Si no hay catálogos por crear, continuar automáticamente
  if (Object.keys(grouped).length === 0) {
    //   this.active++; // ⬅️ Aumentar el paso antes de continuar

    // return this.next(); // 👉 avanzar al siguiente paso
  }

  // Si sí hay catálogos, procesarlos
  for (const key of Object.keys(grouped)) {
    const { property, label, rows } = grouped[key];

    try {
      const result: any = await firstValueFrom(
        property.service.create({ [property.createField]: label })
      );
      const newId = property.getId
        ? property.getId(result)
        : result[property.nameProperty] ?? result.id;

      for (const row of rows) {
        row[property.nameProperty] = newId;
        delete row[`__fallback_${property.nameProperty}`];
      }

      property.catalogValues?.push({ label, value: newId });
    } catch (error: any) {
      for (const row of rows) {
        this.erroresData.push({
          fila: row,
          numero: this.filas.get(row),
          errores: [
            `Error al crear catálogo '${label}': ${error.message || error}`,
          ],
        });
      }
    }
  }

        this.active = 3; // ⬅️ Aumentar el paso antes de continuar

    return this.next(); // 👉 avanzar al siguiente paso

}


  async importarRegistros() {
    const service = this.configuration().service;
    const uniqueFields: any[] = this.configuration().properties.filter((p: any) => p.unique);
    // Los registros cuyo catálogo no se pudo crear ya están en erroresData.
    const conError = new Set(this.erroresData.map((e) => e.fila));
    const pendientes = this.listData.filter((r) => !conError.has(r));

    const total = pendientes.length;
    this.progress = { current: 0, total };
    this.importados = 0;

    for (const row of pendientes) {
      const errorDe = (texto: string) =>
        this.erroresData.push({ fila: row, numero: this.filas.get(row), errores: [texto] });

      // Solo se buscan duplicados por los campos únicos que traen valor.
      const conValor = uniqueFields.filter((f: any) => {
        const v = row[f.nameProperty];
        return v !== undefined && v !== null && v !== '';
      });
      let omitir = false;
      if (conValor.length) {
        const filterParams = '?' + conValor
          .map((f: any) => `${f.nameProperty}=${encodeURIComponent(row[f.nameProperty])}`)
          .join('&');
        try {
          const found: any = await firstValueFrom(service.getAllFilter(filterParams));
          if (found.length > 0) {
            errorDe('Ya existe un registro con el mismo ' + conValor.map((f: any) => f.label).join(', ') + '.');
            omitir = true;
          }
        } catch (error: any) {
          errorDe('No se pudo revisar si ya existe: ' + this.mensajeDe(error));
          omitir = true;
        }
      }

      if (!omitir) {
        try {
          await firstValueFrom(service.create(row));
          this.importados++;
        } catch (error: any) {
          errorDe('No se importó: ' + this.mensajeDe(error));
        }
      }
      this.progress.current++;
    }

    const conErrores = this.erroresData.length;
    if (conErrores === 0) {
      this.messageService.add({
        severity: 'success',
        summary: 'Importación completa',
        detail: `${this.importados} registros importados`,
      });
    } else {
      this.messageService.add({
        severity: this.importados ? 'warn' : 'error',
        summary: this.importados ? 'Importación parcial' : 'No se importó ningún registro',
        detail: `${this.importados} importados, ${conErrores} con errores. Revisa el detalle por fila.`,
      });
    }
    this.erroresData.sort((a, b) => (a.numero ?? 0) - (b.numero ?? 0));
    this.imported.emit();
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
    enlace.download = this.configuration().titleDownload + '.xlsx';
    enlace.click();
    URL.revokeObjectURL(enlace.href);
  }

  trackByFn(index: number, item: any): any {
    return index;
  }

  getEnumOptions(field: any): any[] {
    return (
      field.enumValues?.map((val: any) => ({ label: val, value: val })) ?? []
    );
  }

  async loadCatalogOptions() {
    for (const property of this.configuration().properties) {
      if (
        property.type === 'catalog' &&
        property.serviceName &&
        !this.catalogOptions[property.nameProperty]
      ) {
        const service = this.services()[property.serviceName];
        if (service && typeof service.getAll === 'function') {
          const result: any[] = await firstValueFrom(
            service.getAll({ hiddenLoading: 'true' })
          );
          this.catalogOptions[property.nameProperty] = result.map(
            (item: any) => ({
              label: item.nombre || item.descripcion || item.label || item.name,
              value: item.id || item.value,
            })
          );
        }
      }
    }
  }
}
