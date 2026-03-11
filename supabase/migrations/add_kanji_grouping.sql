-- Create groups table
CREATE TABLE IF NOT EXISTS kanji_card_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  radical TEXT NOT NULL,
  name TEXT NOT NULL,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add group_id to kanji_cards
ALTER TABLE kanji_cards
ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES kanji_card_groups(id) ON DELETE CASCADE;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_groups_user_radical ON kanji_card_groups(user_id, radical);
CREATE INDEX IF NOT EXISTS idx_groups_position ON kanji_card_groups(user_id, position);
CREATE INDEX IF NOT EXISTS idx_cards_group ON kanji_cards(group_id);

-- Enable RLS
ALTER TABLE kanji_card_groups ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "groups_select_policy"
ON kanji_card_groups FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "groups_insert_policy"
ON kanji_card_groups FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "groups_update_policy"
ON kanji_card_groups FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "groups_delete_policy"
ON kanji_card_groups FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Auto-update updated_at on kanji_card_groups
CREATE OR REPLACE FUNCTION update_kanji_card_groups_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_kanji_card_groups_updated_at
BEFORE UPDATE ON kanji_card_groups
FOR EACH ROW EXECUTE FUNCTION update_kanji_card_groups_updated_at();
