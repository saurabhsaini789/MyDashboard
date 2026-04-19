-- PERSONAL DASHBOARD - DATABASE SYNC SETUP
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)

-- 1. Ensure the table EXISTS with the required structure
CREATE TABLE IF NOT EXISTS public.dashboard_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT NOT NULL UNIQUE,
    value JSONB NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Add 'user_id' column if it's missing (Fix for your specific error)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='dashboard_data' AND column_name='user_id') THEN
        ALTER TABLE public.dashboard_data ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added user_id column to dashboard_data table.';
    END IF;
END $$;

-- 3. Enable Row Level Security (RLS)
-- This ensures users can't see each other's data.
ALTER TABLE public.dashboard_data ENABLE ROW LEVEL SECURITY;

-- 4. Set up Security Policies
-- We drop them first to ensure we have a clean state.
DROP POLICY IF EXISTS "Users can only see their own data" ON public.dashboard_data;
DROP POLICY IF EXISTS "Users can only insert their own data" ON public.dashboard_data;
DROP POLICY IF EXISTS "Users can only update their own data" ON public.dashboard_data;
DROP POLICY IF EXISTS "Users can only delete their own data" ON public.dashboard_data;

-- Policy: SELECT (Read)
CREATE POLICY "Users can only see their own data" 
ON public.dashboard_data 
FOR SELECT 
USING (auth.uid() = user_id);

-- Policy: INSERT (Create)
CREATE POLICY "Users can only insert their own data" 
ON public.dashboard_data 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Policy: UPDATE (Edit)
CREATE POLICY "Users can only update their own data" 
ON public.dashboard_data 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Policy: DELETE (Remove)
CREATE POLICY "Users can only delete their own data" 
ON public.dashboard_data 
FOR DELETE 
USING (auth.uid() = user_id);

-- 5. Add an index for performance
CREATE INDEX IF NOT EXISTS idx_dashboard_data_user_id ON public.dashboard_data (user_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_data_key ON public.dashboard_data (key);
