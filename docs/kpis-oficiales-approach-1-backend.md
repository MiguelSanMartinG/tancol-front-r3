# KPIs oficiales Tancol — Approach #1

## Objetivo

Agregar al dashboard de KPIs los indicadores oficiales solicitados por Tancol.

La información debe consultarse por periodo y respetar los permisos del usuario autenticado. La configuración visual de cada usuario se guarda por separado; este documento define los datos que backend debe exponer para alimentar los KPIs.

## KPIs solicitados

1. Consumo de clientes por día.
2. Top de clientes por consumo de PG y EXP.
3. Clientes con más equipos.
4. Clientes con equipo con mas tiempo sin consumo.
5. Devoluciones de equipos.
6. Días con mayor movimiento de equipos.
7. Días con menor movimiento de equipos.
8. Top de usos por consumo de insumos y sus tres insumos principales.
9. Top de insumos comprados.

### KPIs de insumos (contrato adicional)

El endpoint agregado `/dashboard/kpis/official` debe incluir `topDepartamentosInsumos` y `topInsumosComprados` en su respuesta:

- El periodo requiere `fechaInicio` y `fechaFin` en formato `YYYY-MM-DD`; ambas fechas son inclusivas y se interpretan en `America/Mexico_City`.
- `limit` es opcional, predeterminado `10`, y debe limitarse a un máximo de `100`.
- `topDepartamentosInsumos` agrupa por `uso`, excluye órdenes eliminadas y estado `BORRADOR`, y entrega por cada uso su total y sus tres insumos principales. Cada insumo lleva `idProducto`, nombre, cantidad y unidad.
- `topInsumosComprados` agrupa y suma por insumo y unidad; excluye órdenes eliminadas y estados `BORRADOR` y `CANCELADA`, e incluye `PENDIENTE`, `AUTORIZADO` y `COMPLETADA`.
- La respuesta usa arreglos vacíos si no hay resultados. El frontend permite navegar desde cada insumo a su detalle.

## Reglas generales

- Todos los endpoints deben aceptar `fechaInicio` y `fechaFin`.
- Las fechas deben interpretarse con zona horaria de negocio: `America/Mexico_City`.
- El periodo debe incluir la fecha inicial y la fecha final.
- La respuesta debe ser agregada por backend; el frontend no debe hacer consultas por cada cliente.
- Los registros cancelados deben excluirse por defecto.
- Debe existir un parámetro explícito para incluir cancelados cuando sea necesario.
- Los resultados deben respetar la autorización del usuario, empresa, sucursal o unidad operativa correspondiente.
- Los resultados sin datos deben devolver arreglos vacíos y totales en `0`, nunca `500`.
- Los nombres de conceptos, clientes y equipos deben devolverse listos para mostrar.
- Las cantidades deben ser numéricas y no strings.
- Los endpoints deben permitir ordenar y limitar resultados.

## Endpoint agregado recomendado

Para evitar múltiples llamadas desde el dashboard, se recomienda un endpoint agregado:

```http
GET /dashboard/kpis/official?fechaInicio=2026-08-01&fechaFin=2026-08-31&limit=10
```

Respuesta sugerida:

```json
{
  "periodo": {
    "fechaInicio": "2026-08-01",
    "fechaFin": "2026-08-31",
    "zonaHoraria": "America/Mexico_City"
  },
  "consumoClientesPorDia": [],
  "topClientesPgExp": [],
  "clientesConMasEquipos": [],
  "clientesSinConsumo": [],
  "devolucionesEquipos": {},
  "movimientoEquiposPorDia": [],
  "metadata": {
    "generadoEn": "2026-08-31T18:00:00.000Z",
    "incluyeCancelados": false
  }
}
```

Si se prefiere separar los endpoints, deben mantener los mismos nombres de campos, reglas de fechas y filtros.

---

## 1. Consumo de clientes por día

### Definición

Muestra cuántas unidades consumieron los clientes cada día del periodo seleccionado.

La unidad principal es la cantidad de producto consumido, no el importe monetario.

### Endpoint específico opcional

```http
GET /dashboard/kpis/consumo-clientes-diario?fechaInicio=2026-08-01&fechaFin=2026-08-31
```

### Respuesta

```json
[
  {
    "fecha": "2026-08-01",
    "unidades": 1250,
    "clientesAtendidos": 84,
    "importe": 45000.5
  }
]
```

### Reglas

- Agrupar por día usando la fecha de la venta/consumo.
- `unidades` debe sumar la cantidad de producto.
- `clientesAtendidos` debe contar clientes únicos del día.
- No mezclar devoluciones de equipo con consumo de producto.
- El importe es opcional, pero ayuda a visualizar unidades contra valor monetario.
- Los días sin movimiento pueden omitirse o devolverse con cero; se recomienda devolverlos con cero para que la gráfica no tenga saltos ambiguos.

---

## 2. Top de clientes por consumo de PG y EXP

### Definición

Ranking de clientes que más unidades consumieron considerando únicamente los conceptos de venta:

- `PG`
- `EXP`

El ranking debe ordenar de mayor a menor cantidad consumida.

### Endpoint específico opcional

```http
GET /dashboard/kpis/top-clientes-pg-exp?fechaInicio=2026-08-01&fechaFin=2026-08-31&limit=10
```

### Respuesta

```json
[
  {
    "idCliente": "uuid",
    "cliente": "PUBLICO GENERAL",
    "unidadesTotales": 12000,
    "unidadesPg": 8000,
    "unidadesExp": 4000,
    "importeTotal": 250000,
    "ultimaFechaConsumo": "2026-08-30"
  }
]
```

### Reglas

- Filtrar exclusivamente por los conceptos PG y EXP.
- No incluir otros conceptos como F1, BPSC, PGNP u otros.
- Agrupar por cliente.
- Mostrar total combinado y, preferentemente, desglose PG/EXP.
- Excluir cancelaciones por defecto.
- Permitir `limit` y orden descendente por `unidadesTotales`.

El reporte actual de liquidaciones ya contiene cliente, concepto y cantidad, por lo que podría reutilizarse internamente, pero se recomienda exponer una respuesta agregada para el dashboard.

---

## 3. Clientes con más equipos

### Definición

Ranking de clientes con mayor cantidad de equipos asignados actualmente.

### Endpoint específico

```http
GET /dashboard/kpis/clientes-mas-equipos?limit=10
```

### Respuesta

```json
[
  {
    "idCliente": "uuid",
    "cliente": "CLIENTE DEMO",
    "equiposAsignados": 12,
    "equiposActivos": 10,
    "equiposDevueltosEnPeriodo": 2,
    "ultimaAsignacion": "2026-08-20"
  }
]
```

### Reglas

- Por defecto contar solo asignaciones activas al momento de la consulta.
- Permitir distinguir equipos activos, devueltos y total histórico.
- No hacer una llamada independiente por cliente.
- Considerar la fecha de corte de la consulta.

El frontend actual tiene consulta de asignaciones por cliente, pero no una consulta consolidada. Se requiere un endpoint agregado para evitar problemas de rendimiento.

---

## 4. Clientes con equipo con mas tiempo sin consumo

### Definición

Clientes que llevan más días sin registrar consumo, tomando como referencia su última venta/consumo.

### Endpoint específico

```http
GET /dashboard/kpis/clientes-sin-consumo?fechaCorte=2026-08-31&limit=10&incluirNuncaConsumieron=true
```

### Respuesta

```json
[
  {
    "idCliente": "uuid",
    "cliente": "CLIENTE DEMO",
    "ultimaFechaConsumo": "2026-05-15",
    "diasSinConsumir": 108,
    "equiposAsignados": 3,
    "nuncaHaConsumido": false
  }
]
```

### Reglas

- Consultar todo el histórico disponible, no solo el mes seleccionado.
- Calcular `diasSinConsumir` con la zona horaria de negocio.
- Permitir incluir clientes que nunca han consumido.
- Definir si clientes inactivos se incluyen o se excluyen.
- Ordenar de mayor a menor por días sin consumir.
- Si un cliente tiene varias operaciones el mismo día, considerar la fecha más reciente.

Este KPI requiere backend porque el frontend actual no tiene una consulta histórica consolidada por cliente.

---

## 5. Devoluciones de equipos

### Definición

Cantidad de equipos devueltos durante el periodo seleccionado.

### Endpoint específico

```http
GET /dashboard/kpis/devoluciones-equipos?fechaInicio=2026-08-01&fechaFin=2026-08-31
```

### Respuesta

```json
{
  "totalDevoluciones": 18,
  "equiposDevueltos": 15,
  "clientesConDevoluciones": 12,
  "porTipoEquipo": [
    {
      "idTipoEquipo": "uuid",
      "tipoEquipo": "Garrafón",
      "cantidad": 10
    }
  ],
  "porDia": [
    {
      "fecha": "2026-08-12",
      "cantidad": 4
    }
  ]
}
```

### Reglas

- Diferenciar cantidad de eventos de devolución y cantidad de equipos devueltos.
- Usar `fechaDevolucion` como fecha del movimiento.
- No contar asignaciones activas como devoluciones.
- Si un equipo se reasigna después de devolverse, conservar ambos eventos en el histórico.

El frontend actual solo tiene la acción para devolver un equipo; necesita backend para consultar el histórico.

---

## 6 y 7. Días con mayor y menor movimiento de equipos

### Definición

Medir el movimiento diario de equipos considerando asignaciones y devoluciones.

Se recomienda entregar ambos movimientos por separado y un total combinado.

### Endpoint específico

```http
GET /dashboard/kpis/movimiento-equipos-diario?fechaInicio=2026-08-01&fechaFin=2026-08-31
```

### Respuesta

```json
[
  {
    "fecha": "2026-08-12",
    "asignaciones": 8,
    "devoluciones": 4,
    "movimientosTotales": 12
  }
]
```

### Reglas

- `movimientosTotales = asignaciones + devoluciones`.
- El día con mayor movimiento es el máximo de `movimientosTotales`.
- El día con menor movimiento debe calcularse entre días con actividad, salvo que negocio solicite incluir días en cero.
- Enviar también fechas con cero si se quiere graficar el calendario completo.
- Definir cómo tratar movimientos cancelados o revertidos.
- No duplicar un evento si la operación se reintenta.

Para evitar ambigüedad, el backend puede incluir directamente:

```json
{
  "diaMayorMovimiento": {
    "fecha": "2026-08-12",
    "movimientos": 12
  },
  "diaMenorMovimiento": {
    "fecha": "2026-08-03",
    "movimientos": 1
  }
}
```

---

## Filtros opcionales

El endpoint agregado debería aceptar, si aplican al negocio:

```text
idRutas[]
idClientes[]
idTiposEquipo[]
idEquipos[]
conceptosVenta[]
incluirCancelados
incluirClientesInactivos
limit
```

Para el KPI oficial de PG/EXP, backend debe forzar o validar que los conceptos sean únicamente PG y EXP, aunque el frontend envíe otros valores.

## Rendimiento

- No ejecutar una consulta por cada cliente.
- Usar agregaciones SQL y agrupaciones por fecha, cliente, concepto y equipo.
- Agregar índices para fechas de consumo, fechas de asignación, fechas de devolución, cliente, concepto y equipo.
- Considerar cache de corta duración para el dashboard.
- El endpoint agregado debe responder idealmente en menos de 2 segundos para un mes.
- Para históricos grandes, permitir paginación o límites.

## Permisos y seguridad

- Usar siempre el usuario autenticado del token.
- No confiar en `userId` recibido desde el frontend.
- Respetar permisos por empresa, sucursal, ruta o unidad operativa.
- No exponer clientes, consumos o equipos fuera del alcance del usuario.
- Validar todos los UUID y fechas.
- Rechazar conceptos de venta no permitidos para el KPI PG/EXP.

## Criterios de aceptación

- El dashboard puede solicitar un mes y recibir todos los KPIs oficiales en una sola respuesta.
- Los datos cambian correctamente al navegar entre meses.
- PG y EXP están identificados y no se mezclan con otros conceptos.
- El top de clientes se ordena por unidades consumidas, no por importe, salvo que se agregue un ranking alternativo explícito.
- Los equipos se contabilizan con base en asignaciones y devoluciones reales.
- Se puede calcular el tiempo desde el último consumo usando histórico.
- Se puede graficar movimiento diario de equipos.
- Los días con mayor y menor movimiento son determinísticos y documentan si se consideran días en cero.
- Una respuesta sin datos no rompe la pantalla.
- El resultado respeta permisos y filtros.

## Nota para frontend

El frontend ya tiene configuración visual de KPIs y gráficas mediante `localStorage`. La integración con backend debe mantener separadas estas responsabilidades:

- Configuración por usuario: visibilidad, orden, tipo de gráfica, tamaño y colores.
- Datos del dashboard: valores calculados para el periodo seleccionado.

La pantalla deberá consultar primero la configuración del usuario y después los datos de este Approach #1.
