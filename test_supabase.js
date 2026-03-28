const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  console.log('Testing connection to Supabase...');
  console.log('URL:', supabaseUrl);

  try {
    // Try to count rows in dashboard_data
    const { data, error, count } = await supabase
      .from('dashboard_data')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('Connection failed:', error.message);
      if (error.message.includes('relation "public.dashboard_data" does not exist')) {
        console.log('TIP: It seems the "dashboard_data" table hasn\'t been created yet. Did you run the SQL in the Supabase editor?');
      }
      process.exit(1);
    }

    console.log('Successfully connected to Supabase!');
    console.log(`Current row count in "dashboard_data": ${count}`);
    
  } catch (err) {
    console.error('An unexpected error occurred:', err.message);
    process.exit(1);
  }
}

testConnection();
