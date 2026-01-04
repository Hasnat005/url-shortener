'use client';

import { useMemo, useState } from 'react';

import { useAuth } from '../context/AuthContext';

type ShortenResponse = {
	url: {
		id: string;
		short_code: string;
		original_url: string;
		click_count?: number | null;
		created_at?: string;
	};
};

function getBackendBaseUrl(): string {
	return process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3001';
}

export default function ShortenForm() {
	const { accessToken, loading: authLoading } = useAuth();

	const backendBaseUrl = useMemo(() => getBackendBaseUrl(), []);

	const [originalUrl, setOriginalUrl] = useState('');
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [createdShortUrl, setCreatedShortUrl] = useState<string | null>(null);

	async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setError(null);
		setCreatedShortUrl(null);

		if (!accessToken) {
			setError('You must be logged in to shorten URLs.');
			return;
		}

		const trimmed = originalUrl.trim();
		if (!trimmed) {
			setError('Please enter a URL.');
			return;
		}

		setSubmitting(true);
		try {
			const res = await fetch(`${backendBaseUrl}/api/shorten`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${accessToken}`,
				},
				body: JSON.stringify({ originalUrl: trimmed }),
			});

			if (!res.ok) {
				if (res.status === 403) {
					setError('Limit reached: you can only create up to 100 URLs.');
					return;
				}

				const maybeBody = (await res.json().catch(() => null)) as unknown;
				const errorMessage =
					maybeBody && typeof maybeBody === 'object' && 'error' in maybeBody
						? String((maybeBody as { error?: unknown }).error ?? '')
						: '';
				throw new Error(errorMessage || `Request failed (${res.status})`);
			}

			// If the caller wants to show the created URL later, the backend returns it.
			const body = (await res.json()) as ShortenResponse;
			const shortCode = body?.url?.short_code;
			if (typeof shortCode === 'string' && shortCode.length > 0) {
				setCreatedShortUrl(`${backendBaseUrl}/${shortCode}`);
			}
			setOriginalUrl('');
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to shorten URL');
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<form onSubmit={onSubmit} className="w-full">
			<label className="block">
				<span className="text-sm font-medium">URL</span>
				<input
					className="mt-1 w-full rounded-lg border border-black/8 bg-background px-3 py-2 text-sm outline-none focus:border-black/20 dark:border-white/[.145] dark:focus:border-white/30"
					inputMode="url"
					placeholder="https://example.com"
					type="url"
					value={originalUrl}
					onChange={(e) => setOriginalUrl(e.target.value)}
					required
					disabled={submitting || authLoading}
				/>
			</label>

			{error ? (
				<div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">
					{error}
				</div>
			) : null}

			{createdShortUrl ? (
				<div className="mt-3 rounded-lg border border-black/8 bg-black/2 px-3 py-2 text-sm dark:border-white/[.145] dark:bg-white/6">
					<div className="text-xs text-zinc-600 dark:text-zinc-400">Shortened URL</div>
					<a
						href={createdShortUrl}
						target="_blank"
						rel="noreferrer"
						className="break-all font-mono underline underline-offset-4"
					>
						{createdShortUrl}
					</a>
				</div>
			) : null}

			<button
				type="submit"
				disabled={submitting || authLoading}
				className="mt-3 flex h-11 w-full items-center justify-center rounded-lg bg-foreground px-4 text-sm font-medium text-background disabled:opacity-60"
			>
				{submitting ? 'Shortening…' : 'Shorten'}
			</button>
		</form>
	);
}
