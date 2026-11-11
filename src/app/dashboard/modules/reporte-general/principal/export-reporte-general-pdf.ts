import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  ReporteGeneralCorridasResponse,
  ReporteGeneralTipo,
} from '../services/reporte-general.service';

export interface ReporteGeneralPdfTab {
  label: string;
  value: ReporteGeneralTipo;
}

export interface ReporteGeneralPdfData {
  fechaInicio?: Date | null;
  fechaFin?: Date | null;
  generadoEn?: Date;
  usuarioExporta: string;
  tabs: ReporteGeneralPdfTab[];
  reportes: Record<ReporteGeneralTipo, ReporteGeneralCorridasResponse | null>;
}

function pad(value: number): string {
  return value.toString().padStart(2, '0');
}

function formatDate(value?: Date | null): string {
  if (!value || Number.isNaN(value.getTime())) {
    return '-';
  }

  return `${pad(value.getDate())}/${pad(value.getMonth() + 1)}/${value.getFullYear()}`;
}

function formatDateTime(value?: Date | null): string {
  if (!value || Number.isNaN(value.getTime())) {
    return '-';
  }

  return `${pad(value.getDate())}/${pad(value.getMonth() + 1)}/${value.getFullYear()} ${pad(value.getHours())}:${pad(value.getMinutes())}`;
}

function formatCurrency(value: number | null | undefined): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value ?? 0);
}

function getTableLayout(columnCount: number): { bodyFontSize: number; headFontSize: number; cellPadding: number } {
  if (columnCount > 18) {
    return { bodyFontSize: 5.5, headFontSize: 5.5, cellPadding: 0.8 };
  }
  if (columnCount > 12) {
    return { bodyFontSize: 6, headFontSize: 6, cellPadding: 1 };
  }
  if (columnCount > 8) {
    return { bodyFontSize: 7, headFontSize: 7, cellPadding: 1.2 };
  }
  return { bodyFontSize: 8, headFontSize: 8, cellPadding: 1.5 };
}

function buildColumnStyles(
  pageWidth: number,
  columnCount: number
): Record<number, { cellWidth: number; halign: 'left' | 'center'; overflow: 'linebreak' | 'hidden' }> {
  const margin = 14;
  const usableWidth = pageWidth - margin * 2;
  const employeeWidth = Math.min(Math.max(usableWidth * 0.16, 36), 52);
  const numericColumnCount = Math.max(columnCount - 1, 1);
  const numericWidth = (usableWidth - employeeWidth) / numericColumnCount;
  const styles: Record<number, { cellWidth: number; halign: 'left' | 'center'; overflow: 'linebreak' | 'hidden' }> = {
    0: { cellWidth: employeeWidth, halign: 'left', overflow: 'linebreak' },
  };

  for (let index = 1; index < columnCount; index += 1) {
    styles[index] = {
      cellWidth: numericWidth,
      halign: 'center',
      overflow: 'hidden',
    };
  }

  return styles;
}

/** Tamaño Oficio (México): 216 × 340 mm */
const OFICIO_PORTRAIT_FORMAT: [number, number] = [216, 340];

function drawSignatureBlock(doc: jsPDF, userName: string, y: number): void {
  const pageWidth = doc.internal.pageSize.getWidth();
  const leftX = 14;
  const lineStartX = leftX + 18;
  const lineEndX = pageWidth - 52;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Firma:', leftX, y);
  doc.line(lineStartX, y - 1, lineEndX, y - 1);

  doc.setFontSize(9);
  const lineCenterX = (lineStartX + lineEndX) / 2;
  doc.text(userName, lineCenterX, y + 5, { align: 'center' });
}

function placeSignatureBlock(doc: jsPDF, userName: string, contentEndY: number): number {
  const pageHeight = doc.internal.pageSize.getHeight();
  const signatureY = contentEndY + 8;

  if (signatureY + 14 > pageHeight - 16) {
    doc.addPage();
    drawSignatureBlock(doc, userName, 18);
    return 32;
  }

  drawSignatureBlock(doc, userName, signatureY);
  return signatureY + 14;
}

function drawPageNumbers(doc: jsPDF): void {
  const totalPages = doc.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let page = 1; page <= totalPages; page += 1) {
    doc.setPage(page);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Pagina ${page} de ${totalPages}`, pageWidth - 14, pageHeight - 8, { align: 'right' });
  }
}

interface PdfSeccion {
  label: string;
  abreviatura?: string;
  columnas: string[];
  etiquetas?: Record<string, string>;
}

const SECCIONES_CREDITO: PdfSeccion[] = [
  { label: 'RUTA PÚBLICO Y RUTA COMERCIAL', abreviatura: '(RP Y RC)', columnas: ['e20', 'pg', 'exp'] },
  { label: 'RUTA HIELO', abreviatura: '(RH)', columnas: ['h5kg', 'h3kg'] },
  { label: 'RUTA BOTELLITAS', abreviatura: '(RB)', columnas: ['c350', 'c500', 'c1000', 'c1500'] },
  { label: 'AGUA A GRANEL', abreviatura: '(A.PUR, A.POT Y A.DM)', columnas: ['agua_purif', 'agua_pot', 'agua_dm'] },
];

const SECCIONES_NO_FACTURA: PdfSeccion[] = [
  { label: 'RP Y RC', columnas: ['des_liq20', 'pg', 'bpsc', 'exp'], etiquetas: { des_liq20: 'desc_liq' } },
  { label: 'RH', columnas: ['h5kg', 'h3kg', 'desc_h5kg'], etiquetas: { desc_h5kg: 'desc_h5kg' } },
];

const COLUMNAS_TARJETA = [
  'pg', 'desliq', 'e20', 'agua_purif', 'agua_pot', 'agua_dm',
  'h5kg', 'h3kg', 'c350', 'c500', 'c1000', 'c1500',
  'desc_hielo', 'env11', 'liq11', 'env10', 'bpsc',
];

function normalizarColumna(columna: string): string {
  return columna.trim().toLowerCase().replace(/\s+/g, '');
}

function tieneDatos(report: ReporteGeneralCorridasResponse | null): boolean {
  return !!report?.filas?.some((row) =>
    Number(row.totalFila ?? 0) !== 0 || Object.values(row.columnas ?? {}).some((value) => Number(value ?? 0) !== 0),
  );
}

export async function exportReporteGeneralPdf(data: ReporteGeneralPdfData): Promise<void> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: OFICIO_PORTRAIT_FORMAT });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const generatedAt = data.generadoEn ?? new Date();
  const usuarioExporta = data.usuarioExporta || 'No disponible';
  const fechaInicio = formatDate(data.fechaInicio ?? null);
  const fechaFin = formatDate(data.fechaFin ?? null);
  const tabsToExport = data.tabs.filter((tab) => tieneDatos(data.reportes[tab.value]));

  if (!tabsToExport.length) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Reporte General', margin, 18);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Rango: ${fechaInicio} - ${fechaFin}`, margin, 26);
    doc.text(`Generado: ${formatDateTime(generatedAt)}`, margin, 32);
    doc.text('No hay datos para exportar.', margin, 46);
    placeSignatureBlock(doc, usuarioExporta, 46);
    drawPageNumbers(doc);
    window.open(URL.createObjectURL(doc.output('blob')), '_blank');
    return;
  }

  let nextReportY = 14;

  tabsToExport.forEach((tab) => {
    if (nextReportY + 20 > pageHeight - 16) {
      doc.addPage();
      nextReportY = 14;
    }

    const report = data.reportes[tab.value] ?? {
      columnas: [],
      filas: [],
      granTotal: 0,
      totalesPorColumna: {},
    };
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(`Reporte General - ${tab.label}`, margin, nextReportY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Rango: ${fechaInicio} - ${fechaFin}`, margin, nextReportY + 6);
    doc.text(`Generado: ${formatDateTime(generatedAt)}`, margin, nextReportY + 11);

    if (tab.value === 'rg-credito' || tab.value === 'rg-factura' || tab.value === 'rg-nofactura') {
      const definiciones = tab.value === 'rg-nofactura' ? SECCIONES_NO_FACTURA : SECCIONES_CREDITO;
      const secciones = definiciones.map((seccion) => ({
        ...seccion,
        columnas: seccion.columnas
          .map((esperada) => report.columnas.find((actual) => normalizarColumna(actual) === esperada)
            ?? (tab.value === 'rg-nofactura' ? esperada : undefined))
          .filter((columna): columna is string => !!columna),
      })).filter((seccion) =>
        seccion.columnas.length && report.filas.some((row) =>
          seccion.columnas.reduce((total, columna) => total + Number(row.columnas?.[columna] ?? 0), 0) !== 0,
        ),
      );

      let startY = nextReportY + 16;
      for (const seccion of secciones) {
        const filasSeccion = report.filas.filter((row) =>
          seccion.columnas.reduce((total, col) => total + Number(row.columnas?.[col] ?? 0), 0) !== 0,
        );
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(220, 38, 38);
        doc.text(seccion.label, margin, startY);
        if (seccion.abreviatura) {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          doc.text(seccion.abreviatura, margin, startY + 4);
        }
        doc.setTextColor(0, 0, 0);

        const encabezadoCredito = [
          'Empleado',
          ...seccion.columnas.map((col) => seccion.etiquetas?.[col] ?? col),
          'Total',
        ];
        const tableLayoutCredito = getTableLayout(encabezadoCredito.length);
        const bodyCredito = filasSeccion.length
          ? filasSeccion.map((row) => [
              row.nombreEmpleado,
              ...seccion.columnas.map((col) => formatCurrency(row.columnas?.[col] ?? 0)),
              formatCurrency(seccion.columnas.reduce((total, col) => total + Number(row.columnas?.[col] ?? 0), 0)),
            ])
          : [['Sin datos', ...Array(seccion.columnas.length).fill(''), '']];

        autoTable(doc, {
          startY: startY + (seccion.abreviatura ? 7 : 3),
          margin: { left: margin, right: margin },
          tableWidth: pageWidth - margin * 2,
          head: [encabezadoCredito],
          body: bodyCredito,
          styles: {
            fontSize: tableLayoutCredito.bodyFontSize,
            overflow: 'hidden',
            cellPadding: tableLayoutCredito.cellPadding,
            valign: 'middle',
            halign: 'center',
            lineWidth: 0.1,
            lineColor: [203, 213, 225],
          },
          headStyles: {
            fillColor: [0, 175, 230],
            textColor: 255,
            fontStyle: 'bold',
            fontSize: tableLayoutCredito.headFontSize,
            cellPadding: tableLayoutCredito.cellPadding,
            overflow: 'hidden',
            minCellHeight: 6,
          },
          foot: [[
            'Totales',
            ...seccion.columnas.map((col) => formatCurrency(
              filasSeccion.reduce((total, row) => total + Number(row.columnas?.[col] ?? 0), 0),
            )),
            formatCurrency(filasSeccion.reduce(
              (total, row) => total + seccion.columnas.reduce((subtotal, col) => subtotal + Number(row.columnas?.[col] ?? 0), 0),
              0,
            )),
          ]],
          footStyles: {
            fillColor: [226, 232, 240],
            textColor: 15,
            fontStyle: 'bold',
            fontSize: tableLayoutCredito.bodyFontSize,
            cellPadding: tableLayoutCredito.cellPadding,
            overflow: 'hidden',
          },
          columnStyles: buildColumnStyles(pageWidth, encabezadoCredito.length),
          alternateRowStyles: { fillColor: [248, 250, 252] },
        });

        startY = (doc as any).lastAutoTable?.finalY + 7;
      }

      const totalesCredito = secciones.map((seccion) => ({
        label: seccion.label,
        total: report.filas.reduce(
          (total, row) => total + seccion.columnas.reduce(
            (subtotal, columna) => subtotal + Number(row.columnas?.[columna] ?? 0),
            0,
          ),
          0,
        ),
      }));
      const totalGeneralCredito = totalesCredito.reduce((total, seccion) => total + seccion.total, 0);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(220, 38, 38);
      doc.text(`Totalizador ${tab.label}`, margin, startY);
      doc.setTextColor(0, 0, 0);

      autoTable(doc, {
        startY: startY + 3,
        margin: { left: margin, right: margin },
        tableWidth: pageWidth - margin * 2,
        head: [['Sección', 'Total']],
        body: totalesCredito.map((seccion) => [seccion.label, formatCurrency(seccion.total)]),
        foot: [['Total general', formatCurrency(totalGeneralCredito)]],
        styles: {
          fontSize: 8,
          cellPadding: 1.5,
          halign: 'center',
          lineWidth: 0.1,
          lineColor: [203, 213, 225],
        },
        columnStyles: {
          0: { halign: 'left', cellWidth: 90 },
          1: { halign: 'center' },
        },
        headStyles: { fillColor: [0, 175, 230], textColor: 255, fontStyle: 'bold' },
        footStyles: { fillColor: [226, 232, 240], textColor: 15, fontStyle: 'bold' },
      });

      const finalYWithTotalizador = (doc as any).lastAutoTable?.finalY ?? startY;
      nextReportY = placeSignatureBlock(doc, usuarioExporta, finalYWithTotalizador);
      return;
    }

    const columnasReporte = tab.value === 'rp-tcredito' || tab.value === 'rp-tdebito'
      ? [
          ...report.columnas,
          ...COLUMNAS_TARJETA.filter((columna) =>
            !report.columnas.some((actual) => normalizarColumna(actual) === normalizarColumna(columna)),
          ),
        ].filter((columna) =>
          !['desliq', 'desc_liq', 'desc_hielo', 'des_hielo', 'desc_h5kg', 'exp'].includes(normalizarColumna(columna)),
        )
      : report.columnas;
    const encabezado = [
      'Empleado',
      ...columnasReporte.map((col) =>
        ({
              desliq: 'Líquido 20 lts Vale código',
              desc_hielo: 'Hielo 5kg Vale código',
              des_hielo: 'Hielo 5kg Vale código',
              env10: 'liq10',
              bpsc: 'BPSC',
            }[normalizarColumna(col)] ?? col),
      ),
      'Total',
    ];
    const tableLayout = getTableLayout(encabezado.length);
    const columnStyles = buildColumnStyles(pageWidth, encabezado.length);
    const body = report.filas.length
      ? report.filas.map((row) => [
          row.nombreEmpleado,
          ...columnasReporte.map((col) => formatCurrency(row.columnas?.[col] ?? 0)),
          formatCurrency(row.totalFila),
        ])
      : [['Sin datos', ...Array(columnasReporte.length).fill(''), '']];

    autoTable(doc, {
      startY: nextReportY + 16,
      margin: { left: margin, right: margin },
      tableWidth: pageWidth - margin * 2,
      head: [encabezado],
      body,
      styles: {
        fontSize: tableLayout.bodyFontSize,
        overflow: 'hidden',
        cellPadding: tableLayout.cellPadding,
        valign: 'middle',
        halign: 'center',
        lineWidth: 0.1,
        lineColor: [203, 213, 225],
      },
      headStyles: {
        fillColor: [0, 175, 230],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: tableLayout.headFontSize,
        cellPadding: tableLayout.cellPadding,
        overflow: 'hidden',
        minCellHeight: 6,
      },
      foot: [[
        'Totales',
        ...columnasReporte.map((col) => formatCurrency(
          tab.value === 'rp-tcredito' || tab.value === 'rp-tdebito'
            ? report.filas.reduce((total, row) => total + Number(row.columnas?.[col] ?? 0), 0)
            : report.totalesPorColumna?.[col] ?? 0,
        )),
        formatCurrency(report.granTotal),
      ]],
      footStyles: {
        fillColor: [226, 232, 240],
        textColor: 15,
        fontStyle: 'bold',
        fontSize: tableLayout.bodyFontSize,
        cellPadding: tableLayout.cellPadding,
        overflow: 'hidden',
      },
      columnStyles,
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      didParseCell: (cellData) => {
        if (cellData.section === 'head' && cellData.column.index > 0) {
          cellData.cell.styles.halign = 'center';
        }
        if (cellData.section === 'body' && cellData.column.index > 0) {
          cellData.cell.styles.halign = 'center';
          cellData.cell.styles.overflow = 'hidden';
        }
        if (cellData.section === 'foot') {
          cellData.cell.styles.fontStyle = 'bold';
          if (cellData.column.index > 0) {
            cellData.cell.styles.halign = 'center';
            cellData.cell.styles.overflow = 'hidden';
          }
        }
      },
    });

    const finalY = (doc as any).lastAutoTable?.finalY ?? nextReportY + 16;
    nextReportY = placeSignatureBlock(doc, usuarioExporta, finalY);
  });

  drawPageNumbers(doc);
  window.open(URL.createObjectURL(doc.output('blob')), '_blank');
}
