-- Petition Pilot Database Schema
-- Run this in Supabase SQL Editor to set up all tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  organization TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Projects table
CREATE TABLE public.projects (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  state TEXT NOT NULL,
  petition_type TEXT NOT NULL,
  description TEXT,
  deadline DATE,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'archived')) NOT NULL,
  total_signatures INTEGER DEFAULT 0 NOT NULL,
  verified_count INTEGER DEFAULT 0 NOT NULL,
  invalid_count INTEGER DEFAULT 0 NOT NULL,
  flagged_count INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Petition sheets (uploaded images/PDFs)
CREATE TABLE public.petition_sheets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  sheet_number INTEGER DEFAULT 1 NOT NULL,
  ocr_status TEXT DEFAULT 'pending' CHECK (ocr_status IN ('pending', 'processing', 'completed', 'failed')) NOT NULL,
  ocr_raw_text TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Voter files (uploaded CSV/XLSX)
CREATE TABLE public.voter_files (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  record_count INTEGER DEFAULT 0 NOT NULL,
  parsed_status TEXT DEFAULT 'pending' CHECK (parsed_status IN ('pending', 'processing', 'completed', 'failed')) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Individual voter records (parsed from voter files)
CREATE TABLE public.voters (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  voter_file_id UUID REFERENCES public.voter_files(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  full_name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT,
  state TEXT,
  zip TEXT,
  party TEXT,
  registration_date DATE,
  voter_id_number TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Extracted signatures (from OCR)
CREATE TABLE public.signatures (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  sheet_id UUID REFERENCES public.petition_sheets(id) ON DELETE CASCADE NOT NULL,
  line_number INTEGER NOT NULL,
  extracted_name TEXT NOT NULL,
  extracted_address TEXT NOT NULL,
  extracted_date TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'invalid', 'flagged', 'skipped')) NOT NULL,
  matched_voter_name TEXT,
  matched_voter_address TEXT,
  matched_voter_party TEXT,
  match_confidence REAL,
  match_method TEXT CHECK (match_method IN ('auto', 'manual')),
  flagged_reason TEXT,
  verified_by UUID REFERENCES public.profiles(id),
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Activity log
CREATE TABLE public.activity_log (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  details TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Indexes for performance
CREATE INDEX idx_projects_user_id ON public.projects(user_id);
CREATE INDEX idx_projects_status ON public.projects(status);
CREATE INDEX idx_petition_sheets_project_id ON public.petition_sheets(project_id);
CREATE INDEX idx_signatures_project_id ON public.signatures(project_id);
CREATE INDEX idx_signatures_sheet_id ON public.signatures(sheet_id);
CREATE INDEX idx_signatures_status ON public.signatures(status);
CREATE INDEX idx_voters_project_id ON public.voters(project_id);
CREATE INDEX idx_voters_full_name ON public.voters(full_name);
CREATE INDEX idx_activity_log_user_id ON public.activity_log(user_id);
CREATE INDEX idx_activity_log_project_id ON public.activity_log(project_id);

-- Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.petition_sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voter_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read/update their own profile
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Projects: users can CRUD their own projects
CREATE POLICY "Users can view own projects" ON public.projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create projects" ON public.projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own projects" ON public.projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own projects" ON public.projects FOR DELETE USING (auth.uid() = user_id);

-- Petition sheets: access through project ownership
CREATE POLICY "Users can view own sheets" ON public.petition_sheets FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = petition_sheets.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can insert own sheets" ON public.petition_sheets FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = petition_sheets.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can update own sheets" ON public.petition_sheets FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = petition_sheets.project_id AND projects.user_id = auth.uid()));

-- Voter files: access through project ownership
CREATE POLICY "Users can view own voter files" ON public.voter_files FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = voter_files.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can insert own voter files" ON public.voter_files FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = voter_files.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can update own voter files" ON public.voter_files FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = voter_files.project_id AND projects.user_id = auth.uid()));

-- Voters: access through project ownership
CREATE POLICY "Users can view own voters" ON public.voters FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = voters.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can insert own voters" ON public.voters FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = voters.project_id AND projects.user_id = auth.uid()));

-- Signatures: access through project ownership
CREATE POLICY "Users can view own signatures" ON public.signatures FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = signatures.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can insert own signatures" ON public.signatures FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = signatures.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can update own signatures" ON public.signatures FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = signatures.project_id AND projects.user_id = auth.uid()));

-- Activity log: users can view their own activity
CREATE POLICY "Users can view own activity" ON public.activity_log FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create activity" ON public.activity_log FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, organization)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'organization');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_signatures_updated_at BEFORE UPDATE ON public.signatures
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('petition-sheets', 'petition-sheets', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('voter-files', 'voter-files', false);

-- Storage policies
CREATE POLICY "Users can upload petition sheets" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'petition-sheets' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can view own petition sheets" ON storage.objects FOR SELECT
  USING (bucket_id = 'petition-sheets' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can upload voter files" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'voter-files' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can view own voter files" ON storage.objects FOR SELECT
  USING (bucket_id = 'voter-files' AND auth.uid()::text = (storage.foldername(name))[1]);
