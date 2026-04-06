-- Run this in your Supabase SQL Editor to wipe out all seeded data!
-- This will bypass Row Level Security (RLS) which blocked the Node script.

-- 1. Wipe all data from the content and interaction tables
TRUNCATE TABLE cultural_content CASCADE;
TRUNCATE TABLE subscriptions CASCADE;
TRUNCATE TABLE cart_items CASCADE;
TRUNCATE TABLE creator_ratings CASCADE;

-- 2. Clean up user profiles (removes admin names, states, etc)
UPDATE profiles 
SET display_name = NULL, 
    assigned_state = NULL,
    role = 'user';
