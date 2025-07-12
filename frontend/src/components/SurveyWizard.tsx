import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { X, ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';

interface SurveyWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onEvent: (eventName: string, data?: any) => void;
}

interface SurveyStep {
  id: string;
  question: string;
  type: 'rating' | 'text' | 'multiple-choice';
  options?: string[];
  required: boolean;
}

const SurveyWizard: React.FC<SurveyWizardProps> = ({ isOpen, onClose, onEvent }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [isCompleted, setIsCompleted] = useState(false);

  const surveySteps: SurveyStep[] = [
    {
      id: 'satisfaction',
      question: 'How satisfied are you with the overall user experience?',
      type: 'rating',
      required: true
    },
    {
      id: 'ease-of-use',
      question: 'How easy was it to navigate and use the interface?',
      type: 'rating',
      required: true
    },
    {
      id: 'features',
      question: 'How would you rate the available features and functionality?',
      type: 'rating',
      required: true
    },
    {
      id: 'recommendation',
      question: 'How likely are you to recommend this product to others?',
      type: 'multiple-choice',
      options: ['Very likely', 'Likely', 'Neutral', 'Unlikely', 'Very unlikely'],
      required: true
    },
    {
      id: 'improvements',
      question: 'What improvements would you suggest for this interface?',
      type: 'text',
      required: false
    },
    {
      id: 'favorite-feature',
      question: 'What was your favorite feature or aspect of this experience?',
      type: 'text',
      required: false
    }
  ];

  const currentStepData = surveySteps[currentStep];

  const handleResponse = (response: any) => {
    setResponses(prev => ({
      ...prev,
      [currentStepData.id]: response
    }));
  };

  const handleNext = () => {
    if (currentStep < surveySteps.length - 1) {
      // Emit step completion event
      onEvent('survey.stepCompleted', {
        stepId: currentStepData.id,
        stepNumber: currentStep + 1,
        totalSteps: surveySteps.length,
        response: responses[currentStepData.id]
      });

      setCurrentStep(prev => prev + 1);
    } else {
      // Complete the survey
      setIsCompleted(true);
      onEvent('survey.completed', {
        responses,
        totalSteps: surveySteps.length
      });
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const canProceed = () => {
    const currentResponse = responses[currentStepData.id];
    if (currentStepData.required) {
      return currentResponse !== undefined && currentResponse !== '';
    }
    return true;
  };

  const renderStepContent = () => {
    const currentResponse = responses[currentStepData.id];

    switch (currentStepData.type) {
      case 'rating':
        return (
          <div className="space-y-4">
            <div className="flex space-x-2 justify-center">
              {[1, 2, 3, 4, 5].map(rating => (
                <button
                  key={rating}
                  onClick={() => handleResponse(rating)}
                  className={`px-4 py-2 rounded border transition-colors ${
                    currentResponse === rating
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  {rating}
                </button>
              ))}
            </div>
            <div className="text-center text-sm text-gray-600">
              <span>1 = Very Poor</span>
              <span className="mx-2">•</span>
              <span>5 = Excellent</span>
            </div>
          </div>
        );

      case 'multiple-choice':
        return (
          <div className="space-y-3">
            {currentStepData.options?.map(option => (
              <label key={option} className="flex items-center space-x-3 p-3 border rounded hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name={currentStepData.id}
                  value={option}
                  checked={currentResponse === option}
                  onChange={(e) => handleResponse(e.target.value)}
                  className="text-blue-500"
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        );

      case 'text':
        return (
          <div>
            <textarea
              value={currentResponse || ''}
              onChange={(e) => handleResponse(e.target.value)}
              className="w-full p-3 border rounded-md"
              rows={4}
              placeholder="Share your thoughts..."
            />
          </div>
        );

      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-semibold">User Experience Survey</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {isCompleted ? (
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center space-x-2 text-green-600">
                <CheckCircle className="h-6 w-6" />
                <span className="text-lg font-medium">Survey Completed!</span>
              </div>
              <p className="text-gray-600">
                Thank you for your feedback. Your responses will help us improve the user experience.
              </p>
              <Button onClick={onClose} className="bg-green-600 hover:bg-green-700">
                Close Survey
              </Button>
            </div>
          ) : (
            <>
              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentStep + 1) / surveySteps.length) * 100}%` }}
                />
              </div>
              <div className="text-sm text-gray-600 text-center">
                Step {currentStep + 1} of {surveySteps.length}
              </div>

              {/* Question */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">{currentStepData.question}</h3>
                {currentStepData.required && (
                  <span className="text-red-500 text-sm">* Required</span>
                )}
                
                {renderStepContent()}
              </div>

              {/* Navigation */}
              <div className="flex justify-between">
                <Button
                  onClick={handlePrevious}
                  disabled={currentStep === 0}
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Previous</span>
                </Button>

                <Button
                  onClick={handleNext}
                  disabled={!canProceed()}
                  className="flex items-center space-x-2"
                >
                  <span>{currentStep === surveySteps.length - 1 ? 'Complete' : 'Next'}</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SurveyWizard; 