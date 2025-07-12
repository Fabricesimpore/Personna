import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import eventBus from '../lib/eventBus';
import { useTranscript } from '../contexts/TranscriptContext';

interface DeepDiveShellProps {
  onTaskComplete?: (taskId: string) => void;
  onComplete?: () => void;
}

type TaskPhase = 'explore' | 'profile' | 'feedback';

const DeepDiveShell: React.FC<DeepDiveShellProps> = ({ 
  onTaskComplete, 
  onComplete 
}) => {
  const [currentPhase, setCurrentPhase] = useState<TaskPhase>('explore');
  const [exploreTimeRemaining, setExploreTimeRemaining] = useState(60);
  const [isExploring, setIsExploring] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [profileUpdated, setProfileUpdated] = useState(false);
  const [workflowRating, setWorkflowRating] = useState(0);
  const [improvementSuggestion, setImprovementSuggestion] = useState('');

  const { transcript } = useTranscript();

  useEffect(() => {
    if (currentPhase === 'explore') {
      setIsExploring(true);
      setExploreTimeRemaining(60);
      
      const timer = setInterval(() => {
        setExploreTimeRemaining(prev => {
          if (prev <= 1) {
            setIsExploring(false);
            eventBus.emit('explore.completed', { timestamp: Date.now() });
            onTaskComplete?.('exploreThinkAloud');
            setCurrentPhase('profile');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [currentPhase, onTaskComplete]);

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleProfileUpdate = () => {
    setProfileUpdated(true);
    eventBus.emit('profile.updated', { timestamp: Date.now() });
    onTaskComplete?.('updateProfile');
    setCurrentPhase('feedback');
  };

  const handleFeedbackSubmit = () => {
    eventBus.emit('feedback.submitted', { 
      rating: workflowRating, 
      suggestion: improvementSuggestion, 
      timestamp: Date.now() 
    });
    onTaskComplete?.('flowFeedback');
    onComplete?.();
  };

  const renderExplorePhase = () => (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Workflow Deep-Dive Review
          </CardTitle>
          <p className="text-gray-600 text-center">
            You have 60 seconds to explore our new dashboard—think aloud what you expect each part to do
          </p>
        </CardHeader>
        <CardContent>
          {isExploring ? (
            <div className="bg-white border rounded-lg p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">User Dashboard</h2>
                <div className="flex space-x-4">
                  <button className="text-blue-600 hover:text-blue-800">Dashboard</button>
                  <button className="text-blue-600 hover:text-blue-800">Projects</button>
                  <button className="text-blue-600 hover:text-blue-800">Account</button>
                  <button className="text-blue-600 hover:text-blue-800">Settings</button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium mb-2">📈 My Projects</h3>
                  <div className="space-y-2">
                    <div className="bg-white p-2 rounded border">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Project Alpha</span>
                        <span className="text-green-600 text-sm">Active</span>
                      </div>
                      <div className="text-xs text-gray-500">Last updated: 2 hours ago</div>
                    </div>
                    <div className="bg-white p-2 rounded border">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Project Beta</span>
                        <span className="text-yellow-600 text-sm">Pending</span>
                      </div>
                      <div className="text-xs text-gray-500">Last updated: 1 day ago</div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium mb-2">⚡ Quick Actions</h3>
                  <div className="space-y-2">
                    <button className="w-full bg-blue-500 text-white px-3 py-2 rounded text-sm">
                      Create New Project
                    </button>
                    <button className="w-full bg-green-500 text-white px-3 py-2 rounded text-sm">
                      Import Data
                    </button>
                    <button className="w-full bg-purple-500 text-white px-3 py-2 rounded text-sm">
                      Generate Report
                    </button>
                  </div>
                </div>
                
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium mb-2">👤 Account Info</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-gray-300 rounded-full mr-2"></div>
                      <div>
                        <div className="font-medium">John Doe</div>
                        <div className="text-gray-500">john@example.com</div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-600">
                      Member since: January 2024
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 bg-gray-50 p-4 rounded">
                <h3 className="font-medium mb-2">Recent Activity</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    <span>Project Alpha updated</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                    <span>New team member added</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                    <span>Report generated</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">⏱️</div>
              <h3 className="text-xl font-medium mb-2">Exploration Complete!</h3>
              <p className="text-gray-600">Now let's move to the next task...</p>
            </div>
          )}

          {isExploring && (
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 mb-2">
                {exploreTimeRemaining} seconds remaining
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-1000"
                  style={{ width: `${(exploreTimeRemaining / 60) * 100}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Think aloud about what you expect each part to do!
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderProfilePhase = () => (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Update Your Profile
          </CardTitle>
          <p className="text-gray-600 text-center">
            Log in, open Account Settings, and upload a new profile picture
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {!isLoggedIn ? (
            <div className="bg-white border rounded-lg p-6">
              <h3 className="text-lg font-medium mb-4">Login Required</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <input
                    type="email"
                    className="w-full p-2 border rounded-md"
                    placeholder="Enter your email"
                    defaultValue="john@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Password</label>
                  <input
                    type="password"
                    className="w-full p-2 border rounded-md"
                    placeholder="Enter your password"
                    defaultValue="password123"
                  />
                </div>
                <Button onClick={handleLogin} className="w-full">
                  Log In
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-white border rounded-lg p-6">
              <h3 className="text-lg font-medium mb-4">Account Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Profile Picture</label>
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center">
                      {profileUpdated ? (
                        <span className="text-green-600 text-2xl">✓</span>
                      ) : (
                        <span className="text-gray-500">👤</span>
                      )}
                    </div>
                    <div>
                      <Button 
                        onClick={handleProfileUpdate}
                        disabled={profileUpdated}
                        className="bg-blue-500 text-white px-4 py-2 rounded"
                      >
                        {profileUpdated ? 'Picture Updated' : 'Upload New Picture'}
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Display Name</label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded-md"
                    defaultValue="John Doe"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Bio</label>
                  <textarea
                    className="w-full p-2 border rounded-md"
                    rows={3}
                    placeholder="Tell us about yourself..."
                    defaultValue="UX Designer passionate about creating intuitive user experiences."
                  />
                </div>
              </div>
            </div>
          )}

          {profileUpdated && (
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-green-800">
                ✅ Profile picture successfully updated!
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderFeedbackPhase = () => (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Workflow Feedback
          </CardTitle>
          <p className="text-gray-600 text-center">
            Rate the ease of that flow (1–5), then suggest one thing we could improve
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-4">
              Rate the ease of the profile update workflow (1-5 scale)
            </label>
            <div className="flex justify-center space-x-4">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  onClick={() => setWorkflowRating(rating)}
                  className={`w-12 h-12 rounded-full flex items-center justify-center font-medium transition-colors ${
                    workflowRating === rating
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {rating}
                </button>
              ))}
            </div>
            <div className="flex justify-between text-sm text-gray-500 mt-2">
              <span>1 - Very difficult</span>
              <span>5 - Very easy</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Suggest one thing we could improve:
            </label>
            <textarea
              value={improvementSuggestion}
              onChange={(e) => setImprovementSuggestion(e.target.value)}
              className="w-full p-3 border rounded-md"
              rows={4}
              placeholder="What could we improve about the profile update workflow?"
            />
          </div>

          {workflowRating > 0 && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-blue-800">
                You rated the workflow as <strong>{workflowRating}/5</strong>
              </p>
            </div>
          )}

          <Button 
            onClick={handleFeedbackSubmit}
            className="w-full"
            disabled={workflowRating === 0 || !improvementSuggestion.trim()}
          >
            Submit Feedback
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Progress Indicator */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentPhase === 'explore' ? 'bg-blue-500 text-white' : 'bg-gray-200'
              }`}>
                1
              </div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentPhase === 'profile' ? 'bg-blue-500 text-white' : 'bg-gray-200'
              }`}>
                2
              </div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentPhase === 'feedback' ? 'bg-blue-500 text-white' : 'bg-gray-200'
              }`}>
                3
              </div>
            </div>
            <div className="text-sm text-gray-600">
              Step {currentPhase === 'explore' ? '1' : currentPhase === 'profile' ? '2' : '3'} of 3
            </div>
          </div>
        </div>
      </div>

      {/* Phase Content */}
      <div className="py-8">
        {currentPhase === 'explore' && renderExplorePhase()}
        {currentPhase === 'profile' && renderProfilePhase()}
        {currentPhase === 'feedback' && renderFeedbackPhase()}
      </div>

      {/* Transcript Display */}
      {transcript && (
        <div className="fixed bottom-4 right-4 w-80 bg-white rounded-lg shadow-lg border p-4 max-h-64 overflow-y-auto">
          <h4 className="font-medium mb-2">Live Transcript</h4>
          <p className="text-sm text-gray-600">{transcript}</p>
        </div>
      )}
    </div>
  );
};

export default DeepDiveShell; 