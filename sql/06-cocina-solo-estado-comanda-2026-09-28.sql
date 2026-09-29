-- ============================================================
-- HospedaYa — 06: cocina solo puede mover el estado de la comanda
-- Fecha: 28/09/2026 · Aplicado en Supabase (proyecto gcuicpitzbcwqxlloodm)
--
-- Antes: el rol COCINA podía modificar cualquier columna de ventas_directas
-- (total, metodo_pago, etc.) directamente en la base de datos, por ejemplo poner
-- el total en 0 o marcar un pedido como cobrado sin pasar por caja.
--
-- Ahora (trigger; las políticas no se tocan): cocina solo puede cambiar el
-- ESTADO dentro de `notas`, y únicamente abierta → preparando → listo
-- (o abierta → listo). No puede tocar mesa, hora, total ni método de pago.
-- ============================================================

create or replace function public.fn_cocina_solo_estado_comanda()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  est_old text := substring(coalesce(old.notas,'') from 'ESTADO:([a-z_]+)');
  est_new text := substring(coalesce(new.notas,'') from 'ESTADO:([a-z_]+)');
begin
  if auth.uid() is null or coalesce(public.fn_mi_rol(), '') <> 'cocina' then
    return new;
  end if;

  if (to_jsonb(new) - 'notas' - 'updated_at') is distinct from (to_jsonb(old) - 'notas' - 'updated_at')
     or regexp_replace(coalesce(new.notas,''), 'ESTADO:[a-z_]+', '') is distinct from
        regexp_replace(coalesce(old.notas,''), 'ESTADO:[a-z_]+', '')
     or est_old is null or est_old not in ('abierta','preparando')
     or est_new is null or est_new not in ('preparando','listo') then
    raise exception 'Cocina solo puede pasar la comanda a "Preparando" o "Listo".' using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_cocina_solo_estado_comanda on public.ventas_directas;
create trigger trg_cocina_solo_estado_comanda
  before update on public.ventas_directas
  for each row execute function public.fn_cocina_solo_estado_comanda();

-- ── REVERTIR ─────────────────────────────────────────────────
-- drop trigger if exists trg_cocina_solo_estado_comanda on public.ventas_directas;
-- drop function if exists public.fn_cocina_solo_estado_comanda();
