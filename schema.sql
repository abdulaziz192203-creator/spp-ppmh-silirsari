-- Create profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  role TEXT CHECK (role IN ('admin', 'parent', 'pimpinan')) NOT NULL DEFAULT 'parent',
  nisn TEXT UNIQUE,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create students table
CREATE TABLE students (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  nisn TEXT UNIQUE NOT NULL,
  class_room TEXT,
  address TEXT,
  parent_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create payments table
CREATE TABLE payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  month INTEGER CHECK (month >= 1 AND month <= 12) NOT NULL,
  year INTEGER NOT NULL,
  amount BIGINT NOT NULL,
  status TEXT CHECK (status IN ('unpaid', 'pending', 'paid')) DEFAULT 'unpaid' NOT NULL,
  proof_url TEXT,
  verified_at TIMESTAMP WITH TIME ZONE,
  verified_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Set up Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Public profiles are viewable by everyone." ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile." ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Students Policies
CREATE POLICY "Admins can do everything on students." ON students
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Parents can view their own students." ON students
  FOR SELECT USING (
    auth.uid() = parent_id OR nisn = (SELECT nisn FROM profiles WHERE id = auth.uid())
  );

-- Payments Policies
CREATE POLICY "Admins can do everything on payments." ON payments
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Parents can view and update their own payments." ON payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM students 
      WHERE students.id = payments.student_id 
      AND (students.parent_id = auth.uid() OR students.nisn = (SELECT nisn FROM profiles WHERE id = auth.uid()))
    )
  );

CREATE POLICY "Parents can upload proof for their own payments." ON payments
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM students 
      WHERE students.id = payments.student_id 
      AND (students.parent_id = auth.uid() OR students.nisn = (SELECT nisn FROM profiles WHERE id = auth.uid()))
    )
  ) WITH CHECK (
    status = 'pending' AND proof_url IS NOT NULL
  );

-- STORAGE SETUP (Run in Supabase Dashboard)
-- 1. Create a bucket named 'payment-proofs'
-- 2. Set it to 'Public' if you want easy access, or 'Private' with RLS
-- 
-- Storage RLS Example:
-- CREATE POLICY "Allow public read" ON storage.objects FOR SELECT USING (bucket_id = 'payment-proofs');
-- CREATE POLICY "Allow authenticated upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'payment-proofs' AND auth.role() = 'authenticated');

-- AUTOMATED PROFILES TRIGGER
-- This function automatically creates a profile when a new user is created in auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, nisn)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_metadata->>'full_name', ''), 
    COALESCE(NEW.raw_user_metadata->>'role', 'parent'),
    NEW.raw_user_metadata->>'nisn'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Create system_settings table
CREATE TABLE system_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- System Settings Policies
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on settings" ON system_settings
  FOR SELECT USING (true);

CREATE POLICY "Admins can update settings" ON system_settings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Pre-seed some default settings
INSERT INTO system_settings (key, value) VALUES 
  ('school_name', 'Pondok Pesantren Miftahul Huda'),
  ('bank_name', 'BSI (Mandiri Syariah)'),
  ('bank_account_number', '7123456789'),
  ('bank_account_name', 'PP Miftahul Huda')
ON CONFLICT (key) DO NOTHING;

-- TRIGGER THE FUNCTION... (rest of the file)
