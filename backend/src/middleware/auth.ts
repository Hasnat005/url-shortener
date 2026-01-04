import type { RequestHandler } from 'express';

import { supabaseAdmin } from '../lib/supabase';

function getBearerToken(authorizationHeader: string | undefined): string | null {
	if (!authorizationHeader) return null;

	const [scheme, token] = authorizationHeader.split(' ');
	if (!scheme || scheme.toLowerCase() !== 'bearer') return null;
	if (!token) return null;

	return token;
}

export const requireAuth: RequestHandler = async (req, res, next) => {
	try {
		const token = getBearerToken(req.header('authorization'));
		if (!token) {
			return res.status(401).json({ error: 'Missing Bearer token' });
		}

		const { data, error } = await supabaseAdmin.auth.getUser(token);
		if (error || !data.user) {
			return res.status(401).json({ error: 'Invalid or expired token' });
		}

		res.locals.user = data.user;
		res.locals.accessToken = token;

		return next();
	} catch (err) {
		return next(err);
	}
};
