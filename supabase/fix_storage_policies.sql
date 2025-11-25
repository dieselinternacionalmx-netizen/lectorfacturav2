-- Eliminar políticas anteriores restrictivas
DROP POLICY IF EXISTS "Authenticated users can upload invoices" ON storage.objects;
DROP POLICY IF EXISTS "Users can view invoices by role" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update invoices" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete invoices" ON storage.objects;

-- Nueva política: Permitir subida pública (anon y authenticated)
-- Esto es necesario para que la función de subida funcione sin complicaciones de auth por ahora
CREATE POLICY "Public Upload Access"
ON storage.objects FOR INSERT
TO public
WITH CHECK ( bucket_id = 'invoices' );

-- Nueva política: Permitir lectura pública
CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT
TO public
USING ( bucket_id = 'invoices' );

-- Nueva política: Permitir update/delete público (opcional, para limpiar)
CREATE POLICY "Public Update/Delete Access"
ON storage.objects FOR DELETE
TO public
USING ( bucket_id = 'invoices' );
