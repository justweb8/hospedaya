# Cambios — 28/09/2026 (revisión completa como dueño del hotel)

Respaldo previo: `..\..\RESPALDO-hospedaya-2026-09-28\` (versión GitHub y versión Drive del 23/09).

## Errores corregidos
- **Escrituras sin revisar errores (49 lugares):** cobros, check-in/out, ventas, restaurante, etc. mostraban "guardado" aunque la base de datos rechazara el dato. Ahora usan `chk()` (supabaseClient.js) y muestran el error real.
- **Cierre de caja ciego:** vuelve a calcularse en el servidor (`fn_cerrar_turno`), como en la versión del 23/09.
- **Caja:** "Saldo en caja" sumaba Yape/Plin como efectivo. Ahora muestra el *efectivo esperado* (fondo + efectivo − egresos en efectivo) y solo el administrador lo ve antes del cierre.
- **Historial de arqueos e impresión de arqueo:** fallaban (relación inexistente turnos_caja → perfiles_usuarios). Corregido.
- **Reportes y Facturación:** usaban la columna `estado` (no existe) en vez de `estado_sunat`.
- **Configuración global (SuperAdmin):** pedía la columna inexistente `fl_empresa_id`.
- **Cuota SUNAT:** `.catch()` sobre `db.rpc()` rompía la pantalla; la cuota ahora se verifica *antes* de emitir.
- **Reservas:** se puede reservar a futuro cualquier habitación (se valida cruce de fechas), con fecha de salida y noches; no bloquea la habitación hasta el día de llegada; el adelanto exige turno abierto; estado "Vencida" para reservas pasadas; cancelar pide confirmación y no libera habitaciones ocupadas; editar fechas valida cruces; confirmar llegada valida que la habitación esté libre y recalcula la salida.
- **Rack:** una habitación reservada muestra "Confirmar llegada / Cancelar" (antes mostraba check-out); capacidad visible en tarjetas; el check-in directo no permite pisar una reserva.
- **Fechas en hora de Perú:** "hoy", menú del día, calendario, reportes y fecha de comprobantes usaban UTC (después de las 7 p. m. era "mañana").
- **Tiendita:** no deja vender/cargar más que el stock; stock inicial entra al kardex sin duplicarse; categorías sin distinguir mayúsculas; aviso si el precio es menor que el costo.
- **Indicadores falsos eliminados:** porcentajes fijos (↑12 %, ↑8 %, etc.) en Reportes, Tiendita y Personal reemplazados por datos reales.
- **Exportar:** Huéspedes, Reservas y Reportes descargan Excel real (.xlsx); Huéspedes exporta solo lo filtrado.
- **Varios:** navegación rápida entre módulos, total del pedido en restaurante, tiempos de cocina legibles, correos inventados en Personal, estado real de conexión SUNAT, textos de Suscripción según plan, barra inferior en celular.

- **Roles:** tabla única `PERMISOS_ROL` (app.js) usada por el menú, el menú "Más" del celular y un candado en `renderModulo`. Recepción ya no ve Restaurante y ningún rol puede abrir secciones ajenas (antes recepción podía abrir Reportes, Personal, Config. SUNAT, etc. por el menú "Más" o notificaciones).

- **Inicio por rol:** cada rol entra a su pantalla (limpieza → Estado de Habitaciones, cocina → Cocina, restaurante → Restaurante); ya no sale "Sin acceso" al iniciar sesión. Limpieza, cocina y restaurante ya no ven el Dashboard (mostraba caja e ingresos), ni el buscador de huéspedes, ni la campana. Marcar "Limpia" ya no abre el Rack.
- **Imprimir arqueo / reportes / comprobante de restaurante:** fallaban con "Cannot read properties of null (reading 'document')" cuando el navegador bloqueaba la ventana emergente. Ahora, si se bloquea, se muestran en un visor dentro de la página (`abrirVentanaImpresion`).

- **Supabase (aplicado, ver `sql/01-seguridad-roles-2026-09-28.sql`; respaldo en `sql/00-...`):** se eliminó la política vieja `cfg_sunat_hotel` que dejaba a cualquier empleado leer la clave SOL y el token; `fn_emitir_comprobante` admite el rol restaurante; trigger que impide a no-admin cambiar número/piso/tipo/activo de una habitación.
- **Comprobantes de check-in, check-out y restaurante:** ahora se numeran en el servidor con `fn_emitir_comprobante` (antes el navegador leía la configuración SUNAT y sumaba el correlativo, con riesgo de números repetidos). No se envían a SUNAT: quedan "Pendiente de envío".
- **Celular:** el botón "Más" solo aparece si hay más secciones de las que caben.
- **Cocina:** los pedidos nuevos entran en la columna "Nuevas" (antes iban directo a "Preparando" y el botón "Empezar a preparar" nunca aparecía); las tarjetas de arriba llevan a su columna; "Ver reporte de ventas" ya no es un botón vacío ("Próximamente"): solo lo ve quien tiene Reportes y abre Reportes; tiempos legibles también en celular.
- **Restaurante (rol):** ahora tiene su propia Caja / Turno (antes no podía cobrar: se le pedía abrir caja pero no tenía acceso). Supabase aplicado en `sql/02-restaurante-caja-2026-09-28.sql`: turno y cobros propios, cierre ciego, cargar a habitación (solo ve habitaciones ocupadas, sin datos personales del huésped), ver sus comprobantes, y política DELETE en `items_venta_directa` (antes "Actualizar comanda" duplicaba productos, para cualquier rol).
- **Restaurante (pantalla):** "Nueva reserva" → "Configurar mesas"; carta fija con categorías Entradas y Platos de fondo (`sql/03-carta-categorias-2026-09-28.sql`) y botón para editar precio/nombre; al reabrir una mesa se unen productos repetidos; "Cancelar comanda" ahora también cancela pedidos en estado "listo" (antes decía cancelada pero no cambiaba); validación de RUC (11 dígitos) y DNI en boletas desde S/ 700 antes de cobrar (también en check-in/check-out); "Cargar a habitación" ya no muestra "undefined".
- **Revisión total del panel del dueño:**
  - "Rack de Habitaciones" → "Habitaciones"; la configuración pasa a "Config. habitaciones".
  - Paginación real en todas las tablas (antes los botones ‹ 1 › y "10 por página" eran decorativos). Se reinicia al buscar/filtrar.
  - "Ver más" de una habitación: se abre al instante y carga en ~0.5 s (antes 1.5–1.7 s sin respuesta visible); la penalidad/hora extra ahora se ve como línea.
  - Botones "⋮" conectados: movimientos de caja (detalle), productos (editar, reponer, kardex, desactivar), empleados (restablecer contraseña, desactivar/reactivar), comprobantes (detalle, imprimir, PDF, WhatsApp, anular con nota de crédito — la función existía pero ningún botón la usaba). Facturación en celular llamaba a una función inexistente.
  - Filtros que eran solo dibujos, ahora reales: Huéspedes (celular), Config. habitaciones (tipo y estado), Personal (rol y estado), Facturación (fecha y estado), Tiendita celular (ordenar y stock), Reportes ("Ingresos/Egresos/Neto" y "Por monto/cantidad").
  - Huéspedes: filtro "Alojados ahora" nunca funcionó (no se calculaba) y la columna estado decía "Registrado" para todos; "Esta semana" buscaba fechas futuras.
  - Reservas: "Este mes" excluía los días anteriores a hoy; las opciones de estado no coincidían con los estados mostrados.
  - Dashboard: "Llegadas de hoy" marcaba "Pendiente" a quien ya había salido (ahora "Salió").
  - Calendario: "Compartir calendario" solo llevaba a Reservas; ahora envía por WhatsApp las llegadas de los próximos 7 días. Fechas sin "De" en mayúscula.
  - Tiendita en celular: la lista de productos estaba escondida tras un aviso ("Mantén tu inventario…"); ahora dice "Ver productos (N)" y las categorías abren la lista filtrada.
- **Personal:** "Exportar" descarga Excel del personal y "Ver guía de permisos" muestra qué ve cada rol (antes decían "Próximamente").

- **Revisión total del rol Recepción (PC, celular y tablet):**
  - Habitaciones: con los "···" de una habitación **ocupada** se podía marcar "Libre" sin check-out (el huésped quedaba "adentro" y la habitación se podía volver a vender). Ahora solo se libera con check-out, también bloqueado en el servidor de la app (`setEstadoHab`, `iniciarMantenimiento`).
  - Check-out: si ya había boleta del check-in, permitía emitir otra por el total (doble comprobante). Ahora muestra la boleta ya emitida y solo ofrece comprobante por lo pendiente (consumos/penalidades). Cobrar saldo exige turno abierto.
  - Check-in: sin turno quedaba la ventana "Cargando…"; ahora explica y ofrece "Ir a Caja" o "Marcar como libre". DNI debe tener 8 dígitos (CE/pasaporte 6–12). Por horas cobraba un solo bloque aunque se eligieran 6 h.
  - Reservas: el botón "Check-in" registraba la llegada con un solo clic (incluso reservas vencidas); ahora muestra resumen y pide confirmar. No se pueden crear reservas con fecha pasada. Columnas Entrada/Salida/Adelanto ordenan. Buscar por fecha ("01/10", "1 oct"). "Ver ficha del huésped" ahora sí abre la ficha. Entrada sugerida: mañana si ya pasaron las 2 p. m.
  - Caja: se podía registrar un egreso en efectivo mayor al efectivo del cajón (probado: S/ 500 con S/ 100). "Reporte de caja" mostraba "Saldo en caja" a recepción (rompía el cierre ciego) y sumaba Yape como efectivo; ahora muestra el efectivo esperado correcto y solo al administrador.
  - Calendario: al tocar un día se abría el día anterior (zona horaria). Los filtros por habitación no filtraban; ahora filtran en mes/semana/día y aparecen todas las habitaciones. Se quitó el texto "Filtrar" que no hacía nada. Carga reservas hasta 12 meses adelante.
  - Huéspedes: se podía guardar un DNI de 2 dígitos al editar/registrar. En celular, Huéspedes no aparecía en ningún menú (ahora está en "Más", también para el dueño). Nombre del Excel sin espacios.
  - Tiendita: crear/editar productos, cambiar precios y desactivar = solo el dueño (recepción: vender, reponer stock, ver kardex). La reposición tenía un campo "Nuevo precio" que permitía cambiar precios.
  - Facturación: "Configuración SUNAT" llevaba a una sección inexistente (`config-sunat`) y aparecía a recepción; ahora solo el dueño lo ve. Se oculta el estado del facturador a empleados (no pueden leer la configuración). Emitir comprobante manual: boleta desde S/ 700 exige DNI y nombre; validación real del RUC. Se quitó una función duplicada.
  - Buscador de arriba y notificaciones: abren directamente la habitación/estadía (antes solo llevaban a la lista). La notificación de suscripción ya no aparece a empleados. Búsqueda con comas/paréntesis ya no falla.
  - "¿Necesitas ayuda? Contáctanos" (barra lateral) no hacía nada: ahora abre WhatsApp de soporte con hotel y usuario.
  - Exportar: nombre del archivo con fecha de Perú (salía el día siguiente después de las 7 p. m.).

- **Revisión del rol Limpieza + seguridad de la base de datos:**
  - La pantalla "Estado de Habitaciones" no se actualizaba: si recepción hacía un check-out, limpieza no lo veía hasta recargar. Ahora se actualiza sola cada 30 s (y al volver a la app), tiene botón "Actualizar", pone primero las habitaciones por limpiar y muestra el contador ("1 habitación por limpiar" / "No hay habitaciones por limpiar").
  - Supabase (`sql/05-permisos-escritura-por-rol-2026-09-28.sql`): `carta_restaurante`, `menu_dia` y `config_restaurante` podían ser modificados o borrados por CUALQUIER empleado (incluida limpieza); ahora solo dueño y restaurante. `mantenimientos`: crear/editar dueño y recepción, borrar solo el dueño. Nuevo trigger: una habitación con huésped alojado no puede pasar a libre/limpieza/mantenimiento/reservada sin check-out (antes solo lo controlaba la app).
  - Verificado con la cuenta de limpieza: no lee huéspedes, estadías, caja, comprobantes ni productos; no puede cambiarse el rol, ni liberar una habitación ocupada, ni tocar carta/menú/mesas/mantenimientos; sí puede marcar "Limpia" (probado con la 105 y PRUEBA-201). Entrar a otras secciones → "Sin acceso".
  - Mensaje de "¿Necesitas ayuda?" sin espacio sobrante en el nombre del hotel.

- **Revisión del rol Restaurante (PC y celular):**
  - En celular no había forma de llegar a Carta fija, Menú del día, Comprobantes, Configurar mesas ni al buscador de mesas. Ahora están debajo de las mesas, y el buscador arriba. Al borrar la búsqueda, las mesas volvían con diseño de PC; corregido.
  - Filtro "Ocupadas (2)" no mostraba ninguna mesa (excluía las que estaban "Listo"/"Preparando"); ahora coincide con el contador.
  - Cobro con boleta aceptaba un DNI inválido ("12"): ahora valida DNI 8 dígitos / CE / pasaporte. Boleta sin nombre queda como "Cliente varios". La boleta de prueba B001-00000007 se corrigió en la BD (sin DNI, "Cliente varios"; seguía pendiente de envío).
  - Configurar mesas: "0" o vacío guardaba 12 mesas; y dejaba bajar a menos mesas que una con pedido abierto (el pedido desaparecía sin cobrarse). Ambos bloqueados.
  - "Actualizar comanda" reiniciaba la hora del pedido (cocina perdía el tiempo de espera real); ahora se conserva.
  - Pestañas de categorías con el nombre del formulario ("Platos de fondo").
  - Probado: pedido Mesa 2 enviado a cocina (queda abierto para probar Cocina), actualizar sin duplicar, +/−, cancelar comanda (Mesa 3), cobro con boleta (Mesa 4 → B001-00000007), cargo a habitación (Mesa 6 → Hab. 102, S/ 54.50, llegó a consumos), carta (agregar/editar/eliminar con confirmación), menú del día (agregar), comprobantes y sus filtros, caja propia (efectivo esperado oculto).
  - Seguridad verificada: de estadías solo ve la habitación ocupada y sin datos del huésped; solo su turno de caja; solo sus comprobantes; no lee huéspedes ni configuración SUNAT; no puede cambiar habitaciones, tarifas ni su rol.
  - Dato antiguo: la factura F001-00000002 (20/09) tiene RUC de 9 dígitos "202584511" (de antes de las validaciones); SUNAT la rechazaría.

- **Revisión del rol Cocina (PC, tablet y celular):**
  - Cocina cargaba las 100 comandas MÁS ANTIGUAS del hotel y luego filtraba las activas: al pasar de 100 pedidos en el historial, los nuevos ya no habrían aparecido en cocina. Ahora la consulta trae solo las comandas vivas (nueva, preparando, listo).
  - Si el mozo cancelaba/cobraba un pedido mientras cocina lo tenía en pantalla, al tocar "Empezar"/"Listo" igual decía "En preparación". Ahora avisa "El pedido cambió" y recarga; doble clic ya no da error.
  - Supabase (`sql/06-cocina-solo-estado-comanda-2026-09-28.sql`): cocina podía cambiar el total, la forma de pago, la mesa o marcar como cobrado un pedido directamente en la base de datos. Ahora solo puede pasar el estado Nueva → Preparando → Listo. Probado: total 0, "cobrada", cambiar mesa y retroceder → bloqueados; flujo normal → funciona.
  - Probado: Mesa 2 Nueva → Preparando → Listo (guardado en BD, conserva la hora real del pedido), auto-actualización (un pedido nuevo apareció solo), tarjetas que llevan a su columna (PC y celular), botón Actualizar, secciones ajenas → "Sin acceso". Seguridad: no lee huéspedes, estadías, caja, comprobantes ni configuración SUNAT; no puede crear movimientos de caja.
  - Pedido de prueba Mesa 5 (creado para probar) quedó cancelado. La Mesa 2 quedó en "Listo para servir" (S/ 37) para que el restaurante la cobre.

- **Revisión del SuperAdmin (PC y celular):**
  - "Registrar hotel" se quitó del Dashboard SaaS (queda solo en Hoteles).
  - Suscripciones: nuevo botón "Renovar suscripción" (elige hotel → renovar/plan/prórroga). Tras renovar vuelve a la sección desde donde se hizo.
  - Registrar hotel: valida RUC (11 dígitos, 10/15/17/20), monto > 0 y contraseña ≥ 6 (los 3 hoteles actuales tienen RUC mal escritos: "12616469", "3246546464+", "2035879641").
  - Gestionar hotel: "Actualizar límite" con 0/vacío guardaba 150 sin avisar; ahora avisa. Secciones numeradas 1–6 (saltaba el 5).
  - Botón "Probar" de DNI/RUC: antes decía "Conexión OK" aunque el token fuera inválido; ahora distingue token rechazado (401/403), proveedor caído y OK.
  - Supabase:
    - `sql/07`: `fn_consultar_documento` valida DNI (8) / RUC (11) antes de armar la URL del proveedor (antes se podía inyectar texto), el "ping" que la app hace en cada inicio de sesión ya no gasta una consulta real al proveedor, y los errores del proveedor se informan.
    - `sql/08`: `fn_credenciales_facturalibre` la podía ejecutar cualquier usuario y devolvía el token de FacturaLibre (del hotel o de distribuidor) de CUALQUIER hotel ("luna nueva" ya tiene credenciales). Ahora solo el servidor la usa.
    - `sql/09`: la cuota de comprobantes contaba desde el 31/08 14:00 y mostraba "mes 2026-08" (doble conversión de zona horaria); ahora cuenta el mes de Perú. Además, solo el propio hotel o el SuperAdmin pueden consultar su cuota.
  - Verificado (sin cambios necesarios): el dueño NO puede regalarse plan/vencimiento/cuota (trigger `tg_hoteles_guard`); renovar, prórroga, ampliar cuota, registrar hotel, resetear contraseña y ver correos exigen SuperAdmin; `configuracion_global` solo la lee el SuperAdmin.
  - Probado: renovar 1 mes a "luna nueva" (vencimiento 19/10 → 19/11, pago registrado), prórroga +3 días, +10 CPE; luego todo se dejó como estaba (vencimiento 19/10, sin prórroga ni créditos, pago de prueba eliminado).
  - **FacturaLibre:** el panel tiene dónde guardar el token de distribuidor, pero la app todavía envía a SUNAT desde el navegador con el token propio de cada hotel. En la base de datos YA existe `fn_emitir_a_facturalibre` (envío desde el servidor, usa el token del hotel o el de distribuidor sin exponerlo). Falta: que la app la use en lugar de `enviarASunat()` y permitirla también al rol restaurante (hoy solo admin/recepción).

## Pendiente
- En celular no hay acceso a "¿Necesitas ayuda?" para ningún rol (solo está en la barra lateral de PC).
- ~~Tiendita: reforzar en Supabase el bloqueo de precios~~ → HECHO: `sql/04-productos-precios-solo-admin-2026-09-28.sql` (trigger `trg_productos_solo_admin_precios`). Probado con recepción: cambiar precio y crear producto → bloqueado; reponer stock y costo → funciona.
- **OBLIGATORIO ANTES DE ENTREGAR:** con el facturador conectado, los comprobantes que emite recepción no se envían solos a SUNAT (recepción no puede leer la configuración por seguridad): se resuelve con el envío desde el servidor (Edge Function).
- Probar una boleta en check-out con el nuevo flujo por servidor (check-in ya probado: B001-00000006).
- La lista de `perfiles_usuarios` (nombres y roles del personal) sigue visible para todos los empleados del hotel; se usa para mostrar nombres de cajeros. Bajo riesgo.
- Emitir a SUNAT desde el servidor (Edge Function) para que la clave SOL y el token no lleguen al navegador.
- Permitir al dueño ver correos de su personal (`fn_get_email_usuario`).
- Recuperar en `sql/` el resto de funciones de Supabase (hoy solo están los cambios de esta revisión).
