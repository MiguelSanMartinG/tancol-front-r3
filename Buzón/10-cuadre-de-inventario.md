# 10. Cuadre de inventario: tipo y categorías (28-11-2026)

**Ruta del front:** `/dashboard/principal/cuadre-inventario` (endpoints `cuadre-inventario/...`).

## Qué cambió en el front
1. **Tipo de cuadre** (obligatorio) en «Nuevo cuadre», antes del almacén: Diario, Semanal, Mensual, Trimestral, Semestral o Anual. Se ve en la columna «Tipo» del listado (con filtro) y en el detalle.
2. **Categorías** (opcional, una o varias) en «Nuevo cuadre». Sin categorías se cuenta **todo el almacén**; con categorías, solo los insumos de esas categorías **en ese almacén**. Se ven en la columna «Categorías» del listado y en el detalle.
3. Botones de «Acciones» alineados a la izquierda (solo front).

## Lo que necesita el backend
| Endpoint | Cambio |
|----------|--------|
| `POST cuadre-inventario` | Cuerpo `{ idAlmacen, tipo, idsCategoria: [] }`. `tipo` ∈ `DIARIO, SEMANAL, MENSUAL, TRIMESTRAL, SEMESTRAL, ANUAL` (obligatorio). Si `idsCategoria` trae ids, las partidas se generan **solo con los productos de esas categorías** (incluir sus subcategorías) que tengan registro en el almacén; vacío = todo el almacén. `409` si con esas categorías no queda ninguna partida («El almacén no tiene insumos de las categorías elegidas»). |
| `GET cuadre-inventario/:id`, `GET cuadre-inventario/page`, `GET cuadre-inventario` | Devolver `tipo` y `categorias: [{ id, nombre }]` (vacío si es de todo el almacén). |
| `GET cuadre-inventario/page` | Aceptar el filtro `tipo` (igual que `estado`). |
| Regla de un cuadre abierto por almacén | Hoy: `409` si ya hay uno abierto. Con categorías se podría permitir uno abierto **por categoría** sin que se crucen; definirlo. |

> **Ojo:** mientras el backend ignore `tipo` e `idsCategoria`, «Nuevo cuadre» seguirá creando el cuadre de **todo el almacén** y sin tipo (la columna muestra «—»).

## «Nuevo cuadre» con totales (28-11)
Orden de los campos: **Tipo → Almacén → Categorías**.
- **Almacén** muestra cuántos insumos tiene («Bodega San Antonio · 900 insumos»). Los que tienen 0 se ven en gris y no se pueden elegir.
- **Categorías** se habilita al elegir el almacén y muestra **solo las categorías con insumos en ese almacén**, con su total («Barnices · 20», «Componentes eléctricos · 8»).
- Un resumen dice cuántos insumos se van a contar antes de crear el cuadre.
- Si el almacén ya tiene un cuadre abierto, se avisa con un botón para ir a él y no deja crear otro.

**Cómo lo calcula hoy el front (sin cambios en el backend):** una sola consulta `GET inventario` (Inventario inicial). Cuenta los productos distintos por `almacen.idAlmacen` y, dentro de cada almacén, por `producto.categoria`. Los cuadres abiertos salen de `GET cuadre-inventario?estado=ABIERTO`.

**Lo que conviene que el backend mande (opcional, para no descargar todo el inventario):**
- `totalInsumos` en cada almacén de `GET almacen` → el front ya lo usa si llega.
- `GET cuadre-inventario/almacenes/:idAlmacen/categorias` → `[{ idCategoria, nombre, nombreCategoriaPadre, totalInsumos }]`. Avisar al front para cambiar a esta consulta.
