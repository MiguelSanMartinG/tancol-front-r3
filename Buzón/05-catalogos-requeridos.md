# 5. Catálogos que se requieren

| Catálogo | Qué necesita el inventario diario | ¿Existe hoy? |
|----------|-----------------------------------|--------------|
| Departamentos (= áreas) | **Almacén asignado** a cada departamento (de ahí salen sus tarjetas por defecto) | Falta el campo |
| Almacenes | **Responsable** (empleado) para dirigir las notificaciones | Falta el campo |
| Inventario inicial | **Existencia por almacén e insumo**; un insumo solo se ofrece en los almacenes donde tiene registro | Confirmar endpoint por almacén |
| Insumos | **Unidad de medida** seleccionada (se muestra «5,200 bolsas», «480 piezas») | Confirmar que viene en la respuesta |
| Empleados | Lista para «Roto por» y filtro de empleado | Sí |
| Rutas | Ruta opcional de la partida | Sí |

## Insumos por defecto de cada área
Envase 20 L, Envase 11 L, Bolsa de hielo 3 kg y Bolsa de hielo 5 kg, con cupo base 25 / 25 / 700 / 700 y mínimo 5. Confirmar los IDs reales de esos insumos y si los valores base varían por área.
