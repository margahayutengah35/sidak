import { createClient } from '@supabase/supabase-js'

// Ganti dengan URL dan ANON KEY dari Supabase project kamu
const supabaseUrl = 'https://eyhiqaxhcrjndwqfzcto.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5aGlxYXhoY3JqbmR3cWZ6Y3RvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMzUxMTMsImV4cCI6MjA3MDcxMTExM30.kD9NL4Mnvqee0Hjo0zFlSIjMkeGlluIYTGdPKlR2HZ8'

const supabase = createClient(supabaseUrl, supabaseKey)

export default supabase
