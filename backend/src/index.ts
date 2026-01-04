import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';

import redirectRoutes from './routes/redirectRoutes';
import urlRoutes from './routes/urlRoutes';

const app = express();

app.disable('x-powered-by');
app.use(helmet());

const corsAllowedOrigins = (process.env.CORS_ORIGINS ?? '')
	.split(',')
	.map((s) => s.trim())
	.filter(Boolean);

const corsOptions: cors.CorsOptions = {
	origin: (origin, callback) => {
		// Allow non-browser requests (no Origin header)
		if (!origin) return callback(null, true);
		// If no allowlist provided, allow all origins (typical for quick Vercel-to-Vercel setups)
		if (corsAllowedOrigins.length === 0) return callback(null, true);
		return callback(null, corsAllowedOrigins.includes(origin));
	},
	methods: ['GET', 'POST', 'OPTIONS'],
	allowedHeaders: ['Content-Type', 'Authorization'],
	optionsSuccessStatus: 204,
};

const corsMiddleware = cors(corsOptions);

// Apply CORS to all requests, and safely short-circuit preflight for Express 5.
app.use((req, res, next) => {
	corsMiddleware(req, res, (err) => {
		if (err) return next(err);
		if (req.method === 'OPTIONS') return res.sendStatus(204);
		return next();
	});
});
app.use(express.json());
app.use(morgan('dev'));

app.get('/health', (_req, res) => {
	res.status(200).json({ status: 'ok' });
});

app.use('/api', urlRoutes);

// Short URL redirects (keep after /api to avoid conflicts)
app.use('/', redirectRoutes);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
	// Log full error server-side for debugging
	console.error(err);

	const isProd = process.env.NODE_ENV === 'production';
	const message = err instanceof Error ? err.message : 'Internal Server Error';
	const maybe = err as { code?: unknown; details?: unknown; hint?: unknown; status?: unknown };
	const status = typeof maybe?.status === 'number' ? maybe.status : 500;

	res.status(status).json({
		error: message,
		...(isProd
			? null
			: {
				code: typeof maybe?.code === 'string' ? maybe.code : undefined,
				details: typeof maybe?.details === 'string' ? maybe.details : undefined,
				hint: typeof maybe?.hint === 'string' ? maybe.hint : undefined,
			}),
	});
});

const port = Number(process.env.PORT ?? 3001);
app.listen(port, () => {
	console.log(`Backend listening on http://localhost:${port}`);
});
