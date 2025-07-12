import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import eventBus from '../lib/eventBus';
import { useTranscript } from '../contexts/TranscriptContext';

interface FullPersonaShellProps {
  onPhaseComplete?: (phaseId: string) => void;
  onComplete?: () => void;
}

type Phase = 'onboarding' | 'feature-exploration' | 'journey-mapping';

interface OnboardingData {
  name: string;
  age: string;
  occupation: string;
  experience: string;
  goals: string[];
  painPoints: string[];
  preferences: string[];
}

interface FeatureCard {
  id: string;
  title: string;
  description: string;
  category: 'must-have' | 'nice-to-have';
}

const FullPersonaShell: React.FC<FullPersonaShellProps> = ({ 
  onPhaseComplete, 
  onComplete 
}) => {
  const [currentPhase, setCurrentPhase] = useState<Phase>('onboarding');
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    name: '',
    age: '',
    occupation: '',
    experience: '',
    goals: [],
    painPoints: [],
    preferences: []
  });
  const [featureCards, setFeatureCards] = useState<FeatureCard[]>([
    { id: '1', title: 'User Authentication', description: 'Secure login and registration system', category: 'must-have' },
    { id: '2', title: 'Real-time Chat', description: 'Instant messaging with other users', category: 'must-have' },
    { id: '3', title: 'File Sharing', description: 'Upload and share documents', category: 'must-have' },
    { id: '4', title: 'Advanced Analytics', description: 'Detailed usage statistics and insights', category: 'nice-to-have' },
    { id: '5', title: 'Custom Themes', description: 'Personalize the interface appearance', category: 'nice-to-have' },
    { id: '6', title: 'Mobile App', description: 'Native mobile application', category: 'nice-to-have' },
    { id: '7', title: 'API Integration', description: 'Connect with third-party services', category: 'nice-to-have' },
    { id: '8', title: 'Multi-language Support', description: 'Interface in multiple languages', category: 'nice-to-have' }
  ]);
  const [journeyData, setJourneyData] = useState({
    satisfaction: 0,
    easeOfUse: 0,
    featureValue: 0,
    recommendations: '',
    improvements: ''
  });

  const { transcript } = useTranscript();

  const handleOnboardingSubmit = () => {
    eventBus.emit('onboarding.completed', onboardingData);
    onPhaseComplete?.('phase-1');
    setCurrentPhase('feature-exploration');
  };

  const handleFeatureSort = (cardId: string, newCategory: 'must-have' | 'nice-to-have') => {
    setFeatureCards(prev => 
      prev.map(card => 
        card.id === cardId 
          ? { ...card, category: newCategory }
          : card
      )
    );
    eventBus.emit('card.sorted', { cardId, category: newCategory });
  };

  const handleFeatureComplete = () => {
    eventBus.emit('features.explored', featureCards);
    onPhaseComplete?.('phase-2');
    setCurrentPhase('journey-mapping');
  };

  const handleJourneySubmit = () => {
    eventBus.emit('journey.completed', journeyData);
    onPhaseComplete?.('phase-3');
    onComplete?.();
  };

  const renderOnboardingPhase = () => (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Phase 1: Onboarding Questionnaire
          </CardTitle>
          <p className="text-gray-600 text-center">
            Help us understand your background and preferences
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Name</label>
              <input
                type="text"
                value={onboardingData.name}
                onChange={(e) => setOnboardingData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full p-2 border rounded-md"
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Age</label>
              <input
                type="number"
                value={onboardingData.age}
                onChange={(e) => setOnboardingData(prev => ({ ...prev, age: e.target.value }))}
                className="w-full p-2 border rounded-md"
                placeholder="Your age"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Occupation</label>
            <input
              type="text"
              value={onboardingData.occupation}
              onChange={(e) => setOnboardingData(prev => ({ ...prev, occupation: e.target.value }))}
              className="w-full p-2 border rounded-md"
              placeholder="Your job title or role"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Technical Experience</label>
            <select
              value={onboardingData.experience}
              onChange={(e) => setOnboardingData(prev => ({ ...prev, experience: e.target.value }))}
              className="w-full p-2 border rounded-md"
            >
              <option value="">Select your experience level</option>
              <option value="beginner">Beginner - New to technology</option>
              <option value="intermediate">Intermediate - Comfortable with most apps</option>
              <option value="advanced">Advanced - Technical background</option>
              <option value="expert">Expert - Professional in tech</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Primary Goals</label>
            <textarea
              value={onboardingData.goals.join(', ')}
              onChange={(e) => setOnboardingData(prev => ({ 
                ...prev, 
                goals: e.target.value.split(',').map(s => s.trim()).filter(s => s)
              }))}
              className="w-full p-2 border rounded-md"
              rows={3}
              placeholder="What are your main goals when using software? (comma-separated)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Pain Points</label>
            <textarea
              value={onboardingData.painPoints.join(', ')}
              onChange={(e) => setOnboardingData(prev => ({ 
                ...prev, 
                painPoints: e.target.value.split(',').map(s => s.trim()).filter(s => s)
              }))}
              className="w-full p-2 border rounded-md"
              rows={3}
              placeholder="What frustrates you most about software? (comma-separated)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Preferences</label>
            <textarea
              value={onboardingData.preferences.join(', ')}
              onChange={(e) => setOnboardingData(prev => ({ 
                ...prev, 
                preferences: e.target.value.split(',').map(s => s.trim()).filter(s => s)
              }))}
              className="w-full p-2 border rounded-md"
              rows={3}
              placeholder="What do you prefer in software interfaces? (comma-separated)"
            />
          </div>

          <Button 
            onClick={handleOnboardingSubmit}
            className="w-full"
            disabled={!onboardingData.name || !onboardingData.occupation}
          >
            Complete Onboarding
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  const renderFeatureExplorationPhase = () => (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Phase 2: Feature Exploration
          </CardTitle>
          <p className="text-gray-600 text-center">
            Organize these features by importance to your needs
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-green-700">Must Have</h3>
              <div className="min-h-[400px] border-2 border-green-200 rounded-lg p-4 bg-green-50">
                {featureCards
                  .filter(card => card.category === 'must-have')
                  .map(card => (
                    <div
                      key={card.id}
                      className="bg-white p-3 rounded-lg shadow-sm mb-3 cursor-move border border-green-300"
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', card.id);
                      }}
                    >
                      <h4 className="font-medium">{card.title}</h4>
                      <p className="text-sm text-gray-600">{card.description}</p>
                    </div>
                  ))}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-blue-700">Nice to Have</h3>
              <div 
                className="min-h-[400px] border-2 border-blue-200 rounded-lg p-4 bg-blue-50"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const cardId = e.dataTransfer.getData('text/plain');
                  handleFeatureSort(cardId, 'nice-to-have');
                }}
              >
                {featureCards
                  .filter(card => card.category === 'nice-to-have')
                  .map(card => (
                    <div
                      key={card.id}
                      className="bg-white p-3 rounded-lg shadow-sm mb-3 cursor-move border border-blue-300"
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', card.id);
                      }}
                    >
                      <h4 className="font-medium">{card.title}</h4>
                      <p className="text-sm text-gray-600">{card.description}</p>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          <div className="mt-6 text-center">
            <Button onClick={handleFeatureComplete} className="px-8">
              Complete Feature Exploration
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderJourneyMappingPhase = () => (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Phase 3: Journey Mapping
          </CardTitle>
          <p className="text-gray-600 text-center">
            Share your experience and insights from this session
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              Overall Satisfaction (1-10)
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={journeyData.satisfaction}
              onChange={(e) => setJourneyData(prev => ({ 
                ...prev, 
                satisfaction: parseInt(e.target.value) 
              }))}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-gray-500 mt-1">
              <span>1 - Very Dissatisfied</span>
              <span>10 - Very Satisfied</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Ease of Use (1-10)
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={journeyData.easeOfUse}
              onChange={(e) => setJourneyData(prev => ({ 
                ...prev, 
                easeOfUse: parseInt(e.target.value) 
              }))}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-gray-500 mt-1">
              <span>1 - Very Difficult</span>
              <span>10 - Very Easy</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Feature Value (1-10)
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={journeyData.featureValue}
              onChange={(e) => setJourneyData(prev => ({ 
                ...prev, 
                featureValue: parseInt(e.target.value) 
              }))}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-gray-500 mt-1">
              <span>1 - No Value</span>
              <span>10 - High Value</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              What would you recommend to others?
            </label>
            <textarea
              value={journeyData.recommendations}
              onChange={(e) => setJourneyData(prev => ({ 
                ...prev, 
                recommendations: e.target.value 
              }))}
              className="w-full p-2 border rounded-md"
              rows={3}
              placeholder="Share your recommendations..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              What improvements would you suggest?
            </label>
            <textarea
              value={journeyData.improvements}
              onChange={(e) => setJourneyData(prev => ({ 
                ...prev, 
                improvements: e.target.value 
              }))}
              className="w-full p-2 border rounded-md"
              rows={3}
              placeholder="Share your improvement ideas..."
            />
          </div>

          <Button 
            onClick={handleJourneySubmit}
            className="w-full"
          >
            Complete Journey Mapping
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
                currentPhase === 'onboarding' ? 'bg-blue-500 text-white' : 'bg-gray-200'
              }`}>
                1
              </div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentPhase === 'feature-exploration' ? 'bg-blue-500 text-white' : 'bg-gray-200'
              }`}>
                2
              </div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentPhase === 'journey-mapping' ? 'bg-blue-500 text-white' : 'bg-gray-200'
              }`}>
                3
              </div>
            </div>
            <div className="text-sm text-gray-600">
              Phase {currentPhase === 'onboarding' ? '1' : currentPhase === 'feature-exploration' ? '2' : '3'} of 3
            </div>
          </div>
        </div>
      </div>

      {/* Phase Content */}
      <div className="py-8">
        {currentPhase === 'onboarding' && renderOnboardingPhase()}
        {currentPhase === 'feature-exploration' && renderFeatureExplorationPhase()}
        {currentPhase === 'journey-mapping' && renderJourneyMappingPhase()}
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

export default FullPersonaShell; 