import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env') })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function test() {
    console.log('Testing connection to ativos_marca table...')

    // Try to select (should be empty or error if table doesn't exist)
    const { data, error } = await supabase.from('ativos_marca').select('*').limit(1)

    if (error) {
        console.error('Error accessing table:', error)
        if (error.code === '42P01') {
            console.error('Table "ativos_marca" does not exist. Migration might not have run.')
        }
    } else {
        console.log('Success! Table exists (RLS might hide data).', data)
    }
}

test()
