-- Create contest tracking tables for personalized features

-- Table to track user's contest attempts and progress
CREATE TABLE IF NOT EXISTS user_contest_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contest_id INTEGER NOT NULL,
  contest_name TEXT NOT NULL,
  status TEXT CHECK (status IN ('planned', 'attempted', 'completed', 'skipped')) DEFAULT 'planned',
  problems_solved INTEGER DEFAULT 0,
  total_problems INTEGER DEFAULT 0,
  time_spent_minutes INTEGER DEFAULT 0,
  notes TEXT,
  attempted_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, contest_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_contest_tracking_user_id ON user_contest_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_user_contest_tracking_status ON user_contest_tracking(status);
CREATE INDEX IF NOT EXISTS idx_user_contest_tracking_contest_id ON user_contest_tracking(contest_id);

-- Table to store user's favorite contests
CREATE TABLE IF NOT EXISTS user_favorite_contests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contest_id INTEGER NOT NULL,
  contest_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, contest_id)
);

-- Create index for favorites
CREATE INDEX IF NOT EXISTS idx_user_favorite_contests_user_id ON user_favorite_contests(user_id);

-- Update trigger for tracking table
CREATE TRIGGER update_user_contest_tracking_updated_at BEFORE UPDATE ON user_contest_tracking
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
