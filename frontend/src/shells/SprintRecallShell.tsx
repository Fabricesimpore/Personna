import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import eventBus from '../lib/eventBus';
import { useTranscript } from '../contexts/TranscriptContext';
import PrototypeImage from '../components/PrototypeImage';

interface SprintRecallShellProps {
  onTaskComplete?: (taskId: string) => void;
  onComplete?: () => void;
}

type TaskPhase = 'snapshot' | 'recall' | 'highlight';

const SprintRecallShell: React.FC<SprintRecallShellProps> = ({ 
  onTaskComplete, 
  onComplete 
}) => {
  const [currentPhase, setCurrentPhase] = useState<TaskPhase>('snapshot');
  const [showSnapshot, setShowSnapshot] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(5);
  const [recallText, setRecallText] = useState('');
  const [highlightedElements, setHighlightedElements] = useState<string[]>([]);
  const [highlightReason, setHighlightReason] = useState('');

  const { transcript } = useTranscript();

  useEffect(() => {
    if (currentPhase === 'snapshot') {
      setShowSnapshot(true);
      setTimeRemaining(5);
      
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setShowSnapshot(false);
            eventBus.emit('snapshotView.completed', { timestamp: Date.now() });
            onTaskComplete?.('snapshotView');
            setCurrentPhase('recall');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [currentPhase, onTaskComplete]);

  const handleRecallSubmit = () => {
    eventBus.emit('recall.submitted', { recallText, timestamp: Date.now() });
    onTaskComplete?.('memoryRecall');
    setCurrentPhase('highlight');
  };

  const handleHighlightSubmit = () => {
    eventBus.emit('highlight.submitted', { 
      highlightedElements, 
      highlightReason, 
      timestamp: Date.now() 
    });
    onTaskComplete?.('highlightSelect');
    onComplete?.();
  };

  const toggleElementHighlight = (element: string) => {
    setHighlightedElements(prev => {
      if (prev.includes(element)) {
        return prev.filter(e => e !== element);
      } else if (prev.length < 2) {
        return [...prev, element];
      }
      return prev;
    });
  };

  const renderSnapshotPhase = () => (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Rapid Recall Sprint
          </CardTitle>
          <p className="text-gray-600 text-center">
            You'll see this screen for exactly 5 seconds. Absorb what you can—go!
          </p>
        </CardHeader>
        <CardContent>
          {showSnapshot ? (
            <div className="mb-6">
              <PrototypeImage />
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">⏱️</div>
              <h3 className="text-xl font-medium mb-2">Time's Up!</h3>
              <p className="text-gray-600">Now let's see what you remember...</p>
            </div>
          )}

          {showSnapshot && (
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 mb-2">
                {timeRemaining} seconds remaining
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-1000"
                  style={{ width: `${(timeRemaining / 5) * 100}%` }}
                ></div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderRecallPhase = () => (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            What Do You Remember?
          </CardTitle>
          <p className="text-gray-600 text-center">
            List everything you remember—features, labels, visuals
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              Describe everything you can remember from the screen:
            </label>
            <textarea
              value={recallText}
              onChange={(e) => setRecallText(e.target.value)}
              className="w-full p-3 border rounded-md"
              rows={8}
              placeholder="List all the elements, features, numbers, colors, and details you can remember from the dashboard..."
            />
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">💡 Tips for better recall:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Think about the layout and structure</li>
              <li>• Remember specific numbers and metrics</li>
              <li>• Recall colors, buttons, and interactive elements</li>
              <li>• Don't worry about being perfect - just write what you remember</li>
            </ul>
          </div>

          <Button 
            onClick={handleRecallSubmit}
            className="w-full"
            disabled={!recallText.trim()}
          >
            Submit Recall
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  const renderHighlightPhase = () => (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Most Memorable Elements
          </CardTitle>
          <p className="text-gray-600 text-center">
            Which two elements stuck with you most, and why?
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-4">
              Select the two most memorable elements (click to select):
            </label>
            <div className="grid grid-cols-2 gap-4">
              {[
                'Analytics Overview',
                'Recent Activity',
                'Total Users (1,234)',
                'Conversion Rate (12.5%)',
                'Create Report button',
                'Export Data button',
                'Share Dashboard button',
                'Navigation menu'
              ].map((element) => (
                <button
                  key={element}
                  onClick={() => toggleElementHighlight(element)}
                  className={`p-3 rounded-lg border-2 transition-colors ${
                    highlightedElements.includes(element)
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {element}
                </button>
              ))}
            </div>
            <div className="text-sm text-gray-500 mt-2">
              Selected: {highlightedElements.length}/2
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Why did these elements stick with you?
            </label>
            <textarea
              value={highlightReason}
              onChange={(e) => setHighlightReason(e.target.value)}
              className="w-full p-3 border rounded-md"
              rows={4}
              placeholder="Explain why these elements were most memorable to you..."
            />
          </div>

          <Button 
            onClick={handleHighlightSubmit}
            className="w-full"
            disabled={highlightedElements.length !== 2 || !highlightReason.trim()}
          >
            Submit Highlights
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
                currentPhase === 'snapshot' ? 'bg-blue-500 text-white' : 'bg-gray-200'
              }`}>
                1
              </div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentPhase === 'recall' ? 'bg-blue-500 text-white' : 'bg-gray-200'
              }`}>
                2
              </div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentPhase === 'highlight' ? 'bg-blue-500 text-white' : 'bg-gray-200'
              }`}>
                3
              </div>
            </div>
            <div className="text-sm text-gray-600">
              Step {currentPhase === 'snapshot' ? '1' : currentPhase === 'recall' ? '2' : '3'} of 3
            </div>
          </div>
        </div>
      </div>

      {/* Phase Content */}
      <div className="py-8">
        {currentPhase === 'snapshot' && renderSnapshotPhase()}
        {currentPhase === 'recall' && renderRecallPhase()}
        {currentPhase === 'highlight' && renderHighlightPhase()}
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

export default SprintRecallShell; 