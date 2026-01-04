import { createClient } from '@supabase/supabase-js';

import type { SupabaseClient } from '@supabase/supabase-js';

let supabaseSingleton: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
	if (supabaseSingleton) return supabaseSingleton;

	const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
	const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

	if (!supabaseUrl || !supabaseAnonKey) {
		return null;
	}

	supabaseSingleton = createClient(supabaseUrl, supabaseAnonKey);
	return supabaseSingleton;
}

export function isSupabaseConfigured(): boolean {
	return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}
