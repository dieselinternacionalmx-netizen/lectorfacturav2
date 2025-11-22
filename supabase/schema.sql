-- ============================================
-- DIESEL Invoice System - Supabase Schema
-- Migración de SQLite a PostgreSQL
-- Con Row Level Security (RLS)
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE user_role AS ENUM ('admin', 'agent', 'viewer');

-- ============================================
-- TABLES
-- ============================================

-- User Profiles (extends Supabase auth.users)
CREATE TABLE user_profiles (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role user_role DEFAULT 'viewer' NOT NULL,
  agent TEXT, -- Nombre del agente asignado (para filtrar datos)
  mfa_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ
);

-- Invoices
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  filename TEXT UNIQUE NOT NULL,
  invoice_number TEXT,
  date DATE,
  agent TEXT,
  client TEXT,
  rfc TEXT, -- Será encriptado en la aplicación
  subtotal DECIMAL(12,2),
  iva DECIMAL(12,2),
  total DECIMAL(12,2),
  raw_text TEXT,
  pdf_url TEXT, -- URL en Supabase Storage
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Bank Transactions
CREATE TABLE bank_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE,
  agent TEXT,
  description TEXT,
  amount DECIMAL(12,2),
  balance DECIMAL(12,2),
  beneficiary TEXT,
  tracking_key TEXT,
  associated_invoices JSONB, -- [{"invoice": "F-123", "amount": 2000.00}]
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Audit Log (para compliance y seguridad)
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL, -- 'CREATE', 'READ', 'UPDATE', 'DELETE'
  table_name TEXT NOT NULL,
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES (para performance)
-- ============================================

CREATE INDEX idx_invoices_agent ON invoices(agent);
CREATE INDEX idx_invoices_date ON invoices(date DESC);
CREATE INDEX idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX idx_invoices_created_at ON invoices(created_at DESC);

CREATE INDEX idx_transactions_agent ON bank_transactions(agent);
CREATE INDEX idx_transactions_date ON bank_transactions(date DESC);
CREATE INDEX idx_transactions_created_at ON bank_transactions(created_at DESC);

CREATE INDEX idx_audit_user ON audit_log(user_id);
CREATE INDEX idx_audit_table ON audit_log(table_name);
CREATE INDEX idx_audit_created_at ON audit_log(created_at DESC);

CREATE INDEX idx_user_profiles_role ON user_profiles(role);
CREATE INDEX idx_user_profiles_agent ON user_profiles(agent);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- ============================================
-- USER_PROFILES POLICIES
-- ============================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
ON user_profiles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
ON user_profiles FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Users can update their own profile (limited fields)
CREATE POLICY "Users can update own profile"
ON user_profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id AND
  role = (SELECT role FROM user_profiles WHERE user_id = auth.uid()) -- No pueden cambiar su propio rol
);

-- Only admins can insert new profiles
CREATE POLICY "Admins can insert profiles"
ON user_profiles FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Only admins can delete profiles
CREATE POLICY "Admins can delete profiles"
ON user_profiles FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- ============================================
-- INVOICES POLICIES
-- ============================================

-- Users can view invoices based on their role
CREATE POLICY "Users can view invoices by role"
ON invoices FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.user_id = auth.uid()
    AND (
      up.role = 'admin' -- Admins ven todo
      OR (up.role IN ('agent', 'viewer') AND up.agent = invoices.agent) -- Agentes/Viewers solo su agente
    )
  )
);

-- Only admins can insert invoices
CREATE POLICY "Admins can insert invoices"
ON invoices FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Only admins can update invoices
CREATE POLICY "Admins can update invoices"
ON invoices FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Only admins can delete invoices
CREATE POLICY "Admins can delete invoices"
ON invoices FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- ============================================
-- BANK_TRANSACTIONS POLICIES
-- ============================================

-- Users can view transactions based on their role
CREATE POLICY "Users can view transactions by role"
ON bank_transactions FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.user_id = auth.uid()
    AND (
      up.role = 'admin' -- Admins ven todo
      OR (up.role IN ('agent', 'viewer') AND up.agent = bank_transactions.agent) -- Agentes/Viewers solo su agente
    )
  )
);

-- Only admins can insert transactions
CREATE POLICY "Admins can insert transactions"
ON bank_transactions FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Only admins can update transactions
CREATE POLICY "Admins can update transactions"
ON bank_transactions FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Only admins can delete transactions
CREATE POLICY "Admins can delete transactions"
ON bank_transactions FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- ============================================
-- AUDIT_LOG POLICIES
-- ============================================

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
ON audit_log FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- All authenticated users can insert audit logs (via triggers)
CREATE POLICY "Authenticated users can insert audit logs"
ON audit_log FOR INSERT
TO authenticated
WITH CHECK (true);

-- No one can update or delete audit logs (immutable)
-- (No policies needed, will be denied by default)

-- ============================================
-- TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bank_transactions_updated_at
  BEFORE UPDATE ON bank_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to log updates to audit_log
CREATE OR REPLACE FUNCTION log_audit_trail()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_log (user_id, action, table_name, record_id, old_data, new_data)
    VALUES (
      auth.uid(),
      'UPDATE',
      TG_TABLE_NAME,
      NEW.id,
      to_jsonb(OLD),
      to_jsonb(NEW)
    );
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_log (user_id, action, table_name, record_id, old_data)
    VALUES (
      auth.uid(),
      'DELETE',
      TG_TABLE_NAME,
      OLD.id,
      to_jsonb(OLD)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit triggers
CREATE TRIGGER audit_invoices
  AFTER UPDATE OR DELETE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION log_audit_trail();

CREATE TRIGGER audit_bank_transactions
  AFTER UPDATE OR DELETE ON bank_transactions
  FOR EACH ROW
  EXECUTE FUNCTION log_audit_trail();

-- ============================================
-- INITIAL DATA (Admin user will be created via Supabase Auth)
-- ============================================

-- Note: After creating the first admin user via Supabase Auth,
-- you need to manually insert their profile:
-- 
-- INSERT INTO user_profiles (user_id, email, full_name, role)
-- VALUES (
--   'uuid-from-auth-users',
--   'admin@diesel.com',
--   'Admin User',
--   'admin'
-- );

-- ============================================
-- STORAGE BUCKETS (run in Supabase Dashboard)
-- ============================================

-- Create bucket for invoice PDFs
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('invoices', 'invoices', false);

-- Storage policies will be created separately in storage_policies.sql
