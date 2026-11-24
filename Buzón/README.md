# Buzón para backend

Lo que el front ya dejó listo y que necesita al backend para funcionar con datos reales.
Cada documento explica **qué hace la pantalla, las reglas de negocio, los datos y los endpoints** que espera el front.

> Se actualiza con cada cambio que se pide en el front. La fecha de la última actualización está al final de este archivo.

## Estado

| # | Tema | Prioridad | Estado en el front | Qué necesita del backend |
|---|------|-----------|--------------------|--------------------------|
| 1 | [Inventario diario de insumos](01-inventario-diario-insumos.md) | Alta | Diseño terminado con datos de ejemplo en memoria | Modelo, endpoints y cierre diario |
| 2 | [Confirmación de solicitudes de stock](02-confirmacion-solicitudes-stock.md) | Alta | Diseño terminado con datos de ejemplo | Endpoints de aceptar / rechazar |
| 3 | [Notificaciones del inventario diario](03-notificaciones.md) | Alta | Tipos, textos y navegación listos | Crear los 3 tipos y generarlos |
| 4 | [Registro de módulos y permisos](04-modulos-y-permisos.md) | Alta | Módulos visibles para todos (modo diseño) | Dar de alta módulos, rutas y permisos |
| 5 | [Catálogos que se requieren](05-catalogos-requeridos.md) | Alta | Usa datos de ejemplo | Campos nuevos en almacén, departamento e inventario inicial |
| 6 | [Filtros de fecha en consultas y reportes](06-filtros-de-fecha.md) | Media | Terminado | Confirmar cómo interpreta los rangos |
| 7 | [Preferencias por usuario](07-preferencias-de-usuario.md) | Baja | Se guardan en el navegador | Opcional: guardarlas por usuario |
| 8 | [Cambios solo de front](08-cambios-solo-front.md) | — | Terminado | Nada (referencia) |

## Convenciones

- Base de la API: `environment.apiUrl` (hoy `https://back.purificadoratancol.com/api/v1/`). Las rutas de este buzón son relativas a esa base.
- Fechas: ISO 8601 en hora local del negocio (America/Mexico_City). Rangos: inicio a las 00:00:00 y fin a las 23:59:59.999.
- Folios: `IDI-00001` (partidas de inventario diario) y `SDS-00001` (solicitudes de stock). Los genera el backend.
- Firmas: el front envía la imagen de la firma como archivo (mismo componente de firma que Bitácora de ventas). Ver cada endpoint.
- Errores de regla de negocio: responder `409` o `422` con `{ "mensaje": "texto para el usuario" }`; el front muestra ese texto tal cual.

## Dónde está el código del front

| Tema | Archivos |
|------|----------|
| Inventario diario | `src/app/dashboard/modules/inventario-diario/` (el servicio `services/inventario-diario.service.ts` tiene un comentario `API:` en cada método) |
| Confirmación de stock | `src/app/dashboard/modules/confirmacion-stock/` |
| Notificaciones | `src/app/core/services/notificaciones.service.ts`, `src/app/dashboard/principal/notificacion-vista.ts` |
| Modo diseño (quitar al conectar) | `MODULOS_EN_DISENO` en `src/app/dashboard/navigation/funcionalidades.data.ts` y su uso en `src/app/core/guards/auth.guard.ts` |

---
Última actualización: 2026-11-23 · versión del front 1.2.0
