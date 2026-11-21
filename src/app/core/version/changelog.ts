/**
 * Registro de cambios que ve el usuario al entrar después de una actualización.
 *
 * En cada actualización agrega una entrada AL INICIO de la lista: la primera es la versión vigente.
 * Escribe cambios puntuales y resumidos, en el lenguaje del usuario (qué cambió para él, no cómo).
 */
export interface Novedad {
  /** Número de versión visible, p. ej. «1.1.0». */
  version: string;
  /** Fecha de publicación, AAAA-MM-DD. */
  fecha: string;
  cambios: string[];
}

export const CHANGELOG: Novedad[] = [
  {
    version: '1.1.0',
    fecha: '2026-11-21',
    cambios: [
      'Tablas: contenido alineado a la izquierda, encabezados en color, campo «Buscar en tabla» y fila resaltada al pasar el cursor.',
      'Formularios: los campos obligatorios se marcan con * y «Guardar» se habilita al completarlos; al editar el botón dice «Actualizar».',
      '«Cancelar» confirma antes de salir para que no pierdas datos por accidente.',
      'Nuevo diseño para adjuntar archivos e imágenes: arrastra y suelta, con vista previa y tamaño.',
      'Confirmación de eliminar con el mismo diseño en todos los catálogos.',
      'Las pantallas de «Ver detalle» solo muestran la flecha para regresar.',
      'Barra superior: «Búsqueda global» que se abre al centro con Ctrl K y ayudas en KPIs, Ayuda y Notificaciones.',
      'Equipos: la imagen va al inicio del formulario y «Tipo de equipo» tiene buscador.',
      'Correcciones de ortografía en mensajes, reportes, dashboard y órdenes de compra.',
    ],
  },
];

export const VERSION_ACTUAL = CHANGELOG[0].version;
