# 4. Registro de módulos y permisos

## Módulos nuevos
**Estado: conectado.** El menú, la búsqueda y el acceso por URL dependen de los permisos del rol.

1. Alta en **Configuración → Módulos** (o por base de datos) con padre **Operación**:
   | Nombre | Ruta (segmento) |
   |--------|-----------------|
   | Inventario diario de insumos | `inventario-diario` |
   | Confirmación de solicitudes de stock | `confirmacion-stock` |
2. El backend los da de alta con los permisos de Inventario general; se ajustan por rol.

## Permisos de negocio (dentro de los módulos)

| Permiso | Habilita |
|---------|----------|
| Responsable de área | Confirmar el cupo del día; agregar, editar y eliminar tarjetas; elegir a qué áreas puede entrar |
| Responsable de almacén | Aceptar o rechazar solicitudes en Confirmación de stock |

Al entrar, el front consulta **qué áreas / almacenes** tiene a cargo: `GET inventario-diario/mis-permisos` → `{ esAdmin, responsableArea: [areaIds], responsableAlmacen: [almacenIds] }`. Se usan las dos listas; `esAdmin` por sí solo no habilita nada en el front. Confirmar el cupo y aceptar/rechazar se habilitan con esas listas; las demás reglas las valida el backend.
