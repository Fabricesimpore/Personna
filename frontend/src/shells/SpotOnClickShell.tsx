import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import eventBus from '../lib/eventBus';
import { useTranscript } from '../contexts/TranscriptContext';

interface SpotOnClickShellProps {
  onTaskComplete?: (taskId: string) => void;
  onComplete?: () => void;
}

type TaskPhase = 'click' | 'rationale' | 'confidence';

const SpotOnClickShell: React.FC<SpotOnClickShellProps> = ({ 
  onTaskComplete, 
  onComplete 
}) => {
  const [currentPhase, setCurrentPhase] = useState<TaskPhase>('click');
  const [clickedElement, setClickedElement] = useState<string>('');
  const [rationale, setRationale] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [showPricingLink, setShowPricingLink] = useState(false);

  const { transcript } = useTranscript();

  useEffect(() => {
    // Show pricing link after a short delay to simulate discovery
    const timer = setTimeout(() => {
      setShowPricingLink(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handlePricingClick = () => {
    setClickedElement('pricing-link');
    eventBus.emit('spotClick', { element: 'pricing-link', timestamp: Date.now() });
    onTaskComplete?.('spotClick');
    setCurrentPhase('rationale');
  };

  const handleRationaleSubmit = () => {
    eventBus.emit('rationale.submitted', { rationale, timestamp: Date.now() });
    onTaskComplete?.('clickRationale');
    setCurrentPhase('confidence');
  };

  const handleConfidenceSubmit = () => {
    eventBus.emit('rating.submitted', { confidence, timestamp: Date.now() });
    onTaskComplete?.('confidenceRating');
    onComplete?.();
  };

  const renderClickPhase = () => (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Spot-On Click Challenge
          </CardTitle>
          <p className="text-gray-600 text-center">
            Find and click the Pricing link when you see it
          </p>
        </CardHeader>
        <CardContent>
          <div className="bg-white border rounded-lg p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Demo Website</h2>
              <div className="flex space-x-4">
                <button className="text-blue-600 hover:text-blue-800">Home</button>
                <button className="text-blue-600 hover:text-blue-800">About</button>
                <button className="text-blue-600 hover:text-blue-800">Services</button>
                {showPricingLink && (
                  <button 
                    onClick={handlePricingClick}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Pricing
                  </button>
                )}
                <button className="text-blue-600 hover:text-blue-800">Contact</button>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded">
              <h3 className="text-lg font-medium mb-2">Welcome to Our Platform</h3>
              <p className="text-gray-600 mb-4">
                We offer comprehensive solutions for your business needs. 
                Explore our features and find the perfect plan for you.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded border">
                  <h4 className="font-medium">Feature 1</h4>
                  <p className="text-sm text-gray-600">Amazing capabilities</p>
                </div>
                <div className="bg-white p-4 rounded border">
                  <h4 className="font-medium">Feature 2</h4>
                  <p className="text-sm text-gray-600">Powerful tools</p>
                </div>
                <div className="bg-white p-4 rounded border">
                  <h4 className="font-medium">Feature 3</h4>
                  <p className="text-sm text-gray-600">Advanced options</p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <p className="text-gray-600 mb-4">
              {!showPricingLink 
                ? "Looking for the Pricing link..." 
                : "Click the Pricing link when you find it!"
              }
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderRationalePhase = () => (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Why Did You Click There?
          </CardTitle>
          <p className="text-gray-600 text-center">
            Tell us about your decision and what you would have done next
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              Why did you click on the Pricing link?
            </label>
            <textarea
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
              className="w-full p-3 border rounded-md"
              rows={4}
              placeholder="Explain your reasoning for clicking the Pricing link..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              If you hadn't found the Pricing link, where would you look next?
            </label>
            <textarea
              className="w-full p-3 border rounded-md"
              rows={3}
              placeholder="Describe alternative places you would search for pricing information..."
            />
          </div>

          <Button 
            onClick={handleRationaleSubmit}
            className="w-full"
            disabled={!rationale.trim()}
          >
            Submit Rationale
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  const renderConfidencePhase = () => (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Confidence Rating
          </CardTitle>
          <p className="text-gray-600 text-center">
            How confident are you that you clicked the correct Pricing link?
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-4">
              Rate your confidence (1-5 scale)
            </label>
            <div className="flex justify-center space-x-4">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  onClick={() => setConfidence(rating)}
                  className={`w-12 h-12 rounded-full flex items-center justify-center font-medium transition-colors ${
                    confidence === rating
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {rating}
                </button>
              ))}
            </div>
            <div className="flex justify-between text-sm text-gray-500 mt-2">
              <span>1 - Not confident</span>
              <span>5 - Very confident</span>
            </div>
          </div>

          {confidence > 0 && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-blue-800">
                You rated your confidence as <strong>{confidence}/5</strong>
              </p>
            </div>
          )}

          <Button 
            onClick={handleConfidenceSubmit}
            className="w-full"
            disabled={confidence === 0}
          >
            Submit Rating
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
                currentPhase === 'click' ? 'bg-blue-500 text-white' : 'bg-gray-200'
              }`}>
                1
              </div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentPhase === 'rationale' ? 'bg-blue-500 text-white' : 'bg-gray-200'
              }`}>
                2
              </div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentPhase === 'confidence' ? 'bg-blue-500 text-white' : 'bg-gray-200'
              }`}>
                3
              </div>
            </div>
            <div className="text-sm text-gray-600">
              Step {currentPhase === 'click' ? '1' : currentPhase === 'rationale' ? '2' : '3'} of 3
            </div>
          </div>
        </div>
      </div>

      {/* Phase Content */}
      <div className="py-8">
        {currentPhase === 'click' && renderClickPhase()}
        {currentPhase === 'rationale' && renderRationalePhase()}
        {currentPhase === 'confidence' && renderConfidencePhase()}
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

export default SpotOnClickShell; 