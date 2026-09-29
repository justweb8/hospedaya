-- ============================================================
-- HospedaYa — Rol "restaurante" con caja propia + arreglo de comandas
-- (28/09/2026)
--
-- Antes: el rol restaurante podía tomar pedidos pero NO podía abrir turno,
-- cobrar, cargar a habitación ni ver sus comprobantes. Además no existía
-- política DELETE en items_venta_directa, por lo que "Actualizar comanda"
-- duplicaba los productos del pedido (para cualquier rol).
--
-- REVERTIR: al final de este archivo están las expresiones originales.
-- ============================================================

-- 1) Turnos de caja: el restaurante abre y ve SU propio turno
ALTER POLICY turnos_caja_ins ON public.turnos_caja WITH CHECK (
  (SELECT fn_es_superadmin()) OR (
    hotel_id = (SELECT fn_mi_hotel_id())
    AND (SELECT fn_mi_rol()) = ANY (ARRAY['admin','recepcion','restaurante'])
    AND recepcionista_id = auth.uid() AND estado = 'abierto'
    AND (SELECT fn_hotel_vigente())));

ALTER POLICY turnos_caja_sel ON public.turnos_caja USING (
  (SELECT fn_es_superadmin()) OR (
    hotel_id = (SELECT fn_mi_hotel_id()) AND (
      (SELECT fn_mi_rol()) = 'admin'
      OR ((SELECT fn_mi_rol()) = ANY (ARRAY['recepcion','restaurante']) AND recepcionista_id = auth.uid()))));

-- 2) Movimientos de caja: cobra y ve solo en su turno abierto
ALTER POLICY movimientos_caja_ins ON public.movimientos_caja WITH CHECK (
  (SELECT fn_es_superadmin()) OR (
    hotel_id = (SELECT fn_mi_hotel_id())
    AND (SELECT fn_mi_rol()) = ANY (ARRAY['admin','recepcion','restaurante'])
    AND usuario_id = auth.uid()
    AND turno_caja_id IN (SELECT id FROM public.turnos_caja WHERE recepcionista_id = auth.uid() AND estado = 'abierto')
    AND (SELECT fn_hotel_vigente())));

ALTER POLICY movimientos_caja_sel ON public.movimientos_caja USING (
  (SELECT fn_es_superadmin()) OR (
    hotel_id = (SELECT fn_mi_hotel_id()) AND (
      (SELECT fn_mi_rol()) = 'admin'
      OR ((SELECT fn_mi_rol()) = ANY (ARRAY['recepcion','restaurante'])
          AND turno_caja_id IN (SELECT id FROM public.turnos_caja WHERE recepcionista_id = auth.uid())))));

-- 3) Cierre ciego: permitir al restaurante cerrar su turno
DO $$
DECLARE d text;
BEGIN
  d := pg_get_functiondef('public.fn_cerrar_turno'::regproc);
  IF position($q$NOT IN ('admin','recepcion')$q$ in d) > 0 THEN
    d := replace(d, $q$NOT IN ('admin','recepcion')$q$, $q$NOT IN ('admin','recepcion','restaurante')$q$);
    EXECUTE d;
  END IF;
END $$;

-- 4) Cargar a habitación: ver estadías ACTIVAS (habitación y huésped) y agregar consumos
ALTER POLICY consumos_estadia_ins ON public.consumos_estadia WITH CHECK (
  (SELECT fn_es_superadmin()) OR (
    hotel_id = (SELECT fn_mi_hotel_id())
    AND (SELECT fn_mi_rol()) = ANY (ARRAY['admin','recepcion','restaurante'])
    AND (SELECT fn_hotel_vigente())));

DROP POLICY IF EXISTS estadias_restaurante_activas_sel ON public.estadias_reservas;
CREATE POLICY estadias_restaurante_activas_sel ON public.estadias_reservas
  FOR SELECT TO authenticated USING (
    hotel_id = (SELECT fn_mi_hotel_id())
    AND (SELECT fn_mi_rol()) = 'restaurante'
    AND estado = 'activa');

-- 5) Comprobantes: el restaurante ve los emitidos por ventas (no los de hospedaje)
DROP POLICY IF EXISTS comprobantes_restaurante_sel ON public.comprobantes_sunat;
CREATE POLICY comprobantes_restaurante_sel ON public.comprobantes_sunat
  FOR SELECT TO authenticated USING (
    hotel_id = (SELECT fn_mi_hotel_id())
    AND (SELECT fn_mi_rol()) = 'restaurante'
    AND venta_directa_id IS NOT NULL);

-- 6) Comandas: permitir borrar ítems al actualizar un pedido (evita duplicados)
DROP POLICY IF EXISTS items_venta_directa_del ON public.items_venta_directa;
CREATE POLICY items_venta_directa_del ON public.items_venta_directa
  FOR DELETE TO authenticated USING (
    (SELECT fn_es_superadmin()) OR (
      hotel_id = (SELECT fn_mi_hotel_id())
      AND (SELECT fn_mi_rol()) = ANY (ARRAY['admin','recepcion','restaurante'])));

-- ============================================================
-- REVERTIR (expresiones originales)
-- ============================================================
-- ALTER POLICY turnos_caja_ins ON public.turnos_caja WITH CHECK ((SELECT fn_es_superadmin()) OR ((hotel_id = (SELECT fn_mi_hotel_id())) AND ((SELECT fn_mi_rol()) = ANY (ARRAY['admin','recepcion'])) AND (recepcionista_id = auth.uid()) AND (estado = 'abierto') AND (SELECT fn_hotel_vigente())));
-- ALTER POLICY turnos_caja_sel ON public.turnos_caja USING ((SELECT fn_es_superadmin()) OR ((hotel_id = (SELECT fn_mi_hotel_id())) AND (((SELECT fn_mi_rol()) = 'admin') OR (((SELECT fn_mi_rol()) = 'recepcion') AND (recepcionista_id = auth.uid())))));
-- ALTER POLICY movimientos_caja_ins ON public.movimientos_caja WITH CHECK ((SELECT fn_es_superadmin()) OR ((hotel_id = (SELECT fn_mi_hotel_id())) AND ((SELECT fn_mi_rol()) = ANY (ARRAY['admin','recepcion'])) AND (usuario_id = auth.uid()) AND (turno_caja_id IN (SELECT turnos_caja.id FROM turnos_caja WHERE ((turnos_caja.recepcionista_id = auth.uid()) AND (turnos_caja.estado = 'abierto')))) AND (SELECT fn_hotel_vigente())));
-- ALTER POLICY movimientos_caja_sel ON public.movimientos_caja USING ((SELECT fn_es_superadmin()) OR ((hotel_id = (SELECT fn_mi_hotel_id())) AND (((SELECT fn_mi_rol()) = 'admin') OR (((SELECT fn_mi_rol()) = 'recepcion') AND (turno_caja_id IN (SELECT turnos_caja.id FROM turnos_caja WHERE (turnos_caja.recepcionista_id = auth.uid())))))));
-- ALTER POLICY consumos_estadia_ins ON public.consumos_estadia WITH CHECK ((SELECT fn_es_superadmin()) OR ((hotel_id = (SELECT fn_mi_hotel_id())) AND ((SELECT fn_mi_rol()) = ANY (ARRAY['admin','recepcion'])) AND (SELECT fn_hotel_vigente())));
-- DROP POLICY estadias_restaurante_activas_sel ON public.estadias_reservas;
-- DROP POLICY comprobantes_restaurante_sel ON public.comprobantes_sunat;
-- DROP POLICY items_venta_directa_del ON public.items_venta_directa;
-- fn_cerrar_turno: reemplazar NOT IN ('admin','recepcion','restaurante') por NOT IN ('admin','recepcion')
