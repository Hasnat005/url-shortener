import { createClient } from '@supabase/supabase-js';

import type { SupabaseClient } from '@supabase/supabase-js';

let supabaseSingleton: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
	if (supabaseSingleton) return supabaseSingleton;

	const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
	const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

	if (!supabaseUrl) {
		throw new Error('Missing env var: NEXT_PUBLIC_SUPABASE_URL');
	}

	if (!supabaseAnonKey) {
		throw new Error('Missing env var: NEXT_PUBLIC_SUPABASE_ANON_KEY');
	}

	supabaseSingleton = createClient(supabaseUrl, supabaseAnonKey);
	return supabaseSingleton;
}
