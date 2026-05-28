-- Migration: Add case_name column to rework_cases table
ALTER TABLE rework_cases ADD COLUMN IF NOT EXISTS case_name TEXT;
