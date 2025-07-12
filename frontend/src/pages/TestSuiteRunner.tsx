/**
 * TestSuiteRunner.tsx
 * Comprehensive suite runner with sequential shell execution, progress tracking, and localStorage persistence
 */
import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Clock, Play, CheckCircle, SkipForward, RotateCcw } from 'lucide-react';
import TaskFeedback from '../components/TaskFeedback';
import Toast from '../components/Toast';
import ThinkAloudRecorder from '../components/ThinkAloudRecorder';
import { TranscriptProvider, useTranscript } from '../contexts/TranscriptContext';
import testSuites from '../data/testSuites.json';

// Shell component props interface
interface ShellComponentProps {
  onTaskComplete?: (taskId: string) => void;
  onComplete?: () => void;
}

// Dynamic shell imports
const SpotOnClickShell = React.lazy(() => import('../shells/SpotOnClickShell'));
const SprintRecallShell = React.lazy(() => import('../shells/SprintRecallShell'));
const DeepDiveShell = React.lazy(() => import('../shells/DeepDiveShell'));

// Shell component map
const shellMap: Record<string, React.LazyExoticComponent<React.ComponentType<ShellComponentProps>>> = {
  'SpotOnClickShell': SpotOnClickShell,
  'SprintRecallShell': SprintRecallShell,
  'DeepDiveShell': DeepDiveShell
};

interface SuiteEvent {
  name: string;
  timestamp: number;
  stage: number;
  shell: string;
  data?: any;
}

interface SuiteProgress {
  suiteId: string;
  currentStage: number;
  completedStages: number[];
  events: SuiteEvent[];
  transcript: string;
  surveyResponses: any[];
  startTime: number;
}

interface RunState {
  runId: string;
  suiteId: string;
  currentStageIndex: number;
  currentTaskIndex: number;
  events: SuiteEvent[];
  transcriptSoFar: string;
  surveyResponsesSoFar: any[];
  startTime: number;
  createdAt: string;
  finalized?: boolean;
}

const TestSuiteRunnerContent: React.FC = () => {
  const { suiteId } = useParams<{ suiteId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { transcript, updateTranscript, setIsRecording } = useTranscript();
  
  // Get runId from URL params
  const runId = searchParams.get('runId');
  
  // Suite state
  const [suite, setSuite] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Progress state
  const [currentStage, setCurrentStage] = useState(0);
  const [completedStages, setCompletedStages] = useState<number[]>([]);
  const [suiteEvents, setSuiteEvents] = useState<SuiteEvent[]>([]);
  const [surveyResponses, setSurveyResponses] = useState<any[]>([]);
  const [startTime, setStartTime] = useState<number>(0);
  
  // Current shell state
  const [currentShell, setCurrentShell] = useState<string>('');
  const [isShellActive, setIsShellActive] = useState(false);
  const [shellFeedback, setShellFeedback] = useState<{
    type: 'success' | 'error' | 'hint' | 'timeout';
    message: string;
    showHint?: boolean;
  } | null>(null);
  
  // Audio state
  const [isRecording, setIsRecordingState] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  
  // Refs
  const audioChunks = useRef<Blob[]>([]);

  // Load suite and restore progress
  useEffect(() => {
    const loadSuiteAndState = async () => {
      try {
        const foundSuite = testSuites.suites.find(s => s.id === suiteId);
        if (!foundSuite) {
          setError('Suite not found');
          return;
        }
        
        setSuite(foundSuite);
        
        // If we have a runId, try to fetch the run state
        if (runId) {
          await loadRunState(runId);
        } else {
          // No runId, start fresh
          setStartTime(Date.now());
        }
      } catch (err) {
        setError('Failed to load suite');
        console.error('Error loading suite:', err);
      } finally {
        setLoading(false);
      }
    };

    if (suiteId) {
      loadSuiteAndState();
    }
  }, [suiteId, runId]);

  // Load run state from API or localStorage
  const loadRunState = async (runId: string) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No auth token');
      }

      const response = await fetch(`http://localhost:3001/api/tests/runs/${runId}/state`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          hydrateState(data.data);
        } else {
          throw new Error('Invalid run state data');
        }
      } else {
        // API failed, try localStorage fallback
        const savedRun = localStorage.getItem('currentRunState');
        if (savedRun) {
          const runData = JSON.parse(savedRun);
          if (runData.runId === runId) {
            hydrateState(runData);
          } else {
            throw new Error('Run state not found');
          }
        } else {
          throw new Error('Run state not found');
        }
      }
    } catch (error) {
      console.error('Error loading run state:', error);
      // Start fresh if we can't load the state
      setStartTime(Date.now());
    }
  };

  // Hydrate state from run data
  const hydrateState = (runData: RunState) => {
    setCurrentStage(runData.currentStageIndex);
    setSuiteEvents(runData.events || []);
    setSurveyResponses(runData.surveyResponsesSoFar || []);
    setStartTime(runData.startTime);
    updateTranscript(runData.transcriptSoFar || '');
    
    // Calculate completed stages
    const completed = [];
    for (let i = 0; i < runData.currentStageIndex; i++) {
      completed.push(i);
    }
    setCompletedStages(completed);
    
    // Set current shell
    if (runData.currentStageIndex < suite.shellSequence.length) {
      setCurrentShell(suite.shellSequence[runData.currentStageIndex]);
    }
  };

  // Save progress to localStorage
  const saveProgress = useCallback(() => {
    if (!suiteId) return;
    
    const progress: SuiteProgress = {
      suiteId,
      currentStage,
      completedStages,
      events: suiteEvents,
      transcript,
      surveyResponses,
      startTime
    };
    
    localStorage.setItem(`suite-progress-${suiteId}`, JSON.stringify(progress));
    
    // Also save to currentRunState for cross-tab persistence
    const currentRunState = {
      runId: runId || `run_${Date.now()}`,
      suiteId,
      currentStageIndex: currentStage,
      currentTaskIndex: 0, // TODO: implement task-level tracking
      events: suiteEvents,
      transcriptSoFar: transcript,
      surveyResponsesSoFar: surveyResponses,
      startTime,
      createdAt: new Date().toISOString()
    };
    
    localStorage.setItem('currentRunState', JSON.stringify(currentRunState));
  }, [suiteId, currentStage, completedStages, suiteEvents, transcript, surveyResponses, startTime, runId]);

  // Save progress whenever relevant state changes
  useEffect(() => {
    saveProgress();
  }, [saveProgress]);

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
      
      startNextStage();
    } catch (err) {
      console.error('Failed to get permissions:', err);
      // Continue without audio
      startNextStage();
    }
  };

  // Start next stage
  const startNextStage = () => {
    if (!suite || currentStage >= suite.shellSequence.length) {
      completeSuite();
      return;
    }

    const shellName = suite.shellSequence[currentStage];
    setCurrentShell(shellName);
    setIsShellActive(true);
    setShellFeedback(null);
    
    // Log stage start
    const stageEvent: SuiteEvent = {
      name: 'stage.start',
      timestamp: Date.now(),
      stage: currentStage + 1,
      shell: shellName
    };
    setSuiteEvents(prev => [...prev, stageEvent]);
  };

  // Complete current stage
  const completeStage = () => {
    if (!suite) return;
    
    setIsShellActive(false);
    setCompletedStages(prev => [...prev, currentStage]);
    
    // Log stage completion
    const stageEvent: SuiteEvent = {
      name: 'stage.complete',
      timestamp: Date.now(),
      stage: currentStage + 1,
      shell: suite.shellSequence[currentStage]
    };
    setSuiteEvents(prev => [...prev, stageEvent]);
    
    // Move to next stage
    setCurrentStage(prev => prev + 1);
    
    // Start next stage after a short delay
    setTimeout(() => {
      startNextStage();
    }, 1000);
  };

  // Retry current stage
  const retryStage = () => {
    if (!suite) return;
    
    setIsShellActive(false);
    setShellFeedback(null);
    
    // Log stage retry
    const stageEvent: SuiteEvent = {
      name: 'stage.retry',
      timestamp: Date.now(),
      stage: currentStage + 1,
      shell: suite.shellSequence[currentStage]
    };
    setSuiteEvents(prev => [...prev, stageEvent]);
    
    // Restart current stage
    setTimeout(() => {
      setIsShellActive(true);
    }, 500);
  };

  // Skip current stage
  const skipStage = () => {
    if (!suite) return;
    
    setIsShellActive(false);
    
    // Log stage skip
    const stageEvent: SuiteEvent = {
      name: 'stage.skipped',
      timestamp: Date.now(),
      stage: currentStage + 1,
      shell: suite.shellSequence[currentStage]
    };
    setSuiteEvents(prev => [...prev, stageEvent]);
    
    // Move to next stage
    setCurrentStage(prev => prev + 1);
    
    // Start next stage after a short delay
    setTimeout(() => {
      startNextStage();
    }, 1000);
  };

  // Complete the entire suite
  const completeSuite = () => {
    setIsShellActive(false);
    
    // Log suite completion
    const suiteEvent: SuiteEvent = {
      name: 'suite.complete',
      timestamp: Date.now(),
      stage: suite.shellSequence.length,
      shell: 'complete'
    };
    setSuiteEvents(prev => [...prev, suiteEvent]);
    
    // Submit results
    submitResults();
  };

  // Submit results
  const submitResults = async () => {
    try {
      // Stop recording if active
      if (mediaRecorder && isRecording) {
        mediaRecorder.stop();
        mediaRecorder.stream.getTracks().forEach(track => track.stop());
      }
      
      // Prepare form data
      const formData = new FormData();
      formData.append('suiteId', suiteId || '');
      formData.append('data', JSON.stringify({
        events: suiteEvents,
        surveyResponses,
        transcript,
        startTime,
        endTime: Date.now(),
        completedStages
      }));
      
      if (audioBlob) {
        formData.append('audio', audioBlob, 'suite-audio.webm');
      }
      
      // Submit to backend
      const response = await fetch('http://localhost:3001/api/tests/runs', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit results');
      }
      
      // Clear localStorage
      localStorage.removeItem(`suite-progress-${suiteId}`);
      localStorage.removeItem('currentRunState');
      
      // Navigate to completion page
      navigate('/complete', { 
        state: { 
          suiteId, 
          success: true,
          totalStages: suite.shellSequence.length,
          completedStages: completedStages.length
        }
      });
      
    } catch (error) {
      console.error('Error submitting results:', error);
      setError('Failed to submit results. Please try again.');
    }
  };

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate elapsed time
  const elapsedTime = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading suite...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-red-500 text-6xl mb-4">⚠️</div>
              <h2 className="text-xl font-bold mb-2">Error</h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={() => navigate('/')}>Go Back</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!suite) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-red-500 text-6xl mb-4">❌</div>
              <h2 className="text-xl font-bold mb-2">Suite Not Found</h2>
              <p className="text-gray-600 mb-4">The requested suite could not be found.</p>
              <Button onClick={() => navigate('/')}>Go Back</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render current phase
  const renderPhase = () => {
    if (currentStage === 0 && !isShellActive) {
      // Intro phase
      return (
        <div className="max-w-4xl mx-auto p-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl font-bold text-center">
                {runId ? 'Resume Persona Creation' : suite.name}
              </CardTitle>
              <p className="text-gray-600 text-center text-lg">
                {runId ? 'Continue where you left off' : suite.description}
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {runId && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">🔄 Resuming Progress</h3>
                  <p className="text-sm text-green-800">
                    You have {suiteEvents.length} events and {surveyResponses.length} survey responses saved.
                  </p>
                </div>
              )}
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">📋 What to Expect</h3>
                <p className="text-sm text-blue-800">
                  This comprehensive research session includes {suite.shellSequence.length} sequential phases:
                </p>
                <ul className="mt-2 text-sm text-blue-800 space-y-1">
                  {suite.shellSequence.map((shell: string, index: number) => (
                    <li key={shell} className="flex items-center">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs mr-2 ${
                        completedStages.includes(index) 
                          ? 'bg-green-500 text-white' 
                          : index === currentStage 
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-300 text-gray-600'
                      }`}>
                        {index + 1}
                      </span>
                      {shell.replace('Shell', '')}
                      {completedStages.includes(index) && ' ✓'}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">⏱️ Estimated Duration</h3>
                <p className="text-sm text-green-800">
                  Approximately {suite.estimatedDuration} minutes
                </p>
              </div>
              
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">🎤 Think Aloud</h3>
                <p className="text-sm text-yellow-800">
                  Please share your thoughts and reactions throughout the session. 
                  Your verbal feedback is as valuable as your actions.
                </p>
              </div>
              
              <Button 
                onClick={requestPermissions}
                className="w-full text-lg py-3"
                size="lg"
              >
                <Play className="mr-2 h-5 w-5" />
                {runId ? 'Resume Full Persona Run' : 'Start Full Persona Run'}
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    if (currentStage >= suite.shellSequence.length) {
      // Completion phase
      return (
        <div className="max-w-4xl mx-auto p-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl font-bold text-center text-green-600">
                All Done! Saving Results...
              </CardTitle>
              <p className="text-gray-600 text-center">
                Thank you for completing the full persona research session.
              </p>
            </CardHeader>
            <CardContent className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Processing your responses...</p>
            </CardContent>
          </Card>
        </div>
      );
    }

    // Active shell phase
    const ShellComponent = shellMap[currentShell] as React.LazyExoticComponent<React.ComponentType<ShellComponentProps>>;
    if (!ShellComponent) {
      return (
        <div className="text-center py-12">
          <p className="text-red-500">Shell component not found: {currentShell}</p>
        </div>
      );
    }

    return (
      <div className="max-w-6xl mx-auto p-6">
        {/* Progress Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold">
                Stage {currentStage + 1} of {suite.shellSequence.length}: {currentShell.replace('Shell', '')}
              </h1>
              <p className="text-gray-600">
                {suite.shellSequence[currentStage].replace('Shell', '')} Phase
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-gray-500" />
                <span className="text-sm text-gray-600">{formatTime(elapsedTime)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-sm text-gray-600">{completedStages.length} completed</span>
              </div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStage + 1) / suite.shellSequence.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Shell Component */}
        <Suspense fallback={
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading {currentShell}...</p>
          </div>
        }>
          <ShellComponent 
            onTaskComplete={(taskId: string) => {
              const event: SuiteEvent = {
                name: `task.complete.${taskId}`,
                timestamp: Date.now(),
                stage: currentStage + 1,
                shell: currentShell
              };
              setSuiteEvents(prev => [...prev, event]);
            }}
            onComplete={() => {
              completeStage();
            }}
          />
        </Suspense>

        {/* Stage Controls */}
        <div className="mt-6 flex justify-center space-x-4">
          <Button
            onClick={retryStage}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Retry Stage</span>
          </Button>
          <Button
            onClick={skipStage}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <SkipForward className="h-4 w-4" />
            <span>Skip Stage</span>
          </Button>
        </div>

        {/* Shell Feedback */}
        {shellFeedback && (
          <div className="mt-4">
            <TaskFeedback 
              type={shellFeedback.type}
              message={shellFeedback.message}
              showHint={shellFeedback.showHint}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Think Aloud Recorder */}
      <ThinkAloudRecorder
        onTranscriptUpdate={updateTranscript}
        onRecordingStateChange={setIsRecordingState}
      />
      
      {/* Main Content */}
      {renderPhase()}
      
      {/* Toast Notifications */}
      {error && (
        <Toast
          message={error}
          type="error"
          isVisible={true}
          onClose={() => setError(null)}
        />
      )}
    </div>
  );
};

const TestSuiteRunner: React.FC = () => {
  return (
    <TranscriptProvider>
      <TestSuiteRunnerContent />
    </TranscriptProvider>
  );
};

export default TestSuiteRunner; 