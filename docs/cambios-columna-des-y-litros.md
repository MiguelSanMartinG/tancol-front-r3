# Cambios en Reporte General y Medidores

Documento de entrega para convertir a PDF. Fecha de los cambios: 7 de noviembre de 2026. Alcance: solo frontend. El backend no se modificó.

## Resumen

Se hicieron dos cambios independientes.

1. En Reporte General, pestaña RG No Factura, subpestaña Autoservicio, se quitó la columna `des`. Los totales visibles de esa tabla ya no incluyen ese monto.
2. En Medidores, las lecturas que se capturaban y mostraban en metros cúbicos pasaron a litros. El servicio sigue guardando metros cúbicos. La conversión ocurre en la pantalla: se multiplica por 1,000 al mostrar y se divide entre 1,000 al guardar.

---

## 1. Eliminación de la columna des en Autoservicio

### Dónde

Ruta: `/dashboard/principal/reporte-general/principal`

Pestaña: RG No Factura. Subpestaña: AUTOSERVICIO.

### Qué se veía antes

La tabla de Autoservicio tenía una columna llamada `des`, entre `des_liq20` y `pg`. El total de cada fila y el gran total llegaban del endpoint `reportes/general/rg-nofactura-autoservicio` e incluían el monto de `des`.

### Qué cambió

La columna `des` ya no aparece en el encabezado, en las filas ni en el pie. Las columnas que siguen visibles son:

`e20`, `des_liq20`, `pg`, `bpsc`, `exp`, `agua_purif`, `agua_pot`, `agua_dm`, `h5kg`, `h3kg`, `c350`, `c500`, `c1000`, `c1500`, `desc_h5kg`, `e11`, `liq11`, `liq10`, más Empleado y Total.

### Cómo afectó guardar, obtener y mostrar

- Obtener: la llamada al servicio no cambió. El backend puede seguir enviando `des` dentro de cada fila, en `totalesPorColumna` y dentro de `totalFila` y `granTotal`.
- Mostrar: el frontend deja de pintar esa columna.
- Totales: para que el Total coincida con las columnas visibles, la pantalla resta el monto de `des`.
  - Total de la fila = `totalFila` del servicio menos el valor `des` de esa fila.
  - Gran total = `granTotal` del servicio menos `totalesPorColumna.des`.
- Guardar: esta pantalla solo consulta. No hay un alta de datos en este cambio.

### Qué no cambió

- La subpestaña GENERAL de RG No Factura.
- Las demás pestañas del Reporte General.
- El PDF del Reporte General. Esa exportación no incluye la subpestaña Autoservicio.
- El contrato del endpoint.

---

## 2. Lecturas de medidores en litros

### Dónde

Ruta principal: `/dashboard/principal/medidores/principal`

También cubre bitácora, árbol, alta de medidor, alta de medidor hijo, edición, el diálogo de anomalías y el Excel de anomalías.

### Regla de conversión

El API sigue guardando las lecturas en metros cúbicos. Campos afectados: `ultimaMedicion`, `medicionActual`, `medicionInicial`, `medicionFinal` y `consumo`.

| Dirección | Operación | Ejemplo |
| --- | --- | --- |
| Mostrar | metros cúbicos × 1,000 | 1.5 m³ se ven como 1,500 LTS |
| Guardar | litros ÷ 1,000 | el usuario captura 1,500 LTS y el request envía 1.5 |

Si se enviara el número sin dividir, una captura de 1,500 litros quedaría registrada como 1,500 m³.

Estos campos ya estaban en litros y no se convierten: liquidado, quedado en cisterna y litros por minuto.

### Captura

En el diálogo Registrar medición de la lista principal, en la bitácora y en el árbol:

- El sufijo de Medición actual pasó de `m3` a `LTS`.
- Se quitó el mensaje “Capturaste N m3, equivale a N LTS”.
- La lectura inicial sugerida se muestra en litros.
- La unidad indicada en el diálogo es LTS.
- Al guardar, `medicionActual` se divide entre 1,000.

### Alta, alta de hijo y edición

El mismo formulario sirve para las tres pantallas.

- El sufijo de Medición inicial pasó de `m3` a `LTS`.
- Se quitó el mensaje de conversión.
- En el alta y en el alta de hijo, `medicionInicial` se divide entre 1,000 antes de enviarse.
- En edición, el campo está deshabilitado y no se reenvía. Al abrir el formulario se multiplica `ultimaMedicion` por 1,000 para que el valor se lea en litros.

### Listados

- Lista de medidores: la columna Últimas mediciones muestra solo litros, con sufijo LTS. Antes mostraba la lectura en m³ y, debajo, el equivalente en litros.
- Bitácora: medición inicial, medición final y consumo se muestran en litros. La columna Diferencia de esa tabla sigue con el valor que devuelve el servicio, sin convertir.
- Árbol: cada nodo muestra solo litros. Se quitó la etiqueta en m³.

### Anomalías

El diálogo Reporte de anomalías muestra medición del padre, suma de hijos y diferencia en litros. Los encabezados quedaron como Medición padre (LTS), Suma hijos (LTS) y Diferencia (LTS).

La comparación que decide si un padre es anomalía no cambió: sigue haciéndose en metros cúbicos, con la misma tolerancia. Solo se convierten los números que se pintan. El signo de la diferencia se conserva.

### Excel de anomalías

El archivo dejó de exportar columnas en metros cúbicos.

| Hoja | Cambio |
| --- | --- |
| Anomalías | Medición padre, suma de hijos y diferencia salen en litros. |
| Resumen mensual | Se quitó Total m³. Quedó Total LTS. |
| Detalle de registros | Medición inicial, medición final y consumo salen en litros. Se quitaron Consumo (m³) y la columna duplicada de consumo. |

La columna Unidad del Excel sigue mostrando el nombre de la unidad de medida configurada en el medidor. Esa columna es el catálogo del medidor, no la unidad de la lectura en pantalla.

La columna Diferencia de la hoja Detalle sigue con el valor del servicio, sin convertir.

### Qué no cambió en medidores

- El contrato de los endpoints de medidores y de bitácora.
- La unidad en la que el backend persiste las lecturas.
- Liquidado, quedado en cisterna y litros por minuto.
- La lógica que detecta anomalías.

---

## Efecto conjunto

Los dos cambios son de presentación y de los números que el usuario captura. No hay migración de datos.

- Históricos de medidores guardados en metros cúbicos se siguen viendo bien, porque la pantalla los multiplica por 1,000.
- Capturas nuevas se guardan en la misma unidad de siempre, porque la pantalla divide entre 1,000 antes de enviarlas.
- En Autoservicio, `des` puede seguir existiendo en la respuesta del servicio, pero ya no se muestra ni se suma en los totales de esa tabla.
