# 3. Notificaciones del inventario diario

El front ya usa el sistema de notificaciones existente (`GET notificaciones`, campana superior y pantalla Notificaciones).
Falta que el backend **dé de alta 3 tipos** y **genere** las notificaciones.

## Tipos
| Código | Cuándo se genera | Para quién | Al abrirla el front lleva a |
|--------|------------------|------------|-----------------------------|
| `SOLICITUD_STOCK_NUEVA` | Al crear una solicitud de stock | Responsable del almacén de la tarjeta | Confirmación de solicitudes, con la fila resaltada |
| `SOLICITUD_STOCK_RESPUESTA` | Al aceptar o rechazar | Quien solicitó (o responsables del área) | Inventario diario, área e insumo de la solicitud |
| `DOTACION_INCOMPLETA` | Al confirmar el día si el almacén no alcanzó | Responsable del almacén | Inventario diario |

Los tipos deben aparecer en **Configuración → Roles de empleados → Permisos → «Notificaciones para este rol»** para activarlos por rol (`GET notificaciones/tipos`, `GET/PUT notificaciones/roles/:roleId`).

## Texto del campo `mensaje` (el front lo presenta en renglones)
Respetar el formato; si llega distinto se muestra como texto corrido y **se pierde el resaltado del folio**.

```text
SOLICITUD_STOCK_NUEVA      El área Producción solicitó 20 de Envase 20 L (SDS-00004) al Almacén Planta.
SOLICITUD_STOCK_RESPUESTA  El Almacén Planta aceptó la solicitud SDS-00004 de Envase 20 L: entregará 20.
SOLICITUD_STOCK_RESPUESTA  El Almacén Planta rechazó la solicitud SDS-00004 de Envase 20 L. Motivo: sin existencia.
DOTACION_INCOMPLETA        Dotación incompleta en Producción: Bolsa de hielo 5 kg recibió 450 de 700 del Almacén Planta.
```

Títulos sugeridos (`titulo`): «Nueva solicitud de stock», «Respuesta del almacén», «Dotación incompleta».

## Pendiente de definir
- ¿A quién va exactamente? Opción A: a todos los del rol que tenga el tipo activado. Opción B (recomendada): solo al **responsable del almacén** correspondiente → requiere el campo de responsable en almacén ([Catálogos](05-catalogos-requeridos.md)).
