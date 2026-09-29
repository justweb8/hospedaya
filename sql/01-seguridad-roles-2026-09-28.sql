-- ============================================================
-- HospedaYa — Seguridad por roles (28/09/2026)
-- Respaldo para revertir: 00-respaldo-politicas-2026-09-28.sql
-- ============================================================

-- 1) configuracion_sunat: quitar la política vieja que dejaba a CUALQUIER
--    empleado leer la clave SOL y el token del facturador. Quedan vigentes
--    cfgsunat_select / cfgsunat_update (solo admin) y cfgsunat_insert (superadmin).
DROP POLICY IF EXISTS cfg_sunat_hotel ON public.configuracion_sunat;

-- 2) fn_emitir_comprobante: permitir también al rol "restaurante" (cobro de
--    mesas con boleta). La app ya no lee configuracion_sunat para numerar:
--    usa esta función (numeración atómica, estado PENDIENTE_ENVIO).
DO $$
DECLARE d text;
BEGIN
  d := pg_get_functiondef('public.fn_emitir_comprobante'::regproc);
  IF position($q$NOT IN ('admin','recepcion')$q$ in d) > 0 THEN
    d := replace(d, $q$NOT IN ('admin','recepcion')$q$, $q$NOT IN ('admin','recepcion','restaurante')$q$);
    EXECUTE d;
  END IF;
END $$;

-- 3) habitaciones: recepción y limpieza pueden cambiar el ESTADO (check-in,
--    check-out, limpieza, mantenimiento), pero solo el admin puede cambiar
--    número, piso, tipo, activo u hotel.
CREATE OR REPLACE FUNCTION public.fn_habitaciones_solo_admin_estructura()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NOT NULL
     AND NOT COALESCE(public.fn_es_superadmin(), false)
     AND COALESCE(public.fn_mi_rol(), '') <> 'admin'
     AND (NEW.numero IS DISTINCT FROM OLD.numero
       OR NEW.piso IS DISTINCT FROM OLD.piso
       OR NEW.tipo_habitacion_id IS DISTINCT FROM OLD.tipo_habitacion_id
       OR NEW.activo IS DISTINCT FROM OLD.activo
       OR NEW.hotel_id IS DISTINCT FROM OLD.hotel_id) THEN
    RAISE EXCEPTION 'Solo el administrador puede modificar los datos de la habitación.'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_habitaciones_solo_admin_estructura ON public.habitaciones;
CREATE TRIGGER trg_habitaciones_solo_admin_estructura
  BEFORE UPDATE ON public.habitaciones
  FOR EACH ROW EXECUTE FUNCTION public.fn_habitaciones_solo_admin_estructura();
