-- ============================================
-- MIGRATION: Invoice-Centric Architecture
-- Adds payment tracking to invoices
-- ============================================

-- Step 1: Add new columns to invoices table
ALTER TABLE invoices ADD COLUMN payment_status TEXT DEFAULT 'pending';
ALTER TABLE invoices ADD COLUMN paid_amount REAL DEFAULT 0;
ALTER TABLE invoices ADD COLUMN remaining_amount REAL;

-- Step 2: Create invoice_payments table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS invoice_payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  transaction_id INTEGER NOT NULL REFERENCES bank_transactions(id) ON DELETE CASCADE,
  amount REAL NOT NULL,
  applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  applied_by TEXT,
  notes TEXT,
  UNIQUE(invoice_id, transaction_id)
);

-- Step 3: Add indexes for performance
CREATE INDEX idx_invoice_payments_invoice ON invoice_payments(invoice_id);
CREATE INDEX idx_invoice_payments_transaction ON invoice_payments(transaction_id);
CREATE INDEX idx_invoices_payment_status ON invoices(payment_status);
CREATE INDEX idx_invoices_agent_status ON invoices(agent, payment_status);

-- Step 4: Add columns to bank_transactions
ALTER TABLE bank_transactions ADD COLUMN allocated_amount REAL DEFAULT 0;
ALTER TABLE bank_transactions ADD COLUMN remaining_amount REAL;

-- Step 5: Create trigger to update invoice payment status
CREATE TRIGGER update_invoice_payment_status
AFTER INSERT ON invoice_payments
BEGIN
  -- Update paid_amount
  UPDATE invoices
  SET paid_amount = (
    SELECT COALESCE(SUM(amount), 0)
    FROM invoice_payments
    WHERE invoice_id = NEW.invoice_id
  ),
  remaining_amount = total - (
    SELECT COALESCE(SUM(amount), 0)
    FROM invoice_payments
    WHERE invoice_id = NEW.invoice_id
  )
  WHERE id = NEW.invoice_id;
  
  -- Update payment_status
  UPDATE invoices
  SET payment_status = CASE
    WHEN paid_amount >= total THEN 'paid'
    WHEN paid_amount > 0 THEN 'partial'
    ELSE 'pending'
  END
  WHERE id = NEW.invoice_id;
  
  -- Update bank_transactions allocated_amount
  UPDATE bank_transactions
  SET allocated_amount = (
    SELECT COALESCE(SUM(amount), 0)
    FROM invoice_payments
    WHERE transaction_id = NEW.transaction_id
  ),
  remaining_amount = ABS(amount) - (
    SELECT COALESCE(SUM(amount), 0)
    FROM invoice_payments
    WHERE transaction_id = NEW.transaction_id
  )
  WHERE id = NEW.transaction_id;
END;

-- Step 6: Create trigger for DELETE on invoice_payments
CREATE TRIGGER update_invoice_payment_status_on_delete
AFTER DELETE ON invoice_payments
BEGIN
  -- Update paid_amount
  UPDATE invoices
  SET paid_amount = (
    SELECT COALESCE(SUM(amount), 0)
    FROM invoice_payments
    WHERE invoice_id = OLD.invoice_id
  ),
  remaining_amount = total - (
    SELECT COALESCE(SUM(amount), 0)
    FROM invoice_payments
    WHERE invoice_id = OLD.invoice_id
  )
  WHERE id = OLD.invoice_id;
  
  -- Update payment_status
  UPDATE invoices
  SET payment_status = CASE
    WHEN paid_amount >= total THEN 'paid'
    WHEN paid_amount > 0 THEN 'partial'
    ELSE 'pending'
  END
  WHERE id = OLD.invoice_id;
  
  -- Update bank_transactions allocated_amount
  UPDATE bank_transactions
  SET allocated_amount = (
    SELECT COALESCE(SUM(amount), 0)
    FROM invoice_payments
    WHERE transaction_id = OLD.transaction_id
  ),
  remaining_amount = ABS(amount) - (
    SELECT COALESCE(SUM(amount), 0)
    FROM invoice_payments
    WHERE transaction_id = OLD.transaction_id
  )
  WHERE id = OLD.transaction_id;
END;

-- Step 7: Initialize remaining_amount for existing invoices
UPDATE invoices SET remaining_amount = total WHERE remaining_amount IS NULL;

-- Step 8: Initialize remaining_amount for existing bank_transactions
UPDATE bank_transactions SET remaining_amount = ABS(amount) WHERE remaining_amount IS NULL;

-- Step 9: Migrate existing data from associated_invoices to invoice_payments
-- This will be done via a separate migration script since it requires parsing JSON
