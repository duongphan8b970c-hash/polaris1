BEGIN;

-- Drop existing policies before recreating them
DROP POLICY IF EXISTS "kanji_cards_select_policy" ON kanji_cards;
DROP POLICY IF EXISTS "kanji_cards_insert_policy" ON kanji_cards;
DROP POLICY IF EXISTS "kanji_cards_update_policy" ON kanji_cards;
DROP POLICY IF EXISTS "kanji_cards_delete_policy" ON kanji_cards;
DROP POLICY IF EXISTS "Users can view own kanji cards" ON kanji_cards;
DROP POLICY IF EXISTS "Users can insert own kanji cards" ON kanji_cards;
DROP POLICY IF EXISTS "Users can update own kanji cards" ON kanji_cards;
DROP POLICY IF EXISTS "Users can delete own kanji cards" ON kanji_cards;

ALTER TABLE kanji_cards ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "kanji_cards_select_policy"
ON kanji_cards FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "kanji_cards_insert_policy"
ON kanji_cards FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "kanji_cards_update_policy"
ON kanji_cards FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "kanji_cards_delete_policy"
ON kanji_cards FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

COMMIT;
