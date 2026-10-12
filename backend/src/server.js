import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from './config/db.js';
import { initPlacementDb } from './config/initPlacementDb.js';
import { initGeneralAptitudeDb } from './config/initGeneralAptitudeDb.js';
import { seedGeneralAptitudeData } from './config/seedGeneralAptitudeData.js';
import adminRoutes from './routes/adminRoutes.js';
import placementRoutes from './routes/placementRoutes.js';
import authRoutes from './routes/authRoutes.js';
import topicsRoutes from './routes/topicsRoutes.js';
import assessmentRoutes from './routes/assessmentRoutes.js';
import mockTestRoutes from './routes/mockTestRoutes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());
app.use(express.json());

// Initialize PostgreSQL schema and placement test data
(async () => {
  try {
    await initPlacementDb();
    await initGeneralAptitudeDb();
    await seedGeneralAptitudeData();
  } catch (e) {
    console.error('Initialization error:', e);
  }
})();

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/topics', topicsRoutes);
app.use('/api/questions/:slug', (req, res, next) => {
  req.url = `/${req.params.slug}/questions` + (req.url === '/' ? '' : req.url);
  topicsRoutes(req, res, next);
});
app.use('/api/bookmarks', (req, res, next) => {
  req.url = '/user/bookmarks' + req.url;
  topicsRoutes(req, res, next);
});
app.use('/api/placement', placementRoutes);
app.use('/api/quiz', placementRoutes);
app.use('/api/assessment', assessmentRoutes);
app.use('/api/mock-test', mockTestRoutes);

// Test route to verify the database connection
app.get('/api/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT current_database(), current_user, NOW();');
    res.json({
      status: 'Database connected!',
      database: result.rows[0].current_database,
      user: result.rows[0].current_user,
      timestamp: result.rows[0].now,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve static frontend assets from workspace root if accessed directly on Port 5000
const rootDir = path.resolve(__dirname, '../../');
app.use(express.static(rootDir));

app.use((req, res, next) => {
  if (req.url.startsWith('/api')) return next();
  res.sendFile(path.join(rootDir, 'react.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Placement Portal Backend running on http://localhost:${PORT}`);
});
