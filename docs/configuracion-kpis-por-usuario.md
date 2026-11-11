# Contrato API: configuración de KPIs por usuario

## Objetivo

Guardar las preferencias de cada usuario en backend para que la pantalla de configuración y el dashboard usen la misma configuración en cualquier sesión o dispositivo.

- Configuración: `/dashboard/principal/configuracion-kpis`.
- Dashboard: `/dashboard/principal/dashboard-reportes`.
- La configuración controla visibilidad, tipo de gráfica, colores y presentación. No contiene valores de ventas ni reemplaza los endpoints que entregan los datos.
- Se requiere JWT. El usuario propietario se obtiene de los claims del token; no se acepta un `usuarioId` enviado por el cliente.

## Endpoints

Base local: `/api/v1`. Todas las rutas requieren `Authorization: Bearer <token>` y `Content-Type: application/json` cuando llevan body.

### Consultar la configuración del usuario autenticado

```http
GET /api/v1/dashboard/kpis/configuracion
```

Responde `200` con la configuración guardada. Si aún no existe, responde `200` con los valores por defecto descritos abajo; puede crear el registro por defecto en base de datos o devolverlo sin persistir hasta el primer guardado.

### Guardar o reemplazar la configuración

```http
PUT /api/v1/dashboard/kpis/configuracion
```

El backend hace upsert para el usuario del JWT. El body contiene la configuración completa. Responde `200` con el objeto guardado normalizado. Una propiedad ausente se completa con el valor por defecto correspondiente para mantener compatibilidad al agregar preferencias nuevas.

## Modelo JSON

El objeto `configuracion` corresponde al modelo actual del frontend. Los mapas `kpis`, `charts` y `official` usan claves booleanas; `views` y `colors` configuran la presentación.

```json
{
  "configuracion": {
    "inlineKpis": false,
    "kpis": {
      "unidadesVendidas": true,
      "empleadosActivos": true,
      "clientesAtendidos": true,
      "diasOperacion": true,
      "importeReportado": true,
      "promedioDiario": true,
      "promedioPorEmpleado": true,
      "operaciones": true,
      "ticketPromedio": true,
      "descuentos": true,
      "canceladas": true,
      "facturadas": true,
      "mejorDia": true,
      "peorDia": true
    },
    "charts": {
      "ritmoVentas": true,
      "topEmpleados": true,
      "topProductos": true,
      "topClientes": true,
      "metodosPago": true,
      "ventasPorRuta": true,
      "ventasPorConcepto": true
    },
    "official": {
      "consumoClientesPorDia": true,
      "topClientesPgExp": true,
      "clientesMasEquipos": true,
      "clientesSinConsumo": true,
      "empleadosMetasCumplidas": true,
      "topDepartamentosInsumos": true,
      "topInsumosComprados": true,
      "devolucionesEquipos": true,
      "mayorMovimientoEquipos": true,
      "menorMovimientoEquipos": true
    },
    "views": {
      "ritmoVentas": "bars",
      "topEmpleados": "ranking",
      "topProductos": "ranking",
      "topClientes": "ranking",
      "metodosPago": "ranking",
      "ventasPorRuta": "ranking",
      "ventasPorConcepto": "ranking",
      "consumoClientesPorDia": "bars",
      "topClientesPgExp": "ranking",
      "clientesMasEquipos": "bars",
      "clientesSinConsumo": "ranking",
      "empleadosMetasCumplidas": "ranking",
      "topDepartamentosInsumos": "bars",
      "topInsumosComprados": "bars"
    },
    "colors": {
      "unidadesVendidas": "#5856d6",
      "empleadosActivos": "#0ea5e9",
      "clientesAtendidos": "#14b8a6",
      "diasOperacion": "#f59e0b",
      "importeReportado": "#8b5cf6",
      "promedioDiario": "#06b6d4",
      "promedioPorEmpleado": "#6366f1",
      "operaciones": "#64748b",
      "ticketPromedio": "#10b981",
      "descuentos": "#f97316",
      "canceladas": "#ef4444",
      "facturadas": "#22c55e",
      "mejorDia": "#84cc16",
      "peorDia": "#f43f5e",
      "devolucionesEquipos": "#ef4444",
      "mayorMovimientoEquipos": "#14b8a6",
      "menorMovimientoEquipos": "#f59e0b"
    }
  }
}
```

Las vistas válidas generales son `bars`, `line`, `area`, `donut`, `pie`, `stacked`, `radar`, `table` y `ranking`. Para `empleadosMetasCumplidas` el frontend ofrece: `ranking` (barras horizontales comparativas), `bars` (barras verticales comparativas), `line`, `area` y `table`. La gráfica compara dos series: `Meta` (`cantidadMinima`) y `Vendido` (`cantidadVendida`).

Los colores deben ser valores hexadecimales válidos. Rechazar configuración malformada con `400 Bad Request` y valores de vista fuera del catálogo. Las claves desconocidas pueden ignorarse y completarse con defaults; nunca deben convertirse en código ni consultas ejecutables.

La respuesta de `GET` y `PUT` envuelve el objeto completo en `configuracion`, con la misma estructura y tipos que el body anterior. Debe devolver los mapas completos con todos los valores normalizados.

## Persistencia y seguridad

- Guardar una sola configuración activa por usuario, con una restricción única por `user_id`.
- El `user_id` sale del JWT validado; nunca del body, query string ni headers controlados por el cliente.
- Aislar consultas y actualizaciones por usuario autenticado.
- `GET` sin JWT responde `401 Unauthorized`.
- El token válido sin permiso para la función responde `403 Forbidden`, si el sistema maneja permisos por módulo.
- El usuario A no puede leer ni sobrescribir la configuración del usuario B.
- Conservar las preferencias aunque el usuario cierre sesión o inicie en otro navegador.
- El endpoint de configuración es independiente de `GET /api/v1/dashboard/kpis/official` y de los endpoints de datos del dashboard. La pantalla combina datos y preferencias en el frontend.

## Uso en el frontend

1. Al entrar a cualquiera de las dos rutas, consultar `GET /dashboard/kpis/configuracion` con el JWT.
2. En configuración, inicializar controles con la respuesta. Al guardar, enviar el objeto completo mediante `PUT`.
3. En dashboard, aplicar la configuración devuelta: mostrar solo KPIs/gráficas activas y usar el tipo indicado en `views`.
4. Los cambios guardados en `/configuracion-kpis` deben reflejarse al consultar o actualizar `/dashboard/principal/dashboard-reportes`.
5. Si una vista no existe en una configuración antigua, utilizar el default actual del frontend para esa clave.

Mientras el endpoint no esté disponible, el frontend conserva `localStorage` como almacenamiento local. La persistencia entre dispositivos empieza cuando backend implemente estos endpoints y el frontend se conecte a ellos.

## Fuera de alcance

Este contrato cubre las preferencias personales de pantalla. No incluye plantillas compartidas, publicación de tableros, ni una nueva API agregada de ventas. La consulta `GET /api/v1/dashboard/kpis/metas-empleados-cumplidas` continúa entregando los datos semanales de metas; la configuración solo decide si se muestra y con qué vista.

## Entrega requerida para quien implemente backend

Al terminar la implementación, genera un segundo archivo Markdown llamado `integracion-configuracion-kpis-frontend.md` y entrégalo junto con los cambios de backend. Debe documentar la API que quedó implementada realmente, no solo copiar esta propuesta. Incluye:

- URL base y rutas finales de consulta y guardado.
- Métodos HTTP, autenticación JWT, permisos y códigos de respuesta.
- Ejemplos completos de request y response con la estructura exacta que debe consumir el frontend.
- Campos requeridos y opcionales, valores por defecto, validaciones y comportamiento para usuarios sin configuración.
- Cómo obtener el usuario desde el JWT y cómo se garantiza el aislamiento entre cuentas.
- Cualquier diferencia respecto de este contrato, migración de base de datos necesaria y pasos para probar los endpoints.
- Instrucciones concretas para que el frontend conecte `/dashboard/principal/configuracion-kpis` y aplique las preferencias en `/dashboard/principal/dashboard-reportes`.

Al entregar ese archivo, indica explícitamente a la persona usuaria: **“Pásaselo al front para integrar la API.”** La integración frontend queda pendiente hasta que backend proporcione este documento final con las rutas y payloads verificados.
