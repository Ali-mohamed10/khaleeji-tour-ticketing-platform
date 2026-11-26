-- Migration 016: 4-Role RBAC System
-- Supported roles: customer, admin, editor, gate_staff

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('customer', 'admin', 'editor', 'gate_staff'));
