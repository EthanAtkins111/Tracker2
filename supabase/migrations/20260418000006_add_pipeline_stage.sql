ALTER TABLE accounts ADD COLUMN IF NOT EXISTS pipeline_stage text DEFAULT 'Prospect';
