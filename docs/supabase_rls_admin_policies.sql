-- RLS Policies for Admin Tables (Radio Satelital v9.5+)
-- This file contains Row Level Security policies for securing admin functionality
-- Apply in Supabase SQL Editor after creating the tables

-- =====================================================
-- 1. ADMIN_USERS TABLE - Security Policies
-- =====================================================

-- Enable RLS on admin_users table
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow authenticated users to read their own profile
CREATE POLICY "users_can_read_own_profile"
ON admin_users
FOR SELECT
USING (
  auth.uid()::text = email 
  OR 
  EXISTS (
    SELECT 1 FROM admin_users au 
    WHERE au.email = auth.jwt() ->> 'email' 
    AND au.role = 'admin'
  )
);

-- Policy 2: Allow admin to read all profiles
CREATE POLICY "admin_can_read_all_profiles"
ON admin_users
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE email = auth.jwt() ->> 'email'
    AND role = 'admin'
  )
);

-- Policy 3: Allow users to update only their own profile (except role/status)
CREATE POLICY "users_can_update_own_profile"
ON admin_users
FOR UPDATE
USING (email = auth.jwt() ->> 'email')
WITH CHECK (
  email = auth.jwt() ->> 'email'
  AND role = (SELECT role FROM admin_users WHERE email = auth.jwt() ->> 'email')
  AND status = (SELECT status FROM admin_users WHERE email = auth.jwt() ->> 'email')
);

-- Policy 4: Allow admin to update all profiles including role and status
CREATE POLICY "admin_can_update_all_profiles"
ON admin_users
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE email = auth.jwt() ->> 'email'
    AND role = 'admin'
  )
);

-- Policy 5: Prevent deletions via RLS (delete via RPC only)
CREATE POLICY "prevent_direct_delete"
ON admin_users
FOR DELETE
USING (false);

-- =====================================================
-- 2. ADMIN_INVITATIONS TABLE - Security Policies
-- =====================================================

-- Enable RLS on admin_invitations table
ALTER TABLE admin_invitations ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow authenticated users to read invitations meant for them
CREATE POLICY "users_can_read_own_invitations"
ON admin_invitations
FOR SELECT
USING (
  email = auth.jwt() ->> 'email'
  OR
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE email = auth.jwt() ->> 'email'
    AND role = 'admin'
  )
);

-- Policy 2: Allow admin to read all invitations
CREATE POLICY "admin_can_read_all_invitations"
ON admin_invitations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE email = auth.jwt() ->> 'email'
    AND role = 'admin'
  )
);

-- Policy 3: Allow admin to create invitations
CREATE POLICY "admin_can_create_invitations"
ON admin_invitations
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE email = auth.jwt() ->> 'email'
    AND role = 'admin'
  )
);

-- Policy 4: Allow admin to update invitations status
CREATE POLICY "admin_can_update_invitations"
ON admin_invitations
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE email = auth.jwt() ->> 'email'
    AND role = 'admin'
  )
);

-- Policy 5: Allow users to accept their own invitation (update status)
CREATE POLICY "users_can_accept_own_invitation"
ON admin_invitations
FOR UPDATE
USING (
  email = auth.jwt() ->> 'email'
  AND status = 'pending'
)
WITH CHECK (
  status = 'accepted'
  AND email = auth.jwt() ->> 'email'
);

-- Policy 6: Prevent deletions via RLS
CREATE POLICY "prevent_invitation_delete"
ON admin_invitations
FOR DELETE
USING (false);

-- =====================================================
-- 3. ADMIN_AUDIT_LOGS TABLE - Append-Only Security
-- =====================================================

-- Enable RLS on admin_audit_logs table
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow authenticated admins to read audit logs
CREATE POLICY "admin_can_read_audit_logs"
ON admin_audit_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE email = auth.jwt() ->> 'email'
    AND role IN ('admin', 'reviewer')
  )
);

-- Policy 2: Allow system to insert audit logs (via RPC only)
CREATE POLICY "system_can_insert_audit_logs"
ON admin_audit_logs
FOR INSERT
WITH CHECK (true);

-- Policy 3: Prevent updates and deletes on audit logs (audit trail immutability)
CREATE POLICY "prevent_audit_log_modifications"
ON admin_audit_logs
FOR UPDATE
USING (false);

CREATE POLICY "prevent_audit_log_delete"
ON admin_audit_logs
FOR DELETE
USING (false);

-- =====================================================
-- 4. STATIONS TABLE - Reviewer Access Control
-- =====================================================

-- Enable RLS on stations table
ALTER TABLE stations ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow public to read approved stations only
CREATE POLICY "public_can_read_approved_stations"
ON stations
FOR SELECT
USING (status = 'approved');

-- Policy 2: Allow authenticated reviewers to read all stations
CREATE POLICY "reviewer_can_read_all_stations"
ON stations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE email = auth.jwt() ->> 'email'
    AND role IN ('admin', 'reviewer')
  )
);

-- Policy 3: Allow admin to update stations
CREATE POLICY "admin_can_update_stations"
ON stations
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE email = auth.jwt() ->> 'email'
    AND role = 'admin'
  )
);

-- Policy 4: Prevent direct deletes (use soft delete via update)
CREATE POLICY "prevent_station_delete"
ON stations
FOR DELETE
USING (false);

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify RLS is enabled on all tables
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('admin_users', 'admin_invitations', 'admin_audit_logs', 'stations')
ORDER BY tablename;

-- Verify policies are applied
SELECT schemaname, tablename, policyname, permissive, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('admin_users', 'admin_invitations', 'admin_audit_logs', 'stations')
ORDER BY tablename, policyname;
