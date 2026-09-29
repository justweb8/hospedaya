-- ============================================================
-- HospedaYa — 08: token de facturación protegido
-- Fecha: 28/09/2026 · Aplicado en Supabase (proyecto gcuicpitzbcwqxlloodm)
--
-- fn_credenciales_facturalibre(hotel_id) era SECURITY DEFINER y la podía ejecutar
-- CUALQUIER usuario autenticado, sin verificar nada: devolvía el token de
-- FacturaLibre (el propio del hotel, token_api, o el de distribuidor) de
-- CUALQUIER hotel. Solo la usa internamente fn_emitir_a_facturalibre (que corre
-- como postgres), así que se quita el permiso de ejecución a los usuarios.
--
-- Nota: también se revisó si el dueño podía cambiarse el plan / vencimiento /
-- cuota. NO podía: el trigger existente tg_hoteles_guard solo le deja cambiar
-- nombre_comercial, direccion, telefono y email_contacto (probado simulando al
-- dueño de "luna nueva": "No tienes permiso para modificar estos datos del hotel").
-- Un trigger adicional que se creó por error se eliminó (era redundante).
-- ============================================================

revoke execute on function public.fn_credenciales_facturalibre(uuid) from public, anon, authenticated;

-- ── REVERTIR ─────────────────────────────────────────────────
-- grant execute on function public.fn_credenciales_facturalibre(uuid) to authenticated;
