import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://dlgjrgwhgysbdnrldcnn.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsZ2pyZ3doZ3lzYmRucmxkY25uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg5MjY3NDAsImV4cCI6MjA1NDUwMjc0MH0.RwgNxtgdbcvZoDB0ZmU9h_D-bc6dZeeJ8_nzbZ1HQrg";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
