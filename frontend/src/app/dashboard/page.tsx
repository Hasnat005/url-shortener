'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { useAuth } from '../../context/AuthContext';

type UrlRow = {
	id: string;
	short_code: string;
	original_url: string;
	click_count: number | null;
	created_at?: string;
};

function getBackendBaseUrl(): string {
	const raw = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3001';
	return raw.replace(/\/+$/, '');
}

export default function DashboardPage() {
	const router = useRouter();
	const { user, loading: authLoading, accessToken } = useAuth();

	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [urls, setUrls] = useState<UrlRow[]>([]);

	const backendBaseUrl = useMemo(() => getBackendBaseUrl(), []);

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
				setError(err instanceof Error ? err.message : 'Failed to load URLs');
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

			<div className="mt-6 overflow-x-auto rounded-xl border border-black/8 dark:border-white/[.145]">
				<table className="min-w-full text-left text-sm">
					<thead className="bg-black/2 dark:bg-white/6">
						<tr>
							<th className="px-4 py-3 font-medium">Code</th>
							<th className="px-4 py-3 font-medium">Original URL</th>
							<th className="px-4 py-3 font-medium">Clicks</th>
						</tr>
					</thead>
					<tbody>
						{loading ? (
							<tr>
								<td className="px-4 py-4 text-zinc-600 dark:text-zinc-400" colSpan={3}>
									Loading…
								</td>
							</tr>
						) : urls.length === 0 ? (
							<tr>
								<td className="px-4 py-4 text-zinc-600 dark:text-zinc-400" colSpan={3}>
									No URLs yet.
								</td>
							</tr>
						) : (
							urls.map((u) => (
								<tr key={u.id} className="border-t border-black/6 dark:border-white/12">
									<td className="px-4 py-3 font-mono">
										<a
											href={`${backendBaseUrl}/${u.short_code}`}
											target="_blank"
											rel="noreferrer"
											className="underline underline-offset-4"
										>
											{u.short_code}
										</a>
									</td>
									<td className="px-4 py-3">
										<a
											href={u.original_url}
											target="_blank"
											rel="noreferrer"
											className="break-all underline underline-offset-4"
										>
											{u.original_url}
										</a>
									</td>
									<td className="px-4 py-3">{u.click_count ?? 0}</td>
								</tr>
							))
						)}
					</tbody>
				</table>
			</div>
		</div>
	);
}
