-- ============================================================
-- HospedaYa — 07: fn_consultar_documento (DNI/RUC) más segura
-- Fecha: 28/09/2026 · Aplicado en Supabase (proyecto gcuicpitzbcwqxlloodm)
--
-- Problemas de la versión anterior:
--  1. p_numero se pegaba a la URL del proveedor sin validar: se podía inyectar
--     texto ("?", "/", "&"…) y hacer otras consultas usando el token maestro.
--  2. La app llama con p_tipo='ping' en cada inicio de sesión para saber si el
--     servicio está activo; con token configurado eso hacía una llamada REAL al
--     proveedor (RUC vacío) → gasto de cuota en cada login de cada usuario.
--  3. Si el proveedor devolvía error (token inválido, sin saldo, no encontrado)
--     se devolvían campos vacíos sin 'error' → el botón "Probar" siempre decía OK.
--
-- Cambios: valida DNI (8 dígitos) / RUC (11 dígitos); 'ping' responde sin llamar
-- al proveedor; si el proveedor no devuelve datos, se informa el error. El resto
-- (permisos, lectura del token en el servidor, URLs) queda igual.
-- ============================================================

CREATE OR REPLACE FUNCTION public.fn_consultar_documento(p_tipo text, p_numero text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_token TEXT; v_proveedor VARCHAR(30); v_url TEXT; v_resp JSONB;
  v_hotel_id UUID; v_activo BOOLEAN; v_status INT; v_num TEXT;
BEGIN
  -- 1. Validar que el llamador está autenticado
  IF auth.uid() IS NULL THEN RETURN jsonb_build_object('error', 'No autenticado'); END IF;

  -- 2. Verificar que pertenece a un hotel activo (o es superadmin)
  SELECT pu.hotel_id, COALESCE(h.estado = 'activo', TRUE) INTO v_hotel_id, v_activo
  FROM perfiles_usuarios pu LEFT JOIN hoteles h ON h.id = pu.hotel_id
  WHERE pu.user_id = auth.uid() LIMIT 1;
  IF v_hotel_id IS NULL AND NOT EXISTS (
       SELECT 1 FROM perfiles_usuarios WHERE user_id = auth.uid() AND es_superadmin = TRUE) THEN
    RETURN jsonb_build_object('error', 'Sin hotel asignado');
  END IF;
  IF v_activo = FALSE THEN RETURN jsonb_build_object('error', 'Hotel suspendido'); END IF;

  -- 3. Leer token desde configuracion_global (nunca sale al cliente)
  SELECT token_dni_ruc, proveedor_dni_ruc INTO v_token, v_proveedor FROM configuracion_global WHERE id = 1;
  IF v_token IS NULL OR v_token = '' THEN
    RETURN jsonb_build_object('error', 'Servicio de identidad no configurado');
  END IF;

  -- 3b. 'ping': solo informa que el servicio está configurado (sin gastar consultas)
  IF p_tipo = 'ping' THEN RETURN jsonb_build_object('ok', true, 'proveedor', v_proveedor); END IF;

  -- 3c. Validar el número (evita inyectar texto en la URL del proveedor)
  v_num := trim(coalesce(p_numero, ''));
  IF p_tipo = 'dni' AND v_num !~ '^[0-9]{8}$' THEN RETURN jsonb_build_object('error', 'DNI inválido (8 dígitos)'); END IF;
  IF p_tipo = 'ruc' AND v_num !~ '^[0-9]{11}$' THEN RETURN jsonb_build_object('error', 'RUC inválido (11 dígitos)'); END IF;
  IF p_tipo NOT IN ('dni','ruc') THEN RETURN jsonb_build_object('error', 'Tipo de documento no soportado'); END IF;

  -- 4. Construir URL según proveedor y tipo de documento
  IF v_proveedor = 'apis_net_pe' THEN
    IF p_tipo = 'dni' THEN v_url := 'https://api.apis.net.pe/v2/reniec/dni?numero=' || v_num;
    ELSE v_url := 'https://api.apis.net.pe/v2/sunat/ruc?numero=' || v_num; END IF;
  ELSE
    IF p_tipo = 'dni' THEN v_url := 'https://api.migo.pe/api/v1/dni/' || v_num;
    ELSE v_url := 'https://api.migo.pe/api/v1/ruc/' || v_num; END IF;
  END IF;

  -- 5. Llamada HTTP via extensión http de Supabase
  SELECT status, content::JSONB INTO v_status, v_resp FROM http((
    'GET', v_url,
    ARRAY[http_header('Authorization', 'Bearer ' || v_token), http_header('Accept', 'application/json')],
    NULL, NULL)::http_request);

  -- 5b. Error del proveedor (token inválido, sin saldo, no encontrado…)
  IF v_status IS NULL OR v_status >= 400 THEN
    RETURN jsonb_build_object('error', 'Proveedor respondió ' || coalesce(v_status::text, 'sin respuesta')
      || coalesce(': ' || coalesce(v_resp->>'message', v_resp->>'error'), ''), 'status', v_status);
  END IF;

  -- 6. Devolver solo campos limpios (NUNCA el token)
  IF p_tipo = 'dni' THEN
    RETURN jsonb_build_object(
      'nombres', COALESCE(v_resp->>'nombres', ''),
      'apellidoPaterno', COALESCE(v_resp->>'apellidoPaterno', ''),
      'apellidoMaterno', COALESCE(v_resp->>'apellidoMaterno', ''),
      'apellidos', COALESCE(v_resp->>'apellidos', ''),
      'proveedor', v_proveedor);
  ELSE
    RETURN jsonb_build_object(
      'razonSocial', COALESCE(v_resp->>'razonSocial', v_resp->>'nombre', ''),
      'direccion', COALESCE(v_resp->>'direccion', v_resp->>'domicilioFiscal', ''),
      'estado', COALESCE(v_resp->>'estado', ''),
      'proveedor', v_proveedor);
  END IF;
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('error', SQLERRM);
END;
$function$;

-- ── VERSIÓN ANTERIOR (para revertir, pegar tal cual) ─────────
-- CREATE OR REPLACE FUNCTION public.fn_consultar_documento(p_tipo text, p_numero text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$ DECLARE v_token TEXT; v_proveedor VARCHAR(30); v_url TEXT; v_resp JSONB; v_hotel_id UUID; v_activo BOOLEAN; BEGIN IF auth.uid() IS NULL THEN RETURN jsonb_build_object('error', 'No autenticado'); END IF; SELECT pu.hotel_id, COALESCE(h.estado = 'activo', TRUE) INTO v_hotel_id, v_activo FROM perfiles_usuarios pu LEFT JOIN hoteles h ON h.id = pu.hotel_id WHERE pu.user_id = auth.uid() LIMIT 1; IF v_hotel_id IS NULL AND NOT EXISTS ( SELECT 1 FROM perfiles_usuarios WHERE user_id = auth.uid() AND es_superadmin = TRUE ) THEN RETURN jsonb_build_object('error', 'Sin hotel asignado'); END IF; IF v_activo = FALSE THEN RETURN jsonb_build_object('error', 'Hotel suspendido'); END IF; SELECT token_dni_ruc, proveedor_dni_ruc INTO v_token, v_proveedor FROM configuracion_global WHERE id = 1; IF v_token IS NULL OR v_token = '' THEN RETURN jsonb_build_object('error', 'Servicio de identidad no configurado'); END IF; IF v_proveedor = 'apis_net_pe' THEN IF p_tipo = 'dni' THEN v_url := 'https://api.apis.net.pe/v2/reniec/dni?numero=' || p_numero; ELSE v_url := 'https://api.apis.net.pe/v2/sunat/ruc?numero=' || p_numero; END IF; ELSE IF p_tipo = 'dni' THEN v_url := 'https://api.migo.pe/api/v1/dni/' || p_numero; ELSE v_url := 'https://api.migo.pe/api/v1/ruc/' || p_numero; END IF; END IF; SELECT content::JSONB INTO v_resp FROM http(( 'GET', v_url, ARRAY[http_header('Authorization', 'Bearer ' || v_token), http_header('Accept', 'application/json')], NULL, NULL )::http_request); IF p_tipo = 'dni' THEN RETURN jsonb_build_object( 'nombres', COALESCE(v_resp->>'nombres', ''), 'apellidoPaterno', COALESCE(v_resp->>'apellidoPaterno', ''), 'apellidoMaterno', COALESCE(v_resp->>'apellidoMaterno', ''), 'apellidos', COALESCE(v_resp->>'apellidos', ''), 'proveedor', v_proveedor ); ELSE RETURN jsonb_build_object( 'razonSocial', COALESCE(v_resp->>'razonSocial', v_resp->>'nombre', ''), 'direccion', COALESCE(v_resp->>'direccion', v_resp->>'domicilioFiscal', ''), 'estado', COALESCE(v_resp->>'estado', ''), 'proveedor', v_proveedor ); END IF; EXCEPTION WHEN OTHERS THEN RETURN jsonb_build_object('error', SQLERRM); END; $function$;
