// server/server.js
import express from 'express';
import bodyParser from 'body-parser';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cors from 'cors';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:8080'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Body parsing with size limits
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Input validation middleware
const validateTrackingData = (req, res, next) => {
  const { events } = req.body;
  
  if (!events || !Array.isArray(events)) {
    return res.status(400).json({ error: 'Invalid events array' });
  }
  
  if (events.length > 100) {
    return res.status(400).json({ error: 'Too many events in batch' });
  }
  
  // Validate each event
  for (const event of events) {
    if (!event.type || typeof event.type !== 'string') {
      return res.status(400).json({ error: 'Invalid event type' });
    }
    if (event.timestamp && !Number.isInteger(event.timestamp)) {
      return res.status(400).json({ error: 'Invalid timestamp' });
    }
  }
  
  next();
};

app.post('/track', validateTrackingData, (req, res) => {
  const { events } = req.body;
  
  // Log for debugging (remove in production)
  if (process.env.NODE_ENV === 'development') {
    console.log('Received events:', events.length);
  }
  
  // TODO: Store events in database
  // For now, just acknowledge receipt
  res.json({ 
    ok: true, 
    received: events.length,
    timestamp: Date.now()
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Chyavan server listening on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});
