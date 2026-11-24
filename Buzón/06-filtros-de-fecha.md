# 6. Filtros de fecha en consultas y reportes

Aplica a Bitácora de ventas, Inventario diario, Liquidación y los reportes (cuentas, general, liquidaciones, bitácora, consumo de clientes, consumo por área y producto, salida de material y volumen de ventas).

## Reglas que ya aplica el front
1. Son **consultas**: el selector de rango solo permite **hoy y días anteriores**.
2. La **fecha fin puede elegirse antes que la de inicio**; el front **ordena el rango** y siempre envía `inicio ≤ fin`.
3. Inicio a las **00:00:00** y fin a las **23:59:59.999** (día completo).
4. Bitácora de ventas: por defecto la semana **de viernes a hoy** (la semana va de viernes a jueves).

## Qué pedimos al backend
- Interpretar el rango **inclusivo** en ambos extremos y en hora local (America/Mexico_City).
- Si llega `inicio > fin`, responder `422` con mensaje claro (el front no debería enviarlo, pero por seguridad).
