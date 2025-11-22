-- ============================================
-- SUPABASE STORAGE POLICIES
-- Para PDFs de facturas
-- ============================================

-- ============================================
-- BUCKET: invoices
-- ============================================

-- Política: Solo usuarios autenticados pueden subir PDFs
CREATE POLICY "Authenticated users can upload invoices"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'invoices' AND
  (storage.foldername(name))[1] = (
    SELECT agent FROM user_profiles WHERE user_id = auth.uid()
  )
);

-- Política: Usuarios pueden ver PDFs según su rol
CREATE POLICY "Users can view invoices by role"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'invoices' AND
  EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.user_id = auth.uid()
    AND (
      up.role = 'admin' -- Admins ven todo
      OR (
        up.role IN ('agent', 'viewer') AND
        (storage.foldername(name))[1] = up.agent -- Solo PDFs de su agente
      )
    )
  )
);

-- Política: Solo admins pueden actualizar PDFs
CREATE POLICY "Admins can update invoices"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'invoices' AND
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Política: Solo admins pueden eliminar PDFs
CREATE POLICY "Admins can delete invoices"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'invoices' AND
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- ============================================
-- ESTRUCTURA DE CARPETAS RECOMENDADA
-- ============================================

-- Los PDFs deben organizarse por agente:
-- invoices/
--   ANDRES/
--     F-34963.pdf
--     F-34986.pdf
--   JUAN_DIOS/
--     F-34914.pdf
--   TEODORO/
--     F-34311.pdf
--     F-34219.pdf
--   VALERIA/
--     F-33108.pdf

-- Esto permite que las políticas RLS filtren automáticamente
-- por carpeta según el agente del usuario
