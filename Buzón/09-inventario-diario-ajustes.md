# 9. Inventario diario: ajustes del 27-11-2026

Cambios pedidos sobre `/dashboard/principal/inventario-diario`. El front ya está hecho. Esta tabla dice qué necesita del backend cada cambio.

| # | Cambio | Front | Backend |
|---|--------|-------|---------|
| 1 | Las partidas descuentan del cupo y del almacén **solo al firmarse**. La recepción de stock ya suma solo al firmar. | La tarjeta muestra lo firmado y la etiqueta «−N por firmar». | **Sí**: mover el descuento a la firma y mandar `pendienteFirma` en cada cupo (ver abajo). |
| 2 | En «Agregar insumo», cada almacén muestra cuántos insumos tiene registrados («400 insumos»). Los que no tienen registro salen en gris y no se pueden elegir. | Hecho: cuenta con `almacenes/:id/insumos`. | Opcional: mandar `totalInsumos` en `catalogos.almacenes` para no pedir un almacén por uno. |
| 3 | El usuario solo ve los almacenes que tiene permitidos. Si no tiene ninguno asignado, ve todos. | Hecho con `mis-permisos`: almacenes a cargo + almacenes de sus áreas. El administrador ve todos. | **Sí**: validar en `POST inventario-diario/cupos` que el almacén y el insumo le estén permitidos (`403` con mensaje). |
| 4 | Foto del insumo en la tarjeta (miniatura; al hacer clic se ve en grande). | Hecho: se toma de `producto.idImagen`. | Opcional: mandar `idImagen` en cada cupo para no consultar el catálogo de productos. |
| 10 | Las partidas solo se editan y eliminan **el mismo día** (hasta las 23:59:59). Después quedan de consulta con el filtro de fechas. | Hecho: las de días anteriores se ven bloqueadas. | **Sí**: `409` en `PUT` y `DELETE` de partidas que no sean de hoy (hora de México). La firma de una partida pendiente de otro día sigue permitida. |
| 12 | En Solicitudes de stock se ven **las dos firmas**: la de entrega del almacén y la de recibido del solicitante, con sus nombres. | Hecho: lee `firmaAlmacen` y `fechaFirmaAlmacen`; mientras no lleguen, dice «Sin firma». | **Sí**: guardar la firma del responsable del almacén (ver abajo). |

| 3b | Al enviar una solicitud, el solicitante tiene **120 segundos** para ajustar la cantidad y la nota. Después los campos se ven bloqueados y solo puede cancelarla mientras el almacén no responda. | Hecho: cuenta desde `fechaSolicitud`. | **Sí**: `409` en `PUT solicitudes/:id` si pasaron más de 120 s desde `fechaSolicitud` («Ya no se puede editar: pasaron 2 minutos desde que se envió»). |
| 4b | Solo quien **agregó** una tarjeta la puede eliminar; a los demás no se les muestra el botón. Las tarjetas por defecto no se eliminan. | Hecho: compara `creadoPorId` con `userInfo.idEmpleado`. **Mientras no llegue `creadoPorId`, nadie ve el botón.** | **Sí**: guardar quién creó la tarjeta, mandar `creadoPorId` y `creadoPor` en cada cupo, y responder `403` en `DELETE cupos/:id` si no es el creador. |
| 5b | Al aceptar o rechazar, el solicitante recibe la notificación `SOLICITUD_STOCK_RESPUESTA` **sin recargar**. | Hecho: revisa las notificaciones cada minuto sin pantalla de carga, muestra un aviso emergente y actualiza la tarjeta y la tabla. | **Sí**: generar `SOLICITUD_STOCK_RESPUESTA` para **quien solicitó** (`solicitadoPorId`), además de los del rol. Ver [03](03-notificaciones.md). |

| 13 | **Declinar** lo entregado: en «Recibir y firmar» el solicitante puede no aceptar lo que le dieron. No se suma nada al cupo, el insumo se queda en el almacén y se habilita otra vez «Solicitar stock». | Hecho: confirmación con motivo opcional. Si el endpoint no existe, avisa «Esta acción aún no está habilitada en el servidor». | **Sí**: `PUT inventario-diario/solicitudes/:id/declinar` con `{ motivo? }`, solo en `ACEPTADO` y sin firma → estatus nuevo **`DECLINADO`**; guardar el motivo en `comentario` y la fecha en `fechaRecepcion`; quitar `solicitudAbierta` del cupo y notificar al almacén. |
| 14 | Al aceptar, el almacén ve cuánto le **quedará**: «En almacén 50 → se entregan 25 → quedarán 25». No deja aceptar más de lo que hay. | Hecho. | **Sí**: `409` en `aceptar` si `cantidadAEntregar > existencia`, y volver a validar la existencia en `recibir` (pudo cambiar entre aceptar y recibir). |
| 15 | Si se recibe **menos** de lo autorizado, no se vuelve a autorizar. Lo recibido cierra la solicitud, se avisa al almacén cuánto faltó, y si necesitan más piden otra solicitud. Nunca se puede recibir más de lo autorizado. | Hecho: tope en lo autorizado y aviso «Faltan N». | **Sí**: al `recibir` con `cantidadRecibida < cantidadAEntregar`, notificar al responsable del almacén (puede ser `DOTACION_INCOMPLETA` o un tipo nuevo `ENTREGA_INCOMPLETA`). |

| 16 | «Solicitar stock» se habilita solo cuando **lo firmado** llega al mínimo. Lo registrado sin firma no cuenta, porque aún no confirma que se necesite. | Hecho: compara `disponible + pendienteFirma` con el mínimo; si falta firmar, el botón dice por qué. | **Sí** (regla 19): validar en `POST solicitudes` con `inicial + ampliado − firmado ≤ minimo`, sin restar lo pendiente de firma. |

Los demás puntos (íconos de la tarjeta, filtros, totalizadores, columnas ajustables, paginación y textos) son solo de front.

## 1. Descontar al firmar

Reglas que cambian en [01](01-inventario-diario-insumos.md):

- **Regla 16:** al **guardar** una partida ya no se descuenta. Se descuenta del cupo (`consumido`) y de la existencia del almacén **al firmarla**, en la misma transacción.
- **Regla 13:** para no pasarse del cupo, la validación sigue contando lo registrado sin firmar: `inicial + ampliado − firmado − pendiente ≥ cantidad`.
- **Regla 17:** editar o eliminar una partida sin firma ya no regresa nada al almacén, porque aún no se había descontado.

Campos de `GET inventario-diario/areas/:areaId/cupos`:

| Campo | Significado |
|-------|-------------|
| `consumido` | Solo lo firmado |
| `pendienteFirma` | **Nuevo**: suma de las partidas de hoy sin firma |
| `disponible` | Lo que aún se puede registrar: `inicial + ampliado − consumido − pendienteFirma` |
| `existencia` | Existencia real del almacén (solo descuenta lo firmado) |

> Mientras no llegue `pendienteFirma`, el front lo calcula con `GET partidas?areaId=&inicio=hoy&fin=hoy` y lo suma a `disponible` y a `existencia` para mostrar lo firmado. Cuando el backend lo mande, el front deja de calcularlo.

## 12. Firma del almacén

- Al **aceptar** una solicitud (Confirmación de stock), el responsable del almacén firma la entrega.
- Propuesta: `POST inventario-diario/solicitudes/:id/firma-almacen` con `multipart: archivo` (igual que las otras firmas), o bien aceptar el `archivo` en `PUT .../aceptar` como `multipart`.
- La solicitud debe responder `firmaAlmacen` (nombre del archivo) y `fechaFirmaAlmacen`.
- **El front todavía no la captura** en Confirmación de stock. Se agrega cuando exista el endpoint, para no romper «Aceptar» en producción.

## Filtros de la pantalla (reemplaza la regla 27)

Rango de fechas, empleado, ruta, insumo, roto por y firmado (sí/no). El área ya no es un filtro: se elige junto a las pestañas. Los filtros son los mismos en las dos pestañas; en Solicitudes, Ruta y Roto por se desactivan porque no aplican. Ruta, insumo, roto por y firmado los aplica el front sobre lo que regresa la API; si se vuelven pesados, se pueden mandar como parámetros (`rutaId`, `insumoId`, `rotoPor`, `firmado=true|false`).

## Partidas sin firmar al cierre del día (decisión 28-11)
**Se quedan así**: no se cancelan ni se firman solas. Siguen sin descontar del cupo ni del almacén y, como son de un día anterior, ya no se editan ni se eliminan (regla 10). Se pueden firmar después; el backend define a qué día cuenta el descuento (recomendado: al día de la partida, no al de la firma).

## Solicitudes de stock: «Mis solicitudes»
El front filtra con `solicitadoPorId` contra `userInfo.idEmpleado`. Asegurar que `GET solicitudes` mande `solicitadoPorId` con el id de empleado.

## Iniciar el día (28-11, reemplaza la «confirmación obligatoria»)

**Ya no es obligatorio.** Si nadie inicia el día, el área trabaja con el **cupo base** de cada tarjeta: registra partidas y pide stock sin esperar. «Iniciar día» es una acción **opcional** del responsable de área para cambiar con cuánto inicia cada insumo.

**Diálogo «Iniciar día»:** Insumo · Almacén · Cupo base · **Cerró ayer** · **Para completar** (`base − cerró ayer`) · En almacén · **Inicia el día con** (editable, mayor o menor; viene con la base).
Ejemplo: base 25 y ayer cerró con 10 → para completar 15 → «Inicia el día con» 25 → salen 15 del almacén.

### Lo que necesita el backend
1. **Sin confirmación también se trabaja**: quitar la regla 8 del [01](01-inventario-diario-insumos.md). Sin confirmación hoy, `inicial = base` (o `cierreAnterior + lo necesario`), y se permiten partidas y solicitudes.
   - Mientras no cambie, el front muestra la base cuando `inicial = 0` sin confirmación. **Pero el backend puede rechazar las partidas con su mensaje actual.**
2. **`GET areas/:areaId/confirmacion/previa`**: agregar `cierreAnterior` por renglón. Es lo firmado que le quedó al área el día anterior. Mientras no llegue, el front usa 0.
3. **`POST confirmaciones`** con las cantidades:
   ```json
   { "areaId": "…", "entregas": [ { "cupoId": "…", "insumoId": "…", "cierreAnterior": 10, "iniciaCon": 25, "entrega": 15 } ] }
   ```
   - `inicial` del día = `iniciaCon`. Sale del almacén `entrega = max(0, iniciaCon − cierreAnterior)`. Validar `entrega ≤ existencia` (`409`).
   - Si no llega `entregas`, mantener el comportamiento actual.
   - Lo que queda al cierre **se arrastra** al día siguiente como `cierreAnterior`; ya no «regresa» al almacén (cambia la regla 10).
4. **Registro en Solicitudes de stock**: por cada renglón con `entrega > 0`, crear una solicitud con:
   - `tipo = "DOTACION"` (campo nuevo; las demás son `SOLICITUD`), con folio `SDS-…`.
   - `cantidadSolicitada = cantidadAEntregar = cantidadRecibida = entrega` y `nota` «Cerró ayer con N; inicia con M».
   - estatus `RECIBIDO`; `solicitadoPor` y `recibidoPor` = quien inició el día.
   - El front ya las muestra como «Dotación del día».
5. Seguir generando `DOTACION_INCOMPLETA` si el almacén no alcanza.

> **Ojo:** hoy el backend ignora `entregas` y entrega la base. Hasta que se publique, lo que se cambie en «Inicia el día con» **no se guarda**.
