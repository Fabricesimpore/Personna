/**
 * Tests API routes
 * Handles POST requests for creating test instances and collecting test responses
 */

import { Request, Response } from 'express';
import multer from 'multer';
import { testInstanceStore } from '../models/TestInstance';
import { testTemplateStore } from '../models/TestTemplate';
import { verifyToken } from '../middleware/auth';

// In-memory test runs storage for MVP
const testRuns: Map<string, any> = new Map();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('audio/') || file.mimetype === 'application/octet-stream') {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed'));
    }
  }
});

/**
 * POST /api/tests
 * Creates a new test instance from a template
 */
export const createTest = (req: Request, res: Response) => {
  try {
    const { templateId } = req.body;

    // Validate required fields
    if (!templateId) {
      return res.status(400).json({
        success: false,
        error: 'Bad request',
        message: 'templateId is required'
      });
    }

    // Check if template exists
    const template = testTemplateStore.getById(templateId);
    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: `Test template with ID ${templateId} not found`
      });
    }

    // Create new test instance from template
    const testInstance = testInstanceStore.createFromTemplate(
      templateId,
      template.name,
      template.description
    );

    // Return success response with created instance
    res.status(201).json({
      success: true,
      data: testInstance,
      message: 'Test instance created successfully'
    });
  } catch (error) {
    console.error('Error creating test instance:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to create test instance'
    });
  }
};

/**
 * POST /api/tests/runs
 * Collects comprehensive test run data including audio, events, transcript, and survey responses
 */
export const submitTestRun = upload.single('audio');

export const handleTestRunSubmission = (req: Request, res: Response) => {
  try {
    const {
      templateId,
      runId,
      personaTraits,
      logs,
      transcript,
      surveyResponses
    } = req.body;

    // Validate required fields
    if (!templateId || !runId) {
      return res.status(400).json({
        success: false,
        error: 'Bad request',
        message: 'templateId and runId are required'
      });
    }

    // Parse JSON fields
    let parsedPersonaTraits, parsedLogs, parsedSurveyResponses;
    
    try {
      parsedPersonaTraits = personaTraits ? JSON.parse(personaTraits) : null;
      parsedLogs = logs ? JSON.parse(logs) : null;
      parsedSurveyResponses = surveyResponses ? JSON.parse(surveyResponses) : null;
    } catch (parseError) {
      return res.status(400).json({
        success: false,
        error: 'Bad request',
        message: 'Invalid JSON in request body'
      });
    }

    // Check if template exists
    const template = testTemplateStore.getById(templateId);
    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: `Test template with ID ${templateId} not found`
      });
    }

    // Process audio file if provided
    let audioData = null;
    if (req.file) {
      audioData = {
        buffer: req.file.buffer,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      };
      
      // In a real application, you would save this to cloud storage (S3, etc.)
      console.log(`Audio file received: ${req.file.originalname} (${req.file.size} bytes)`);
    }

    // Create test run data object
    const testRunData = {
      runId,
      templateId,
      templateName: template.name,
      submittedAt: new Date().toISOString(),
      personaTraits: parsedPersonaTraits,
      logs: parsedLogs,
      transcript: transcript || '',
      surveyResponses: parsedSurveyResponses,
      audioFile: audioData ? {
        filename: audioData.originalname,
        size: audioData.size,
        mimetype: audioData.mimetype
      } : null,
      summary: {
        totalEvents: parsedLogs?.length || 0,
        totalSurveyResponses: parsedSurveyResponses?.length || 0,
        hasAudio: !!audioData,
        hasTranscript: !!transcript,
        duration: calculateDuration(parsedLogs)
      }
    };

    // In a real application, you would save this to a database
    console.log('Test run data received:', {
      runId,
      templateId,
      templateName: template.name,
      eventCount: parsedLogs?.length || 0,
      surveyResponseCount: parsedSurveyResponses?.length || 0,
      hasAudio: !!audioData,
      hasTranscript: !!transcript
    });

    // Return success response
    res.status(201).json({
      success: true,
      data: {
        runId,
        message: 'Test run submitted successfully'
      },
      summary: testRunData.summary
    });

  } catch (error) {
    console.error('Error submitting test run:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to submit test run'
    });
  }
};

/**
 * Calculate test duration from logs
 */
function calculateDuration(logs: any[]): number {
  if (!logs || logs.length < 2) return 0;
  
  const startTime = logs.find(log => log.type === 'task-start')?.timestamp;
  const endTime = logs.find(log => log.type === 'task-complete')?.timestamp;
  
  if (startTime && endTime) {
    return Math.round((endTime - startTime) / 1000); // Convert to seconds
  }
  
  return 0;
}

/**
 * GET /api/tests
 * Returns all test instances
 */
export const getTests = (req: Request, res: Response) => {
  try {
    const tests = testInstanceStore.getAll();
    
    res.status(200).json({
      success: true,
      data: tests,
      meta: {
        total: tests.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching test instances:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch test instances'
    });
  }
};

/**
 * GET /api/tests/:id
 * Returns a specific test instance by ID
 */
export const getTestById = (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const testInstance = testInstanceStore.getById(id);
    
    if (!testInstance) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: `Test instance with ID ${id} not found`
      });
    }

    // Attach the full template details
    const template = testTemplateStore.getById(testInstance.templateId);
    res.status(200).json({
      success: true,
      data: {
        ...testInstance,
        template
      }
    });
  } catch (error) {
    console.error('Error fetching test instance:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch test instance'
    });
  }
};

/**
 * PATCH /api/tests/:id/status
 * Updates the status of a test instance
 */
export const updateTestStatus = (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Bad request',
        message: 'status is required'
      });
    }

    const validStatuses = ['draft', 'active', 'completed', 'archived'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Bad request',
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const updatedInstance = testInstanceStore.updateStatus(id, status);
    
    if (!updatedInstance) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: `Test instance with ID ${id} not found`
      });
    }

    res.status(200).json({
      success: true,
      data: updatedInstance,
      message: 'Test instance status updated successfully'
    });
  } catch (error) {
    console.error('Error updating test instance status:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to update test instance status'
    });
  }
};

/**
 * PATCH /api/tests/:id/score
 * Updates the score of a completed test instance
 */
export const updateTestScore = (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { score, maxScore } = req.body;

    if (typeof score !== 'number' || typeof maxScore !== 'number') {
      return res.status(400).json({
        success: false,
        error: 'Bad request',
        message: 'score and maxScore are required numbers'
      });
    }

    if (score < 0 || maxScore <= 0 || score > maxScore) {
      return res.status(400).json({
        success: false,
        error: 'Bad request',
        message: 'Invalid score values'
      });
    }

    const updatedInstance = testInstanceStore.updateScore(id, score, maxScore);
    
    if (!updatedInstance) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: `Test instance with ID ${id} not found`
      });
    }

    res.status(200).json({
      success: true,
      data: updatedInstance,
      message: 'Test instance score updated successfully'
    });
  } catch (error) {
    console.error('Error updating test instance score:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to update test instance score'
    });
  }
}; 

/**
 * POST /api/test-responses
 * Collects test responses and persona data from interactive test components
 */
export const submitTestResponses = (req: Request, res: Response) => {
  try {
    const {
      templateId,
      testType,
      responses,
      userNotes,
      totalTime,
      completionRate,
      averageDifficulty,
      totalErrors,
      totalAttempts,
      userBehavior,
      averageAccuracy,
      totalMousePathPoints,
      averageTaskTime,
      averageResponseTime,
      averageConfidence,
      totalChanges,
      totalHesitations
    } = req.body;

    // Validate required fields
    if (!templateId || !testType) {
      return res.status(400).json({
        success: false,
        error: 'Bad request',
        message: 'templateId and testType are required'
      });
    }

    // Check if template exists
    const template = testTemplateStore.getById(templateId);
    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: `Test template with ID ${templateId} not found`
      });
    }

    // Create persona data object
    const personaData = {
      id: `persona-${Date.now()}`,
      templateId,
      testType,
      timestamp: new Date().toISOString(),
      responses: responses || [],
      userNotes: userNotes || '',
      
      // Usability metrics
      totalTime: totalTime || 0,
      completionRate: completionRate || 0,
      averageDifficulty: averageDifficulty || 0,
      totalErrors: totalErrors || 0,
      totalAttempts: totalAttempts || 0,
      
      // Click test metrics
      averageAccuracy: averageAccuracy || 0,
      totalMousePathPoints: totalMousePathPoints || 0,
      averageTaskTime: averageTaskTime || 0,
      
      // Survey metrics
      averageResponseTime: averageResponseTime || 0,
      averageConfidence: averageConfidence || 0,
      totalChanges: totalChanges || 0,
      totalHesitations: totalHesitations || 0,
      
      // User behavior data
      userBehavior: userBehavior || {},
      
      // Persona insights
      insights: generatePersonaInsights(req.body)
    };

    // Store persona data (in a real app, this would go to a database)
    console.log('Persona data collected:', personaData);

    // Update test instance status to completed
    const testInstances = testInstanceStore.getAll();
    const relatedTest = testInstances.find(test => test.templateId === templateId);
    if (relatedTest) {
      testInstanceStore.updateStatus(relatedTest.id, 'completed');
    }

    res.status(201).json({
      success: true,
      data: {
        personaId: personaData.id,
        message: 'Test responses and persona data collected successfully'
      },
      insights: personaData.insights
    });
  } catch (error) {
    console.error('Error submitting test responses:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to submit test responses'
    });
  }
};

/**
 * Generate persona insights from test data
 */
function generatePersonaInsights(data: any) {
  const insights: {
    userType: string;
    behaviorPattern: string;
    skillLevel: string;
    preferences: string[];
    painPoints: string[];
    recommendations: string[];
  } = {
    userType: '',
    behaviorPattern: '',
    skillLevel: '',
    preferences: [] as string[],
    painPoints: [] as string[],
    recommendations: [] as string[]
  };

  // Determine user type based on test type and performance
  if (data.testType === 'basic-usability') {
    if (data.completionRate >= 0.8 && data.averageDifficulty <= 2) {
      insights.userType = 'Power User';
    } else if (data.completionRate >= 0.6 && data.averageDifficulty <= 3) {
      insights.userType = 'Regular User';
    } else {
      insights.userType = 'Novice User';
    }
  } else if (data.testType === 'click-test') {
    if (data.averageAccuracy >= 80) {
      insights.userType = 'Precise User';
    } else if (data.averageAccuracy >= 60) {
      insights.userType = 'Average User';
    } else {
      insights.userType = 'Learning User';
    }
  } else if (data.testType === 'survey') {
    if (data.averageConfidence >= 4) {
      insights.userType = 'Confident User';
    } else if (data.averageConfidence >= 2.5) {
      insights.userType = 'Uncertain User';
    } else {
      insights.userType = 'Hesitant User';
    }
  }

  // Determine behavior pattern
  if (data.userBehavior?.totalHesitations > 5) {
    insights.behaviorPattern = 'Cautious';
  } else if (data.userBehavior?.totalChanges > 3) {
    insights.behaviorPattern = 'Indecisive';
  } else if (data.totalTime < 300) { // Less than 5 minutes
    insights.behaviorPattern = 'Quick';
  } else {
    insights.behaviorPattern = 'Methodical';
  }

  // Determine skill level
  if (data.completionRate >= 0.9 && data.totalErrors <= 1) {
    insights.skillLevel = 'Expert';
  } else if (data.completionRate >= 0.7 && data.totalErrors <= 3) {
    insights.skillLevel = 'Intermediate';
  } else {
    insights.skillLevel = 'Beginner';
  }

  // Generate preferences based on responses
  if (data.responses) {
    data.responses.forEach((response: any) => {
      if (response.answer && typeof response.answer === 'string') {
        if (response.answer.toLowerCase().includes('easy') || response.answer.toLowerCase().includes('intuitive')) {
          insights.preferences.push('Simplicity');
        }
        if (response.answer.toLowerCase().includes('fast') || response.answer.toLowerCase().includes('speed')) {
          insights.preferences.push('Speed');
        }
        if (response.answer.toLowerCase().includes('visual') || response.answer.toLowerCase().includes('design')) {
          insights.preferences.push('Visual Design');
        }
      }
    });
  }

  // Generate pain points
  if (data.totalErrors > 2) {
    insights.painPoints.push('Navigation difficulties');
  }
  if (data.averageDifficulty > 3) {
    insights.painPoints.push('Complex interface elements');
  }
  if (data.userBehavior?.totalHesitations > 3) {
    insights.painPoints.push('Unclear instructions');
  }

  // Generate recommendations
  if (insights.userType === 'Novice User') {
    insights.recommendations.push('Add more onboarding elements');
    insights.recommendations.push('Simplify navigation structure');
  }
  if (insights.behaviorPattern === 'Cautious') {
    insights.recommendations.push('Provide more feedback and confirmation');
    insights.recommendations.push('Add undo/redo functionality');
  }
  if (data.averageDifficulty > 3) {
    insights.recommendations.push('Redesign complex workflows');
    insights.recommendations.push('Add contextual help');
  }

  return insights;
} 

/**
 * Generate insights from test run data
 */
function generateTestRunInsights(testRunData: any, template: any) {
  const insights = {
    userType: '',
    behaviorPattern: '',
    skillLevel: '',
    completionRate: 0,
    averageTaskTime: 0,
    interactionPattern: '',
    eventSuccessRate: 0,
    expectedEventsCompleted: 0,
    recommendations: [] as string[]
  };

  // Calculate completion rate
  const taskCompletions = testRunData.taskLogs.filter((log: any) => log.type === 'task-complete').length;
  insights.completionRate = taskCompletions / template.tasks.length;

  // Calculate average task time
  const taskTimes = testRunData.taskLogs
    .filter((log: any) => log.type === 'task-complete')
    .map((log: any) => log.data.timeSpent);
  
  if (taskTimes.length > 0) {
    insights.averageTaskTime = taskTimes.reduce((a: number, b: number) => a + b, 0) / taskTimes.length;
  }

  // Analyze event-driven task completion
  const eventLogs = testRunData.logs.filter((log: any) => log.type === 'event-fired');
  const expectedEvents = template.tasks
    .filter((task: any) => task.expectedEvent)
    .map((task: any) => task.expectedEvent);
  
  const completedEvents = eventLogs
    .filter((log: any) => expectedEvents.includes(log.data.eventName))
    .map((log: any) => log.data.eventName);
  
  insights.expectedEventsCompleted = completedEvents.length;
  insights.eventSuccessRate = expectedEvents.length > 0 ? completedEvents.length / expectedEvents.length : 0;

  // Determine user type based on completion rate and event success
  if (insights.completionRate >= 0.8 && insights.eventSuccessRate >= 0.8 && insights.averageTaskTime < 120) {
    insights.userType = 'Power User';
  } else if (insights.completionRate >= 0.6 && insights.eventSuccessRate >= 0.6 && insights.averageTaskTime < 180) {
    insights.userType = 'Regular User';
  } else {
    insights.userType = 'Novice User';
  }

  // Determine behavior pattern based on interaction logs and event patterns
  const clickCount = testRunData.interactionLogs.filter((log: any) => log.type === 'click').length;
  const scrollCount = testRunData.interactionLogs.filter((log: any) => log.type === 'scroll').length;
  const wrongEventCount = eventLogs.filter((log: any) => !expectedEvents.includes(log.data.eventName)).length;
  
  if (clickCount > scrollCount * 2 && wrongEventCount < 2) {
    insights.behaviorPattern = 'Precise';
  } else if (wrongEventCount > 3) {
    insights.behaviorPattern = 'Exploratory';
  } else if (scrollCount > clickCount * 2) {
    insights.behaviorPattern = 'Cautious';
  } else {
    insights.behaviorPattern = 'Balanced';
  }

  // Determine skill level based on event success and task completion
  if (insights.completionRate >= 0.9 && insights.eventSuccessRate >= 0.9 && testRunData.totalInteractions < 50) {
    insights.skillLevel = 'Expert';
  } else if (insights.completionRate >= 0.7 && insights.eventSuccessRate >= 0.7 && testRunData.totalInteractions < 100) {
    insights.skillLevel = 'Intermediate';
  } else {
    insights.skillLevel = 'Beginner';
  }

  // Generate recommendations based on event-driven insights
  if (insights.eventSuccessRate < 0.6) {
    insights.recommendations.push('Improve task clarity and instructions');
    insights.recommendations.push('Add more visual cues for expected actions');
  }
  
  if (wrongEventCount > 2) {
    insights.recommendations.push('Reduce interface complexity');
    insights.recommendations.push('Add contextual help and tooltips');
  }
  
  if (insights.completionRate < 0.6) {
    insights.recommendations.push('Simplify task instructions');
    insights.recommendations.push('Add more visual cues');
  }
  
  if (insights.averageTaskTime > 180) {
    insights.recommendations.push('Reduce task complexity');
    insights.recommendations.push('Improve interface efficiency');
  }
  
  if (testRunData.totalInteractions > 150) {
    insights.recommendations.push('Streamline navigation');
    insights.recommendations.push('Reduce cognitive load');
  }

  return insights;
} 

/**
 * POST /api/tests/runs/event
 * Real-time event logging for test runs
 */
export const logTestRunEvent = (req: Request, res: Response) => {
  try {
    const { runId, eventName, timestamp, data } = req.body;
    const userId = req.user!.userId;

    if (!runId || !eventName) {
      return res.status(400).json({
        success: false,
        message: 'runId and eventName are required'
      });
    }

    // Get or create test run
    let testRun = testRuns.get(runId);
    if (!testRun) {
      testRun = {
        id: runId,
        userId,
        events: [],
        transcript: '',
        audioChunks: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      testRuns.set(runId, testRun);
    }

    // Add event
    testRun.events.push({
      name: eventName,
      timestamp: timestamp || Date.now(),
      data: data || {}
    });
    testRun.updatedAt = new Date().toISOString();

    res.json({
      success: true,
      message: 'Event logged successfully'
    });

  } catch (error) {
    console.error('Error logging test run event:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to log event'
    });
  }
};

/**
 * POST /api/tests/runs/transcript
 * Real-time transcript updates for test runs
 */
export const updateTestRunTranscript = (req: Request, res: Response) => {
  try {
    const { runId, chunk, timestamp } = req.body;
    const userId = req.user!.userId;

    if (!runId || !chunk) {
      return res.status(400).json({
        success: false,
        message: 'runId and chunk are required'
      });
    }

    // Get or create test run
    let testRun = testRuns.get(runId);
    if (!testRun) {
      testRun = {
        id: runId,
        userId,
        events: [],
        transcript: '',
        audioChunks: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      testRuns.set(runId, testRun);
    }

    // Append transcript chunk
    testRun.transcript += chunk;
    testRun.updatedAt = new Date().toISOString();

    res.json({
      success: true,
      message: 'Transcript updated successfully'
    });

  } catch (error) {
    console.error('Error updating test run transcript:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update transcript'
    });
  }
};

/**
 * POST /api/tests/runs/audio
 * Real-time audio chunk upload for test runs
 */
export const uploadTestRunAudio = upload.single('audioChunk');

export const handleTestRunAudioUpload = (req: Request, res: Response) => {
  try {
    const { runId } = req.body;
    const userId = req.user!.userId;

    if (!runId) {
      return res.status(400).json({
        success: false,
        message: 'runId is required'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Audio file is required'
      });
    }

    // Get or create test run
    let testRun = testRuns.get(runId);
    if (!testRun) {
      testRun = {
        id: runId,
        userId,
        events: [],
        transcript: '',
        audioChunks: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      testRuns.set(runId, testRun);
    }

    // Add audio chunk
    testRun.audioChunks.push({
      buffer: req.file.buffer,
      timestamp: Date.now(),
      size: req.file.size
    });
    testRun.updatedAt = new Date().toISOString();

    console.log(`Audio chunk uploaded for run ${runId}: ${req.file.size} bytes`);

    res.json({
      success: true,
      message: 'Audio chunk uploaded successfully'
    });

  } catch (error) {
    console.error('Error uploading test run audio:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload audio chunk'
    });
  }
};

/**
 * POST /api/tests/runs/finalize
 * Finalize test run and create persona
 */
export const finalizeTestRun = async (req: Request, res: Response) => {
  try {
    const { runId, suiteId, metadata } = req.body;
    const userId = req.user!.userId;

    if (!runId) {
      return res.status(400).json({
        success: false,
        message: 'runId is required'
      });
    }

    // Get test run
    const testRun = testRuns.get(runId);
    if (!testRun) {
      return res.status(404).json({
        success: false,
        message: 'Test run not found'
      });
    }

    // Mark run as finalized
    testRun.finalized = true;
    testRun.endTime = Date.now();
    testRuns.set(runId, testRun);

    // Import and call buildPersona
    const { buildPersona, setTestRuns } = require('../services/personaService');
    
    // Set test runs data for persona service
    setTestRuns(testRuns);
    
    // Build persona from test run data
    const personaData = await buildPersona(runId);

    res.json({
      success: true,
      runId,
      personaId: personaData.personaId,
      message: 'Test run finalized and persona created successfully'
    });

  } catch (error) {
    console.error('Error finalizing test run:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to finalize test run'
    });
  }
}; 

/**
 * GET /api/tests/runs/current
 * Returns the in-progress test run for the authenticated user
 */
export const getCurrentTestRun = (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    
    // Find the most recent non-finalized run for this user
    const currentRun = testRuns.get(userId); // Assuming testRuns is a Map of userId to run
    
    if (!currentRun) {
      return res.status(404).json({ 
        success: false, 
        message: 'No active run found' 
      });
    }
    
    res.json({
      success: true,
      data: {
        runId: currentRun.id,
        suiteId: currentRun.suiteId, // Assuming suiteId is stored in the run object
        currentStageIndex: currentRun.currentStageIndex || 0,
        currentTaskIndex: currentRun.currentTaskIndex || 0,
        events: currentRun.events || [],
        transcriptSoFar: currentRun.transcript || '',
        surveyResponsesSoFar: currentRun.surveyResponses || [],
        startTime: currentRun.createdAt,
        createdAt: currentRun.createdAt
      }
    });
  } catch (error) {
    console.error('Error fetching current run:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch current run' 
    });
  }
};

/**
 * GET /api/tests/runs/:runId/state
 * Returns the state of a specific test run by runId
 */
export const getTestRunState = (req: Request, res: Response) => {
  try {
    const { runId } = req.params;
    const userId = req.user!.userId;
    
    const run = testRuns.get(runId); // Assuming testRuns is a Map of runId to run
    
    if (!run) {
      return res.status(404).json({ 
        success: false, 
        message: 'Run not found' 
      });
    }
    
    res.json({
      success: true,
      data: {
        runId: run.id,
        suiteId: run.suiteId, // Assuming suiteId is stored in the run object
        currentStageIndex: run.currentStageIndex || 0,
        currentTaskIndex: run.currentTaskIndex || 0,
        events: run.events || [],
        transcriptSoFar: run.transcript || '',
        surveyResponsesSoFar: run.surveyResponses || [],
        startTime: run.createdAt,
        createdAt: run.createdAt,
        finalized: run.finalized // Assuming finalized is stored in the run object
      }
    });
  } catch (error) {
    console.error('Error fetching run state:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch run state' 
    });
  }
};

 