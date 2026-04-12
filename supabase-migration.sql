-- DeepSat Document Viewer: tables for email gating + comments
-- Run this in Supabase Dashboard > SQL Editor

-- 1. Document views (who opened what, when)
CREATE TABLE IF NOT EXISTS doc_views (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  doc_id text NOT NULL,
  email text NOT NULL,
  name text,
  viewed_at timestamptz DEFAULT now(),
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- 2. Document comments (text selection + annotation)
CREATE TABLE IF NOT EXISTS doc_comments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  doc_id text NOT NULL,
  email text NOT NULL,
  name text,
  selected_text text NOT NULL,
  comment text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 3. Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_doc_views_doc_id ON doc_views(doc_id);
CREATE INDEX IF NOT EXISTS idx_doc_views_email ON doc_views(email);
CREATE INDEX IF NOT EXISTS idx_doc_comments_doc_id ON doc_comments(doc_id);

-- 4. Enable Row Level Security
ALTER TABLE doc_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE doc_comments ENABLE ROW LEVEL SECURITY;

-- 5. RLS policies: anon can INSERT (submit views/comments), service role can read all
-- Allow anyone to insert a view
CREATE POLICY "Anyone can log a view" ON doc_views
  FOR INSERT TO anon WITH CHECK (true);

-- Allow anyone to insert a comment
CREATE POLICY "Anyone can add a comment" ON doc_comments
  FOR INSERT TO anon WITH CHECK (true);

-- Allow anyone to read comments (so viewers can see each other's comments)
CREATE POLICY "Anyone can read comments" ON doc_comments
  FOR SELECT TO anon USING (true);

-- Service role (your admin/backend) can do everything
CREATE POLICY "Service role full access views" ON doc_views
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access comments" ON doc_comments
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
