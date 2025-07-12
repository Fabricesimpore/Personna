/**
 * @file BasicUsabilityTest
 * Interactive usability test with simulated interface and comprehensive response collection
 */
import React, { useState, useEffect } from 'react';
import { TestTemplate, submitTestResponses } from '../services/api';

interface TaskResponse {
  taskId: string;
  completed: boolean;
  timeSpent: number;
  difficulty: number;
  errors: number;
  attempts: number;
  notes: string;
  userBehavior: {
    hoverTime: number;
    clicks: number;
    scrolls: number;
    pauses: number;
  };
}

interface UserBehavior {
  hoverTime: number;
  clicks: number;
  scrolls: number;
  pauses: number;
  lastActivity: number;
}

export default function BasicUsabilityTest({ template }: { template: TestTemplate }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState<TaskResponse[]>([]);
  const [currentTask, setCurrentTask] = useState({
    id: 'task-1',
    title: 'Find and click the "Settings" button',
    description: 'Navigate through the interface to locate the settings option'
  });
  const [taskStartTime, setTaskStartTime] = useState(Date.now());
  const [userNotes, setUserNotes] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [difficulty, setDifficulty] = useState(3);
  const [errors, setErrors] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [userBehavior, setUserBehavior] = useState<UserBehavior>({
    hoverTime: 0,
    clicks: 0,
    scrolls: 0,
    pauses: 0,
    lastActivity: Date.now()
  });
  const [showHint, setShowHint] = useState(false);

  const tasks = [
    {
      id: 'task-1',
      title: 'Find and click the "Settings" button',
      description: 'Navigate through the interface to locate the settings option',
      target: 'Settings',
      hints: ['Look in the top navigation bar', 'It\'s usually in the top-right corner']
    },
    {
      id: 'task-2', 
      title: 'Change the theme to "Dark Mode"',
      description: 'Locate the theme settings and switch to dark mode',
      target: 'Dark Mode',
      hints: ['Check the Settings menu', 'Look for appearance or theme options']
    },
    {
      id: 'task-3',
      title: 'Add a new contact to your list',
      description: 'Find the add contact feature and create a new entry',
      target: 'Add Contact',
      hints: ['Look for a "+" button', 'Check the Contacts section']
    }
  ];

  // Track user activity
  useEffect(() => {
    const handleActivity = () => {
      const now = Date.now();
      const timeSinceLastActivity = now - userBehavior.lastActivity;
      
      if (timeSinceLastActivity > 3000) { // 3 seconds of inactivity
        setUserBehavior(prev => ({
          ...prev,
          pauses: prev.pauses + 1
        }));
      }
      
      setUserBehavior(prev => ({
        ...prev,
        lastActivity: now
      }));
    };

    const handleScroll = () => {
      setUserBehavior(prev => ({
        ...prev,
        scrolls: prev.scrolls + 1
      }));
    };

    document.addEventListener('mousemove', handleActivity);
    document.addEventListener('click', handleActivity);
    document.addEventListener('keydown', handleActivity);
    document.addEventListener('scroll', handleScroll);

    return () => {
      document.removeEventListener('mousemove', handleActivity);
      document.removeEventListener('click', handleActivity);
      document.removeEventListener('keydown', handleActivity);
      document.removeEventListener('scroll', handleScroll);
    };
  }, [userBehavior.lastActivity]);

  const handleElementClick = (elementName: string) => {
    setUserBehavior(prev => ({
      ...prev,
      clicks: prev.clicks + 1
    }));

    setAttempts(prev => prev + 1);

    if (elementName === tasks[currentStep].target) {
      handleTaskComplete();
    } else {
      setErrors(prev => prev + 1);
      // Show error feedback
      const element = document.querySelector(`[data-element="${elementName}"]`) as HTMLElement;
      if (element) {
        element.style.backgroundColor = '#fee2e2';
        setTimeout(() => {
          element.style.backgroundColor = '';
        }, 1000);
      }
    }
  };

  const handleElementHover = (elementName: string) => {
    setUserBehavior(prev => ({
      ...prev,
      hoverTime: prev.hoverTime + 100
    }));
  };

  const handleTaskComplete = () => {
    const timeSpent = Math.round((Date.now() - taskStartTime) / 1000);
    const newResponse: TaskResponse = {
      taskId: currentTask.id,
      completed: true,
      timeSpent,
      difficulty,
      errors,
      attempts,
      notes: userNotes,
      userBehavior: {
        hoverTime: userBehavior.hoverTime,
        clicks: userBehavior.clicks,
        scrolls: userBehavior.scrolls,
        pauses: userBehavior.pauses
      }
    };
    
    setResponses([...responses, newResponse]);
    setUserNotes('');
    setShowSuccess(true);
    setDifficulty(3);
    setErrors(0);
    setAttempts(0);
    setUserBehavior({
      hoverTime: 0,
      clicks: 0,
      scrolls: 0,
      pauses: 0,
      lastActivity: Date.now()
    });
    
    setTimeout(() => {
      setShowSuccess(false);
      if (currentStep < tasks.length - 1) {
        setCurrentStep(currentStep + 1);
        setCurrentTask(tasks[currentStep + 1]);
        setTaskStartTime(Date.now());
      }
    }, 2000);
  };

  const handleSubmit = async () => {
    try {
      const personaData = {
        templateId: template.id,
        testType: 'basic-usability' as const,
        responses,
        userNotes,
        totalTime: responses.reduce((sum, r) => sum + r.timeSpent, 0),
        completionRate: responses.filter(r => r.completed).length / tasks.length,
        averageDifficulty: responses.reduce((sum, r) => sum + r.difficulty, 0) / responses.length,
        totalErrors: responses.reduce((sum, r) => sum + r.errors, 0),
        totalAttempts: responses.reduce((sum, r) => sum + r.attempts, 0),
        userBehavior: {
          totalHoverTime: responses.reduce((sum, r) => sum + r.userBehavior.hoverTime, 0),
          totalClicks: responses.reduce((sum, r) => sum + r.userBehavior.clicks, 0),
          totalScrolls: responses.reduce((sum, r) => sum + r.userBehavior.scrolls, 0),
          totalPauses: responses.reduce((sum, r) => sum + r.userBehavior.pauses, 0)
        }
      };
      
      const result = await submitTestResponses(personaData);
      console.log('Persona insights:', result.insights);
      alert(`Test completed! Your persona analysis shows you are a ${result.insights.userType} with ${result.insights.behaviorPattern} behavior patterns.`);
    } catch (error) {
      console.error('Error submitting test responses:', error);
      alert('Error submitting test responses. Please try again.');
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4">{template.name}</h2>
        
        {/* Instructions */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold mb-2">Test Instructions:</h3>
          <ol className="list-decimal list-inside space-y-1">
            {template.flowDefinition.map((step: string, i: number) => (
              <li key={i} className="text-sm">{step}</li>
            ))}
          </ol>
        </div>

        {/* Interactive Interface */}
        <div className="mb-6 border-2 border-gray-300 rounded-lg p-4 bg-gray-50">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Demo Application</h3>
              <div className="space-x-2">
                <button 
                  data-element="Home"
                  onClick={() => handleElementClick('Home')}
                  onMouseEnter={() => handleElementHover('Home')}
                  className="px-3 py-1 bg-gray-200 rounded text-sm hover:bg-gray-300 transition-colors"
                >
                  Home
                </button>
                <button 
                  data-element="Settings"
                  onClick={() => handleElementClick('Settings')}
                  onMouseEnter={() => handleElementHover('Settings')}
                  className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors"
                >
                  Settings
                </button>
                <button 
                  data-element="Profile"
                  onClick={() => handleElementClick('Profile')}
                  onMouseEnter={() => handleElementHover('Profile')}
                  className="px-3 py-1 bg-gray-200 rounded text-sm hover:bg-gray-300 transition-colors"
                >
                  Profile
                </button>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="p-3 bg-gray-100 rounded">
                <h4 className="font-medium">Current Task: {currentTask.title}</h4>
                <p className="text-sm text-gray-600">{currentTask.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-white border rounded">
                  <h5 className="font-medium">Contacts</h5>
                  <p className="text-sm text-gray-600">Manage your contacts</p>
                  <button 
                    data-element="Add Contact"
                    onClick={() => handleElementClick('Add Contact')}
                    onMouseEnter={() => handleElementHover('Add Contact')}
                    className="mt-2 px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 transition-colors"
                  >
                    Add Contact
                  </button>
                </div>
                <div className="p-3 bg-white border rounded">
                  <h5 className="font-medium">Settings</h5>
                  <p className="text-sm text-gray-600">App preferences</p>
                  <div className="mt-2 space-y-1">
                    <button 
                      data-element="Theme Settings"
                      onClick={() => handleElementClick('Theme Settings')}
                      onMouseEnter={() => handleElementHover('Theme Settings')}
                      className="block w-full text-left px-2 py-1 hover:bg-gray-100 rounded text-sm"
                    >
                      Theme Settings
                    </button>
                    <button 
                      data-element="Dark Mode"
                      onClick={() => handleElementClick('Dark Mode')}
                      onMouseEnter={() => handleElementHover('Dark Mode')}
                      className="block w-full text-left px-2 py-1 hover:bg-gray-100 rounded text-sm"
                    >
                      Dark Mode
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Task Progress and Stats */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Task {currentStep + 1} of {tasks.length}</span>
            <div className="flex space-x-4 text-sm text-gray-600">
              <span>Time: {Math.round((Date.now() - taskStartTime) / 1000)}s</span>
              <span>Attempts: {attempts}</span>
              <span>Errors: {errors}</span>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / tasks.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Difficulty Rating */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">
            How difficult is this task? (1 = Easy, 5 = Very Hard)
          </label>
          <div className="flex space-x-2">
            {[1, 2, 3, 4, 5].map((level) => (
              <button
                key={level}
                onClick={() => setDifficulty(level)}
                className={`w-10 h-10 rounded-full border-2 transition-colors ${
                  difficulty === level 
                    ? 'bg-blue-500 text-white border-blue-500' 
                    : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        {/* Hint System */}
        <div className="mb-6">
          <button
            onClick={() => setShowHint(!showHint)}
            className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
          >
            {showHint ? 'Hide' : 'Show'} Hint
          </button>
          {showHint && (
            <div className="mt-2 p-3 bg-yellow-50 rounded-lg">
              <p className="text-sm text-yellow-800">
                💡 {tasks[currentStep].hints[0]}
              </p>
            </div>
          )}
        </div>

        {/* User Notes */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">
            Your thoughts during this task:
          </label>
          <textarea
            className="w-full p-3 border rounded-lg"
            rows={3}
            placeholder="Describe what you're thinking, any confusion, or observations..."
            value={userNotes}
            onChange={(e) => setUserNotes(e.target.value)}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-4">
          <button
            onClick={handleTaskComplete}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Complete Task
          </button>
          
          {currentStep === tasks.length - 1 && (
            <button
              onClick={handleSubmit}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Submit Test
            </button>
          )}
        </div>

        {/* Success Message */}
        {showSuccess && (
          <div className="mt-4 p-3 bg-green-100 text-green-800 rounded-lg">
            ✓ Task completed! Moving to next task...
          </div>
        )}
      </div>
    </div>
  );
} 