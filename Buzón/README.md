# Buzón para backend

Lo que el front ya dejó listo y que necesita al backend para funcionar con datos reales.
Cada documento explica **qué hace la pantalla, las reglas de negocio, los datos y los endpoints** que espera el front.

> Se actualiza con cada cambio que se pide en el front. La fecha de la última actualización está al final de este archivo.

## Estado

| # | Tema | Prioridad | Estado en el front | Qué necesita del backend |
|---|------|-----------|--------------------|--------------------------|
| 1 | [Inventario diario de insumos](01-inventario-diario-insumos.md) | Alta | **Conectado** a `inventario-diario/...` | Publicar la rama `feat/inventario-diario` |
| 2 | [Confirmación de solicitudes de stock](02-confirmacion-solicitudes-stock.md) | Alta | **Conectado** (aceptar / rechazar) | Publicar la rama `feat/inventario-diario` |
| 3 | [Notificaciones del inventario diario](03-notificaciones.md) | Alta | Tipos, textos y navegación listos | Crear los 3 tipos y generarlos |
| 4 | [Registro de módulos y permisos](04-modulos-y-permisos.md) | Alta | **Conectado**: visibilidad por permisos del rol y `mis-permisos` | Dar de alta los módulos (incluido en la rama) |
| 5 | [Catálogos que se requieren](05-catalogos-requeridos.md) | Alta | **Conectado**: almacén del departamento y responsable del almacén | Publicar los campos nuevos |
| 6 | [Filtros de fecha en consultas y reportes](06-filtros-de-fecha.md) | Media | Terminado | Confirmar cómo interpreta los rangos |
| 7 | [Preferencias por usuario](07-preferencias-de-usuario.md) | Baja | Se guardan en el navegador | Nada: el endpoint existe, el front aún no lo usa |
| 8 | [Cambios solo de front](08-cambios-solo-front.md) | — | Terminado | Nada (referencia) |

## Convenciones

- Base de la API: `environment.apiUrl` (hoy `https://back.purificadoratancol.com/api/v1/`). Las rutas de este buzón son relativas a esa base.
- Fechas: ISO 8601 en hora local del negocio (America/Mexico_City). Rangos: inicio a las 00:00:00 y fin a las 23:59:59.999. En `inventario-diario/...` los filtros `fecha`, `inicio` y `fin` son `AAAA-MM-DD`.
- Folios: `IDI-00001` (partidas de inventario diario) y `SDS-00001` (solicitudes de stock). Los genera el backend.
- Firmas: el front envía la imagen de la firma como archivo PNG en `FormData` (campo `archivo`); la respuesta trae el nombre y se muestra desde `images/<nombre>`.
- Errores de regla de negocio: `409` con `{ "status": 409, "message": "texto para el usuario" }`; el front muestra ese texto tal cual.

## Dónde está el código del front

| Tema | Archivos |
|------|----------|
| Inventario diario | `src/app/dashboard/modules/inventario-diario/` (las llamadas están en `services/inventario-diario.service.ts`) |
| Confirmación de stock | `src/app/dashboard/modules/confirmacion-stock/` |
| Notificaciones | `src/app/core/services/notificaciones.service.ts`, `src/app/dashboard/principal/notificacion-vista.ts` |
| Menú y acceso | `src/app/dashboard/navigation/funcionalidades.data.ts`, `src/app/core/guards/auth.guard.ts` |

---
Última actualización: 2026-11-24 · versión del front 1.2.0
