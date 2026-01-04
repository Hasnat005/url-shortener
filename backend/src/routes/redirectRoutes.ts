import { Router } from 'express';

import { supabaseAdmin } from '../lib/supabase';

const router = Router();

router.get('/:code', async (req, res, next) => {
	try {
		const code = String(req.params.code ?? '').trim();
		if (!code) {
			return res.status(404).json({ error: 'Not found' });
		}

		const { data: url, error } = await supabaseAdmin
			.from('urls')
			.select('*')
			.eq('short_code', code)
			.single();

		if (error || !url) {
			return res.status(404).json({ error: 'Not found' });
		}

		// Best-effort click tracking. (Prefer a DB-side increment for perfect concurrency.)
		const currentClicks = typeof (url as any).click_count === 'number' ? (url as any).click_count : 0;
		await supabaseAdmin
			.from('urls')
			.update({ click_count: currentClicks + 1 })
			.eq('id', (url as any).id);

		const originalUrl = String((url as any).original_url ?? '');
		if (!originalUrl) {
			return res.status(500).json({ error: 'URL record missing original_url' });
		}

		return res.redirect(302, originalUrl);
	} catch (err) {
		return next(err);
	}
});

export default router;
