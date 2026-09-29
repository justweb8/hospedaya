-- ============================================================
-- HospedaYa — 05: escritura por rol en tablas que estaban abiertas
-- Fecha: 28/09/2026 · Aplicado en Supabase (proyecto gcuicpitzbcwqxlloodm)
--
-- Antes: estas políticas "ALL" dejaban a CUALQUIER empleado del hotel
-- (limpieza, cocina, recepción…) crear, cambiar y BORRAR:
--   carta_restaurante.carta_all        (precios de la carta)
--   menu_dia.menudia_all                (menú del día)
--   config_restaurante.cfgrest_all      (mesas / configuración)
--   mantenimientos.mant_hotel           (historial de mantenimientos)
-- Definición original de las 4 (para revertir):
--   USING (fn_es_superadmin() OR (hotel_id = fn_mi_hotel_id()))
--
-- Ahora: todos los del hotel pueden LEER; escribir solo quien lo usa en la app.
-- Además: una habitación con estadía ACTIVA no puede pasar a libre/limpieza/
-- mantenimiento/reservada sin check-out (antes solo lo controlaba la app).
-- ============================================================

-- ── carta_restaurante: leer todos · escribir admin y restaurante ──
drop policy if exists carta_all on public.carta_restaurante;
create policy carta_sel on public.carta_restaurante for select
  using (fn_es_superadmin() or hotel_id = fn_mi_hotel_id());
create policy carta_write on public.carta_restaurante for all
  using      (fn_es_superadmin() or (hotel_id = fn_mi_hotel_id() and fn_mi_rol() in ('admin','restaurante')))
  with check (fn_es_superadmin() or (hotel_id = fn_mi_hotel_id() and fn_mi_rol() in ('admin','restaurante')));

-- ── menu_dia ──
drop policy if exists menudia_all on public.menu_dia;
create policy menudia_sel on public.menu_dia for select
  using (fn_es_superadmin() or hotel_id = fn_mi_hotel_id());
create policy menudia_write on public.menu_dia for all
  using      (fn_es_superadmin() or (hotel_id = fn_mi_hotel_id() and fn_mi_rol() in ('admin','restaurante')))
  with check (fn_es_superadmin() or (hotel_id = fn_mi_hotel_id() and fn_mi_rol() in ('admin','restaurante')));

-- ── config_restaurante ──
drop policy if exists cfgrest_all on public.config_restaurante;
create policy cfgrest_sel on public.config_restaurante for select
  using (fn_es_superadmin() or hotel_id = fn_mi_hotel_id());
create policy cfgrest_write on public.config_restaurante for all
  using      (fn_es_superadmin() or (hotel_id = fn_mi_hotel_id() and fn_mi_rol() in ('admin','restaurante')))
  with check (fn_es_superadmin() or (hotel_id = fn_mi_hotel_id() and fn_mi_rol() in ('admin','restaurante')));

-- ── mantenimientos: leer todos · crear/editar admin y recepción · borrar solo admin ──
drop policy if exists mant_hotel on public.mantenimientos;
create policy mant_sel on public.mantenimientos for select
  using (fn_es_superadmin() or hotel_id = fn_mi_hotel_id());
create policy mant_ins on public.mantenimientos for insert
  with check (fn_es_superadmin() or (hotel_id = fn_mi_hotel_id() and fn_mi_rol() in ('admin','recepcion')));
create policy mant_upd on public.mantenimientos for update
  using      (fn_es_superadmin() or (hotel_id = fn_mi_hotel_id() and fn_mi_rol() in ('admin','recepcion')))
  with check (fn_es_superadmin() or (hotel_id = fn_mi_hotel_id() and fn_mi_rol() in ('admin','recepcion')));
create policy mant_del on public.mantenimientos for delete
  using (fn_es_superadmin() or (hotel_id = fn_mi_hotel_id() and fn_mi_rol() = 'admin'));

-- ── habitaciones: con huésped adentro solo se libera con check-out ──
create or replace function public.fn_habitacion_ocupada_no_liberar()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null
     and new.estado is distinct from old.estado
     and new.estado in ('libre','limpieza','mantenimiento','reservada')
     and exists (select 1 from public.estadias_reservas e
                 where e.habitacion_id = new.id and e.estado = 'activa') then
    raise exception 'La habitación tiene un huésped alojado: primero haz el check-out.' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_habitacion_ocupada_no_liberar on public.habitaciones;
create trigger trg_habitacion_ocupada_no_liberar
  before update on public.habitaciones
  for each row execute function public.fn_habitacion_ocupada_no_liberar();

-- ── REVERTIR ─────────────────────────────────────────────────
-- drop trigger if exists trg_habitacion_ocupada_no_liberar on public.habitaciones;
-- drop function if exists public.fn_habitacion_ocupada_no_liberar();
-- drop policy carta_sel on public.carta_restaurante;  drop policy carta_write on public.carta_restaurante;
-- create policy carta_all on public.carta_restaurante for all using (fn_es_superadmin() or (hotel_id = fn_mi_hotel_id()));
-- drop policy menudia_sel on public.menu_dia;  drop policy menudia_write on public.menu_dia;
-- create policy menudia_all on public.menu_dia for all using (fn_es_superadmin() or (hotel_id = fn_mi_hotel_id()));
-- drop policy cfgrest_sel on public.config_restaurante;  drop policy cfgrest_write on public.config_restaurante;
-- create policy cfgrest_all on public.config_restaurante for all using (fn_es_superadmin() or (hotel_id = fn_mi_hotel_id()));
-- drop policy mant_sel on public.mantenimientos; drop policy mant_ins on public.mantenimientos;
-- drop policy mant_upd on public.mantenimientos; drop policy mant_del on public.mantenimientos;
-- create policy mant_hotel on public.mantenimientos for all using (fn_es_superadmin() or (hotel_id = fn_mi_hotel_id()));
