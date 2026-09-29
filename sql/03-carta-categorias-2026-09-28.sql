-- ============================================================
-- HospedaYa — Carta fija: categorías "entradas" y "platos" (28/09/2026)
-- Antes: CHECK (categoria IN ('bebidas','snacks','postres','otros'))
-- REVERTIR (solo si no hay filas con entradas/platos):
--   ALTER TABLE public.carta_restaurante DROP CONSTRAINT carta_restaurante_categoria_check;
--   ALTER TABLE public.carta_restaurante ADD CONSTRAINT carta_restaurante_categoria_check
--     CHECK (categoria = ANY (ARRAY['bebidas','snacks','postres','otros']));
-- ============================================================
ALTER TABLE public.carta_restaurante DROP CONSTRAINT IF EXISTS carta_restaurante_categoria_check;
ALTER TABLE public.carta_restaurante ADD CONSTRAINT carta_restaurante_categoria_check
  CHECK (categoria = ANY (ARRAY['entradas','platos','bebidas','postres','snacks','otros']));
