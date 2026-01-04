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
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/health', (_req, res) => {
	res.status(200).json({ status: 'ok' });
});

app.use('/api', urlRoutes);

// Short URL redirects (keep after /api to avoid conflicts)
app.use('/', redirectRoutes);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
	const message = err instanceof Error ? err.message : 'Internal Server Error';
	res.status(500).json({ error: message });
});

const port = Number(process.env.PORT ?? 3001);
app.listen(port, () => {
	console.log(`Backend listening on http://localhost:${port}`);
});
