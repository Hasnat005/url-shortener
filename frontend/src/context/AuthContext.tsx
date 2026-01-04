'use client';

import type { User } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { getSupabaseClient } from '../lib/supabaseClient';

type AuthContextValue = {
	user: User | null;
	loading: boolean;
	login: (email: string, password: string) => Promise<void>;
	logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let isMounted = true;
		const supabase = getSupabaseClient();

		async function init() {
			const { data, error } = await supabase.auth.getSession();
			if (!isMounted) return;
			if (error) {
				setUser(null);
				setLoading(false);
				return;
			}

			setUser(data.session?.user ?? null);
			setLoading(false);
		}

		void init();

		const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
			if (!isMounted) return;
			setUser(session?.user ?? null);
			setLoading(false);
		});

		return () => {
			isMounted = false;
			subscription.subscription.unsubscribe();
		};
	}, []);

	const value = useMemo<AuthContextValue>(() => {
		return {
			user,
			loading,
			login: async (email: string, password: string) => {
				const supabase = getSupabaseClient();
				const { error } = await supabase.auth.signInWithPassword({ email, password });
				if (error) throw error;
			},
			logout: async () => {
				const supabase = getSupabaseClient();
				const { error } = await supabase.auth.signOut();
				if (error) throw error;
			},
		};
	}, [user, loading]);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
	const ctx = useContext(AuthContext);
	if (!ctx) {
		throw new Error('useAuth must be used within an AuthProvider');
	}
	return ctx;
}
