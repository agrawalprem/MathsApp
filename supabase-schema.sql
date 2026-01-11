-- Supabase Database Schema for PremAgrawalMathsApp
-- Run this in the Supabase SQL Editor

-- Create user_scores table
CREATE TABLE IF NOT EXISTS user_scores (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  operation TEXT NOT NULL,
  variant TEXT NOT NULL,
  correct_count INTEGER NOT NULL DEFAULT 0,
  wrong_count INTEGER NOT NULL DEFAULT 0,
  total_time DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total_questions INTEGER NOT NULL DEFAULT 0,
  session_data JSONB NOT NULL DEFAULT '[]'::jsonb,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_scores_user_id ON user_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_user_scores_operation ON user_scores(operation);
CREATE INDEX IF NOT EXISTS idx_user_scores_variant ON user_scores(variant);
CREATE INDEX IF NOT EXISTS idx_user_scores_completed_at ON user_scores(completed_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE user_scores ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only see their own scores
CREATE POLICY "Users can view their own scores"
  ON user_scores
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own scores
CREATE POLICY "Users can insert their own scores"
  ON user_scores
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own scores
CREATE POLICY "Users can update their own scores"
  ON user_scores
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own scores
CREATE POLICY "Users can delete their own scores"
  ON user_scores
  FOR DELETE
  USING (auth.uid() = user_id);
