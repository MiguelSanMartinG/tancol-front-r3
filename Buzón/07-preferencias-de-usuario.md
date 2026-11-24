# 7. Preferencias por usuario (opcional)

Hoy se guardan **en el navegador** (localStorage). Si se cambia de equipo se pierden. Si el backend las guarda, el front solo cambia el lugar de lectura/escritura.

| Preferencia | Clave actual en el navegador | Formato |
|-------------|------------------------------|---------|
| Orden y tarjetas minimizadas | `tancol:inventario-diario:tarjetas:<idEmpleado>:preferencias` | `{ orden: ["areaId|insumoId"], minimizadas: [...] }` |
| Modo oscuro | `tancol:tema` | `"claro"` \| `"oscuro"` |
| Novedades vistas | `tancol:novedades-vistas:<idEmpleado>` | versión vista, p. ej. `"1.2.0"` |
| Favoritos de Catálogos | `catalogFavorites` (no distingue usuario) | lista de rutas, p. ej. `["./cliente"]` |

Endpoint sugerido: `GET/PUT usuarios/me/preferencias` con un objeto libre `{ clave: valor }`.

> Las **tarjetas agregadas** en Inventario diario ya no son una preferencia: son del área y se guardan en el backend (`inventario-diario/cupos`).
