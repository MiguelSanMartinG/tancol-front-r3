# 1. Inventario diario de insumos

**Ruta del front:** `/dashboard/principal/inventario-diario` (menú Operación → Almacén).
**Para quién:** responsable de cada área (Producción, Autoservicio, Distribución…).

## Idea general

El inventario físico vive **solo en el almacén** (Inventario inicial). Cada área tiene un **cupo diario por insumo**: cuánto puede usar ese día.
Cada **partida** (entrega) descuenta del cupo y del almacén al mismo tiempo. Lo que no se usa en el día **nunca salió del almacén**.
Si el cupo se acaba, el área **solicita stock** al almacén para ampliar el cupo del día.

## Reglas de negocio

### Cupo diario (tarjetas)
1. Cada tarjeta = un insumo para un área, con: **almacén** de donde sale, **cupo base diario** y **mínimo para solicitar**.
2. Cada área tiene **4 tarjetas por defecto** (Envase 20 L, Envase 11 L, Bolsa de hielo 3 kg, Bolsa de hielo 5 kg) que **no se pueden eliminar**; solo editar base y mínimo.
3. El usuario puede **agregar tarjetas**: elige almacén → el combo de insumos muestra **solo los insumos que existen en ese almacén** (con su existencia y unidad) y que el área aún no tiene. Estas sí se pueden eliminar.
4. Validación: `minimo < base` y `base ≥ 1`. Un área no puede tener dos tarjetas del mismo insumo.
5. Disponible del día = `inicial + ampliado − consumido`.
   - `inicial`: lo que se entregó al confirmar el día (la base, o menos si el almacén no alcanzó).
   - `ampliado`: suma de lo recibido por solicitudes de stock en el día.
   - `consumido`: suma de las partidas del día.
6. La tarjeta muestra la existencia del insumo en su almacén con la **unidad de medida del insumo** (catálogo), p. ej. «Almacén Planta: 5,200 bolsas».
7. Editar la base aplica desde hoy si alcanza el almacén.

### Confirmación del día (obligatoria)
8. **(Cambió 28-11: ya no es obligatorio; ver [09](09-inventario-diario-ajustes.md).)** Al entrar a un área sin confirmar hoy, el responsable de área debe **confirmar el cupo del día**. Sin confirmación **no se pueden registrar partidas** ni pedir stock.
9. Al confirmar, por cada tarjeta se entrega `min(base, existencia en su almacén)`.
   Si el almacén no alcanza: se entrega lo disponible, la tarjeta queda marcada **«Dotación incompleta: faltaron N»** y se **notifica al responsable de almacén** (notificación `DOTACION_INCOMPLETA`).
10. **(Cambió 28-11, ver [09](09-inventario-diario-ajustes.md#confirmación-del-cupo-del-día-28-11): lo que queda se arrastra al día siguiente.)** **Cierre diario a las 23:59:59**: el cupo vuelve a la base para el día siguiente (nueva confirmación). `ampliado` y `consumido` se reinician. No hay devolución física porque lo no usado nunca salió del almacén.

### Partidas
11. Campos: ruta (opcional), insumo (de las tarjetas del área), cantidad, concepto de entrega, comentario (opcional), roto por (solo «Cambio por roto»).
12. Conceptos: `VENTA`, `CAMBIO`, `CAMBIO_ROTO`, `DONADO`, `HUECO`.
13. **No se puede exceder el disponible del cupo**. El error debe decir el disponible: «Supera el cupo disponible (N)».
14. «Roto por» es **obligatorio solo** con `CAMBIO_ROTO`; puede ser un empleado o `MAQUINA`.
15. **Firmante**: si fue `CAMBIO_ROTO` por un empleado, firma ese empleado; en cualquier otro caso firma el usuario en sesión.
16. ~~Al guardar: descuenta del cupo y de la existencia del almacén en la misma transacción.~~ **Cambió (27-11):** descuenta **al firmar**; ver [09](09-inventario-diario-ajustes.md).
17. Las partidas **sin firma** se pueden **editar** (por celda en la tabla o en el detalle) y **eliminar**:
    - Editar cantidad o insumo: se regresa lo anterior al cupo/almacén y se descuenta lo nuevo; la validación del cupo considera lo que ya tenía la partida.
    - Eliminar: la cantidad regresa al cupo y al almacén.
18. **Firmada = bloqueada**: no se edita ni se elimina.

### Solicitudes de stock
19. Se piden **desde la tarjeta**. Solo se habilita cuando el disponible ≤ mínimo, el día está confirmado y **no hay otra solicitud abierta** (Solicitado o Aceptado) de ese insumo en el área.
20. Cantidad sugerida: `base − disponible`. Nota opcional para el almacén.
21. Estatus: `SOLICITADO` → `ACEPTADO` | `RECHAZADO` (lo decide el almacén) → `RECIBIDO` | **`DECLINADO`** (27-11: el solicitante no acepta lo entregado; ver [09](09-inventario-diario-ajustes.md)). El solicitante puede pasar a `CANCELADO` solo desde `SOLICITADO`.
22. Mientras está `SOLICITADO` el solicitante puede ajustar cantidad y nota.
23. Al `ACEPTADO`, el almacén define la **cantidad a entregar** (puede ser menor a la pedida) y un comentario.
24. **Recibir**: el solicitante captura la cantidad recibida (1…cantidad a entregar; viene llena con lo autorizado) y **firma**. Al firmar, la cantidad recibida **se suma a `ampliado`** del cupo de hoy y la solicitud queda `RECIBIDO` (bloqueada).
25. Al crear, aceptar o rechazar se notifica (ver [Notificaciones](03-notificaciones.md)).
26. La pestaña «Solicitudes de stock» es **solo consulta**: muestra las del rango de fechas **y siempre las abiertas aunque sean de días anteriores**.

### Filtros de la pantalla
27. ~~Rango de fechas, área y empleado.~~ **Cambió (27-11):** rango de fechas, empleado, ruta, insumo, roto por y firmado; el área se elige junto a las pestañas. Ver [09](09-inventario-diario-ajustes.md).

## Modelo de datos sugerido

```text
CupoDiario            id, areaId, insumoId, almacenId, porDefecto(bool), base, minimo
CupoDia (por fecha)   cupoId, fecha(AAAA-MM-DD), inicial, ampliado, consumido   ← o calcularlo
ConfirmacionDia       areaId, fecha, confirmadoPor(empleadoId), confirmadoEn
PartidaInventario     id, folio(IDI-#####), fecha, areaId, rutaId?, insumoId, cantidad,
                      concepto, comentario, rotoPor(empleadoId|'MAQUINA')?, usuarioId,
                      firmanteId, firma(archivo)?, fechaFirma?
SolicitudStock        id, folio(SDS-#####), areaId, insumoId, almacenId, cantidadSolicitada, nota,
                      solicitadoPor, fechaSolicitud, estatus, cantidadAEntregar?, comentario?,
                      confirmadoPor?, fechaConfirmacion?, cantidadRecibida?, recibidoPor?,
                      fechaRecepcion?, firma(archivo)?
```

## Endpoints que espera el front

| Método | Ruta | Cuerpo | Notas |
|--------|------|--------|-------|
| GET | `inventario-diario/areas/:areaId/cupos?fecha=` | — | Tarjetas con `inicial/ampliado/consumido/disponible`, existencia del almacén, unidad y solicitud abierta |
| POST | `inventario-diario/cupos` | `{ areaId, almacenId, insumoId, base, minimo }` | Tarjeta nueva (`porDefecto=false`) |
| PUT | `inventario-diario/cupos/:id` | `{ base, minimo }` | |
| DELETE | `inventario-diario/cupos/:id` | — | `409` si `porDefecto` |
| GET | `inventario-diario/areas/:areaId/confirmacion?fecha=` | — | `null` si no se ha confirmado |
| GET | `inventario-diario/areas/:areaId/confirmacion/previa` | — | Por tarjeta: base, existencia, se entrega, faltante |
| POST | `inventario-diario/confirmaciones` | `{ areaId }` | Devuelve faltantes; genera `DOTACION_INCOMPLETA` si aplica |
| GET | `inventario-diario/partidas?areaId=&inicio=&fin=&empleadoId=` | — | Más recientes primero |
| POST | `inventario-diario/partidas` | `{ areaId, rutaId?, insumoId, cantidad, concepto, comentario?, rotoPor? }` | Valida cupo; devuelve la partida con folio y firmante |
| PUT | `inventario-diario/partidas/:id` | campos editables | `409` si firmada o excede cupo |
| DELETE | `inventario-diario/partidas` | `{ ids: [] }` | Solo sin firma; devuelve cuántas se eliminaron |
| POST | `inventario-diario/partidas/:id/firma` | `multipart: archivo` | Bloquea la partida |
| GET | `inventario-diario/solicitudes?areaId=&inicio=&fin=&empleadoId=&estatus=` | — | Incluir abiertas de días anteriores |
| POST | `inventario-diario/solicitudes` | `{ areaId, insumoId, cantidad, nota? }` | Aplica regla 19; notifica `SOLICITUD_STOCK_NUEVA` |
| PUT | `inventario-diario/solicitudes/:id` | `{ cantidadSolicitada?, nota?, cantidadRecibida? }` | Solo sin firma (regla 22 y 24) |
| PUT | `inventario-diario/solicitudes/:id/cancelar` | — | Solo `SOLICITADO` |
| PUT | `inventario-diario/solicitudes/:id/recibir` | `multipart: { cantidadRecibida, archivo }` | Suma a `ampliado` |
| GET / PUT | `inventario-diario/tarjetas/preferencias` | `{ orden: [], minimizadas: [] }` | Opcional, ver [Preferencias](07-preferencias-de-usuario.md) |

## Datos de catálogo que usa
Áreas = Departamentos (con su almacén asignado), almacenes, insumos con unidad de medida, existencias del Inventario inicial por almacén, empleados y rutas. Ver [Catálogos requeridos](05-catalogos-requeridos.md).

## Totalizador (pie de la tabla)
Lo calcula el front con las partidas visibles: por insumo y concepto (venta, cambio, cambio por roto, donado, hueco, total, sin firmar) y por ruta e insumo. No requiere endpoint.
