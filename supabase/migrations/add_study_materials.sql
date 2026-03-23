-- Study materials table
CREATE TABLE IF NOT EXISTS study_materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  category TEXT CHECK (category IN ('grammar', 'vocab', 'kanji', 'general')) DEFAULT 'general',
  tags TEXT[] DEFAULT '{}',
  images TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_study_materials_user ON study_materials(user_id);
CREATE INDEX IF NOT EXISTS idx_study_materials_category ON study_materials(user_id, category);
CREATE INDEX IF NOT EXISTS idx_study_materials_tags ON study_materials USING GIN(tags);

-- RLS
ALTER TABLE study_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "study_materials_select_policy"
ON study_materials FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "study_materials_insert_policy"
ON study_materials FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "study_materials_update_policy"
ON study_materials FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "study_materials_delete_policy"
ON study_materials FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Storage bucket for study material images
-- Run this in the Supabase dashboard SQL editor:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('study-materials', 'study-materials', true)
-- ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies (run after creating bucket)
-- CREATE POLICY "study_materials_storage_select"
-- ON storage.objects FOR SELECT
-- TO authenticated
-- USING (bucket_id = 'study-materials' AND auth.uid()::text = (storage.foldername(name))[1]);

-- CREATE POLICY "study_materials_storage_insert"
-- ON storage.objects FOR INSERT
-- TO authenticated
-- WITH CHECK (bucket_id = 'study-materials' AND auth.uid()::text = (storage.foldername(name))[1]);

-- CREATE POLICY "study_materials_storage_delete"
-- ON storage.objects FOR DELETE
-- TO authenticated
-- USING (bucket_id = 'study-materials' AND auth.uid()::text = (storage.foldername(name))[1]);
