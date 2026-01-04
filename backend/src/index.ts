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
const corsOptions: cors.CorsOptions = {
	origin: true,
	methods: ['GET', 'POST', 'OPTIONS'],
	allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));
// Express 5 + path-to-regexp no longer supports '*' here; handle preflight safely.
app.use((req, res, next) => {
	if (req.method === 'OPTIONS') return res.sendStatus(204);
	return next();
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
