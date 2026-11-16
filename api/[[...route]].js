import app from '../app.js';
import { connectDatabase } from '../config/database.js';

export default async function handler(req, res) {
  try {
    await connectDatabase();
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    res.status(503).json({
      success: false,
      message: 'Service temporarily unavailable',
    });
    return;
  }

  return app(req, res);
}
