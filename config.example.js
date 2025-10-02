// Environment Configuration Example
// Copy this file to config.js and update with your values

module.exports = {
  // Environment
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 3000,

  // CORS Configuration
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS?.split(',') || [
    'http://localhost:8080',
    'http://localhost:3000'
  ],

  // NPM Token (for GitHub Actions)
  NPM_TOKEN: process.env.NPM_TOKEN,

  // Database Configuration (when implemented)
  DATABASE_URL: process.env.DATABASE_URL,
  REDIS_URL: process.env.REDIS_URL,

  // Security
  JWT_SECRET: process.env.JWT_SECRET || 'your-jwt-secret-here',
  API_KEY: process.env.API_KEY,

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  RATE_LIMIT_MAX: 100, // requests per window

  // Tracking Configuration
  MAX_EVENTS_PER_BATCH: 100,
  BUFFER_SIZE: 20,
  FLUSH_INTERVAL: 5000, // 5 seconds
};