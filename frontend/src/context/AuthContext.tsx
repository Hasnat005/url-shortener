'use client';

import type { Session, User } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { getSupabaseClient } from '../lib/supabaseClient';

type AuthContextValue = {
	user: User | null;
	session: Session | null;
	accessToken: string | null;
	loading: boolean;
	login: (email: string, password: string) => Promise<void>;
	signup: (email: string, password: string) => Promise<void>;
	resendConfirmation: (email: string) => Promise<void>;
	logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [user, setUser] = useState<User | null>(null);
	const [session, setSession] = useState<Session | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let isMounted = true;
		const supabase = getSupabaseClient();
		if (!supabase) {
			setUser(null);
			setSession(null);
			setLoading(false);
			return () => {
				isMounted = false;
			};
		}

		const supabaseClient = supabase;

		async function init() {
			const { data, error } = await supabaseClient.auth.getSession();
			if (!isMounted) return;
			if (error) {
				setUser(null);
				setLoading(false);
				return;
			}

			setUser(data.session?.user ?? null);
			setSession(data.session ?? null);
			setLoading(false);
		}

		void init();

		const { data: subscription } = supabaseClient.auth.onAuthStateChange((_event, session) => {
			if (!isMounted) return;
			setUser(session?.user ?? null);
			setSession(session ?? null);
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
			session,
			accessToken: session?.access_token ?? null,
			loading,
			login: async (email: string, password: string) => {
				const supabase = getSupabaseClient();
				if (!supabase) {
					throw new Error(
						'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in frontend/.env.local and restart the dev server.'
					);
				}
				const { error } = await supabase.auth.signInWithPassword({ email, password });
				if (error) throw error;
			},
			signup: async (email: string, password: string) => {
				const supabase = getSupabaseClient();
				if (!supabase) {
					throw new Error(
						'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in frontend/.env.local and restart the dev server.'
					);
				}
				const { error } = await supabase.auth.signUp({ email, password });
				if (error) throw error;
			},
			resendConfirmation: async (email: string) => {
				const supabase = getSupabaseClient();
				if (!supabase) {
					throw new Error(
						'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in frontend/.env.local and restart the dev server.'
					);
				}
				const { error } = await supabase.auth.resend({ type: 'signup', email });
				if (error) throw error;
			},
			logout: async () => {
				const supabase = getSupabaseClient();
				if (!supabase) {
					throw new Error(
						'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in frontend/.env.local and restart the dev server.'
					);
				}
				const { error } = await supabase.auth.signOut();
				if (error) throw error;
			},
		};
	}, [user, session, loading]);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
	const ctx = useContext(AuthContext);
	if (!ctx) {
		throw new Error('useAuth must be used within an AuthProvider');
	}
	return ctx;
}
