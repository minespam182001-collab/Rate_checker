-- Run this once in Supabase SQL editor
ALTER TABLE rates ADD COLUMN IF NOT EXISTS is_estimated boolean not null default false;
