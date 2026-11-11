import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';

export class ExcelExportService {
static exportAsExcelFile<T>(
  data: T[],
  columns: ExportColumn<T>[],
  fileName: string
): void {
  const exportData = data.map((item) => {
    const row: any = {};
    columns.forEach((col) => {
      row[col.header] = item[col.key];
    });
    return row;
  });

  const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData);
  worksheet['!cols'] = columns.map((col) => ({
    wch: col.width ?? 15,
  }));
  if (exportData.length > 0) {
    worksheet['!autofilter'] = {
      ref: XLSX.utils.encode_range({
        s: { r: 0, c: 0 },
        e: { r: exportData.length, c: columns.length - 1 },
      }),
    };
  }
  const workbook: XLSX.WorkBook = {
    Sheets: { data: worksheet },
    SheetNames: ['data'],
  };

  const excelBuffer: any = XLSX.write(workbook, {
    bookType: 'xlsx',
    type: 'array',
  });

  const blob: Blob = new Blob([excelBuffer], {
    type:
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8',
  });

  FileSaver.saveAs(blob, `${fileName}.xlsx`);
}

}

export interface ExportColumn<T = any> {
  header: string;
  key: keyof T;
  width?: number;
}
