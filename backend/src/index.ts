import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';

const app = express();

app.disable('x-powered-by');
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/health', (_req, res) => {
	res.status(200).json({ status: 'ok' });
});

const port = Number(process.env.PORT ?? 3001);
app.listen(port, () => {
	console.log(`Backend listening on http://localhost:${port}`);
});
