# 2. Confirmación de solicitudes de stock

**Ruta del front:** `/dashboard/principal/confirmacion-stock` (menú Operación → Almacén).
**Para quién:** responsable de almacén.

## Reglas de negocio
1. Vista **Pendientes** (`SOLICITADO`, con contador) y vista **Todas**; filtro por área.
2. Por solicitud se ve: folio, área, insumo, cantidad solicitada, **nota del área**, existencia en el almacén, quién y cuándo la pidió.
3. **Aceptar**: el almacén captura la **cantidad a entregar** (por defecto la solicitada; puede ser menor) y un comentario opcional. Pasa a `ACEPTADO` y se notifica al área (`SOLICITUD_STOCK_RESPUESTA`).
4. **Rechazar**: comentario (motivo) y pasa a `RECHAZADO`; se notifica al área.
5. Solo se aceptan o rechazan solicitudes en `SOLICITADO`.
6. La existencia del almacén **no se descuenta al aceptar**: se descuenta cuando el área **firma de recibido** (regla 24 del inventario diario). Si el backend prefiere apartar al aceptar, avisar al front.
7. Llegando desde una notificación (`?folio=SDS-00004`) el front resalta esa fila; si ya no está pendiente, cambia a «Todas».

## Endpoints
| Método | Ruta | Cuerpo |
|--------|------|--------|
| GET | `inventario-diario/solicitudes?estatus=SOLICITADO&areaId=` | — |
| PUT | `inventario-diario/solicitudes/:id/aceptar` | `{ cantidadAEntregar, comentario? }` |
| PUT | `inventario-diario/solicitudes/:id/rechazar` | `{ comentario }` |

Responder la solicitud actualizada (incluyendo `confirmadoPor` con nombre y `fechaConfirmacion`).
