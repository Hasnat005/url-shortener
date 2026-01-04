'use client';

import Link from 'next/link';

import ShortenForm from '../components/ShortenForm';
import { useAuth } from '../context/AuthContext';
import { isSupabaseConfigured } from '../lib/supabaseClient';

export default function HomePage() {
	const { user, loading, logout } = useAuth();
	const configured = isSupabaseConfigured();

	return (
		<div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 py-10">
			<header className="flex items-center justify-between gap-4">
				<h1 className="text-xl font-semibold">URL Shortener</h1>
				<nav className="flex items-center gap-4 text-sm">
					<Link className="underline underline-offset-4" href="/dashboard">
						Dashboard
					</Link>
					{user ? (
						<button
							onClick={() => void logout()}
							className="underline underline-offset-4"
							type="button"
						>
							Logout
						</button>
					) : (
						<Link className="underline underline-offset-4" href="/login">
							Login
						</Link>
					)}
				</nav>
			</header>

		<main className="mt-10 rounded-xl border border-black/8 bg-background p-6 dark:border-white/[.145]">
			<p className="text-sm text-zinc-600 dark:text-zinc-400">
				{loading
					? 'Checking session…'
					: user
						? `Signed in as ${user.email ?? user.id}`
						: 'Sign in to create and manage short links.'}
			</p>

			{!configured ? (
				<div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-800 dark:text-amber-200">
					Supabase is not configured. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to
					`frontend/.env.local` and restart `npm run dev`.
				</div>
			) : null}

			<div className="mt-6">
				<ShortenForm />
			</div>
		</main>
		</div>
	);
}
