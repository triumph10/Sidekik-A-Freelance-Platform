-- This function allows executing dynamic SQL queries with vector parameters
-- You need to run this query in the Supabase SQL Editor to create this function

-- Enable pgvector if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- Create the RPC function to execute queries with vector parameters
CREATE OR REPLACE FUNCTION query_with_embedding(query_text text, query_params jsonb)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result json;
BEGIN
    EXECUTE query_text
    USING (SELECT ARRAY(SELECT jsonb_array_elements(query_params)))[1]
    INTO result;
    
    RETURN result;
END;
$$; 