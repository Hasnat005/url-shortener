'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';

import { useAuth } from '../../context/AuthContext';

type UrlRow = {
	id: string;
	short_code: string;
	original_url: string;
	click_count: number | null;
	created_at?: string;
};

function getBackendBaseUrl(): string {
	const raw = process.env.NEXT_PUBLIC_BACKEND_URL;
	if (raw && raw.trim()) return raw.trim().replace(/\/+$/, '');
	if (typeof window !== 'undefined') {
		const origin = window.location.origin;
		// Helpful local default when running Next.js on :3000
		if (origin.includes('localhost:3000')) return 'http://localhost:3001';
		// In deployed environments, fall back to same-origin unless explicitly configured
		return origin;
	}
	return 'http://localhost:3001';
}

export default function DashboardPage() {
	const router = useRouter();
	const { user, loading: authLoading, accessToken } = useAuth();

	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [urls, setUrls] = useState<UrlRow[]>([]);
	const [copiedCode, setCopiedCode] = useState<string | null>(null);
	const [expandedId, setExpandedId] = useState<string | null>(null);
	const copiedResetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

	const backendBaseUrl = useMemo(() => getBackendBaseUrl(), []);

	useEffect(() => {
		return () => {
			if (copiedResetTimer.current) {
				clearTimeout(copiedResetTimer.current);
				copiedResetTimer.current = null;
			}
		};
	}, []);

	async function copyToClipboard(text: string, code: string) {
		try {
			if (navigator?.clipboard?.writeText) {
				await navigator.clipboard.writeText(text);
				setCopiedCode(code);
				if (copiedResetTimer.current) clearTimeout(copiedResetTimer.current);
				copiedResetTimer.current = setTimeout(() => setCopiedCode(null), 1500);
				return;
			}
			throw new Error('Clipboard API not available');
		} catch {
			try {
				const textarea = document.createElement('textarea');
				textarea.value = text;
				textarea.setAttribute('readonly', 'true');
				textarea.style.position = 'fixed';
				textarea.style.left = '-9999px';
				document.body.appendChild(textarea);
				textarea.select();
				const ok = document.execCommand('copy');
				document.body.removeChild(textarea);
				if (ok) {
					setCopiedCode(code);
					if (copiedResetTimer.current) clearTimeout(copiedResetTimer.current);
					copiedResetTimer.current = setTimeout(() => setCopiedCode(null), 1500);
					return;
				}
			} catch {
				// ignore
			}
			setError('Could not copy to clipboard.');
		}
	}

	async function onDelete(id: string) {
		if (!accessToken) return;
		const ok = window.confirm('Delete this shortened URL?');
		if (!ok) return;

		setError(null);
		try {
			const res = await fetch(`${backendBaseUrl}/api/urls/${id}`, {
				method: 'DELETE',
				headers: {
					Authorization: `Bearer ${accessToken}`,
				},
			});

			if (!res.ok) {
				const maybeBody = (await res.json().catch(() => null)) as unknown;
				const errorMessage =
					maybeBody && typeof maybeBody === 'object' && 'error' in maybeBody
						? String((maybeBody as { error?: unknown }).error ?? '')
						: '';
				throw new Error(errorMessage || `Request failed (${res.status})`);
			}

			setUrls((prev) => prev.filter((u) => u.id !== id));
			if (expandedId === id) setExpandedId(null);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to delete URL');
		}
	}

	useEffect(() => {
		if (authLoading) return;
		if (!user) {
			router.push('/login');
			return;
		}
		if (!accessToken) return;

		let cancelled = false;
		async function load() {
			setLoading(true);
			setError(null);
			try {
				const res = await fetch(`${backendBaseUrl}/api/urls`, {
					method: 'GET',
					headers: {
						Authorization: `Bearer ${accessToken}`,
					},
				});

				if (!res.ok) {
					const maybeBody = (await res.json().catch(() => null)) as unknown;
					const errorMessage =
						maybeBody && typeof maybeBody === 'object' && 'error' in maybeBody
							? String((maybeBody as { error?: unknown }).error ?? '')
							: '';
					throw new Error(errorMessage || `Request failed (${res.status})`);
				}

				const body = (await res.json()) as { urls: UrlRow[] };
				if (cancelled) return;
				setUrls(body.urls ?? []);
			} catch (err) {
				if (cancelled) return;
				const message = err instanceof Error ? err.message : 'Failed to load URLs';
				if (message.toLowerCase().includes('failed to fetch')) {
					setError(
						`Cannot reach backend at ${backendBaseUrl}. Check NEXT_PUBLIC_BACKEND_URL and that ${backendBaseUrl}/health works.`
					);
					return;
				}
				setError(message);
			} finally {
				if (cancelled) return;
				setLoading(false);
			}
		}

		void load();
		return () => {
			cancelled = true;
		};
	}, [authLoading, user, accessToken, backendBaseUrl, router]);

	return (
		<div className="mx-auto w-full max-w-5xl px-4 py-10">
			<div className="flex items-end justify-between gap-4">
				<div>
					<h1 className="text-2xl font-semibold">Dashboard</h1>
					<p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
						Your shortened URLs
					</p>
				</div>
				<Link
					href="/"
					className="text-sm font-medium text-zinc-950 underline underline-offset-4 dark:text-zinc-50"
				>
					Home
				</Link>
			</div>

			{error ? (
				<div className="mt-6 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">
					{error}
				</div>
			) : null}

			<div className="mt-6 overflow-hidden rounded-xl border border-black/8 dark:border-white/[.145]">
				<table className="w-full table-fixed text-left text-sm">
					<thead className="bg-black/2 dark:bg-white/6">
						<tr>
							<th className="w-1/2 px-4 py-3 font-medium">Original URL</th>
							<th className="w-24 px-4 py-3 font-medium">Short code</th>
							<th className="w-1/4 px-4 py-3 font-medium">Short URL</th>
							<th className="w-20 px-4 py-3 font-medium">Clicks</th>
							<th className="w-28 px-4 py-3 font-medium">Created</th>
							<th className="w-24 px-4 py-3 font-medium">Actions</th>
						</tr>
					</thead>
					<tbody>
						{loading ? (
							<tr>
								<td className="px-4 py-4 text-zinc-600 dark:text-zinc-400" colSpan={6}>
									Loading…
								</td>
							</tr>
						) : urls.length === 0 ? (
							<tr>
								<td className="px-4 py-4 text-zinc-600 dark:text-zinc-400" colSpan={6}>
									No URLs yet.
								</td>
							</tr>
						) : (
							urls.map((u) => (
								<tr key={u.id} className="border-t border-black/6 dark:border-white/12">
									<td className="px-4 py-3">
										<div className="flex min-w-0 items-start gap-2">
											<a
												href={u.original_url}
												target="_blank"
												rel="noreferrer"
												title={u.original_url}
												className={
													expandedId === u.id
														? 'min-w-0 break-all underline underline-offset-4'
														: 'min-w-0 truncate underline underline-offset-4'
												}
											>
												{u.original_url}
											</a>
											<button
												type="button"
												onClick={() => setExpandedId((prev) => (prev === u.id ? null : u.id))}
												className="shrink-0 text-xs font-medium underline underline-offset-4"
												aria-label={expandedId === u.id ? 'Collapse URL' : 'Expand URL'}
											>
												{expandedId === u.id ? 'Collapse' : 'Expand'}
											</button>
										</div>
									</td>
									<td className="px-4 py-3 font-mono">{u.short_code}</td>
									<td className="px-4 py-3">
										<div className="flex items-center gap-2">
											<a
												href={`${backendBaseUrl}/${u.short_code}`}
												target="_blank"
												rel="noreferrer"
												title={`${backendBaseUrl}/${u.short_code}`}
												className="min-w-0 truncate font-mono underline underline-offset-4"
											>
												{`${backendBaseUrl}/${u.short_code}`}
											</a>
											<button
												type="button"
												onClick={() => void copyToClipboard(`${backendBaseUrl}/${u.short_code}`, u.short_code)}
												className="rounded-md border border-black/8 bg-background px-2 py-1 text-xs font-medium text-foreground disabled:opacity-60 dark:border-white/[.145]"
												disabled={copiedCode === u.short_code}
												aria-label={copiedCode === u.short_code ? 'Copied' : 'Copy shortened URL'}
											>
												{copiedCode === u.short_code ? 'Copied' : 'Copy'}
											</button>
										</div>
									</td>
									<td className="px-4 py-3">{u.click_count ?? 0}</td>
									<td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
										{u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
									</td>
									<td className="px-4 py-3">
										<button
											type="button"
											onClick={() => void onDelete(u.id)}
											className="rounded-md border border-red-500/30 bg-red-500/10 px-2 py-1 text-xs font-medium text-red-700 disabled:opacity-60 dark:text-red-300"
										>
											Delete
										</button>
									</td>
								</tr>
							))
						)}
					</tbody>
				</table>
			</div>
		</div>
	);
}
