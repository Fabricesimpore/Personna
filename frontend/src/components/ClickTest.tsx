/**
 * @file ClickTest
 * Interactive click test with comprehensive tracking and heatmap visualization
 */
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { TestTemplate, submitTestResponses } from '../services/api';

interface ClickData {
  x: number;
  y: number;
  timestamp: number;
  target: string;
  taskId: string;
  accuracy: number;
}

interface MousePath {
  x: number;
  y: number;
  timestamp: number;
}

interface TaskData {
  id: string;
  title: string;
  target: string;
  description: string;
  clicks: ClickData[];
  mousePath: MousePath[];
  startTime: number;
  endTime?: number;
  accuracy: number;
}

export default function ClickTest({ template }: { template: TestTemplate }) {
  const [currentTask, setCurrentTask] = useState(0);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showMousePath, setShowMousePath] = useState(false);
  const [userNotes, setUserNotes] = useState('');
  const [isTracking, setIsTracking] = useState(false);
  const [mousePath, setMousePath] = useState<MousePath[]>([]);
  const [taskData, setTaskData] = useState<TaskData[]>([]);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [taskStartTime, setTaskStartTime] = useState(Date.now());

  const tasks = useMemo(() => [
    {
      id: 'click-1',
      title: 'Click on the "Settings" button',
      target: 'Settings',
      description: 'Locate and click the Settings button in the navigation'
    },
    {
      id: 'click-2',
      title: 'Click on the "Profile" section',
      target: 'Profile',
      description: 'Find and click on the Profile navigation item'
    },
    {
      id: 'click-3',
      title: 'Click on the "Add Contact" button',
      target: 'Add Contact',
      description: 'Locate the Add Contact button and click it'
    },
    {
      id: 'click-4',
      title: 'Click on the "Dark Mode" toggle',
      target: 'Dark Mode',
      description: 'Find and click the Dark Mode toggle button'
    }
  ], []);

  // Initialize task data
  useEffect(() => {
    const initialTaskData = tasks.map(task => ({
      id: task.id,
      title: task.title,
      target: task.target,
      description: task.description,
      clicks: [],
      mousePath: [],
      startTime: Date.now(),
      accuracy: 0
    }));
    setTaskData(initialTaskData);
  }, [tasks]);

  // Mouse tracking
  useEffect(() => {
    if (!isTracking) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        setMousePath(prev => [...prev, {
          x,
          y,
          timestamp: Date.now()
        }]);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, [isTracking]);

  const startTask = () => {
    setIsTracking(true);
    setMousePath([]);
    setTaskStartTime(Date.now());
  };

  const handleClick = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const target = e.currentTarget.textContent || 'unknown';
    
    // Calculate accuracy based on target size and click position
    const targetRect = e.currentTarget.getBoundingClientRect();
    const accuracy = Math.max(0, 100 - Math.sqrt(
      Math.pow(x - targetRect.width / 2, 2) + 
      Math.pow(y - targetRect.height / 2, 2)
    ) / 10);
    
    const clickData: ClickData = {
      x,
      y,
      timestamp: Date.now(),
      target,
      taskId: tasks[currentTask].id,
      accuracy: Math.min(100, Math.max(0, accuracy))
    };
    
    // Update task data
    setTaskData(prev => prev.map((task, index) => 
      index === currentTask 
        ? { ...task, clicks: [...task.clicks, clickData] }
        : task
    ));
    
    // Visual feedback
    const element = e.currentTarget as HTMLElement;
    element.style.transform = 'scale(0.95)';
    setTimeout(() => {
      element.style.transform = 'scale(1)';
    }, 150);

    // Check if target matches current task
    if (target === tasks[currentTask].target) {
      completeTask();
    }
  };

  const completeTask = () => {
    const endTime = Date.now();
    
    // Calculate task accuracy
    const currentTaskClicks = taskData[currentTask].clicks;
    const targetClicks = currentTaskClicks.filter(click => click.target === tasks[currentTask].target);
    const accuracy = targetClicks.length > 0 
      ? targetClicks.reduce((sum, click) => sum + click.accuracy, 0) / targetClicks.length
      : 0;

    // Update task data with completion info
    setTaskData(prev => prev.map((task, index) => 
      index === currentTask 
        ? { 
            ...task, 
            endTime,
            mousePath: [...mousePath],
            accuracy
          }
        : task
    ));

    setIsTracking(false);
    
    // Move to next task after delay
    setTimeout(() => {
      if (currentTask < tasks.length - 1) {
        setCurrentTask(currentTask + 1);
        setMousePath([]);
        setTaskStartTime(Date.now());
      }
    }, 2000);
  };

  const handleNextTask = () => {
    if (currentTask < tasks.length - 1) {
      setCurrentTask(currentTask + 1);
      setMousePath([]);
      setTaskStartTime(Date.now());
      setIsTracking(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const personaData = {
        templateId: template.id,
        testType: 'click-test' as const,
        responses: taskData.flatMap(task => task.clicks),
        userNotes,
        averageAccuracy: taskData.reduce((sum, task) => sum + task.accuracy, 0) / taskData.length,
        totalMousePathPoints: taskData.reduce((sum, task) => sum + task.mousePath.length, 0),
        averageTaskTime: taskData.reduce((sum, task) => {
          if (task.endTime) {
            return sum + (task.endTime - task.startTime);
          }
          return sum;
        }, 0) / taskData.length,
        userBehavior: {
          totalClicks: taskData.reduce((sum, task) => sum + task.clicks.length, 0),
          totalMousePathPoints: taskData.reduce((sum, task) => sum + task.mousePath.length, 0)
        }
      };
      
      const result = await submitTestResponses(personaData);
      console.log('Persona insights:', result.insights);
      alert(`Click test completed! Your persona analysis shows you are a ${result.insights.userType} with ${result.insights.skillLevel} skill level.`);
    } catch (error) {
      console.error('Error submitting test responses:', error);
      alert('Error submitting test responses. Please try again.');
    }
  };

  const renderHeatmap = () => {
    if (!showHeatmap) return null;
    
    const allClicks = taskData.flatMap(task => task.clicks);
    
    return (
      <div className="absolute inset-0 pointer-events-none">
        {allClicks.map((click, index) => (
          <div
            key={index}
            className="absolute w-4 h-4 bg-red-500 rounded-full opacity-70 animate-pulse"
            style={{
              left: click.x - 8,
              top: click.y - 8,
              zIndex: index,
              opacity: click.accuracy / 100
            }}
          />
        ))}
      </div>
    );
  };

  const renderMousePath = () => {
    if (!showMousePath || mousePath.length === 0) return null;
    
    return (
      <svg className="absolute inset-0 pointer-events-none" style={{ zIndex: 10 }}>
        <polyline
          points={mousePath.map(point => `${point.x},${point.y}`).join(' ')}
          fill="none"
          stroke="blue"
          strokeWidth="2"
          opacity="0.6"
        />
      </svg>
    );
  };

  const currentTaskData = taskData[currentTask] || { clicks: [], accuracy: 0 };

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

        {/* Task Progress */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Task {currentTask + 1} of {tasks.length}</span>
            <div className="flex space-x-4 text-sm text-gray-600">
              <span>Clicks: {currentTaskData.clicks.length}</span>
              <span>Accuracy: {Math.round(currentTaskData.accuracy)}%</span>
              <span>Time: {Math.round((Date.now() - taskStartTime) / 1000)}s</span>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentTask + 1) / tasks.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Current Task */}
        <div className="mb-6 p-4 bg-yellow-50 rounded-lg">
          <h3 className="font-semibold mb-2">Current Task:</h3>
          <p className="text-lg">{tasks[currentTask].title}</p>
          <p className="text-sm text-gray-600 mt-1">{tasks[currentTask].description}</p>
          {!isTracking && (
            <button
              onClick={startTask}
              className="mt-3 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Start Task
            </button>
          )}
        </div>

        {/* Interactive Interface */}
        <div className="mb-6 relative">
          <div 
            ref={canvasRef}
            className="border-2 border-gray-300 rounded-lg p-6 bg-gray-50 min-h-[400px] relative"
          >
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold">Demo Application</h3>
                <div className="space-x-2">
                  <button 
                    onClick={handleClick}
                    className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition-transform"
                  >
                    Home
                  </button>
                  <button 
                    onClick={handleClick}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-transform"
                  >
                    Settings
                  </button>
                  <button 
                    onClick={handleClick}
                    className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition-transform"
                  >
                    Profile
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="p-4 bg-white border rounded-lg">
                    <h4 className="font-medium mb-2">Contacts</h4>
                    <button 
                      onClick={handleClick}
                      className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 transition-transform"
                    >
                      Add Contact
                    </button>
                  </div>
                  <div className="p-4 bg-white border rounded-lg">
                    <h4 className="font-medium mb-2">Settings</h4>
                    <div className="space-y-2">
                      <button 
                        onClick={handleClick}
                        className="block w-full text-left px-2 py-1 hover:bg-gray-100 rounded"
                      >
                        Theme Settings
                      </button>
                      <button 
                        onClick={handleClick}
                        className="block w-full text-left px-2 py-1 hover:bg-gray-100 rounded"
                      >
                        Privacy Settings
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="p-4 bg-white border rounded-lg">
                    <h4 className="font-medium mb-2">Theme</h4>
                    <button 
                      onClick={handleClick}
                      className="px-3 py-1 bg-purple-500 text-white rounded text-sm hover:bg-purple-600 transition-transform"
                    >
                      Dark Mode
                    </button>
                  </div>
                  <div className="p-4 bg-white border rounded-lg">
                    <h4 className="font-medium mb-2">Notifications</h4>
                    <button 
                      onClick={handleClick}
                      className="px-3 py-1 bg-orange-500 text-white rounded text-sm hover:bg-orange-600 transition-transform"
                    >
                      Enable Notifications
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Heatmap Overlay */}
            {renderHeatmap()}
            
            {/* Mouse Path Overlay */}
            {renderMousePath()}
          </div>
        </div>

        {/* Controls */}
        <div className="mb-6 flex space-x-4">
          <button
            onClick={() => setShowHeatmap(!showHeatmap)}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            {showHeatmap ? 'Hide' : 'Show'} Heatmap
          </button>
          
          <button
            onClick={() => setShowMousePath(!showMousePath)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            {showMousePath ? 'Hide' : 'Show'} Mouse Path
          </button>
          
          <button
            onClick={handleNextTask}
            disabled={currentTask >= tasks.length - 1}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            Next Task
          </button>
        </div>

        {/* Task Statistics */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium mb-2">Current Task Statistics:</h4>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Total Clicks:</span>
              <span className="ml-2 font-medium">{currentTaskData.clicks.length}</span>
            </div>
            <div>
              <span className="text-gray-600">Accuracy:</span>
              <span className="ml-2 font-medium">{Math.round(currentTaskData.accuracy)}%</span>
            </div>
            <div>
              <span className="text-gray-600">Mouse Path Points:</span>
              <span className="ml-2 font-medium">{mousePath.length}</span>
            </div>
          </div>
        </div>

        {/* User Notes */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">
            Your observations about the interface:
          </label>
          <textarea
            className="w-full p-3 border rounded-lg"
            rows={3}
            placeholder="Describe your experience, any confusion, or suggestions..."
            value={userNotes}
            onChange={(e) => setUserNotes(e.target.value)}
          />
        </div>

        {/* Submit Button */}
        {currentTask === tasks.length - 1 && (
          <button
            onClick={handleSubmit}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Submit Test
          </button>
        )}
      </div>
    </div>
  );
} 