-- ============================================================
-- HospedaYa — 04: precios y datos de productos solo los cambia el dueño
-- Fecha: 28/09/2026 · Aplicado en Supabase (proyecto gcuicpitzbcwqxlloodm)
--
-- Antes: las políticas productos_ins / productos_upd dejaban a RECEPCIÓN crear
-- productos y cambiar cualquier columna (precio incluido) directamente en la BD,
-- aunque la app ya ocultaba esos botones.
--
-- Ahora (trigger, las políticas NO se tocan):
--   · admin / superadmin / procesos del servidor: sin cambios.
--   · otros roles: NO pueden crear productos ni cambiar nombre, categoría,
--     precio_venta, activo, stock_minimo u hotel_id.
--     SÍ pueden cambiar stock_actual (ventas, cargos, reposición vía trigger de
--     movimientos_inventario) y costo_compra (lo registra la reposición).
-- ============================================================

create or replace function public.fn_productos_solo_admin_precios()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  -- Sin usuario (servidor / service role), superadmin o dueño: permitido
  if auth.uid() is null or public.fn_es_superadmin() or coalesce(public.fn_mi_rol(), '') = 'admin' then
    return new;
  end if;

  if tg_op = 'INSERT' then
    raise exception 'Solo el administrador puede crear productos' using errcode = '42501';
  end if;

  if new.nombre       is distinct from old.nombre
  or new.categoria    is distinct from old.categoria
  or new.precio_venta is distinct from old.precio_venta
  or new.activo       is distinct from old.activo
  or new.stock_minimo is distinct from old.stock_minimo
  or new.hotel_id     is distinct from old.hotel_id then
    raise exception 'Solo el administrador puede cambiar nombre, precio, categoría o estado del producto'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_productos_solo_admin_precios on public.productos;
create trigger trg_productos_solo_admin_precios
  before insert or update on public.productos
  for each row execute function public.fn_productos_solo_admin_precios();

-- ── REVERTIR (volver a como estaba) ──────────────────────────
-- drop trigger if exists trg_productos_solo_admin_precios on public.productos;
-- drop function if exists public.fn_productos_solo_admin_precios();
