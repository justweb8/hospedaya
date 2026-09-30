-- ============================================================
-- HospedaYa — DATOS DE PRUEBA para probar listas largas (30/09/2026)
-- NO es un cambio de estructura. Se usó para probar Huéspedes y Comprobantes con
-- muchos registros en el hotel demo "luna nueva" y luego se BORRÓ (ver abajo).
-- Series de prueba PRB1 / PRF1: no tocan la numeración real (B001 / F001), que sale
-- de los contadores de configuracion_sunat.
-- ============================================================

-- 1) 60 huéspedes de prueba (DNI 88000001…88000060), registrados en los últimos ~120 días
insert into huespedes (hotel_id, tipo_doc, num_doc, nombres, apellidos, celular, created_at)
select 'e8221391-04ef-42ce-bb7e-f946c5c62276', 'DNI', '880000' || lpad(n::text, 2, '0'),
       'PRUEBA-Claude', 'Tester ' || (case when n % 3 = 0 then 'Quispe ' when n % 3 = 1 then 'Mamani ' else 'Rojas ' end) || lpad(n::text, 2, '0'),
       '9880000' || lpad(n::text, 2, '0'),
       now() - ((n * 2) || ' days')::interval
from generate_series(1, 60) n;

-- 2) 70 comprobantes de prueba: 25 en el mes actual, 25 en agosto y 20 en julio 2026
insert into comprobantes_sunat (hotel_id, tipo_doc, serie, correlativo, ruc_emisor, ruc_receptor, razon_social_rec, total, igv, estado_sunat, created_at)
select h.id,
       case when n % 4 = 0 then 'factura' else 'boleta' end,
       case when n % 4 = 0 then 'PRF1' else 'PRB1' end,
       n, coalesce(h.ruc, '00000000000'),
       case when n % 4 = 0 then '20' || lpad(n::text, 9, '0') else null end,
       'PRUEBA-Claude Cliente ' || lpad(n::text, 2, '0'),
       round((20 + n * 3.5)::numeric, 2), round(((20 + n * 3.5) * 18 / 118)::numeric, 2),
       case when n % 10 = 0 then 'ANULADO' when n % 7 = 0 then 'ACEPTADO' else 'PENDIENTE_ENVIO' end,
       case when n <= 25 then now() - ((n * 17) || ' hours')::interval
            when n <= 50 then make_timestamptz(2026, 8, 1 + (n - 26), 12, 0, 0, 'America/Lima')
            else make_timestamptz(2026, 7, 1 + (n - 51), 12, 0, 0, 'America/Lima') end
from generate_series(1, 70) n
cross join (select id, ruc from hoteles where id = 'e8221391-04ef-42ce-bb7e-f946c5c62276') h;

-- ── LIMPIEZA (ejecutada al terminar las pruebas) ─────────────
-- delete from comprobantes_sunat where hotel_id = 'e8221391-04ef-42ce-bb7e-f946c5c62276' and serie in ('PRB1','PRF1');
-- delete from huespedes where hotel_id = 'e8221391-04ef-42ce-bb7e-f946c5c62276' and num_doc like '880000__' and nombres = 'PRUEBA-Claude';
