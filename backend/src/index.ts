/**
 * Main Express server for Create Testings Demo
 * Sets up the server, registers routes, and starts listening
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import multer from 'multer';

// Import route handlers
import { 
  getTestTemplates, 
  getTestTemplateById, 
  getCategories 
} from './routes/testTemplates';
import { 
  createTest, 
  getTests, 
  getTestById, 
  updateTestStatus, 
  updateTestScore,
  submitTestResponses,
  submitTestRun,
  handleTestRunSubmission,
  getCurrentTestRun,
  getTestRunState,
  finalizeTestRun
} from './routes/tests';
import { 
  getMyPersona, 
  getPersonaById, 
  getUserPersonas 
} from './routes/personas';
import authRouter from './routes/auth';
import { verifyToken as authMiddleware } from './middleware/auth';

// Create Express application instance
const app = express();
const PORT = process.env.PORT || 3001;

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed'));
    }
  }
});

// Step 1: Configure middleware for security and parsing
app.use(helmet()); // Add security headers
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] 
    : ['http://localhost:3000'],
  credentials: true
}));
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Step 2: Add request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Step 3: Define API routes for test templates
app.get('/api/test-templates', getTestTemplates);
app.get('/api/test-templates/categories', getCategories);
app.get('/api/test-templates/:id', getTestTemplateById);

// Step 4: Define API routes for test instances
app.post('/api/tests', createTest);
app.get('/api/tests', getTests);
app.get('/api/tests/:id', getTestById);
app.patch('/api/tests/:id/status', updateTestStatus);
app.patch('/api/tests/:id/score', updateTestScore);
app.post('/api/test-responses', submitTestResponses);
app.post('/api/tests/runs', submitTestRun, handleTestRunSubmission);

// Test run state management endpoints
app.get('/api/tests/runs/current', authMiddleware, getCurrentTestRun);
app.get('/api/tests/runs/:runId/state', authMiddleware, getTestRunState);
app.post('/api/tests/runs/finalize', authMiddleware, finalizeTestRun);

// Persona endpoints
app.get('/api/personas/me', authMiddleware, getMyPersona);
app.get('/api/personas/:id', authMiddleware, getPersonaById);
app.get('/api/personas', authMiddleware, getUserPersonas);

// Register auth routes
app.use('/api/auth', authRouter);

// Step 5: Add health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Step 6: Add root endpoint with API information
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Create Testings Demo API',
    version: '1.0.0',
    endpoints: {
      templates: {
        'GET /api/test-templates': 'Get all test templates',
        'GET /api/test-templates/categories': 'Get all categories',
        'GET /api/test-templates/:id': 'Get specific template'
      },
      tests: {
        'POST /api/tests': 'Create new test instance',
        'GET /api/tests': 'Get all test instances',
        'GET /api/tests/:id': 'Get specific test instance',
        'PATCH /api/tests/:id/status': 'Update test status',
        'PATCH /api/tests/:id/score': 'Update test score',
        'POST /api/test-responses': 'Submit test responses and collect persona data',
        'POST /api/tests/runs': 'Submit comprehensive test run with audio and logs'
      },
      personas: {
        'GET /api/personas/me': 'Get current user\'s latest persona',
        'GET /api/personas/:id': 'Get specific persona by ID',
        'GET /api/personas': 'Get all personas for current user'
      }
    }
  });
});

// Step 7: Add 404 handler for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not found',
    message: `Route ${req.method} ${req.originalUrl} not found`
  });
});

// Step 8: Add global error handler
app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: 'An unexpected error occurred'
  });
});

// Step 9: Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📚 API docs: http://localhost:${PORT}/`);
  console.log(`🔄 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Step 10: Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

export default app; 