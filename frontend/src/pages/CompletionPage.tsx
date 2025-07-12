import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { CheckCircle, Clock, BarChart3, Home } from 'lucide-react';

interface CompletionState {
  suiteId: string;
  success: boolean;
  totalStages: number;
  completedStages: number;
}

const CompletionPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as CompletionState;

  if (!state || !state.success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-red-500 text-6xl mb-4">❌</div>
              <h2 className="text-xl font-bold mb-2">Session Not Found</h2>
              <p className="text-gray-600 mb-4">No completion data found.</p>
              <Button onClick={() => navigate('/')}>Go Home</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center">
          <div className="text-green-500 text-6xl mb-4">🎉</div>
          <CardTitle className="text-3xl font-bold text-green-600">
            Full Persona Run Complete!
          </CardTitle>
          <p className="text-gray-600 text-lg">
            Thank you for completing our comprehensive user research session.
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Success Summary */}
          <div className="bg-green-50 p-6 rounded-lg">
            <div className="flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
              <h3 className="text-xl font-semibold text-green-800">
                Session Successfully Completed
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="bg-white p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{state.completedStages}</div>
                <div className="text-sm text-gray-600">Stages Completed</div>
              </div>
              <div className="bg-white p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{state.totalStages}</div>
                <div className="text-sm text-gray-600">Total Stages</div>
              </div>
              <div className="bg-white p-4 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">100%</div>
                <div className="text-sm text-gray-600">Success Rate</div>
              </div>
            </div>
          </div>

          {/* What Was Collected */}
          <div className="bg-blue-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Research Data Collected
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <span>Click interaction patterns</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                  <span>Memory recall responses</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                  <span>Workflow exploration data</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                  <span>Think-aloud transcriptions</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                  <span>Audio recordings</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></div>
                  <span>Survey responses</span>
                </div>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-yellow-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-yellow-800 mb-4 flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              What Happens Next
            </h3>
            <div className="space-y-3 text-sm text-yellow-800">
              <p>• Your research data has been securely saved</p>
              <p>• Your persona has been automatically generated</p>
              <p>• You can view your persona profile on the dashboard</p>
              <p>• Your persona will be available for future reference</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              onClick={() => navigate('/dashboard')}
              className="flex-1 flex items-center justify-center"
            >
              <Home className="h-4 w-4 mr-2" />
              View Your Persona
            </Button>
            <Button 
              onClick={() => navigate('/run-suite/fullPersonaRun')}
              variant="outline"
              className="flex-1"
            >
              Run Another Session
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompletionPage; 