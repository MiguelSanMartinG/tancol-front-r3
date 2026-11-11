import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function exportLiquidacionPdf(doc: jsPDF, data: any) {
  // === Config global de tipografías ===
  const BASE_FONT = 'helvetica';
  const BASE_FONT_STYLE: 'normal' | 'bold' = 'normal';
  const BASE_FONT_SIZE = 10;
  const formatMoney = (value: any) => `$${(Number(value) || 0).toFixed(2)}`;
  const excluirCanceladas = Boolean(data.readonly);
  const catalogoConceptos = Array.isArray(data.listaConceptoVenta) ? data.listaConceptoVenta : [];
  const catalogoProductos = Array.isArray(data.listaProductos) ? data.listaProductos : [];
  const getLabelByValue = (catalogo: any[], value: any) => {
    const found = catalogo.find((item: any) => String(item.value) === String(value));
    return found ? found.label : value;
  };
  const isFolioDisabledPartida = (p: any) => {
    const value = String(p?.conceptoVenta ?? '').trim().toUpperCase();
    if (value === 'BPSC' || value === 'PGNP') return true;
    const label = String(getLabelByValue(catalogoConceptos, p?.conceptoVenta) ?? '').trim().toUpperCase();
    return label.includes('BPSC') || label.includes('PGNP');
  };
  const esConceptoVentaF1 = (p: any) => {
    const concepto = String(p?.conceptoVenta ?? '').trim().toUpperCase();
    if (concepto === 'F1') {
      return true;
    }

    const label = String(getLabelByValue(catalogoConceptos, p?.conceptoVenta) ?? '').trim().toUpperCase();
    return label === 'F1';
  };
  const partidasVisibles = (data.listaPartidas || []).filter((p: any) => {
    if (excluirCanceladas && p?.cancelada) {
      return false;
    }
    return !esConceptoVentaF1(p);
  });

  const totalizadorPorProductoFiltrado = (() => {
    const mapa = new Map<string, { id: string; nombre: string; cantidad: number; total: number }>();

    for (const p of partidasVisibles) {
      if (String(p?.formaPago ?? '').toUpperCase() !== 'CONTADO') continue;
      if (!p?.producto) continue;

      const cantidad = Number(p.cantidad || 0);
      const precio = Number(p.precio || 0);
      if (cantidad <= 0 || precio <= 0) continue;

      const key = String(p.producto);
      const nombre = String(getLabelByValue(catalogoProductos, p.producto) ?? p.producto);

      if (!mapa.has(key)) {
        mapa.set(key, { id: key, nombre, cantidad: 0, total: 0 });
      }

      const curr = mapa.get(key)!;
      curr.cantidad += cantidad;
      curr.total += precio * cantidad;
    }

    return Array.from(mapa.values())
      .map((item) => ({
        ...item,
        precioPromedio: item.cantidad > 0 ? item.total / item.cantidad : 0,
      }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
  })();

  const totalizadorPorProductoGeneral = (() => {
    const mapa = new Map<string, { id: string; nombre: string; cantidad: number; total: number }>();

    for (const p of partidasVisibles) {
      if (!p?.producto) continue;

      const cantidad = Number(p.cantidad || 0);
      const precio = Number(p.precio || 0);
      if (cantidad <= 0 || precio <= 0) continue;

      const key = String(p.producto);
      const nombre = String(getLabelByValue(catalogoProductos, p.producto) ?? p.producto);
      if (!mapa.has(key)) mapa.set(key, { id: key, nombre, cantidad: 0, total: 0 });

      const curr = mapa.get(key)!;
      curr.cantidad += cantidad;
      curr.total += precio * cantidad;
    }

    return Array.from(mapa.values())
      .map((item) => ({
        ...item,
        precioPromedio: item.cantidad > 0 ? item.total / item.cantidad : 0,
      }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
  })();

  // Recalcular total general solo para partidas CONTADO (Efectivo)
  const totalGeneralImporteFiltrado = partidasVisibles
    .filter((p: any) => p.formaPago === 'CONTADO')
    .reduce((sum: number, p: any) => sum + (Number(p.importe) || 0), 0);
  const totalGeneralDescuentos = Number(data.totalGeneralDescuentos) || partidasVisibles
    .filter((p: any) => String(p.formaPago ?? '').toUpperCase() === 'CONTADO')
    .reduce((sum: number, p: any) => sum + (Number(p.descuento) || 0) * (Number(p.cantidad) || 0), 0);
  const totalNetoLiquidacion = totalGeneralImporteFiltrado - totalGeneralDescuentos;

  // Dibuja encabezados y retorna la posición final de y
  function drawHeaders(doc: jsPDF, data: any, fechaTxt: string) {
    // Homologar SIEMPRE fuente y tamaño antes de dibujar encabezados
    doc.setFont(BASE_FONT, BASE_FONT_STYLE);
    doc.setFontSize(BASE_FONT_SIZE);

    let y = 28;
    if (data.logoDataUrl) {
      try {
        const format = data.logoDataUrl.startsWith('data:image/svg') ? 'SVG' : 'PNG';
        doc.addImage(data.logoDataUrl, format as any, 14, 10, 84, 16);
        y = Math.max(y, 32);
      } catch (error) {
        console.warn('No se pudo agregar el logo al PDF', error);
      }
    }
    // Folio a la izquierda, propiedad en negrita
    if (data.formulario.folio) {
      doc.setFont(BASE_FONT, 'bold');
      doc.text('Folio:', 14, y, { align: 'left' });
      doc.setFont(BASE_FONT, 'normal');
      doc.text(` ${data.formulario.folio}`, 14 + doc.getTextWidth('Folio:'), y, { align: 'left' });
    }
    // Fecha a la derecha, propiedad en negrita
    if (fechaTxt) {
      const fechaLabel = 'Fecha:';
      const fechaValue = ` ${fechaTxt}`;
      const rightX = doc.internal.pageSize.getWidth() - 14;
      doc.setFont(BASE_FONT, 'bold');
      doc.text(fechaLabel, rightX - doc.getTextWidth(fechaLabel + fechaValue), y, { align: 'left' });
      doc.setFont(BASE_FONT, 'normal');
      doc.text(fechaValue, rightX - doc.getTextWidth(fechaValue), y, { align: 'left' });
    }
    if (data.formulario.folio || fechaTxt) y += 8;

    // Ruta a la izquierda, Bloque nota a la derecha
    let nombreRuta = '';
    if (data.rutas && Array.isArray(data.rutas)) {
      const rutaObj = data.rutas.find((r: any) => r.value === data.formulario.idRuta);
      nombreRuta = rutaObj ? rutaObj.label : '';
    }
    if (nombreRuta) {
      doc.setFont(BASE_FONT, 'bold');
      doc.text('Ruta:', 14, y, { align: 'left' });
      doc.setFont(BASE_FONT, 'normal');
      doc.text(` ${nombreRuta}`, 14 + doc.getTextWidth('Ruta:'), y, { align: 'left' });
    }
    if (data.formulario.bloqueNota) {
      const bloqueLabel = 'Bloque nota:';
      const bloqueValue = ` ${data.formulario.bloqueNota}`;
      const rightX = doc.internal.pageSize.getWidth() - 14;
      doc.setFont(BASE_FONT, 'bold');
      doc.text(bloqueLabel, rightX - doc.getTextWidth(bloqueLabel + bloqueValue), y, { align: 'left' });
      doc.setFont(BASE_FONT, 'normal');
      doc.text(bloqueValue, rightX - doc.getTextWidth(bloqueValue), y, { align: 'left' });
    }
    if (nombreRuta || data.formulario.bloqueNota) y += 8;

    // Dejar la fuente base homogénea tras los encabezados
    doc.setFont(BASE_FONT, BASE_FONT_STYLE);
    doc.setFontSize(BASE_FONT_SIZE);

    return y;
  }

  // Helper para pie de página con número de página
  function drawPageNumber(pageNum: number) {
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    doc.setFont(BASE_FONT, 'normal');
    doc.setFontSize(9);
    doc.text(`Página ${pageNum}`, pageW - 28, pageH - 10, { align: 'right' });
    // Restaurar fuente base por si la necesitas inmediatamente después
    doc.setFont(BASE_FONT, BASE_FONT_STYLE);
    doc.setFontSize(BASE_FONT_SIZE);
  }

  function drawSignatureGrid(
    signatories: Array<{ title: string; name: string }>,
    startY: number
  ) {
    if (!signatories.length) {
      return;
    }

    const margin = 14;
    const gap = 8;
    const pageWidth = doc.internal.pageSize.getWidth();
    const columns = Math.min(3, Math.max(1, signatories.length));
    const blockWidth = (pageWidth - margin * 2 - gap * (columns - 1)) / columns;
    const rowHeight = 22;

    signatories.forEach((signatory, index) => {
      const column = index % columns;
      const row = Math.floor(index / columns);
      const x = margin + column * (blockWidth + gap);
      const y = startY + row * rowHeight;

      doc.line(x, y, x + blockWidth, y);
      doc.setFont(BASE_FONT, 'normal');
      doc.setFontSize(8.5);
      doc.text(signatory.title, x, y + 6);
      doc.setFontSize(8);
      doc.text(signatory.name || 'No disponible', x + blockWidth / 2, y + 12, {
        align: 'center',
        maxWidth: blockWidth,
      });
    });
  }

  console.log('doc', doc);
  console.log('data', data);

  // Fuente base homogénea desde el inicio
  doc.setFont(BASE_FONT, BASE_FONT_STYLE);
  doc.setFontSize(BASE_FONT_SIZE);

  // Pie de página para la primera hoja
  drawPageNumber(1);

  // Fecha formateada
  let fechaTxt = '';
  if (data.formulario.fecha) {
    const fechaObj = new Date(data.formulario.fecha);
    if (!isNaN(fechaObj.getTime())) {
      const dd = String(fechaObj.getDate()).padStart(2, '0');
      const mm = String(fechaObj.getMonth() + 1).padStart(2, '0');
      const yyyy = fechaObj.getFullYear();
      const hh = String(fechaObj.getHours()).padStart(2, '0');
      const min = String(fechaObj.getMinutes()).padStart(2, '0');
      fechaTxt = `${dd}/${mm}/${yyyy} ${hh}:${min}`;
    } else {
      fechaTxt = data.formulario.fecha;
    }
  }

  // Encabezados homogéneos
  let y = drawHeaders(doc, data, fechaTxt);

  // =========================
  // Choferes (alineación fija)
  // =========================
  doc.setFont(BASE_FONT, 'bold');
  doc.text('Choferes', 14, 62);
  doc.setFont(BASE_FONT, 'normal');

  // Productos únicos
  const productosUnicos = Array.from(new Set(
    data.listadoChoferes.flatMap((ch: any) => (ch.productos || []).map((p: any) => p.nombre))
  ));
  // Encabezado: Chofer + productos
  const choferesHead: string[] = ['Chofer', ...productosUnicos.map(p => String(p))];

  // Catálogo empleados opcional
  const empleadosCatalogo = Array.isArray(data.empleados) ? data.empleados : [];

  // Anchos CONSISTENTES para todas las tablas de esta sección
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 14;
  const usableW = pageW - margin * 2;

  // Nombre más ancho; columnas de productos se reparten
  const firstColW = Math.min(usableW * 0.35, 90); // ajustable
  const restColW = (usableW - firstColW) / Math.max(productosUnicos.length, 1);

  // Centramos TODAS las columnas (incluida la de nombre) para mantener consistencia visual
  const columnStylesChofer: { [key: number]: any } = {};
  columnStylesChofer[0] = { cellWidth: firstColW, halign: 'center' };
  for (let i = 1; i < choferesHead.length; i++) {
    columnStylesChofer[i] = { cellWidth: restColW, halign: 'center' };
  }

  const listadoChoferes = Array.isArray(data.listadoChoferes) ? data.listadoChoferes : [];
  const getNombreEmpleado = (id: string | undefined, fallback: string) => {
    if (!id || !empleadosCatalogo.length) return fallback;
    const emp = empleadosCatalogo.find((e: any) => e.idEmpleado === id);
    if (!emp) return fallback;
    return [emp.nombre, emp.apellidoPaterno, emp.apellidoMaterno].filter(Boolean).join(' ');
  };
  const signatories = [
    { title: 'Usuario en sesión', name: data.usuarioSesion || 'No disponible' },
    ...listadoChoferes.map((ch: any, index: number) => ({
      title: listadoChoferes.length > 1 ? `Chofer ${index + 1}` : 'Chofer',
      name: getNombreEmpleado(ch?.id, ch?.nombre || 'No disponible'),
    })),
  ];
  const getCantidadesProducto = (productos: any[]) =>
    productosUnicos.map((nombreProd) => {
      const prod = (productos || []).find((p: any) => p.nombre === nombreProd);
      return prod ? String(prod.cantidad) : '';
    });

  let startY = 66;

  // 1) Tabla unica de choferes
  const choferesBody = listadoChoferes.map((ch: any) => {
    const nombreCompleto = getNombreEmpleado(ch?.id, ch?.nombre || '');
    return [nombreCompleto, ...getCantidadesProducto(ch?.productos || [])];
  });

  autoTable(doc, {
    startY,
    head: [choferesHead],
    body: choferesBody.length ? choferesBody : [['', ...Array(productosUnicos.length).fill('')]],
    styles: { overflow: 'linebreak', halign: 'center', valign: 'middle' },
    columnStyles: columnStylesChofer,
    tableWidth: usableW,
    margin: { left: margin, right: margin }
  });

  startY = (doc as any).lastAutoTable.finalY + 3;

  // 2) Tablas de ayudantes por chofer (separadas y etiquetadas)
  listadoChoferes.forEach((ch: any) => {
    if (!Array.isArray(ch?.ayudantes) || ch.ayudantes.length === 0) return;

    const nombreChofer = getNombreEmpleado(ch?.id, ch?.nombre || '');
    const ayudanteHead = [
      { content: `Ayudante (${nombreChofer})` },
      ...productosUnicos.map((p) => ({ content: String(p) }))
    ];
    const ayudantesBody = ch.ayudantes.map((ay: any) => {
      const nombreAyudante = getNombreEmpleado(ay?.id, ay?.nombre || '');
      return [nombreAyudante, ...getCantidadesProducto(ay?.productos || [])];
    });

    autoTable(doc, {
      startY,
      head: [ayudanteHead],
      body: ayudantesBody,
      styles: { overflow: 'linebreak', halign: 'center', valign: 'middle' },
      columnStyles: columnStylesChofer,
      tableWidth: usableW,
      margin: { left: margin, right: margin }
    });

    startY = (doc as any).lastAutoTable.finalY + 2;
  });

  const choferesSectionEndY = startY;

  // Partidas
  doc.setFont(BASE_FONT, 'bold');
  doc.text('Partidas', 14, choferesSectionEndY + 10);
  doc.setFont(BASE_FONT, 'normal');
  const columnStylesPartidas: { [key: number]: any } = {
    0: { cellWidth: 15 }, // Concepto
    1: { cellWidth: 30 }, // Cliente
    2: { cellWidth: 16 }, // Producto
    3: { cellWidth: 8, halign: 'center' }, // Cantidad
    4: { cellWidth: 11, halign: 'right' }, // Precio
    5: { cellWidth: 12, halign: 'right' }, // Importe
    6: { cellWidth: 9, halign: 'center' }, // Folio
    7: { cellWidth: 18, halign: 'center' }, // Forma pago
    8: { cellWidth: 8, halign: 'center' }, // Factura
    9: { cellWidth: 55 }, // Motivo cancelación
  };
  autoTable(doc, {
    startY: choferesSectionEndY + 14,
    head: [['Concepto', 'Cliente', 'Producto', 'Cant.', 'Precio', 'Importe', 'Folio', 'Forma pago', 'Fact.', 'Motivo cancelación']],
    body: partidasVisibles.map((p: any) => [
      // Buscar el label del concepto de venta usando el catálogo
      (() => {
        if (Array.isArray(data.listaConceptoVenta)) {
          const found = data.listaConceptoVenta.find((item: any) => String(item.value) === String(p.conceptoVenta));
          return found ? found.label : p.conceptoVenta;
        }
        return p.conceptoVenta;
      })(),
      // Buscar el nombre del cliente usando el catálogo
      (() => {
        if (Array.isArray(data.listaClientes)) {
          const found = data.listaClientes.find((item: any) => String(item.value) === String(p.cliente));
          return found ? found.label : p.cliente;
        }
        return p.cliente;
      })(),
      // Buscar el nombre del producto usando el catálogo
      (() => {
        if (Array.isArray(data.listaProductos)) {
          const found = data.listaProductos.find((item: any) => String(item.value) === String(p.producto));
          return found ? found.label : p.producto;
        }
        return p.producto;
      })(),
      p.cantidad,
      formatMoney(p.precio),
      formatMoney(p.importe),
      isFolioDisabledPartida(p) ? '' : p.folio,
      p.formaPago,
      p.factura ? 'Sí' : 'No',
      p.cancelada ? String(p.motivoCancelacion ?? p.motivo ?? p.razonCancelacion ?? p.motivoCancelacionPartida ?? '') : ''
    ]),
    styles: {
      fontSize: 6.5,
      cellPadding: 1.1,
      overflow: 'linebreak',
      valign: 'middle',
    },
    headStyles: {
      fontSize: 6,
      fillColor: [44, 127, 184],
      textColor: 255,
      halign: 'center',
      valign: 'middle',
      cellPadding: 1.4,
      minCellHeight: 8,
    },
    bodyStyles: {
      fontSize: 6.5,
    },
    columnStyles: columnStylesPartidas,
    tableWidth: usableW,
    margin: { left: margin, right: margin },
    didParseCell: function (dataCell) {
      if ([0, 1, 2, 9].includes(dataCell.column.index)) {
        dataCell.cell.styles.fontStyle = 'bold';
      }
    }
  });

  // Comentarios
  const obsY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFont(BASE_FONT, 'bold');
  doc.text('Observaciones:', 14, obsY);
  doc.setFont(BASE_FONT, 'normal');
  const obsLines = doc.splitTextToSize(data.comentarios || '', doc.internal.pageSize.getWidth() - 28);
  doc.text(obsLines, 14, obsY + 6);
  const afterObsY = obsY + 6 + (obsLines.length * 6); // 6px por línea

  // Totalizador: saltar de hoja si no cabe
  const pageHeight = doc.internal.pageSize.getHeight();
  const minSpaceNeeded = 90 + ((totalizadorPorProductoFiltrado.length + totalizadorPorProductoGeneral.length) * 12);
  const drawTotalizador = (title: string, rows: any[], startY: number, soloCantidad = false) => {
    doc.setFont(BASE_FONT, 'bold');
    doc.text(title, 14, startY);
    doc.setFont(BASE_FONT, 'normal');
    autoTable(doc, {
      startY: startY + 4,
      head: [soloCantidad
        ? ['Producto', 'Cantidad total']
        : ['Producto', 'Cantidad total', 'Precio promedio', 'Total']],
      body: rows.map((t: any) => [
        t.nombre,
        t.cantidad,
        ...(soloCantidad ? [] : [formatMoney(t.precioPromedio), formatMoney(t.total)])
      ]),
      didParseCell: function (dataCell) {
        if (dataCell.column.index === 0 || dataCell.row.index === 0) {
          dataCell.cell.styles.fontStyle = 'bold';
        }
      }
    });
    return (doc as any).lastAutoTable.finalY;
  };

  if (afterObsY + minSpaceNeeded > pageHeight) {
    doc.addPage();

    // MUY IMPORTANTE: restablecer tipografía base cada vez que cambias de hoja
    doc.setFont(BASE_FONT, BASE_FONT_STYLE);
    doc.setFontSize(BASE_FONT_SIZE);

    // Encabezados homogéneos en la nueva hoja
    drawHeaders(doc, data, fechaTxt);

    const totalizadorY = 62;
    const efectivoEndY = drawTotalizador('Totalizador efectivo', totalizadorPorProductoFiltrado, totalizadorY);
    drawTotalizador('Totalizador de productos', totalizadorPorProductoGeneral, efectivoEndY + 10, true);

    // Pie de página con número de hoja en la nueva hoja
    const pageNum = doc.getNumberOfPages();
    drawPageNumber(pageNum);

  } else {
    const efectivoEndY = drawTotalizador('Totalizador efectivo', totalizadorPorProductoFiltrado, afterObsY + 10);
    drawTotalizador('Totalizador de productos', totalizadorPorProductoGeneral, efectivoEndY + 10, true);
  }

  // Totales + firmas en la misma hoja, pegados al pie
  doc.setFont(BASE_FONT, 'bold');
  const pageHeightSignatures = doc.internal.pageSize.getHeight();
  const signatureRows = Math.ceil(signatories.length / 3);
  const signatureSectionHeight = signatureRows * 22;
  const footerBottomMargin = 14;
  const signatureStartY = pageHeightSignatures - signatureSectionHeight - footerBottomMargin;
  const totalGeneralY = Math.max((doc as any).lastAutoTable.finalY + 18, signatureStartY - 26);

  doc.text(`Total general: ${formatMoney(totalGeneralImporteFiltrado)}`, 14, totalGeneralY);
  doc.setFont(BASE_FONT, 'normal');
  doc.text(`Descuentos: -${formatMoney(totalGeneralDescuentos)}`, 14, totalGeneralY + 6);
  doc.setFont(BASE_FONT, 'bold');
  doc.text(`Total a liquidar: ${formatMoney(totalNetoLiquidacion)}`, 14, totalGeneralY + 12);
  doc.setFont(BASE_FONT, 'normal');
  drawSignatureGrid(signatories, signatureStartY);

  // Abrir en nueva pestaña
  const pdfBlob = doc.output('blob');
  const url = URL.createObjectURL(pdfBlob);
  const link = document.createElement('a');
  link.href = url;
  link.target = '_blank';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

