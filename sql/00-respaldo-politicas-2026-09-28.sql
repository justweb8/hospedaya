-- ============================================================
-- HospedaYa — RESPALDO de políticas y función ANTES del cambio
-- del 28/09/2026 (01-seguridad-roles-2026-09-28.sql).
-- Ejecutar SOLO si hay que volver atrás.
-- ============================================================

-- 1) Política permisiva que existía en configuracion_sunat
--    (dejaba a cualquier empleado del hotel leer/modificar, incluida la clave SOL)
CREATE POLICY cfg_sunat_hotel ON public.configuracion_sunat
  FOR ALL TO public
  USING (fn_es_superadmin() OR (hotel_id = fn_mi_hotel_id()));

-- 2) fn_emitir_comprobante: la versión anterior solo permitía estos roles
--    IF COALESCE(public.fn_mi_rol(), '') NOT IN ('admin','recepcion') THEN
--    Para revertir:
DO $$
DECLARE d text;
BEGIN
  d := pg_get_functiondef('public.fn_emitir_comprobante'::regproc);
  d := replace(d, $q$NOT IN ('admin','recepcion','restaurante')$q$, $q$NOT IN ('admin','recepcion')$q$);
  EXECUTE d;
END $$;

-- 3) Quitar el candado de columnas de habitaciones
DROP TRIGGER IF EXISTS trg_habitaciones_solo_admin_estructura ON public.habitaciones;
DROP FUNCTION IF EXISTS public.fn_habitaciones_solo_admin_estructura();

-- ── Políticas que NO se tocaron (referencia) ─────────────────
-- configuracion_sunat:
--   cfgsunat_insert  INSERT  WITH CHECK fn_es_superadmin()
--   cfgsunat_select  SELECT  USING (fn_es_superadmin() OR (hotel_id = fn_mi_hotel_id() AND fn_mi_rol() = 'admin'))
--   cfgsunat_update  UPDATE  USING (fn_es_superadmin() OR (hotel_id = fn_mi_hotel_id() AND fn_mi_rol() = 'admin'))
-- habitaciones:
--   habitaciones_ins INSERT  (superadmin) o (hotel propio, rol admin, hotel vigente)
--   habitaciones_sel SELECT  (superadmin) o (hotel propio)
--   habitaciones_upd UPDATE  (superadmin) o (hotel propio, rol admin/recepcion/limpieza, hotel vigente)
-- perfiles_usuarios:
--   perfiles_insert  INSERT  superadmin
--   perfiles_select  SELECT  superadmin o hotel propio o el propio usuario
--   perfiles_update  UPDATE  superadmin o (hotel propio, rol admin, hotel vigente)
