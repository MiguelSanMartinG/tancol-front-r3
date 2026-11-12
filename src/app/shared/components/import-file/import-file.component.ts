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
  erroresData: { fila: any; errores: string[] }[] = [];
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
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      const rowData: any = {};
      row.eachCell((cell, colNumber) => {
        const rawValue = cell.value;

        rowData[headers[colNumber - 1]] =
          typeof rawValue === 'object' &&
          rawValue !== null &&
          'text' in (rawValue as any)
            ? (rawValue as any).text
            : rawValue;
      });

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

      if (errores.length) {
        this.erroresData.push({ fila: row, errores });
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
  console.log('Paso actual:', this.active);
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
  console.log('grouped', grouped);
  console.log(this.listData);

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
    console.log('No hay catálogos faltantes. Avanzando...');
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
    console.log('importar',this.listData);
    const service = this.configuration().service;
    const uniqueFields:any = this.configuration().properties.filter(
      (p: any) => p.unique
    );
          console.log('uniqueFields',uniqueFields);

    const total = this.listData.length;
    let current = 0;
    this.progress = { current, total };

    for (const row of [...this.listData]) {
        const filterParams = '?' + uniqueFields
    .map((f: any) => `${f.nameProperty}=${encodeURIComponent(row[f.nameProperty])}`)
    .join('&');

      console.log('filterParams',filterParams);
      if (uniqueFields.length) {
              try {
    const found:any = await firstValueFrom(service.getAllFilter(filterParams));
    console.log('found',found);
    if (found.length > 0) {
      this.erroresData.push({
        fila: row,
        errores: [
          'Ya existe un registro con los mismos campos únicos: ' +
            uniqueFields.map((f: any) => f.label).join(', '),
        ],
      });
      continue;
    }
  } catch (error: any) {
    this.erroresData.push({
      fila: row,
      errores: [
        'Error al validar duplicado desde backend: ' +
          (error?.message ?? 'desconocido'),
      ],
    });
    continue;
  }
      }


  try {
    await firstValueFrom(service.create(row));
  } catch (error: any) {
    this.erroresData.push({
      fila: row,
      errores: ['Error al importar: ' + (error?.message ?? 'desconocido')],
    });
  }
      // const isDuplicate =
      //   this.listData.filter((r) =>
      //     uniqueFields.every(
      //       (field: any) => r[field.nameProperty] === row[field.nameProperty]
      //     )
      //   ).length > 1;

      // if (isDuplicate) {
      //   this.erroresData.push({
      //     fila: row,
      //     errores: [
      //       'Registro duplicado por campos únicos: ' +
      //         uniqueFields.map((f: any) => f.label).join(', '),
      //     ],
      //   });
      //   this.listData = this.listData.filter((r) => r !== row);
      //   continue;
      // }

      // try {
      //   await firstValueFrom(service.create(row));
      // } catch (error: any) {
      //   this.erroresData.push({
      //     fila: row,
      //     errores: ['Error al importar: ' + (error?.message ?? 'desconocido')],
      //   });
      // }
      current++;
      this.progress.current = current;
    }

    if (this.erroresData.length === 0) {
      this.messageService.add({
        severity: 'success',
        summary: 'Importación completa',
        detail: `${total} registros importados`,
      });
    } else {
      this.messageService.add({
        severity: 'warn',
        summary: 'Importación parcial',
        detail: `${total - this.erroresData.length} registros importados, ${
          this.erroresData.length
        } con errores`,
      });
    }
    console.log(this.erroresData);
    this.imported.emit();
    // this.active = 4;
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
