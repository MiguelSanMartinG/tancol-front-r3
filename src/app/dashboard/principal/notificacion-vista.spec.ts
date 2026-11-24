import { Notificacion } from '@app/core/services/notificaciones.service';
import { agruparNotificaciones, presentarNotificacion } from './notificacion-vista';

describe('presentarNotificacion', () => {
  const hoy = new Date(2026, 9, 10);

  function aviso(partial: Partial<Notificacion>): Notificacion {
    return {
      id: '1',
      titulo: 'Meta semanal de venta no cubierta',
      mensaje: 'El empleado Jorge Alberto Santiago Hernández no cubrió la meta semanal de H5KG. Mínimo: 60.00, vendido: 0. Periodo: 2026-10-05T00:00 a 2026-10-08T17:34.',
      tipo: 'META_VENTA_NO_CUBIERTA',
      leida: false,
      periodoInicio: '2026-10-05T00:00:00',
      periodoFin: '2026-10-08T17:34:00',
      createdAt: '2026-10-08T17:34:00',
      updatedAt: '2026-10-08T17:34:00',
      ...partial,
    };
  }

  function plano(lineas: { texto: string; fuerte: boolean }[][]): string[] {
    return lineas.map((linea) => linea.map((parte) => `${parte.fuerte ? '*' : ''}${parte.texto}`).join(''));
  }

  it('formats an uncovered sales goal like the reference card', () => {
    const vista = presentarNotificacion(aviso({}), hoy);

    expect(vista.titulo).toBe('Meta semanal no cubierta');
    expect(vista.sujeto).toBe('Jorge Alberto Santiago Hernández');
    expect(plano(vista.lineas)).toEqual([
      'Producto *H5KG',
      'Meta: *60 · Vendido: *0',
      'Periodo: 5–8 oct 2026',
    ]);
    expect(vista.cuando).toBe('8 oct · 17:34');
    expect(vista.diaEtiqueta).toBe('8 de octubre');
  });

  it('formats equipment, stock and broken-bottle alerts', () => {
    const equipo = presentarNotificacion(aviso({
      titulo: 'Monto semanal de equipo no cubierto',
      mensaje: 'El cliente Acme no cubrió el monto mínimo semanal del equipo Dispensador. Mínimo: 1500.50, cubierto: 200.',
    }), hoy);
    const stock = presentarNotificacion(aviso({
      titulo: 'Stock bajo el mínimo',
      mensaje: 'El insumo Tapa (SKU: TP-1) está bajo el stock mínimo. Stock actual: 3, mínimo: 10.',
      periodoInicio: null,
      periodoFin: null,
    }), hoy);
    const rotos = presentarNotificacion(aviso({
      titulo: 'Tolerancia de botellones rotos superada',
      mensaje: 'El empleado Ana superó la tolerancia de botellones rotos de Garrafón. Rotos en la semana: 4 PZA. Tolerancia: 2 PZA. Semana del 2026-10-05 al 2026-10-11.',
    }), hoy);

    expect(equipo.titulo).toBe('Monto semanal no cubierto');
    expect(plano(equipo.lineas)[0]).toBe('Equipo *Dispensador');
    expect(plano(equipo.lineas)[1]).toBe('Mínimo: *1,500.5 · Cubierto: *200');
    expect(stock.sujeto).toBe('Tapa');
    expect(plano(stock.lineas)).toEqual(['SKU *TP-1', 'Stock: *3 · Mínimo: *10']);
    expect(rotos.titulo).toBe('Tolerancia de rotos superada');
    expect(plano(rotos.lineas)[1]).toBe('Rotos: *4 PZA · Tolerancia: *2 PZA');
  });

  it('formats the daily supplies stock notifications and links them to their screen', () => {
    const nueva = presentarNotificacion(aviso({
      titulo: 'Nueva solicitud de stock',
      tipo: 'SOLICITUD_STOCK_NUEVA',
      mensaje: 'El área Producción solicitó 20 de Envase 20 L (SDS-00004) al Almacén Planta.',
      periodoInicio: null,
      periodoFin: null,
    }), hoy);
    expect(nueva.sujeto).toBe('Envase 20 L');
    expect(plano(nueva.lineas)).toEqual(['Folio *SDS-00004 · Área *Producción', 'Cantidad: *20 · Almacén Planta']);
    expect(nueva.destino).toEqual({ etiqueta: 'Atender solicitud', ruta: '/dashboard/principal/confirmacion-stock', queryParams: { folio: 'SDS-00004' } });

    const aceptada = presentarNotificacion(aviso({
      tipo: 'SOLICITUD_STOCK_RESPUESTA',
      mensaje: 'El Almacén Planta aceptó la solicitud SDS-00004 de Envase 20 L: entregará 18.',
    }), hoy);
    expect(plano(aceptada.lineas)).toEqual(['Folio *SDS-00004 · *Aceptada', 'Entregará: *18 · Almacén Planta']);
    expect(aceptada.destino?.etiqueta).toBe('Recibir y firmar');
    expect(aceptada.destino?.ruta).toBe('/dashboard/principal/inventario-diario');

    const rechazada = presentarNotificacion(aviso({
      tipo: 'SOLICITUD_STOCK_RESPUESTA',
      mensaje: 'El Almacén Planta rechazó la solicitud SDS-00005 de Bolsa de hielo 3 kg. Motivo: sin existencia.',
    }), hoy);
    expect(plano(rechazada.lineas)).toEqual(['Folio *SDS-00005 · *Rechazada', 'Motivo: *sin existencia']);
    expect(rechazada.destino?.etiqueta).toBe('Ver en inventario diario');

    const dotacion = presentarNotificacion(aviso({
      tipo: 'DOTACION_INCOMPLETA',
      mensaje: 'Dotación incompleta en Producción: Bolsa de hielo 5 kg recibió 450 de 700 del Almacén Planta.',
    }), hoy);
    expect(dotacion.sujeto).toBe('Bolsa de hielo 5 kg · Producción');
    expect(plano(dotacion.lineas)).toEqual(['Recibió: *450 de *700 · Faltaron *250', 'Almacén Planta']);
    expect(dotacion.destino?.ruta).toBe('/dashboard/principal/inventario-diario');
  });

  it('keeps an unrecognized message readable', () => {
    const vista = presentarNotificacion(aviso({
      titulo: 'Aviso de prueba',
      mensaje: 'Texto libre del sistema.',
      periodoInicio: null,
      periodoFin: null,
    }), hoy);

    expect(vista.titulo).toBe('Aviso de prueba');
    expect(vista.sujeto).toBeNull();
    expect(plano(vista.lineas)).toEqual(['Texto libre del sistema.']);
  });

  it('groups notifications that share a day', () => {
    const grupos = agruparNotificaciones([
      aviso({ id: 'a', createdAt: '2026-10-08T17:34:00' }),
      aviso({ id: 'b', createdAt: '2026-10-08T09:00:00', mensaje: 'Otro aviso', titulo: 'Aviso' }),
      aviso({ id: 'c', createdAt: '2026-10-07T11:00:00' }),
    ], hoy);

    expect(grupos.map((grupo) => grupo.etiqueta)).toEqual(['8 de octubre', '7 de octubre']);
    expect(grupos[0].items.map((item) => item.id)).toEqual(['a', 'b']);
  });
});
