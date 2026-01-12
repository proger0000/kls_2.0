import { createClient } from '@supabase/supabase-js'
// ДОБАВЛЕНО слово type
import type { Database } from './database.types.ts'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase URL or Key')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseKey)