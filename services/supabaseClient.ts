import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ctgnxnjqtciqqjlbjrvn.supabase.co';
// Using the key provided. NOTE: Usually this should be the 'anon' public key. 
// If 'sb_publishable...' is a specific token type, ensure RLS policies are set accordingly.
const supabaseKey = 'sb_publishable_UtZByjbz2vpnUurJaYcixw_ZyQobsqL';

export const supabase = createClient(supabaseUrl, supabaseKey);