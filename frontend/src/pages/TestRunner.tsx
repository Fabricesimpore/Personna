/**
 * TestRunner.tsx
 * Comprehensive test runner with persona-driven testing, audio capture, and logging
 */
import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTemplates } from '../services/api';
import { TestTemplate, TestTask } from '../services/api';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Clock, Mic, Play, CheckCircle, Lightbulb } from 'lucide-react';
import TaskFeedback from '../components/TaskFeedback';
import Toast from '../components/Toast';
import { generateHint } from '../services/aiHints';
import { generateScenario, generateTaskScenario } from '../services/scenarioGenerator';
import ThinkAloudRecorder from '../components/ThinkAloudRecorder';
import { TranscriptProvider, useTranscript } from '../contexts/TranscriptContext';
import eventBus from '../lib/eventBus';

// Dynamic shell imports
const SpotOnClickShell = React.lazy(() => import('../shells/SpotOnClickShell'));
const SprintRecallShell = React.lazy(() => import('../shells/SprintRecallShell'));
const DeepDiveShell = React.lazy(() => import('../shells/DeepDiveShell'));

// Shell component map
const shellMap: Record<string, React.LazyExoticComponent<any>> = {
  'SpotOnClickShell': SpotOnClickShell,
  'SprintRecallShell': SprintRecallShell,
  'DeepDiveShell': DeepDiveShell
};

interface UserLog {
  timestamp: number;
  type: 'click' | 'scroll' | 'keypress' | 'task-start' | 'task-complete' | 'audio-start' | 'audio-stop' | 'event-fired' | 'hint-requested';
  data: any;
}

interface SurveyResponse {
  questionId: string;
  answer: string | number;
}

const TestRunnerContent: React.FC = () => {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();
  const { transcript, updateTranscript, setIsRecording } = useTranscript();
  const [template, setTemplate] = useState<TestTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Test state
  const [currentPhase, setCurrentPhase] = useState<'intro' | 'persona' | 'permissions' | 'tasks' | 'survey' | 'complete'>('intro');
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [taskTimeRemaining, setTaskTimeRemaining] = useState(0);
  const [isTaskActive, setIsTaskActive] = useState(false);
  const [userLogs, setUserLogs] = useState<UserLog[]>([]);
  const [surveyResponses, setSurveyResponses] = useState<SurveyResponse[]>([]);
  
  // Event-driven validation state
  const [expectedEvent, setExpectedEvent] = useState<string | null>(null);
  const [taskFeedback, setTaskFeedback] = useState<{
    type: 'success' | 'error' | 'hint' | 'timeout';
    message: string;
    showHint?: boolean;
  } | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [aiHint, setAiHint] = useState<string>('');
  const [hintIndex, setHintIndex] = useState(0);
  const [taskScenario, setTaskScenario] = useState<string>('');
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
    isVisible: boolean;
  } | null>(null);
  
  // Audio state
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [isRecording, setIsRecordingState] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);

  // Refs
  const audioChunks = useRef<Blob[]>([]);
  const taskTimer = useRef<NodeJS.Timeout | null>(null);

  // Load template
  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        const templates = await getTemplates();
        const foundTemplate = templates.find(t => t.id === templateId);
        
        if (!foundTemplate) {
          setError('Template not found');
          return;
        }
        
        setTemplate(foundTemplate);
      } catch (err) {
        setError('Failed to load template');
        console.error('Error fetching template:', err);
      } finally {
        setLoading(false);
      }
    };

    if (templateId) {
      fetchTemplate();
    }
  }, [templateId]);

  // Log user activity
  const logActivity = useCallback((type: UserLog['type'], data: any) => {
    const log: UserLog = {
      timestamp: Date.now(),
      type,
      data
    };
    setUserLogs(prev => [...prev, log]);
  }, []);

  // Request permissions and start audio
  const requestPermissions = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true, 
        video: false 
      });
      setAudioStream(stream);
      
      // Start recording
      const recorder = new MediaRecorder(stream);
      setMediaRecorder(recorder);
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.current.push(event.data);
        }
      };
      
      recorder.onstop = () => {
        const blob = new Blob(audioChunks.current, { type: 'audio/webm' });
        setAudioBlob(blob);
      };
      
      recorder.start();
      setIsRecordingState(true);
      setIsRecording(true);
      logActivity('audio-start', {});
      
      setCurrentPhase('tasks');
    } catch (err) {
      console.error('Failed to get permissions:', err);
      // Continue without audio
      setCurrentPhase('tasks');
    }
  };

  // Start task
  const startTask = async (task: TestTask) => {
    setIsTaskActive(true);
    setTaskTimeRemaining(task.duration);
    setExpectedEvent(task.expectedEvent || null);
    setTaskFeedback(null);
    setShowHint(false);
    
    // Generate personalized scenario
    if (template) {
      try {
        const scenario = await generateTaskScenario(
          template.personaTraits,
          task.prompt,
          task.expectedEvent
        );
        setTaskScenario(scenario);
      } catch (error) {
        console.error('Error generating scenario:', error);
        setTaskScenario(task.prompt);
      }
    }
    
    logActivity('task-start', { taskId: task.id, taskPrompt: task.prompt, expectedEvent: task.expectedEvent });
    
    taskTimer.current = setInterval(() => {
      setTaskTimeRemaining(prev => {
        if (prev <= 1) {
          // Time expired without expected event
          setTaskFeedback({
            type: 'timeout',
            message: 'Time expired! The task was not completed successfully.',
            showHint: true
          });
          completeTask(task);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Complete task
  const completeTask = (task: TestTask) => {
    if (taskTimer.current) {
      clearInterval(taskTimer.current);
    }
    
    setIsTaskActive(false);
    setExpectedEvent(null);
    logActivity('task-complete', { taskId: task.id, timeSpent: task.duration - taskTimeRemaining });
    
    // Auto-advance after a brief delay to show feedback
    setTimeout(() => {
      if (currentTaskIndex < template!.tasks.length - 1) {
        setCurrentTaskIndex(prev => prev + 1);
      } else {
        // All tasks complete, move to survey
        setCurrentPhase('survey');
      }
    }, 2000);
  };

  // Handle survey response
  const handleSurveyResponse = (questionId: string, answer: string | number) => {
    setSurveyResponses(prev => {
      const existing = prev.find(r => r.questionId === questionId);
      if (existing) {
        return prev.map(r => r.questionId === questionId ? { ...r, answer } : r);
      } else {
        return [...prev, { questionId, answer }];
      }
    });
  };

  // Handle events from shell components
  const handleShellEvent = (eventName: string, data?: any) => {
    logActivity('event-fired', { eventName, data });
    
    if (expectedEvent && eventName === expectedEvent) {
      // Expected event fired - success!
      setTaskFeedback({
        type: 'success',
        message: 'Great job! Task completed successfully.',
        showHint: false
      });
      
      // Show success toast
      setToast({
        message: 'Task completed successfully!',
        type: 'success',
        isVisible: true
      });
      
      // Complete the task after showing success feedback
      setTimeout(() => {
        completeTask(template!.tasks[currentTaskIndex]);
      }, 1000);
    } else if (expectedEvent && eventName !== expectedEvent) {
      // Wrong event fired - show hint
      setTaskFeedback({
        type: 'error',
        message: 'Not quite right. Try a different approach.',
        showHint: true
      });
    }
  };

  // Generate AI hint
  const handleGenerateHint = async () => {
    if (!template) return;
    
    try {
      const hintResponse = await generateHint({
        personaTraits: template.personaTraits,
        currentTask: {
          prompt: template.tasks[currentTaskIndex].prompt,
          expectedEvent: template.tasks[currentTaskIndex].expectedEvent || ''
        },
        userBehavior: {
          wrongClicks: userLogs.filter(log => log.type === 'click' && log.data.target !== expectedEvent).length,
          timeSpent: taskTimeRemaining,
          attempts: userLogs.filter(log => log.type === 'event-fired').length
        }
      });
      
      setAiHint(hintResponse.hint);
      setShowHint(true);
      setHintIndex(prev => prev + 1);
      
      logActivity('hint-requested', { 
        hint: hintResponse.hint, 
        confidence: hintResponse.confidence,
        reasoning: hintResponse.reasoning 
      });
    } catch (error) {
      console.error('Error generating hint:', error);
      setAiHint("Try looking for the main action button that matches the task description.");
      setShowHint(true);
    }
  };

  // Submit test results
  const submitResults = async () => {
    try {
      // Stop recording
      if (mediaRecorder && isRecording) {
        mediaRecorder.stop();
        setIsRecordingState(false);
        setIsRecording(false);
        logActivity('audio-stop', {});
      }
      
      // Stop audio stream
      if (audioStream) {
        audioStream.getTracks().forEach(track => track.stop());
      }
      
      const runId = `run-${Date.now()}`;
      
      // Create FormData for multipart upload
      const formData = new FormData();
      formData.append('templateId', template!.id);
      formData.append('runId', runId);
      formData.append('personaTraits', JSON.stringify(template!.personaTraits));
      formData.append('logs', JSON.stringify(userLogs));
      formData.append('transcript', transcript);
      formData.append('surveyResponses', JSON.stringify(surveyResponses));
      
      if (audioBlob) {
        formData.append('audio', audioBlob, 'test-audio.webm');
      }
      
      // Submit to backend
      const response = await fetch('/api/tests/runs', {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        setCurrentPhase('complete');
      } else {
        throw new Error('Failed to submit results');
      }
    } catch (err) {
      console.error('Error submitting results:', err);
      setError('Failed to submit test results');
    }
  };

  // Event listeners for logging
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (isTaskActive) {
        logActivity('click', {
          x: e.clientX,
          y: e.clientY,
          target: (e.target as HTMLElement).tagName,
          text: (e.target as HTMLElement).textContent?.slice(0, 50)
        });
      }
    };

    const handleScroll = () => {
      if (isTaskActive) {
        logActivity('scroll', {
          scrollY: window.scrollY,
          scrollX: window.scrollX
        });
      }
    };

    const handleKeypress = (e: KeyboardEvent) => {
      if (isTaskActive) {
        logActivity('keypress', {
          key: e.key,
          target: (e.target as HTMLElement).tagName
        });
      }
    };

    document.addEventListener('click', handleClick);
    document.addEventListener('scroll', handleScroll);
    document.addEventListener('keypress', handleKeypress);

    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('scroll', handleScroll);
      document.removeEventListener('keypress', handleKeypress);
    };
  }, [isTaskActive, logActivity]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading test...</p>
        </div>
      </div>
    );
  }

  if (error || !template) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Error</h2>
          <p className="text-gray-600 mb-6">{error || 'Template not found'}</p>
          <button
            onClick={() => navigate('/create-test')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Back to Templates
          </button>
        </div>
      </div>
    );
  }

  const currentTask = template.tasks[currentTaskIndex];
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderPhase = () => {
    switch (currentPhase) {
      case 'intro':
        return (
          <div className="max-w-2xl mx-auto p-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">{template.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-600">{template.description}</p>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <Clock className="h-4 w-4" />
                  <span>{template.estimatedDuration} minutes</span>
                </div>
                <p className="text-sm text-gray-600">{template.preTestInstructions}</p>
                <Button onClick={() => setCurrentPhase('persona')} className="w-full">
                  Start Test
                </Button>
              </CardContent>
            </Card>
          </div>
        );

      case 'persona':
        return (
          <div className="max-w-2xl mx-auto p-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Meet Your Tester</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-lg">{template.personaTraits.name}</h3>
                  <p className="text-sm text-gray-600">{template.personaTraits.age} years old • {template.personaTraits.occupation}</p>
                  <p className="text-sm text-gray-600 mt-2">{template.personaTraits.experience}</p>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium text-sm">Goals:</h4>
                    <ul className="text-sm text-gray-600 list-disc list-inside">
                      {template.personaTraits.goals.map((goal, i) => (
                        <li key={i}>{goal}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-sm">Pain Points:</h4>
                    <ul className="text-sm text-gray-600 list-disc list-inside">
                      {template.personaTraits.painPoints.map((point, i) => (
                        <li key={i}>{point}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-sm">Preferences:</h4>
                    <ul className="text-sm text-gray-600 list-disc list-inside">
                      {template.personaTraits.preferences.map((pref, i) => (
                        <li key={i}>{pref}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                
                <Button onClick={() => setCurrentPhase('permissions')} className="w-full">
                  Continue
                </Button>
              </CardContent>
            </Card>
          </div>
        );

      case 'permissions':
        return (
          <div className="max-w-2xl mx-auto p-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Setup Your Test Environment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3 p-4 bg-yellow-50 rounded-lg">
                  <Mic className="h-5 w-5 text-yellow-600" />
                  <div>
                    <p className="font-medium">Microphone Access</p>
                    <p className="text-sm text-gray-600">We'll record your voice to capture your thoughts during the test</p>
                  </div>
                </div>
                
                <p className="text-sm text-gray-600">
                  During the test, please think aloud and share your thoughts about the interface. 
                  This helps us understand your experience better.
                </p>
                
                <Button onClick={requestPermissions} className="w-full">
                  Allow Microphone & Start Test
                </Button>
              </CardContent>
            </Card>
          </div>
        );

      case 'tasks':
        return (
          <div className="min-h-screen bg-gray-50">
            <div className="mb-6 p-4 bg-white border-b">
              <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Task {currentTaskIndex + 1} of {template.tasks.length}</h2>
                  <div className="flex items-center space-x-2">
                    {isRecording && <Mic className="h-4 w-4 text-red-500 animate-pulse" />}
                    <span className="text-sm text-gray-500">Recording</span>
                  </div>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg mb-4">
                  <h3 className="font-medium mb-2">{taskScenario || currentTask.prompt}</h3>
                  <p className="text-sm text-gray-600">{currentTask.instructions}</p>
                  {showHint && (
                    <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Lightbulb className="h-4 w-4 text-yellow-600" />
                        <span className="text-sm text-yellow-800">
                          {aiHint || `Hint: ${currentTask.expectedEvent === 'settings.opened' ? 'Look for the gear icon in the top-right corner.' :
                                 currentTask.expectedEvent === 'profile.submitted' ? 'Fill out the profile form and click Save.' :
                                 currentTask.expectedEvent === 'contact.added' ? 'Click the "Add Contact" button to add a new contact.' :
                                 currentTask.expectedEvent === 'search.activated' ? 'Click the search icon to activate the search feature.' :
                                 currentTask.expectedEvent === 'form.submitted' ? 'Complete the form and click Submit.' :
                                 currentTask.expectedEvent === 'survey.completed' ? 'Click "Take Survey" and fill out all the questions.' :
                                 currentTask.expectedEvent === 'rating.submitted' ? 'Click on one of the star ratings to submit your rating.' :
                                 'Try clicking on the relevant interface element.'}`}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Task Feedback */}
                {taskFeedback && (
                  <div className="mb-4">
                    <TaskFeedback
                      type={taskFeedback.type}
                      message={taskFeedback.message}
                      showHint={taskFeedback.showHint}
                      hintText="Need a hint?"
                      onShowHint={handleGenerateHint}
                    />
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {!isTaskActive ? (
                      <Button 
                        onClick={() => startTask(currentTask)} 
                        className="flex items-center space-x-2"
                        disabled={expectedEvent !== null}
                      >
                        <Play className="h-4 w-4" />
                        <span>Start Task</span>
                      </Button>
                    ) : (
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4" />
                          <span className="font-mono">{formatTime(taskTimeRemaining)}</span>
                        </div>
                        <Button 
                          onClick={() => completeTask(currentTask)} 
                          variant="outline"
                          className="flex items-center space-x-2"
                        >
                          <CheckCircle className="h-4 w-4" />
                          <span>Complete Task</span>
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  <div className="text-sm text-gray-500">
                    Task {currentTaskIndex + 1} of {template.tasks.length}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Dynamic Shell Component */}
            <Suspense fallback={
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            }>
              {template.shell && shellMap[template.shell] && React.createElement(shellMap[template.shell], {})}
            </Suspense>
          </div>
        );

      case 'survey':
        return (
          <div className="max-w-2xl mx-auto p-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Post-Test Survey</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {template.postTestQuestions.map((question, index) => (
                  <div key={question.id} className="space-y-3">
                    <label className="block font-medium">
                      {question.question}
                      {question.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    
                    {question.type === 'rating' && (
                      <div className="flex space-x-2">
                        {[1, 2, 3, 4, 5].map(rating => (
                          <button
                            key={rating}
                            onClick={() => handleSurveyResponse(question.id, rating)}
                            className={`px-3 py-1 rounded border ${
                              surveyResponses.find(r => r.questionId === question.id)?.answer === rating
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 hover:bg-gray-200'
                            }`}
                          >
                            {rating}
                          </button>
                        ))}
                      </div>
                    )}
                    
                    {question.type === 'text' && (
                      <textarea
                        onChange={(e) => handleSurveyResponse(question.id, e.target.value)}
                        className="w-full p-2 border rounded"
                        rows={3}
                        placeholder="Enter your response..."
                      />
                    )}
                    
                    {question.type === 'multiple-choice' && question.options && (
                      <div className="space-y-2">
                        {question.options.map(option => (
                          <label key={option} className="flex items-center space-x-2">
                            <input
                              type="radio"
                              name={question.id}
                              value={option}
                              onChange={(e) => handleSurveyResponse(question.id, e.target.value)}
                              className="text-blue-500"
                            />
                            <span>{option}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                
                <Button onClick={submitResults} className="w-full">
                  Submit Results
                </Button>
              </CardContent>
            </Card>
          </div>
        );

      case 'complete':
        return (
          <div className="max-w-2xl mx-auto p-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl text-green-600">Test Complete!</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  <span>Your test results have been submitted successfully</span>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Test Summary</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• {template.tasks.length} tasks completed</li>
                    <li>• {userLogs.length} interactions logged</li>
                    <li>• {surveyResponses.length} survey responses</li>
                    {transcript && <li>• Voice transcript captured</li>}
                    {audioBlob && <li>• Audio recording saved</li>}
                  </ul>
                </div>
                
                <Button onClick={() => navigate('/create-test')} className="w-full">
                  Back to Templates
                </Button>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {renderPhase()}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          isVisible={toast.isVisible}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

const TestRunner: React.FC = () => {
  return (
    <TranscriptProvider>
      <TestRunnerContent />
    </TranscriptProvider>
  );
};

export default TestRunner; 