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
    version: '1.3.0',
    fecha: '2026-11-27',
    cambios: [
      'Inventario diario: la tarjeta muestra solo lo firmado; lo registrado sin firmar aparece como «−N por firmar».',
      'Inventario diario: las tarjetas muestran la foto del insumo (clic para verla en grande) y los íconos ya no se salen en pantallas angostas.',
      'Agregar insumo: cada almacén indica cuántos insumos tiene; los vacíos salen en gris y solo ves los almacenes que tienes asignados.',
      'Filtros de Inventario diario: el área se elige junto a las pestañas y se agregaron Ruta, Insumo, Roto por y Firmado.',
      'Partidas: se editan solo el mismo día; las de días anteriores se consultan con el filtro de fechas. Columnas ajustables y resúmenes nuevos por concepto y por roto por.',
      'Solicitudes de stock: tabla de 20 registros por página, fechas de respuesta y recepción en su propia columna, quién solicitó y las firmas de entrega y de recibido.',
      'Filtros contraíbles: a la vista quedan fechas, ruta y empleado; «Más filtros» muestra insumo, roto por y firmado.',
      'Solicitudes de stock: la cantidad y la nota se pueden ajustar durante 2 minutos después de enviarla.',
      'Solo quien agregó una tarjeta de insumo la puede eliminar.',
      'Avisos al momento: cuando el almacén acepta o rechaza tu solicitud aparece un aviso sin recargar la página.',
      'Las tablas de Partidas, Solicitudes y Confirmación de stock tienen el mismo aspecto que las de los catálogos.',
      'Recibir y firmar: botón «Declinar» para no aceptar lo entregado; el insumo se queda en el almacén y puedes volver a solicitar.',
      'Confirmación de stock: la nota del área va en su propia columna y al aceptar ves cuánto quedará en el almacén.',
      'Tarjetas: botón «+» para agregar una partida de ese insumo, y «−N por firmar» muestra esas partidas para firmarlas.',
      'Partidas: columnas «Registró» y «Firmó» con su fecha, y botón «Exportar» a Excel con las partidas y los resúmenes.',
      'Resumen de entregas contraíble, con fila de totales por concepto.',
      'Solicitudes de stock: «Mis solicitudes», contador de declinadas y canceladas, y clic en la fila para ver el detalle.',
      'Ya no hay que confirmar el cupo para trabajar: cada tarjeta inicia con su cupo base. «Iniciar día» (opcional) muestra con cuánto cerró ayer y deja cambiar con cuánto inicia; queda registrado como «Dotación del día» en Solicitudes de stock.',
    ],
  },
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
