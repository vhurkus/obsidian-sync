-- Phase 5: Add favorites and recent access tracking to notes table
ALTER TABLE notes 
ADD COLUMN is_favorite BOOLEAN DEFAULT FALSE,
ADD COLUMN last_accessed_at TIMESTAMPTZ DEFAULT NOW();

-- Create indexes for better performance on favorites and recent access
CREATE INDEX idx_notes_is_favorite ON notes(user_id, is_favorite) WHERE is_favorite = TRUE;
CREATE INDEX idx_notes_last_accessed ON notes(user_id, last_accessed_at DESC);

-- Update RLS policies to include new columns
-- (Existing policies already cover these columns as they use user_id)

-- Function to update last_accessed_at when a note is viewed
CREATE OR REPLACE FUNCTION update_note_access_time()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update if more than 1 minute has passed since last access
    -- to avoid too frequent updates
    IF OLD.last_accessed_at IS NULL OR 
       OLD.last_accessed_at < NOW() - INTERVAL '1 minute' THEN
        NEW.last_accessed_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Note: We'll trigger this function manually from the application
-- rather than using an automatic trigger to have better control
