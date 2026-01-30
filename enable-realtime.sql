-- Enable Realtime for all appointment tables
-- Run this in your Supabase SQL Editor

-- Enable Realtime for PWD table
ALTER PUBLICATION supabase_realtime ADD TABLE pwd;

-- Enable Realtime for Senior Citizens table
ALTER PUBLICATION supabase_realtime ADD TABLE senior_citizens;

-- Enable Realtime for Solo Parents table
ALTER PUBLICATION supabase_realtime ADD TABLE solo_parents;

-- Enable Realtime for Financial Assistance table
ALTER PUBLICATION supabase_realtime ADD TABLE financial_assistance;

-- Enable Realtime for Early Childhood table
ALTER PUBLICATION supabase_realtime ADD TABLE early_childhood;

-- Enable Realtime for Youth Sector table
ALTER PUBLICATION supabase_realtime ADD TABLE youth_sector;

-- Enable Realtime for Women's Sector table
ALTER PUBLICATION supabase_realtime ADD TABLE womens_sector;

-- Verify the tables are added to the publication
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
AND tablename IN ('pwd', 'senior_citizens', 'solo_parents', 'financial_assistance', 'early_childhood', 'youth_sector', 'womens_sector');

