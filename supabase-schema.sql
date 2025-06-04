-- Create notes table
CREATE TABLE notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  path TEXT NOT NULL,
  parent_id UUID REFERENCES notes(id),
  is_folder BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  device_id TEXT,
  version INTEGER DEFAULT 1,
  UNIQUE(user_id, path)
);

-- Create tags table
CREATE TABLE tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- Create note_tags junction table
CREATE TABLE note_tags (
  note_id UUID REFERENCES notes(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (note_id, tag_id)
);

-- Create sync_queue table for offline support
CREATE TABLE sync_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  action TEXT NOT NULL, -- create, update, delete
  resource_type TEXT NOT NULL, -- note, tag, etc
  resource_id UUID,
  payload JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  synced_at TIMESTAMPTZ
);

-- Create search_index table for full-text search
CREATE TABLE search_index (
  note_id UUID REFERENCES notes(id) ON DELETE CASCADE PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  search_text TSVECTOR,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create search index
CREATE INDEX search_text_idx ON search_index USING GIN(search_text);

-- Enable Row Level Security
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_index ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
CREATE POLICY "Users can manage own notes" ON notes
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own tags" ON tags
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own note_tags" ON note_tags
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM notes 
      WHERE notes.id = note_tags.note_id 
      AND notes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own sync_queue" ON sync_queue
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own search_index" ON search_index
  FOR ALL USING (auth.uid() = user_id);

-- Create user_sessions table for device management
CREATE TABLE user_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  device_name TEXT,
  is_active BOOLEAN DEFAULT true,
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, device_id)
);

-- Enable RLS for user_sessions
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policy for user_sessions
CREATE POLICY "Users can manage own sessions" ON user_sessions
  FOR ALL USING (auth.uid() = user_id);

-- Function to update search index
CREATE OR REPLACE FUNCTION update_search_index()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO search_index (note_id, user_id, search_text)
  VALUES (
    NEW.id,
    NEW.user_id,
    to_tsvector('english', COALESCE(NEW.title, '') || ' ' || COALESCE(NEW.content, ''))
  )
  ON CONFLICT (note_id) DO UPDATE
  SET 
    search_text = to_tsvector('english', COALESCE(NEW.title, '') || ' ' || COALESCE(NEW.content, '')),
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for search index
CREATE TRIGGER update_search_index_trigger
AFTER INSERT OR UPDATE ON notes
FOR EACH ROW
EXECUTE FUNCTION update_search_index();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for notes updated_at
CREATE TRIGGER update_notes_updated_at
    BEFORE UPDATE ON notes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to update last_seen_at
CREATE OR REPLACE FUNCTION update_session_activity()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_seen_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for session activity
CREATE TRIGGER update_session_activity_trigger
    BEFORE UPDATE ON user_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_session_activity();

-- Function to handle note version conflicts
CREATE OR REPLACE FUNCTION resolve_note_conflict(
  note_id_param UUID,
  client_version INTEGER,
  new_content TEXT,
  new_title TEXT
)
RETURNS TABLE(
  success BOOLEAN,
  current_version INTEGER,
  conflict BOOLEAN
) AS $$
DECLARE
  current_ver INTEGER;
BEGIN
  -- Get current version
  SELECT version INTO current_ver FROM notes WHERE id = note_id_param;
  
  -- Check for conflict
  IF current_ver > client_version THEN
    -- Conflict detected
    RETURN QUERY SELECT FALSE, current_ver, TRUE;
  ELSE
    -- No conflict, update
    UPDATE notes 
    SET content = new_content, 
        title = new_title, 
        version = version + 1,
        updated_at = NOW()
    WHERE id = note_id_param;
    
    RETURN QUERY SELECT TRUE, current_ver + 1, FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql;
