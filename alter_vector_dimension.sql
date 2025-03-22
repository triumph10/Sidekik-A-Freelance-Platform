-- Make sure pgvector extension is enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- First, create a temporary column with the new dimension
ALTER TABLE freelancer_profiles ADD COLUMN temp_embedding vector(384);

-- Update all existing embeddings by truncating them to 384 dimensions
-- This uses a CTE to select all rows with embeddings and truncates them
WITH embeddings AS (
  SELECT 
    id, 
    embedding[1:384] as truncated_embedding
  FROM 
    freelancer_profiles
  WHERE 
    embedding IS NOT NULL
)
UPDATE freelancer_profiles
SET temp_embedding = e.truncated_embedding::vector(384)
FROM embeddings e
WHERE freelancer_profiles.id = e.id;

-- Drop the original embedding column
ALTER TABLE freelancer_profiles DROP COLUMN embedding;

-- Rename the temporary column to embedding
ALTER TABLE freelancer_profiles RENAME COLUMN temp_embedding TO embedding;

-- Add any needed indexes (if you were using them before)
CREATE INDEX IF NOT EXISTS freelancer_profiles_embedding_idx ON freelancer_profiles USING ivfflat (embedding vector_l2_ops);

-- Verify the change
-- Run this after the above to check that the dimension is now 384
SELECT vector_dims(embedding) FROM freelancer_profiles WHERE embedding IS NOT NULL LIMIT 1; 