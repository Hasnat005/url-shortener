'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { useAuth } from '../../context/AuthContext';

export default function LoginPage() {
	const router = useRouter();
	const { login, loading: authLoading, user } = useAuth();

	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [notice, setNotice] = useState<string | null>(null);

	async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setError(null);
		setNotice(null);
		setSubmitting(true);
		try {
			await login(email.trim(), password);
			router.push('/');
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Login failed';
			setError(message);
		} finally {
			setSubmitting(false);
		}
	}

	useEffect(() => {
		if (!authLoading && user) {
			router.replace('/');
		}
	}, [authLoading, user, router]);

	if (!authLoading && user) return null;

	return (
		<div className="flex min-h-screen items-center justify-center bg-background px-4">
			<div className="w-full max-w-sm rounded-xl border border-black/8 bg-background p-6 dark:border-white/[.145]">
				<h1 className="text-2xl font-semibold">Login</h1>
				<p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
					Sign in with your email and password.
				</p>

				<form className="mt-6 space-y-4" onSubmit={onSubmit}>
					<label className="block">
						<span className="text-sm font-medium">Email</span>
						<input
							className="mt-1 w-full rounded-lg border border-black/8 bg-background px-3 py-2 text-sm outline-none focus:border-black/20 dark:border-white/[.145] dark:focus:border-white/30"
							autoComplete="email"
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							required
						/>
					</label>

					<label className="block">
						<span className="text-sm font-medium">Password</span>
						<input
							className="mt-1 w-full rounded-lg border border-black/8 bg-background px-3 py-2 text-sm outline-none focus:border-black/20 dark:border-white/[.145] dark:focus:border-white/30"
							autoComplete="current-password"
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
						/>
					</label>

					{error ? (
						<div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">
							{error}
						</div>
					) : null}

					{notice ? (
						<div className="rounded-lg border border-black/8 bg-black/2 px-3 py-2 text-sm text-zinc-700 dark:border-white/[.145] dark:bg-white/6 dark:text-zinc-200">
							{notice}
						</div>
					) : null}

					<button
						className="flex h-11 w-full items-center justify-center rounded-lg bg-foreground px-4 text-sm font-medium text-background disabled:opacity-60"
						disabled={submitting || authLoading}
						type="submit"
					>
						{submitting ? 'Signing in…' : 'Sign in'}
					</button>
				</form>

				<p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
					No account yet?{' '}
					<a className="underline underline-offset-4" href="/signup">
						Create one
					</a>
				</p>
			</div>
		</div>
	);
}
