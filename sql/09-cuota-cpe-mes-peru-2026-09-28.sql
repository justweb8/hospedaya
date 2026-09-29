-- ============================================================
-- HospedaYa — 09: fn_verificar_cuota_cpe cuenta el mes de Perú correctamente
-- Fecha: 28/09/2026 · Aplicado en Supabase (proyecto gcuicpitzbcwqxlloodm)
--
-- Antes: MAKE_DATE(...)::TIMESTAMPTZ AT TIME ZONE 'America/Lima' convertía dos
-- veces la zona horaria: el "inicio de setiembre" quedaba en el 31/08 14:00 (hora
-- Perú) y el mes mostrado salía "2026-08". Se contaban comprobantes de otro mes.
-- Ahora: inicio = 1.º del mes 00:00 hora Perú; fin = 1.º del mes siguiente.
-- Además: solo el SuperAdmin o un usuario del propio hotel pueden consultar la
-- cuota de un hotel (antes cualquiera podía ver la de cualquier hotel).
-- ============================================================

CREATE OR REPLACE FUNCTION public.fn_verificar_cuota_cpe(p_hotel_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_lima    TIMESTAMP := NOW() AT TIME ZONE 'America/Lima';
  v_inicio  TIMESTAMPTZ := make_timestamptz(EXTRACT(YEAR FROM v_lima)::INT, EXTRACT(MONTH FROM v_lima)::INT, 1, 0, 0, 0, 'America/Lima');
  v_fin     TIMESTAMPTZ;
  v_mes_txt TEXT := TO_CHAR(v_lima, 'YYYY-MM');
  v_limite INTEGER; v_extra INTEGER; v_emitidos INTEGER; v_disponibles INTEGER;
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.fn_es_superadmin()
     AND p_hotel_id IS DISTINCT FROM public.fn_mi_hotel_id() THEN
    RAISE EXCEPTION 'Sin permiso para ver la cuota de otro hotel' USING ERRCODE = '42501';
  END IF;
  v_fin := make_timestamptz(EXTRACT(YEAR FROM (v_lima + INTERVAL '1 month'))::INT,
                            EXTRACT(MONTH FROM (v_lima + INTERVAL '1 month'))::INT, 1, 0, 0, 0, 'America/Lima');

  SELECT COALESCE(limite_cpe_mes, 150), COALESCE(creditos_extra, 0) INTO v_limite, v_extra
  FROM hoteles WHERE id = p_hotel_id;

  SELECT COUNT(*) INTO v_emitidos FROM comprobantes_sunat
  WHERE hotel_id = p_hotel_id AND created_at >= v_inicio AND created_at < v_fin AND estado_sunat != 'ANULADO';

  v_disponibles := (v_limite + v_extra) - v_emitidos;
  RETURN jsonb_build_object('limite', v_limite + v_extra, 'emitidos', v_emitidos,
    'disponibles', v_disponibles, 'puede_emitir', v_disponibles > 0, 'mes', v_mes_txt);
END;
$function$;

-- ── VERSIÓN ANTERIOR (para revertir) ─────────────────────────
-- CREATE OR REPLACE FUNCTION public.fn_verificar_cuota_cpe(p_hotel_id uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$ DECLARE v_anio INT := EXTRACT(YEAR FROM NOW() AT TIME ZONE 'America/Lima')::INT; v_mes_num INT := EXTRACT(MONTH FROM NOW() AT TIME ZONE 'America/Lima')::INT; v_inicio TIMESTAMPTZ := MAKE_DATE(v_anio, v_mes_num, 1)::TIMESTAMPTZ AT TIME ZONE 'America/Lima'; v_fin TIMESTAMPTZ := (MAKE_DATE(v_anio, v_mes_num, 1) + INTERVAL '1 month')::TIMESTAMPTZ AT TIME ZONE 'America/Lima'; v_mes_txt TEXT := TO_CHAR(v_inicio AT TIME ZONE 'America/Lima', 'YYYY-MM'); v_limite INTEGER; v_extra INTEGER; v_emitidos INTEGER; v_disponibles INTEGER; BEGIN SELECT COALESCE(limite_cpe_mes, 150), COALESCE(creditos_extra, 0) INTO v_limite, v_extra FROM hoteles WHERE id = p_hotel_id; SELECT COUNT(*) INTO v_emitidos FROM comprobantes_sunat WHERE hotel_id = p_hotel_id AND created_at >= v_inicio AND created_at < v_fin AND estado_sunat != 'ANULADO'; v_disponibles := (v_limite + v_extra) - v_emitidos; RETURN jsonb_build_object( 'limite', v_limite + v_extra, 'emitidos', v_emitidos, 'disponibles', v_disponibles, 'puede_emitir', v_disponibles > 0, 'mes', v_mes_txt ); END; $function$;
