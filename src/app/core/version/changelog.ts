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
    version: '1.2.0',
    fecha: '2026-11-23',
    cambios: [
      'Menú lateral en íconos: al pasar el cursor se despliegan los módulos; el Dashboard pasó al primer lugar y abajo quedan Novedades y Cerrar sesión.',
      'Barra superior más delgada y translúcida, con el botón para cambiar entre modo claro y modo oscuro (se recuerda en tu navegador).',
      'Catálogos: «Buscar módulo» en la misma fila que la vista en cuadrícula o lista y el botón de editar; favoritos arriba sin repetirse y el conteo de cada grupo en una pastilla de color.',
      'Todas las pantallas con los mismos márgenes y el título a la misma altura.',
      'Carga más ligera: en lugar de la pantalla «Cargando…», cada pantalla muestra su forma (esqueleto) mientras llega la información.',
      'Las listas que vienen de catálogos (empleados, productos, rutas, clientes, áreas, almacenes…) tienen buscador.',
      'Filtros de fecha en reportes y bitácora: solo permiten hoy y días anteriores, y la fecha fin puede ser anterior a la de inicio (el rango se ordena solo).',
      'Nuevo (vista previa): Inventario diario de insumos, con cupo diario por área, partidas con firma y solicitudes de stock desde la tarjeta, y la pantalla de Confirmación de solicitudes para el almacén.',
    ],
  },
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
      'Bitácora de ventas: muestra por defecto la semana de viernes a jueves, con un nuevo selector de fechas que marca el rango, y el resumen de ventas en su propia tarjeta.',
      'Correcciones de ortografía en mensajes, reportes, dashboard y órdenes de compra.',
    ],
  },
];

export const VERSION_ACTUAL = CHANGELOG[0].version;
