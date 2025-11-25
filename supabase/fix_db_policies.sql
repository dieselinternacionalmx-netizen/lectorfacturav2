-- Relajar políticas de base de datos para permitir inserción pública (temporalmente)

-- INVOICES
DROP POLICY IF EXISTS "Admins can insert invoices" ON invoices;

CREATE POLICY "Public Insert Invoices"
ON invoices FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Public Select Invoices"
ON invoices FOR SELECT
TO public
USING (true);

-- BANK TRANSACTIONS
DROP POLICY IF EXISTS "Admins can insert transactions" ON bank_transactions;

CREATE POLICY "Public Insert Transactions"
ON bank_transactions FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Public Select Transactions"
ON bank_transactions FOR SELECT
TO public
USING (true);
