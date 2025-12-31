
import fs from 'fs';
import path from 'path';

const envContent = `VITE_SUPABASE_URL=https://fplfjqttuvawzachfnob.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZwbGZqcXR0dXZhd3phY2hmbm9iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxMTE4MDYsImV4cCI6MjA3NzY4NzgwNn0.mW5zagf6JeS5oomwp4wBU5ZjlIHnG8YjLXIe2XiKwdM
`;

fs.writeFileSync(path.join(process.cwd(), '.env'), envContent, 'utf8');
console.log('.env updated successfully');
