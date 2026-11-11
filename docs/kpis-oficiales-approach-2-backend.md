# KPIs oficiales Tancol — Approach #2

## Objetivo

Agregar un segundo grupo de KPIs configurables en el dashboard mensual. El frontend conserva únicamente la configuración visual por usuario:

- Visible u oculto.
- Orden.
- Tipo de visualización.
- Tamaño del bloque.
- Color para tarjetas numéricas.

Backend debe entregar los datos agregados del periodo. No enviar `userId`; la autenticación se toma del JWT.

Prefijo real: `/api/v1`  
Zona horaria de negocio: `America/Mexico_City`  
Fechas de consulta: `YYYY-MM-DD`, inclusivas.

## Viabilidad actual

| KPI | ¿Se puede calcular correctamente con frontend actual? | Requerimiento |
|---|---:|---|
| Última unidad enviada por día | No | Firma del chofer y relación con unidad/vehículo en un agregado backend |
| Botellones rotos por día | No | Agregado de `rotos` por fecha |
| Empleados que más botellones rompieron | No | Agregado de `rotos` por empleado |
| Botellones producidos por día | No | Definir fuente oficial de producción y agregado diario |
| Procesos con más botellones | No | Agregado por `MANUAL_1`, `MANUAL_2` y `MAQUINA` |
| Merma de agua diaria | No | Endpoint de medidores; pendiente de habilitar fuente |
| Día con más producción | No | Derivado del agregado de producción |
| Día con menos producción | No | Derivado del agregado de producción, ignorando días sin producción |
| Vehículos que más tardan en bahía | No | Eventos de entrada/salida y duración |
| Fuera de especificación del mes | Parcial | Existe el catálogo, pero falta el agregado de registros del periodo |
| Productos vendidos por cantidad y dinero | Parcial | Se puede aproximar con reportes actuales, pero se requiere agregado oficial para exactitud |

## Endpoint agregado recomendado

```http
GET /api/v1/dashboard/kpis/approach-2?fechaInicio=2026-08-01&fechaFin=2026-08-31&limit=10
```

### Query params

| Parámetro | Tipo | Requerido | Notas |
|---|---|---:|---|
| `fechaInicio` | date | Sí | `YYYY-MM-DD` |
| `fechaFin` | date | Sí | `YYYY-MM-DD`, mayor o igual a inicio |
| `limit` | int | No | Default `10`, máximo `100` para rankings |
| `incluirCancelados` | boolean | No | Default `false`; excluir bitácoras/partidas canceladas |
| `idRutas` | UUID repetible | No | Usar `idRutas=uuid1&idRutas=uuid2` |
| `idVehiculos` | UUID repetible | No | Filtro para KPIs de vehículo/bahía |
| `idEmpleados` | UUID repetible | No | Filtro para firmas, rotos y rankings |
| `procesos` | string repetible | No | `MANUAL_1`, `MANUAL_2`, `MAQUINA` |

No usar `idRutas[]`; los parámetros repetibles deben llegar como claves repetidas.

Sin información: responder `200` con listas vacías y totales `0`. No responder `500` por ausencia de datos. Si `fechaInicio > fechaFin`, responder `400`.

## Respuesta propuesta

```json
{
  "periodo": {
    "fechaInicio": "2026-08-01",
    "fechaFin": "2026-08-31",
    "zonaHoraria": "America/Mexico_City"
  },
  "ultimaUnidadEnviadaPorDia": [],
  "botellonesRotosPorDia": [],
  "topEmpleadosBotellonesRotos": [],
  "botellonesProducidosPorDia": [],
  "produccionPorProceso": [],
  "mermaAguaPorDia": [],
  "diaMayorProduccion": null,
  "diaMenorProduccion": null,
  "vehiculosConMayorTiempoEnBahia": [],
  "fueraEspecificacionDelMes": [],
  "productosVendidosTotales": [],
  "metadata": {
    "generadoEn": "2026-08-19T18:00:00Z",
    "incluyeCancelados": false,
    "mermaAguaDisponible": false
  }
}
```

Todos los valores numéricos deben ser números, no strings. `generadoEn` debe ser ISO UTC.

## 1. Última unidad enviada por día

La unidad del día es el último envío confirmado por la **hora de la última firma del chofer**. No usar la fecha de creación de la bitácora ni la hora de actualización.

```json
{
  "fecha": "2026-08-12",
  "idBitacora": "uuid",
  "horaFirmaChofer": "2026-08-12T18:42:10-06:00",
  "idChofer": "uuid",
  "chofer": "NOMBRE DEL CHOFER",
  "idVehiculo": "uuid",
  "vehiculo": "CAMIONETA 01",
  "idRuta": "uuid",
  "ruta": "RP-01",
  "unidad": "Liquido 20L",
  "cantidadEnviada": 475
}
```

Debe existir como máximo un registro por fecha. Si hay empate de hora, gana el registro con fecha de firma más reciente y luego el `idBitacora` más grande/estable.

## 2. Botellones rotos por día

Fuente: campo `rotos` de las partidas de bitácora. Sumar todas las partidas válidas del día. No mezclar `productosFueraEspecificacion`.

```json
{
  "fecha": "2026-08-12",
  "botellonesRotos": 18
}
```

La serie debe incluir todos los días del periodo, incluidos los días en cero.

## 3. Top de empleados que más botellones rompieron

Agrupar `rotos` por empleado responsable de la partida. El orden debe ser descendente por `botellonesRotos`.

```json
{
  "idEmpleado": "uuid",
  "empleado": "NOMBRE DEL EMPLEADO",
  "botellonesRotos": 42,
  "diasConRotos": 5
}
```

## 4. Botellones producidos por día

Definir y documentar la fuente oficial de producción. Recomendación: usar el registro de producción confirmado, no inferirlo de ventas ni de `cantidadSalida` de una ruta.

```json
{
  "fecha": "2026-08-12",
  "botellonesProducidos": 1250,
  "porProducto": [
    { "idProducto": "uuid", "producto": "Liquido 20L", "cantidad": 900 },
    { "idProducto": "uuid", "producto": "Envase 20L", "cantidad": 350 }
  ]
}
```

La serie debe incluir ceros. Si todavía no existe el registro de producción, devolver la lista vacía y `metadata.produccionDisponible=false`.

## 5. Producción por proceso

Agrupar la producción por proceso normalizado. Valores permitidos:

- `MANUAL_1` — Manual 1.
- `MANUAL_2` — Manual 2.
- `MAQUINA` — Máquina.

```json
{
  "proceso": "MANUAL_1",
  "nombreProceso": "Manual 1",
  "botellonesProducidos": 840,
  "porcentaje": 67.2
}
```

El frontend lo visualizará normalmente como pastel/dona, pero debe poder cambiarse a barras, ranking o tabla.

## 6. Merma de agua diaria

Este KPI queda preparado, pero no debe presentar datos simulados. Mientras medidores no esté disponible:

```json
{
  "mermaAguaPorDia": [],
  "metadata": { "mermaAguaDisponible": false }
}
```

Cuando exista la fuente, devolver:

```json
{
  "fecha": "2026-08-12",
  "litrosEntrada": 10000,
  "litrosUtilizados": 9200,
  "litrosMerma": 800,
  "porcentajeMerma": 8
}
```

Definir con negocio si la merma es `entrada - utilizado`, `entrada - producto terminado` o el valor registrado directamente por medidores. No calcularla en frontend sin una definición única.

## 7. Día con mayor y menor producción

Derivar de `botellonesProducidosPorDia`.

- Mayor: máximo `botellonesProducidos`.
- Menor: mínimo entre días con producción mayor a cero.
- Empates: gana la fecha más temprana.
- Mes sin producción: ambos valores `null`.

```json
{
  "fecha": "2026-08-12",
  "botellonesProducidos": 1250
}
```

## 8. Vehículos con mayor tiempo en bahía

Se requiere definir los eventos que delimitan la bahía. Recomendación:

- `entradaBahiaAt` como inicio.
- `salidaBahiaAt` como fin.
- Si aún está dentro de bahía, usar la fecha fin del periodo como corte y marcar `abierto=true`.

```json
{
  "idVehiculo": "uuid",
  "vehiculo": "CAMIONETA 01",
  "visitas": 8,
  "minutosTotalesEnBahia": 1260,
  "minutosPromedioEnBahia": 157.5,
  "ultimaEntrada": "2026-08-22T08:10:00-06:00",
  "ultimaSalida": "2026-08-22T11:15:00-06:00",
  "abierto": false
}
```

Ordenar por `minutosTotalesEnBahia` descendente. Si no existe aún trazabilidad de entrada/salida, devolver `[]` y `metadata.bahiaDisponible=false`; no inferirlo de la hora de firma.

## 9. Fuera de especificación del mes

Agrupar los registros de `productosFueraEspecificacion` de partidas del periodo.

```json
{
  "idMotivo": "uuid",
  "motivo": "Turbio",
  "cantidad": 32,
  "productosAfectados": 2,
  "ultimaFecha": "2026-08-28"
}
```

Opcionalmente incluir detalle por producto:

```json
{
  "producto": "Liquido 20L",
  "cantidad": 20
}
```

Excluir partidas canceladas salvo que `incluirCancelados=true`.

## 10. Productos vendidos por cantidad y dinero

Solo incluir productos con cantidad vendida mayor a cero. Agrupar por producto y devolver cantidad en piezas y equivalente monetario.

```json
{
  "idProducto": "uuid",
  "producto": "Liquido 20L",
  "cantidadVendida": 320,
  "importeTotal": 11857,
  "precioPromedio": 37.05,
  "unidadMedida": "pieza"
}
```

Definir el importe con la misma regla del reporte oficial de ventas:

- incluir descuentos aplicados en el importe neto;
- excluir cancelados por default;
- respetar concepto de venta válido;
- no contar devoluciones como venta;
- no mezclar importe con cantidad.

Si existe equivalencia de presentación, backend debe devolverla explícitamente:

```json
{
  "cantidadVendida": 320,
  "cantidadEquivalente": 320,
  "unidadEquivalente": "pieza"
}
```

## Criterios de frontend

- Al cambiar de mes, una sola llamada al endpoint agregado.
- La configuración visual permanece en `localStorage` hasta que exista backend de layouts.
- No mostrar mocks para producción, merma, bahía o rotos.
- Listas vacías muestran estado vacío, no error.
- Las series diarias deben incluir ceros para no falsear tendencias.
- Rankings deben respetar el orden descendente recibido.
- El KPI de proceso debe mostrar solo los tres procesos normalizados.
- Los valores monetarios deben mostrarse con moneda; cantidades de botellones y piezas sin `$`.
- Las tarjetas numéricas deben poder mostrar valor principal y subtítulo de unidad.

## Pendientes de definición con negocio

1. Qué evento representa exactamente “producción”.
2. Qué eventos abren y cierran el tiempo en bahía.
3. Si los rotos se atribuyen al chofer, al ayudante o al empleado que capturó la partida.
4. Si “última unidad enviada” significa última bitácora firmada o último vehículo/unidad dentro de esa bitácora.
5. Fórmula oficial de merma de agua.
6. Si productos vendidos debe incluir todos los conceptos o excluir conceptos como `BPSC`, donados y cancelados.
7. Qué significa “pieza” y cómo se calcula la equivalencia monetaria cuando un producto tiene presentaciones distintas.
