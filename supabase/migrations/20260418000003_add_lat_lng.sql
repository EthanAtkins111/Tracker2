ALTER TABLE accounts ADD COLUMN IF NOT EXISTS latitude  double precision DEFAULT NULL;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS longitude double precision DEFAULT NULL;
