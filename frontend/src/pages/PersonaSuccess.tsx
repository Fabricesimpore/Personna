import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { CheckCircle, ArrowLeft } from 'lucide-react';

const PersonaSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const personaId = searchParams.get('personaId');

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl font-bold text-green-600">
            🎉 Persona Created Successfully!
          </CardTitle>
          <p className="text-gray-600 mt-2">
            Your persona profile has been generated and saved
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {personaId && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">Your Persona ID:</h3>
              <p className="font-mono text-sm bg-white p-2 rounded border text-blue-900">
                {personaId}
              </p>
            </div>
          )}
          
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold text-green-800 mb-2">What's Next?</h3>
            <ul className="text-sm text-green-800 space-y-1">
              <li>• Your persona data is now available for analysis</li>
              <li>• You can view detailed insights on your dashboard</li>
              <li>• Re-run tests anytime to update your profile</li>
            </ul>
          </div>
          
          <Button 
            onClick={handleBackToDashboard}
            className="w-full flex items-center justify-center"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default PersonaSuccess; 