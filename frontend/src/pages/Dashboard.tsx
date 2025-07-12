import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { User, Plus, Eye, RotateCcw, Play } from 'lucide-react';
import Toast from '../components/Toast';

interface User {
  id: string;
  name: string;
  email: string;
}

interface Persona {
  id: string;
  userId: string;
  personaId: string;
  name: string;
  traitScores: Record<string, number>;
  painPoints: string[];
  quotes: string[];
  createdAt: string;
  status: 'completed' | 'in_progress';
}

interface CurrentRun {
  runId: string;
  suiteId: string;
  currentStageIndex: number;
  currentTaskIndex: number;
  events: any[];
  transcriptSoFar: string;
  surveyResponsesSoFar: any[];
  startTime: number;
  createdAt: string;
}

const Dashboard: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [persona, setPersona] = useState<Persona | null>(null);
  const [currentRun, setCurrentRun] = useState<CurrentRun | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadUserAndData = async () => {
      try {
        // Get user from localStorage
        const userStr = localStorage.getItem('user');
        if (!userStr) {
          throw new Error('User not found');
        }
        const userData: User = JSON.parse(userStr);
        setUser(userData);

        const token = localStorage.getItem('authToken');
        if (!token) {
          throw new Error('No auth token');
        }

        // Fetch persona status
        const personaResponse = await fetch('http://localhost:3001/api/personas/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (personaResponse.ok) {
          const personaData = await personaResponse.json();
          setPersona(personaData.data);
        } else if (personaResponse.status === 404) {
          // No persona exists yet
          setPersona(null);
        } else {
          throw new Error('Failed to fetch persona');
        }

        // Fetch current run status
        const runResponse = await fetch('http://localhost:3001/api/tests/runs/current', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (runResponse.ok) {
          const runData = await runResponse.json();
          if (runData.success && runData.data) {
            setCurrentRun(runData.data);
          }
        } else if (runResponse.status === 404) {
          // No active run
          setCurrentRun(null);
        } else {
          throw new Error('Failed to fetch current run');
        }

      } catch (err) {
        setError('Failed to load dashboard data');
        console.error('Dashboard error:', err);
        
        // Fallback to localStorage for current run
        try {
          const savedRun = localStorage.getItem('currentRunState');
          if (savedRun) {
            const runData = JSON.parse(savedRun);
            setCurrentRun(runData);
          }
        } catch (e) {
          console.error('Error parsing saved run:', e);
        }
      } finally {
        setLoading(false);
      }
    };

    loadUserAndData();
  }, []);

  const handleCreatePersona = () => {
    navigate('/run-suite/fullPersonaRun');
  };

  const handleResumePersona = () => {
    if (currentRun) {
      navigate(`/run-suite/fullPersonaRun?runId=${currentRun.runId}`);
    }
  };

  const handleViewPersona = () => {
    if (persona) {
      navigate(`/persona/${persona.personaId}`);
    }
  };

  const handleRerunTests = () => {
    navigate('/run-suite/fullPersonaRun');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/signup" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome, {user.name}!
          </h1>
          <p className="text-gray-600 mt-2">
            Manage your persona profile and testing sessions
          </p>
        </div>

        {/* Current Run Status */}
        {currentRun && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Play className="mr-2 h-5 w-5" />
                Active Persona Creation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4">
                <div className="text-6xl mb-4">🎯</div>
                <h3 className="text-xl font-semibold mb-2">Resume Your Progress</h3>
                <p className="text-gray-600 mb-4">
                  You have an active persona creation session in progress.
                  Continue where you left off!
                </p>
                <div className="bg-blue-50 p-3 rounded-lg mb-4">
                  <p className="text-sm text-blue-800">
                    Stage {currentRun.currentStageIndex + 1} of 3 • 
                    {currentRun.events.length} events recorded
                  </p>
                </div>
                <Button onClick={handleResumePersona} className="flex items-center">
                  <Play className="mr-2 h-4 w-4" />
                  Resume Persona Run
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Persona Status Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="mr-2 h-5 w-5" />
              Persona Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!persona && !currentRun ? (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">🎭</div>
                <h3 className="text-xl font-semibold mb-2">No Persona Created</h3>
                <p className="text-gray-600 mb-6">
                  Create your persona profile by completing the full testing suite
                </p>
                <Button onClick={handleCreatePersona} className="flex items-center">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Persona
                </Button>
              </div>
            ) : persona ? (
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">{persona.name}</h3>
                      <p className="text-sm text-gray-600">
                        Created: {new Date(persona.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Persona ID</p>
                      <p className="font-mono text-xs">{persona.personaId}</p>
                    </div>
                  </div>
                  
                  {/* Trait Summary */}
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-2">Primary Traits:</p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(persona.traitScores)
                        .sort(([,a], [,b]) => b - a)
                        .slice(0, 3)
                        .map(([trait, score]) => (
                          <span 
                            key={trait}
                            className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                          >
                            {trait} ({Math.round(score * 100)}%)
                          </span>
                        ))}
                    </div>
                  </div>

                  {/* Pain Points Preview */}
                  {persona.painPoints.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-600 mb-2">Key Pain Points:</p>
                      <ul className="space-y-1">
                        {persona.painPoints.slice(0, 2).map((painPoint, index) => (
                          <li key={index} className="text-sm text-gray-700 flex items-start">
                            <span className="text-orange-500 mr-2">•</span>
                            {painPoint.length > 80 ? painPoint.substring(0, 80) + '...' : painPoint}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex space-x-2">
                    <Button 
                      onClick={handleViewPersona} 
                      className="flex items-center"
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      View Full Persona
                    </Button>
                    <Button 
                      onClick={handleRerunTests}
                      variant="outline"
                      className="flex items-center"
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Re-run Tests
                    </Button>
                  </div>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {!currentRun ? (
                <Button 
                  onClick={handleCreatePersona}
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center"
                >
                  <Plus className="h-6 w-6 mb-2" />
                  <span>Start New Test Suite</span>
                </Button>
              ) : (
                <Button 
                  onClick={handleResumePersona}
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center"
                >
                  <Play className="h-6 w-6 mb-2" />
                  <span>Resume Current Run</span>
                </Button>
              )}
              
              {persona && (
                <Button 
                  onClick={handleViewPersona}
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center"
                >
                  <Eye className="h-6 w-6 mb-2" />
                  <span>View Results</span>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

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

export default Dashboard; 