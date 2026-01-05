import { Router } from 'express';

import { supabaseAdmin } from '../lib/supabase';
import { requireAuth } from '../middleware/auth';

const router = Router();

function randomBase62Code(length: number): string {
	const alphabet = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
	let out = '';
	for (let i = 0; i < length; i++) {
		out += alphabet[Math.floor(Math.random() * alphabet.length)];
	}
	return out;
}

type ShortenBody = {
	originalUrl?: string;
};

router.get('/urls', requireAuth, async (_req, res, next) => {
	try {
		const user = res.locals.user as { id: string } | undefined;
		if (!user?.id) {
			return res.status(401).json({ error: 'Unauthorized' });
		}

		const { data, error } = await supabaseAdmin
			.from('urls')
			.select('id, short_code, original_url, click_count, created_at')
			.eq('user_id', user.id)
			.order('created_at', { ascending: false });

		if (error) {
			return next(error);
		}

		return res.status(200).json({ urls: data ?? [] });
	} catch (err) {
		return next(err);
	}
});

router.delete('/urls/:id', requireAuth, async (req, res, next) => {
	try {
		const user = res.locals.user as { id: string } | undefined;
		if (!user?.id) {
			return res.status(401).json({ error: 'Unauthorized' });
		}

		const id = typeof req.params.id === 'string' ? req.params.id.trim() : '';
		if (!id) {
			return res.status(400).json({ error: 'id is required' });
		}

		const { data, error } = await supabaseAdmin
			.from('urls')
			.delete()
			.eq('id', id)
			.eq('user_id', user.id)
			.select('id');

		if (error) {
			return next(error);
		}

		if (!data || data.length === 0) {
			return res.status(404).json({ error: 'Not found' });
		}

		return res.status(200).json({ deletedId: data[0]?.id ?? id });
	} catch (err) {
		return next(err);
	}
});

router.post('/shorten', requireAuth, async (req, res, next) => {
	try {
		const body = (req.body ?? {}) as ShortenBody;
		const originalUrl = typeof body.originalUrl === 'string' ? body.originalUrl.trim() : '';

		if (!originalUrl) {
			return res.status(400).json({ error: 'originalUrl is required' });
		}

		let parsedUrl: URL;
		try {
			parsedUrl = new URL(originalUrl);
		} catch {
			return res.status(400).json({ error: 'originalUrl must be a valid URL' });
		}

		if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
			return res.status(400).json({ error: 'originalUrl must be http(s)' });
		}

		const user = res.locals.user as { id: string } | undefined;
		if (!user?.id) {
			return res.status(401).json({ error: 'Unauthorized' });
		}

		// Check user URL quota (< 100)
		const { count, error: countError } = await supabaseAdmin
			.from('urls')
			.select('id', { count: 'exact', head: true })
			.eq('user_id', user.id);

		if (countError) {
			return next(countError);
		}

		if ((count ?? 0) >= 100) {
			return res.status(403).json({ error: 'URL limit reached (100)' });
		}

		// Generate a short code and insert
		const maxAttempts = 10;
		for (let attempt = 0; attempt < maxAttempts; attempt++) {
			const length = 6 + Math.floor(Math.random() * 3); // 6–8 chars
			const shortCode = randomBase62Code(length);

			// Best-effort uniqueness check (DB should still enforce a unique constraint)
			const { data: existing, error: existsError } = await supabaseAdmin
				.from('urls')
				.select('id')
				.eq('short_code', shortCode)
				.limit(1);

			if (existsError) {
				return next(existsError);
			}

			if (existing && existing.length > 0) {
				continue;
			}

			const { data: inserted, error: insertError } = await supabaseAdmin
				.from('urls')
				.insert({
					user_id: user.id,
					original_url: originalUrl,
					short_code: shortCode,
				})
				.select('*')
				.single();

			if (insertError) {
				// If DB has unique constraint on short_code, collisions will surface here.
				// Retry a few times in case of collision.
				const message = String((insertError as any)?.message ?? '');
				const isUniqueViolation = message.toLowerCase().includes('duplicate') || message.toLowerCase().includes('unique');
				if (isUniqueViolation) {
					continue;
				}
				return next(insertError);
			}

			return res.status(201).json({ url: inserted });
		}

		return res.status(500).json({ error: 'Failed to generate unique short code' });
	} catch (err) {
		return next(err);
	}
});

export default router;
