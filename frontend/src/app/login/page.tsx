'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { useAuth } from '../../context/AuthContext';

export default function LoginPage() {
	const router = useRouter();
	const { login, resendConfirmation, loading: authLoading, user } = useAuth();

	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [notice, setNotice] = useState<string | null>(null);
	const [needsConfirmation, setNeedsConfirmation] = useState(false);

	async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setError(null);
		setNotice(null);
		setNeedsConfirmation(false);
		setSubmitting(true);
		try {
			await login(email.trim(), password);
			router.push('/');
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Login failed';
			if (message.toLowerCase().includes('email not confirmed')) {
				setNeedsConfirmation(true);
				setError('Email not confirmed. Please confirm your email to log in.');
			} else {
				setError(message);
			}
		} finally {
			setSubmitting(false);
		}
	}

	async function onResend() {
		setError(null);
		setNotice(null);
		const trimmed = email.trim();
		if (!trimmed) {
			setError('Enter your email first.');
			return;
		}

		setSubmitting(true);
		try {
			await resendConfirmation(trimmed);
			setNotice('Confirmation email sent. Check your inbox (and spam).');
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to resend confirmation email');
		} finally {
			setSubmitting(false);
		}
	}

	if (!authLoading && user) {
		router.push('/');
		return null;
	}

	return (
		<div className="flex min-h-screen items-center justify-center bg-background px-4">
			<div className="w-full max-w-sm rounded-xl border border-black/[.08] bg-background p-6 dark:border-white/[.145]">
				<h1 className="text-2xl font-semibold">Login</h1>
				<p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
					Sign in with your email and password.
				</p>

				<form className="mt-6 space-y-4" onSubmit={onSubmit}>
					<label className="block">
						<span className="text-sm font-medium">Email</span>
						<input
							className="mt-1 w-full rounded-lg border border-black/[.08] bg-background px-3 py-2 text-sm outline-none focus:border-black/20 dark:border-white/[.145] dark:focus:border-white/30"
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
							className="mt-1 w-full rounded-lg border border-black/[.08] bg-background px-3 py-2 text-sm outline-none focus:border-black/20 dark:border-white/[.145] dark:focus:border-white/30"
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

					{needsConfirmation ? (
						<button
							className="flex h-11 w-full items-center justify-center rounded-lg border border-black/8 bg-background px-4 text-sm font-medium disabled:opacity-60 dark:border-white/[.145]"
							disabled={submitting || authLoading}
							type="button"
							onClick={() => void onResend()}
						>
							Resend confirmation email
						</button>
					) : null}
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
