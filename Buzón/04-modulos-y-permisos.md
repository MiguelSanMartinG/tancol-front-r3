# 4. Registro de módulos y permisos

## Módulos nuevos
Hoy se muestran a **todos los usuarios** porque están en modo diseño (`MODULOS_EN_DISENO`). Para conectarlos:

1. Dar de alta en **Configuración → Módulos** (o por base de datos) con padre **Operación**:
   | Nombre | Ruta (segmento) |
   |--------|-----------------|
   | Inventario diario de insumos | `inventario-diario` |
   | Confirmación de solicitudes de stock | `confirmacion-stock` |
2. Asignar los perfiles (lectura/escritura/actualización/eliminación) a los roles que correspondan.
3. **Avisar al front** para quitar `MODULOS_EN_DISENO` (en `funcionalidades.data.ts` y `auth.guard.ts`); desde ese momento la visibilidad depende de los permisos.

## Permisos de negocio (dentro de los módulos)
El front hoy asume que el usuario tiene ambos. Se proponen como **Permisos avanzados** por empleado:

| Permiso | Habilita |
|---------|----------|
| Responsable de área | Confirmar el cupo del día; agregar, editar y eliminar tarjetas; elegir a qué áreas puede entrar |
| Responsable de almacén | Aceptar o rechazar solicitudes en Confirmación de stock |

El front necesita saber, al entrar, si el usuario tiene cada permiso y **qué áreas / almacenes** tiene a cargo (endpoint sugerido: `GET inventario-diario/mis-permisos` → `{ responsableArea: [areaIds], responsableAlmacen: [almacenIds] }`).
