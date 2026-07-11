javascript
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const config = require('./config');

// Import routes
const apiRoutes = require('./routes/api');
const webhookRoutes = require('./routes/webhook');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// Routes
app.use('/api', apiRoutes);
app.use('/webhook', webhookRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Root
app.get('/', (req, res) => {
  res.json({
    name: 'Fampay Autopay Service',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      setup: 'POST /api/autopay/setup',
      status: 'GET /api/autopay/status/:userId',
      cancel: 'POST /api/autopay/cancel',
      history: 'GET /api/autopay/history/:userId',
      webhook: 'POST /webhook',
      health: 'GET /health',
    },
  });
});

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(config.mongodbUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
}

// Start server
async function startServer() {
  await connectDB();

  app.listen(config.port, () => {
    console.log(`🚀 Server running on port ${config.port}`);
    console.log(`📡 Webhook URL: ${config.webhook.baseUrl}/webhook`);
    console.log(`🔄 Environment: ${config.nodeEnv}`);
  });
}

// Handle uncaught errors
process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
});

startServer();

module.exports = app;
