-- ============================================================
-- HospedaYa — 10: nuevo método de pago "tarjeta" (POS: débito o crédito)  (30/09/2026)
-- Antes solo se aceptaba: efectivo, yape, plin, transferencia (y mixto).
-- Se agrega 'tarjeta' en las 4 tablas que guardan el método de pago.
-- ============================================================

-- RESPALDO (reglas originales, tal como estaban):
--  estadias_reservas_metodo_pago_check : CHECK (metodo_pago = ANY (ARRAY['efectivo','yape','plin','transferencia','mixto']))
--  ventas_directas_metodo_pago_check   : CHECK (metodo_pago = ANY (ARRAY['efectivo','yape','plin','transferencia','mixto']))
--  movimientos_caja_metodo_pago_check  : CHECK (metodo_pago = ANY (ARRAY['efectivo','yape','plin','transferencia','mixto']))
--  suscripciones_pagos_metodo_pago_check: CHECK (metodo_pago = ANY (ARRAY['yape','plin','transferencia','efectivo']))

alter table estadias_reservas drop constraint estadias_reservas_metodo_pago_check;
alter table estadias_reservas add constraint estadias_reservas_metodo_pago_check
  check (metodo_pago = any (array['efectivo','yape','plin','transferencia','tarjeta','mixto']));

alter table ventas_directas drop constraint ventas_directas_metodo_pago_check;
alter table ventas_directas add constraint ventas_directas_metodo_pago_check
  check (metodo_pago = any (array['efectivo','yape','plin','transferencia','tarjeta','mixto']));

alter table movimientos_caja drop constraint movimientos_caja_metodo_pago_check;
alter table movimientos_caja add constraint movimientos_caja_metodo_pago_check
  check (metodo_pago = any (array['efectivo','yape','plin','transferencia','tarjeta','mixto']));

alter table suscripciones_pagos drop constraint suscripciones_pagos_metodo_pago_check;
alter table suscripciones_pagos add constraint suscripciones_pagos_metodo_pago_check
  check (metodo_pago = any (array['yape','plin','transferencia','tarjeta','efectivo']));

-- ── CÓMO REVERTIR ────────────────────────────────────────────
-- (Solo si no hay ya pagos guardados con 'tarjeta'; si los hay, primero cambiarlos.)
-- alter table estadias_reservas drop constraint estadias_reservas_metodo_pago_check;
-- alter table estadias_reservas add constraint estadias_reservas_metodo_pago_check check (metodo_pago = any (array['efectivo','yape','plin','transferencia','mixto']));
-- alter table ventas_directas drop constraint ventas_directas_metodo_pago_check;
-- alter table ventas_directas add constraint ventas_directas_metodo_pago_check check (metodo_pago = any (array['efectivo','yape','plin','transferencia','mixto']));
-- alter table movimientos_caja drop constraint movimientos_caja_metodo_pago_check;
-- alter table movimientos_caja add constraint movimientos_caja_metodo_pago_check check (metodo_pago = any (array['efectivo','yape','plin','transferencia','mixto']));
-- alter table suscripciones_pagos drop constraint suscripciones_pagos_metodo_pago_check;
-- alter table suscripciones_pagos add constraint suscripciones_pagos_metodo_pago_check check (metodo_pago = any (array['yape','plin','transferencia','efectivo']));
