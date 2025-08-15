-- Add missing columns to user_contest_tracking table
ALTER TABLE user_contest_tracking 
ADD COLUMN IF NOT EXISTS is_virtual BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT FALSE;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_user_contest_tracking_virtual 
ON user_contest_tracking(user_id, is_virtual);

CREATE INDEX IF NOT EXISTS idx_user_contest_tracking_favorite 
ON user_contest_tracking(user_id, is_favorite);

-- Update existing records to set proper defaults
UPDATE user_contest_tracking 
SET is_virtual = FALSE 
WHERE is_virtual IS NULL;

UPDATE user_contest_tracking 
SET is_favorite = FALSE 
WHERE is_favorite IS NULL;
