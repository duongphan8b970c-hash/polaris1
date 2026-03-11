-- Kanji Cards Table
CREATE TABLE IF NOT EXISTS kanji_cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  kanji TEXT NOT NULL,
  radical TEXT,
  stroke_count INTEGER,
  meanings TEXT[] DEFAULT '{}',
  readings_on TEXT[] DEFAULT '{}',
  readings_kun TEXT[] DEFAULT '{}',
  notes TEXT,
  jisho_data JSONB,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_kanji_cards_user ON kanji_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_kanji_cards_user_position ON kanji_cards(user_id, position);

-- RLS Policies
ALTER TABLE kanji_cards ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view own kanji cards" ON kanji_cards;
DROP POLICY IF EXISTS "Users can insert own kanji cards" ON kanji_cards;
DROP POLICY IF EXISTS "Users can update own kanji cards" ON kanji_cards;
DROP POLICY IF EXISTS "Users can delete own kanji cards" ON kanji_cards;

-- Create new policies
CREATE POLICY "Users can view own kanji cards"
  ON kanji_cards FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own kanji cards"
  ON kanji_cards FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own kanji cards"
  ON kanji_cards FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own kanji cards"
  ON kanji_cards FOR DELETE
  USING (auth.uid() = user_id);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_kanji_cards_updated_at ON kanji_cards;

CREATE TRIGGER update_kanji_cards_updated_at
    BEFORE UPDATE ON kanji_cards
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
