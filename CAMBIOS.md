# Historial de cambios — HospedaYa

Respaldo previo a todo esto: `Downloads\HOSPEDAYA-20260924T025822Z-1-001\RESPALDO-hospedaya-2026-09-28\` (versión de GitHub y versión de Drive del 23/09).
Los cambios de base de datos están en `sql/` (todos aplicados en Supabase, proyecto `gcuicpitzbcwqxlloodm`).

---

## 30/09/2026 — Nuevo método de pago: Tarjeta (POS)
Respaldo previo: `RESPALDO-hospedaya-2026-09-30\antes-tarjeta\`.
- **Base de datos** (`sql/10-pago-con-tarjeta.sql`, aplicado): se agregó `tarjeta` a los métodos permitidos en `estadias_reservas`, `ventas_directas`, `movimientos_caja` y `suscripciones_pagos`.
- **Dónde se puede elegir "Tarjeta":**
  - check-in, check-out (saldo) y adelanto de reserva;
  - tiendita (venta rápida);
  - cobro de mesa en el restaurante;
  - ingreso manual en caja;
  - pagos de suscripción en SuperAdmin.
- **Caja:**
  - nueva tarjeta rosada "Tarjeta (POS)" en PC y celular; en PC hay 2 filas de 3 (clase `.caja-metodos` en `style.css`);
  - filtro "Tarjeta (POS)" en la lista de movimientos;
  - aparece en el reporte de caja impreso y en el ticket de cierre.
  - Como Yape y Plin, **no suma al efectivo esperado en el cajón**.
- **Reportes:** "Tarjeta (POS)" en la dona y en la lista de ingresos por método.
- **Arreglo de paso:** Reportes ya no muestra el aviso "Failed to create chart" si se sale de la sección antes de que termine de cargar.
- **Probado:**
  - Cobro de prueba de S/ 1 con tarjeta en caja: se guardó, apareció en su tarjeta y en el filtro, y el efectivo esperado no cambió. Luego se borró.
  - Se vieron en celular los botones de cobro del restaurante y del check-out, sin cobrar.
  - Reportes, sin errores.
- Caché `hospedaya-v13`.

## 30/09/2026 — Listas largas: Huéspedes y Comprobantes
Respaldo previo: `RESPALDO-hospedaya-2026-09-30\antes-listas\`.
- **Huéspedes:**
  - antes traía los últimos 300 y el buscador solo buscaba dentro de esos 300 (con más huéspedes, los antiguos "desaparecían");
  - ahora la lista se pide al servidor de a 50, con un botón "Ver N más" y el pie "50 de 68 huéspedes";
  - el buscador busca en **todos** los huéspedes por nombre, apellido, DNI o celular, con varias palabras ("tester quispe 3");
  - fecha, estado y orden se aplican en el servidor;
  - "Exportar" lleva **todos** los que cumplen el filtro, no solo los visibles;
  - el indicador "Huéspedes registrados" es el total real;
  - se quitó el filtro "VIP", que nunca funcionó (la base de datos no guarda esa información).
- **Comprobantes (Facturación):**
  - se ven **por mes**, con un selector de los últimos 24 meses (por defecto, el mes actual; antes eran los últimos 150 de todo el historial);
  - las tarjetas muestran el total y el monto **del mes**;
  - un mes sin comprobantes muestra "Sin comprobantes en Junio 2026. Elige otro mes arriba.";
  - los filtros Facturas/Boletas se combinan con el buscador y el estado. En **celular no funcionaban**; ahora sí.
- **Probado como tester** con datos masivos creados en Supabase (`sql/prueba-listas-datos-masivos.sql`: 60 huéspedes y 70 comprobantes de julio, agosto y setiembre, con series de prueba PRB1/PRF1 que no tocan la numeración real):
  - "Ver más";
  - buscar a un huésped que antes no estaba cargado;
  - varias palabras, celular y caracteres raros;
  - filtros de fecha y estado (comparados con los conteos reales de la base de datos);
  - orden y "Limpiar";
  - exportar (68 y 20 con filtro);
  - ficha, editar y guardar, y WhatsApp en filas cargadas con "Ver más";
  - cambio de mes (montos verificados: julio S/ 4,635.00, agosto S/ 3,825.00);
  - mes vacío, filtros de tipo/estado/búsqueda, paginador, "⋮ → Ver detalle" y WhatsApp.

  Todo en PC y celular, sin errores. Caché `hospedaya-v12`.

---

## 30/09/2026 — Velocidad (todos los roles)
Respaldo previo: `Downloads\HOSPEDAYA-20260924T025822Z-1-001\RESPALDO-hospedaya-2026-09-30\`.
- **Arranque:**
  - antes de mostrar la primera pantalla se hacían ~10 consultas en fila (perfil, hotel, turno, servicio DNI y 6 de notificaciones);
  - ahora el perfil y el hotel van en una sola consulta, y el turno, el servicio DNI y las notificaciones se cargan en segundo plano;
  - medido: Habitaciones visible en ~1 s desde que se abre la app.
- **Consultas a la vez (antes en fila):**
  - Dashboard: de 2.4 s a 0.58 s;
  - Facturación: de 1.6 s a 0.28 s;
  - Restaurante: de 1.5 s a 0.3–0.9 s (y ahora trae solo los pedidos vivos);
  - Huéspedes, Tiendita, Config. habitaciones y las notificaciones de la campana.
  - En celular, donde cada consulta tarda más, la diferencia es mayor (antes se sumaban 5–7 s).
- **Volver a una sección ya visitada es instantáneo (~5 ms):**
  - se muestra su última vista y se actualiza sola en segundo plano (`navegarA` + `skeleton()`);
  - esa copia vive solo en memoria y se borra al cerrar sesión o al entrar otro usuario.
- **Caché de la app (`sw.js`):**
  - antes esperaba internet en cada apertura (volvía a descargar app.js, ~800 KB);
  - ahora abre con la copia guardada y la actualiza en segundo plano;
  - una versión nueva se instala completa y recarga la página. Versión `hospedaya-v11`.
- **Descargas del arranque:**
  - se quitó la librería "lucide" (no se usaba y bloqueaba la carga);
  - QR y gráficos cargan sin bloquear (`defer`);
  - el generador de PDF (jsPDF) se descarga solo al pedir un PDF.
- **Imagen del inicio de sesión:** `banner.png` (1.9 MB) pasó a `banner.jpg` (140 KB), con la misma calidad visible. `banner.png` ya no se usa (queda la copia en el respaldo).

---

## 29/09/2026 — Documentación del proyecto
- Nuevo `CLAUDE.md`: cómo trabajamos, qué archivo hace qué, en qué nos quedamos, pendientes y datos útiles (para continuar en otra conversación sin volver a analizar todo).
- `CAMBIOS.md` reorganizado por fecha y por parte revisada.
- Nuevo `_config.yml`: GitHub Pages no publica en la web `CLAUDE.md`, `CAMBIOS.md`, `README.md`, `sql/` ni `.claude/`.

---

## 28/09/2026 — Revisión completa (dueño, recepción, limpieza, restaurante, cocina y SuperAdmin)

### Parte 1 — Correcciones generales (dueño)
- **Escrituras sin revisar errores (49 lugares):** cobros, check-in/out, ventas, restaurante, etc. decían "guardado" aunque la base de datos rechazara el dato. Ahora usan `chk()` (supabaseClient.js) y muestran el error real.
- **Cierre de caja ciego:** vuelve a calcularse en el servidor (`fn_cerrar_turno`), como en la versión del 23/09.
- **Caja:** "Saldo en caja" sumaba Yape/Plin como efectivo. Ahora muestra el *efectivo esperado* (fondo + efectivo − egresos en efectivo) y solo el dueño lo ve antes del cierre.
- **Historial de arqueos e impresión de arqueo:** fallaban (relación inexistente turnos_caja → perfiles_usuarios). Corregido.
- **Reportes y Facturación:** usaban la columna `estado` (no existe) en vez de `estado_sunat`.
- **Configuración global (SuperAdmin):** pedía la columna inexistente `fl_empresa_id`.
- **Cuota SUNAT:** `.catch()` sobre `db.rpc()` rompía la pantalla; la cuota ahora se verifica *antes* de emitir.
- **Reservas:**
  - se puede reservar a futuro cualquier habitación (se valida el cruce de fechas), con fecha de salida y noches;
  - no bloquea la habitación hasta el día de llegada;
  - el adelanto exige turno abierto;
  - estado "Vencida" para reservas pasadas;
  - cancelar pide confirmación y no libera habitaciones ocupadas;
  - editar fechas valida cruces;
  - confirmar llegada valida que la habitación esté libre y recalcula la salida.
- **Habitaciones:** una habitación reservada muestra "Confirmar llegada / Cancelar" (antes mostraba check-out); capacidad visible en las tarjetas; el check-in directo no permite pisar una reserva.
- **Fechas en hora de Perú:** "hoy", menú del día, calendario, reportes y fecha de comprobantes usaban la hora UTC (después de las 7 p. m. ya era "mañana").
- **Tiendita:**
  - no deja vender ni cargar más que el stock;
  - el stock inicial entra al kardex sin duplicarse;
  - las categorías no distinguen mayúsculas;
  - avisa si el precio es menor que el costo.
- **Indicadores falsos eliminados:** porcentajes fijos (↑12 %, ↑8 %…) en Reportes, Tiendita y Personal reemplazados por datos reales.
- **Exportar:** Huéspedes, Reservas y Reportes descargan un Excel real (.xlsx); Huéspedes exporta solo lo filtrado.
- **Roles:** una sola tabla `PERMISOS_ROL` (app.js) para el menú, el "Más" del celular y un candado en `renderModulo`. Recepción ya no ve Restaurante y ningún rol puede abrir secciones ajenas.
- **Inicio por rol:**
  - cada rol entra a su pantalla y ya no sale "Sin acceso" al iniciar sesión;
  - limpieza, cocina y restaurante ya no ven el Dashboard, el buscador ni la campana.
- **Imprimir** (arqueo, reportes, comprobante del restaurante): si el navegador bloquea la ventana emergente, se muestra un visor dentro de la página (`abrirVentanaImpresion`).
- **Comprobantes** de check-in, check-out y restaurante: se numeran en el servidor (`fn_emitir_comprobante`), sin números repetidos. No se envían a SUNAT: quedan "Pendiente de envío".
- **Celular:** el botón "Más" solo aparece si hay más secciones de las que caben.
- **Cocina:**
  - los pedidos nuevos entran en "Nuevas";
  - las tarjetas de arriba llevan a su columna;
  - "Ver reporte de ventas" ya no es un botón vacío.
- **Restaurante:**
  - caja propia;
  - "Nueva reserva" pasa a "Configurar mesas";
  - carta con categorías y edición;
  - al reabrir una mesa se unen los productos repetidos;
  - "Cancelar comanda" también cancela los pedidos "listo";
  - valida RUC y DNI (boletas desde S/ 700);
  - "Cargar a habitación" ya no muestra "undefined".
- **Panel del dueño:**
  - "Rack de Habitaciones" pasa a "Habitaciones" y la configuración a "Config. habitaciones";
  - paginación real en todas las tablas;
  - "Ver más" abre en ~0.5 s;
  - botones "⋮" conectados (caja, tiendita, personal, facturación, incluido anular con nota de crédito);
  - filtros que eran solo dibujos ahora funcionan (Huéspedes celular, Config. habitaciones, Personal, Facturación, Tiendita celular, Reportes);
  - Huéspedes "Alojados ahora" y "Esta semana" corregidos;
  - Reservas "Este mes" y estados corregidos;
  - el Dashboard muestra "Salió";
  - el Calendario comparte las llegadas por WhatsApp;
  - la lista de la Tiendita en celular ya se puede encontrar;
  - Personal: Exportar y "Guía de permisos".
- **SQL aplicados:** `01-seguridad-roles` (la clave SOL ya no llega a los empleados; restaurante puede emitir; solo el dueño cambia la estructura de las habitaciones), `02-restaurante-caja`, `03-carta-categorias`. Respaldo en `00-respaldo-politicas`.

### Parte 2 — Rol Recepción (PC, celular y tablet)
- **Habitaciones:** con los "···" de una habitación **ocupada** se podía marcar "Libre" sin check-out. Ahora solo se libera con check-out.
- **Check-out:** si ya había boleta del check-in, dejaba emitir otra por el total (doble comprobante). Ahora muestra la boleta ya emitida y solo ofrece comprobante por lo pendiente. Cobrar el saldo exige turno abierto.
- **Check-in:**
  - sin turno se quedaba en "Cargando…"; ahora explica qué falta y ofrece "Ir a Caja" o "Marcar como libre";
  - el DNI debe tener 8 dígitos (CE y pasaporte, de 6 a 12);
  - la tarifa por horas ahora cobra todos los bloques.
- **Reservas:**
  - el botón "Check-in" registraba la llegada con un solo clic (incluso las vencidas); ahora pide confirmar;
  - no se pueden crear reservas con fecha pasada;
  - las columnas se pueden ordenar;
  - se puede buscar por fecha ("01/10", "1 oct");
  - "Ver ficha" ya funciona.
  - Incidente: al probar, la reserva vencida real de JOSE DAVID PEREZ OLIVOS pasó a "alojado"; se revirtió de inmediato.
- **Caja:**
  - se podía registrar un gasto en efectivo mayor al que había en caja (S/ 500 con S/ 100); ahora se bloquea;
  - el "Reporte de caja" le mostraba a recepción el saldo esperado (rompía el cierre ciego); ahora solo lo ve el dueño.
- **Calendario:** al tocar un día se abría el día anterior; los filtros por habitación no filtraban; se quitó un "Filtrar" que no hacía nada; ahora carga 12 meses adelante.
- **Huéspedes:** se podía guardar un DNI de 2 dígitos; en celular no aparecía en ningún menú (ahora está en "Más").
- **Tiendita:** crear o editar productos y cambiar precios queda solo para el dueño; la reposición tenía un campo de precio que ya no ve recepción. SQL `04-productos-precios-solo-admin`.
- **Facturación:**
  - "Configuración SUNAT" llevaba a una sección inexistente; ahora solo el dueño lo ve;
  - boleta manual desde S/ 700 exige DNI;
  - validación real del RUC.
- **Buscador y notificaciones:** abren directamente la habitación.
- **"¿Necesitas ayuda?":** ahora abre el WhatsApp de soporte.
- **Exportar:** el nombre del archivo usa la fecha de Perú.

### Parte 3 — Rol Limpieza + seguridad de la base de datos
- **Pantalla:** se actualiza sola cada 30 s, tiene botón "Actualizar", pone primero las habitaciones por limpiar y muestra un contador.
- **SQL `05-permisos-escritura-por-rol`:**
  - la carta, el menú y las mesas podían ser borrados por cualquier empleado; ahora solo el dueño y restaurante;
  - mantenimientos: los registran el dueño y recepción, y solo el dueño los borra;
  - una habitación con huésped no se libera sin check-out, también en la base de datos.
- **Verificado:** limpieza no lee datos sensibles, no puede cambiarse el rol y solo puede marcar "Limpia".

### Parte 4 — Rol Restaurante (PC y celular)
- **Celular:** no había forma de llegar a Carta, Menú del día, Comprobantes, Configurar mesas ni al buscador. Ya están.
- **Filtro "Ocupadas":** no mostraba ninguna mesa; corregido.
- **Boleta:** aceptaba el DNI "12"; ahora lo valida. La boleta de prueba B001-00000007 se corrigió en la base de datos. Una boleta sin nombre queda como "Cliente varios".
- **Configurar mesas:** "0" guardaba 12 mesas, y se podía bajar a menos mesas que una con pedido abierto; los dos casos quedan bloqueados.
- **"Actualizar comanda":** ya no reinicia la hora del pedido.
- **Probado:**
  - pedidos, actualizar, cancelar y cobrar con boleta;
  - cargo a habitación (Mesa 6 → Hab. 102, S/ 54.50);
  - carta (agregar, editar, eliminar) y menú del día;
  - comprobantes y caja.
- **Dato antiguo:** la factura F001-00000002 (20/09) tiene un RUC de 9 dígitos.

### Parte 5 — Rol Cocina (PC, tablet y celular)
- **Pedidos:** cocina cargaba las 100 comandas más antiguas; pasado ese número, los pedidos nuevos no aparecerían. Ahora trae solo las comandas vivas.
- **Pedido cambiado:** si el mozo cancela o cobra mientras cocina lo tiene en pantalla, avisa "El pedido cambió"; el doble clic ya no da error.
- **SQL `06-cocina-solo-estado-comanda`:** cocina podía cambiar el total o la forma de pago, o marcar como cobrado; ahora solo mueve Nueva → Preparando → Listo.
- **Probado:** el flujo completo, la actualización automática y las tarjetas. El pedido de prueba de la Mesa 5 quedó cancelado.

### Parte 6 — SuperAdmin (PC y celular)
- **Dashboard y Suscripciones:** "Registrar hotel" se quitó del Dashboard SaaS; Suscripciones tiene el botón "Renovar suscripción".
- **Registrar hotel:** valida RUC, monto y contraseña.
- **Gestionar hotel:** el límite "0" ya no guarda 150 sin avisar; secciones numeradas 1–6.
- **Botón "Probar" (DNI/RUC):** distingue un token rechazado.
- **SQL `07-consulta-documento-segura`:**
  - valida DNI/RUC (antes se podía inyectar texto en la dirección del proveedor);
  - el "ping" de cada inicio de sesión ya no gasta consultas;
  - informa los errores del proveedor.
- **SQL `08-suscripcion-y-token-blindados`:** cualquier usuario podía pedir el token de FacturaLibre de cualquier hotel; ahora solo el servidor.
  - Además, se revisó si el dueño podía regalarse la suscripción: **no podía** (`tg_hoteles_guard`). Un trigger que se agregó de más se eliminó.
- **SQL `09-cuota-cpe-mes-peru`:** la cuota contaba mal el mes (mostraba 2026-08); ahora cada hotel solo ve la suya.
- **Probado:** renovar, prórroga y +10 CPE en "luna nueva". Luego se dejó todo como estaba y se borró el pago de prueba.
- **Hallazgo:** en la base de datos ya existe `fn_emitir_a_facturalibre` (envío a SUNAT desde el servidor); falta conectarla a la app.

---

## Pendiente
Lista actualizada y en orden de prioridad: ver `CLAUDE.md` → "Pendiente".
