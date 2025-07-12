import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { ArrowLeft, Calendar, Clock, Activity, MessageSquare, AlertTriangle } from 'lucide-react';
import Toast from '../components/Toast';

interface Persona {
  id: string;
  userId: string;
  runId: string;
  name: string;
  traitScores: Record<string, number>;
  painPoints: string[];
  quotes: string[];
  createdAt: string;
  updatedAt: string;
}

interface RunMetrics {
  totalDuration: number;
  eventsCount: number;
  hintCount: number;
}

const PersonaPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [persona, setPersona] = useState<Persona | null>(null);
  const [runMetrics, setRunMetrics] = useState<RunMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPersona = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          throw new Error('No auth token');
        }

        const response = await fetch(`http://localhost:3001/api/personas/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch persona');
        }

        const data = await response.json();
        setPersona(data.data);

        // Fetch run metrics if available
        if (data.data.runId) {
          const runResponse = await fetch(`http://localhost:3001/api/tests/runs/${data.data.runId}/state`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          if (runResponse.ok) {
            const runData = await runResponse.json();
            const events = runData.data.events || [];
            setRunMetrics({
              totalDuration: calculateDuration(events),
              eventsCount: events.length,
              hintCount: events.filter((e: any) => e.type === 'hint').length
            });
          }
        }

      } catch (err) {
        setError('Failed to load persona data');
        console.error('Error fetching persona:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchPersona();
    }
  }, [id]);

  const calculateDuration = (events: any[]): number => {
    if (events.length < 2) return 0;
    
    const startTime = events.find(e => e.type === 'task-start')?.timestamp;
    const endTime = events.find(e => e.type === 'task-complete')?.timestamp;
    
    if (startTime && endTime) {
      return Math.round((endTime - startTime) / 1000);
    }
    
    return 0;
  };

  const getTopTrait = (): string => {
    if (!persona) return '';
    
    const sortedTraits = Object.entries(persona.traitScores)
      .sort(([,a], [,b]) => b - a);
    
    return sortedTraits[0]?.[0] || '';
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !persona) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Persona</h2>
          <p className="text-gray-600 mb-6">{error || 'Persona not found'}</p>
          <Button onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="outline" 
            onClick={() => navigate('/dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{persona.name}</h1>
              <p className="text-gray-600 mt-2">
                Created on {new Date(persona.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Persona ID</p>
              <p className="font-mono text-sm">{persona.id}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Trait Scores - Radar Chart */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="mr-2 h-5 w-5" />
                  Personality Traits
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(persona.traitScores).map(([trait, score]) => (
                    <div key={trait} className="flex items-center justify-between">
                      <span className="font-medium text-gray-700">{trait}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${score * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-500 w-8 text-right">
                          {Math.round(score * 100)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Primary Trait:</strong> {getTopTrait()}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Run Metrics */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="mr-2 h-5 w-5" />
                  Test Run Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                {runMetrics ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Total Duration</span>
                      <span className="font-semibold">{formatDuration(runMetrics.totalDuration)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Events Recorded</span>
                      <span className="font-semibold">{runMetrics.eventsCount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Hints Used</span>
                      <span className="font-semibold">{runMetrics.hintCount}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">Run metrics not available</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Pain Points */}
        {persona.painPoints.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="mr-2 h-5 w-5 text-orange-500" />
                Pain Points
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {persona.painPoints.map((painPoint, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-gray-700">{painPoint}</p>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Quotes */}
        {persona.quotes.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageSquare className="mr-2 h-5 w-5 text-green-500" />
                Key Quotes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {persona.quotes.map((quote, index) => (
                  <div key={index} className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                    <p className="text-gray-700 italic">"{quote}"</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PersonaPage; 