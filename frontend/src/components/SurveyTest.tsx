/**
 * @file SurveyTest
 * Interactive survey with comprehensive question types and detailed response collection
 */
import React, { useState, useEffect } from 'react';
import { TestTemplate, submitTestResponses } from '../services/api';

interface Question {
  id: string;
  type: 'multiple-choice' | 'rating' | 'text' | 'checkbox' | 'slider' | 'ranking';
  question: string;
  options?: string[];
  required: boolean;
  min?: number;
  max?: number;
  step?: number;
}

interface SurveyResponse {
  questionId: string;
  answer: string | string[] | number;
  timestamp: number;
  timeSpent: number;
  confidence?: number;
}

interface UserBehavior {
  timeSpent: number;
  changes: number;
  hesitations: number;
  lastActivity: number;
}

export default function SurveyTest({ template }: { template: TestTemplate }) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [userNotes, setUserNotes] = useState('');
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [userBehavior, setUserBehavior] = useState<UserBehavior>({
    timeSpent: 0,
    changes: 0,
    hesitations: 0,
    lastActivity: Date.now()
  });
  const [showValidation, setShowValidation] = useState(false);
  const [confidence, setConfidence] = useState(3);

  const questions: Question[] = [
    {
      id: 'q1',
      type: 'multiple-choice',
      question: 'How often do you use mobile apps?',
      options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Very often'],
      required: true
    },
    {
      id: 'q2',
      type: 'rating',
      question: 'How intuitive did you find the interface?',
      required: true
    },
    {
      id: 'q3',
      type: 'slider',
      question: 'How satisfied are you with the overall experience?',
      min: 1,
      max: 10,
      step: 1,
      required: true
    },
    {
      id: 'q4',
      type: 'checkbox',
      question: 'Which features would you like to see improved?',
      options: ['Navigation', 'Settings', 'Contact management', 'Theme options', 'Notifications', 'Search functionality'],
      required: false
    },
    {
      id: 'q5',
      type: 'text',
      question: 'What was your biggest challenge while using this interface?',
      required: true
    },
    {
      id: 'q6',
      type: 'ranking',
      question: 'Rank these features by importance (1 = Most important, 5 = Least important):',
      options: ['Ease of use', 'Speed', 'Visual design', 'Functionality', 'Accessibility'],
      required: true
    },
    {
      id: 'q7',
      type: 'rating',
      question: 'How likely are you to recommend this app to others?',
      required: true
    }
  ];

  // Track user activity
  useEffect(() => {
    const handleActivity = () => {
      const now = Date.now();
      const timeSinceLastActivity = now - userBehavior.lastActivity;
      
      if (timeSinceLastActivity > 5000) { // 5 seconds of inactivity
        setUserBehavior(prev => ({
          ...prev,
          hesitations: prev.hesitations + 1
        }));
      }
      
      setUserBehavior(prev => ({
        ...prev,
        lastActivity: now,
        timeSpent: prev.timeSpent + (now - prev.lastActivity)
      }));
    };

    document.addEventListener('mousemove', handleActivity);
    document.addEventListener('click', handleActivity);
    document.addEventListener('keydown', handleActivity);

    return () => {
      document.removeEventListener('mousemove', handleActivity);
      document.removeEventListener('click', handleActivity);
      document.removeEventListener('keydown', handleActivity);
    };
  }, [userBehavior.lastActivity]);

  // Reset question timer when question changes
  useEffect(() => {
    setQuestionStartTime(Date.now());
    setUserBehavior(prev => ({
      ...prev,
      timeSpent: 0,
      changes: 0,
      hesitations: 0,
      lastActivity: Date.now()
    }));
  }, [currentQuestion]);

  const handleAnswer = (answer: string | string[] | number) => {
    const timeSpent = Date.now() - questionStartTime;
    
    // Check if this is a change to an existing answer
    const existingResponse = responses.find(r => r.questionId === questions[currentQuestion].id);
    if (existingResponse) {
      setUserBehavior(prev => ({
        ...prev,
        changes: prev.changes + 1
      }));
    }

    const response: SurveyResponse = {
      questionId: questions[currentQuestion].id,
      answer,
      timestamp: Date.now(),
      timeSpent,
      confidence
    };
    
    // Update or add response
    setResponses(prev => {
      const filtered = prev.filter(r => r.questionId !== questions[currentQuestion].id);
      return [...filtered, response];
    });
  };

  const handleNext = () => {
    const currentQuestionData = questions[currentQuestion];
    const hasAnswered = responses.some(r => r.questionId === currentQuestionData.id);
    
    if (currentQuestionData.required && !hasAnswered) {
      setShowValidation(true);
      setTimeout(() => setShowValidation(false), 3000);
      return;
    }

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = async () => {
    const currentQuestionData = questions[currentQuestion];
    const hasAnswered = responses.some(r => r.questionId === currentQuestionData.id);
    
    if (currentQuestionData.required && !hasAnswered) {
      setShowValidation(true);
      setTimeout(() => setShowValidation(false), 3000);
      return;
    }

    try {
      const personaData = {
        templateId: template.id,
        testType: 'survey' as const,
        responses,
        userNotes,
        averageResponseTime: responses.reduce((sum, r) => sum + r.timeSpent, 0) / responses.length,
        averageConfidence: responses.reduce((sum, r) => sum + (r.confidence || 3), 0) / responses.length,
        userBehavior: {
          totalTimeSpent: userBehavior.timeSpent,
          totalChanges: userBehavior.changes,
          totalHesitations: userBehavior.hesitations
        }
      };
      
      const result = await submitTestResponses(personaData);
      console.log('Persona insights:', result.insights);
      alert(`Survey completed! Your persona analysis shows you are a ${result.insights.userType} with ${result.insights.behaviorPattern} behavior patterns.`);
    } catch (error) {
      console.error('Error submitting test responses:', error);
      alert('Error submitting test responses. Please try again.');
    }
  };

  const renderQuestion = (question: Question) => {
    const currentResponse = responses.find(r => r.questionId === question.id);
    
    switch (question.type) {
      case 'multiple-choice':
        return (
          <div className="space-y-3">
            {question.options?.map((option, index) => (
              <label key={index} className="flex items-center space-x-3 cursor-pointer p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name={question.id}
                  value={option}
                  checked={currentResponse?.answer === option}
                  onChange={(e) => handleAnswer(e.target.value)}
                  className="text-blue-600"
                />
                <span className="text-lg">{option}</span>
              </label>
            ))}
          </div>
        );

      case 'rating':
        return (
          <div className="space-y-4">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Poor</span>
              <span>Excellent</span>
            </div>
            <div className="flex space-x-2">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  onClick={() => handleAnswer(rating)}
                  className={`w-12 h-12 border-2 rounded-lg transition-colors ${
                    currentResponse?.answer === rating
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'border-gray-300 hover:bg-blue-50 hover:border-blue-300'
                  }`}
                >
                  {rating}
                </button>
              ))}
            </div>
          </div>
        );

      case 'slider':
        return (
          <div className="space-y-4">
            <input
              type="range"
              min={question.min || 1}
              max={question.max || 10}
              step={question.step || 1}
              value={currentResponse?.answer as number || 5}
              onChange={(e) => handleAnswer(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-sm text-gray-600">
              <span>{question.min || 1}</span>
              <span className="font-medium">{currentResponse?.answer as number || 5}</span>
              <span>{question.max || 10}</span>
            </div>
          </div>
        );

      case 'checkbox':
        return (
          <div className="space-y-3">
            {question.options?.map((option, index) => (
              <label key={index} className="flex items-center space-x-3 cursor-pointer p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                <input
                  type="checkbox"
                  value={option}
                  checked={(currentResponse?.answer as string[] || []).includes(option)}
                  onChange={(e) => {
                    const currentAnswers = currentResponse?.answer as string[] || [];
                    let newAnswers: string[];
                    if (e.target.checked) {
                      newAnswers = [...currentAnswers, option];
                    } else {
                      newAnswers = currentAnswers.filter(a => a !== option);
                    }
                    handleAnswer(newAnswers);
                  }}
                  className="text-blue-600"
                />
                <span className="text-lg">{option}</span>
              </label>
            ))}
          </div>
        );

      case 'ranking':
        return (
          <div className="space-y-3">
            {question.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg">
                <span className="text-sm text-gray-500 w-8">{index + 1}.</span>
                <span className="text-lg flex-1">{option}</span>
                <select
                  value={(() => {
                    const rankings = Array.isArray(currentResponse?.answer) 
                      ? (currentResponse?.answer as unknown as number[]) 
                      : [];
                    const rank = rankings.indexOf(index) + 1;
                    return rank > 0 ? rank.toString() : '';
                  })()}
                  onChange={(e) => {
                    const currentRankings = Array.isArray(currentResponse?.answer) 
                      ? (currentResponse?.answer as unknown as number[]) 
                      : [];
                    const newRankings = [...currentRankings];
                    const rank = parseInt(e.target.value);
                    if (rank > 0) {
                      newRankings[index] = rank - 1;
                    }
                    handleAnswer(newRankings as any);
                  }}
                  className="border rounded px-2 py-1"
                >
                  <option value="">-</option>
                  {question.options?.map((_, i) => (
                    <option key={i + 1} value={i + 1}>{i + 1}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        );

      case 'text':
        return (
          <textarea
            className="w-full p-3 border rounded-lg"
            rows={4}
            placeholder="Please provide your answer..."
            value={currentResponse?.answer as string || ''}
            onChange={(e) => handleAnswer(e.target.value)}
          />
        );

      default:
        return null;
    }
  };

  const currentQuestionData = questions[currentQuestion];

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4">{template.name}</h2>
        
        {/* Instructions */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold mb-2">Survey Instructions:</h3>
          <ol className="list-decimal list-inside space-y-1">
            {template.flowDefinition.map((step: string, i: number) => (
              <li key={i} className="text-sm">{step}</li>
            ))}
          </ol>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">
              Question {currentQuestion + 1} of {questions.length}
            </span>
            <div className="flex space-x-4 text-sm text-gray-600">
              <span>{Math.round(((currentQuestion + 1) / questions.length) * 100)}% Complete</span>
              <span>Time: {Math.round((Date.now() - questionStartTime) / 1000)}s</span>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Current Question */}
        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-4">
            {currentQuestionData.question}
            {currentQuestionData.required && <span className="text-red-500 ml-1">*</span>}
          </h3>
          
          {renderQuestion(currentQuestionData)}
        </div>

        {/* Confidence Rating */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">
            How confident are you in your answer? (1 = Not confident, 5 = Very confident)
          </label>
          <div className="flex space-x-2">
            {[1, 2, 3, 4, 5].map((level) => (
              <button
                key={level}
                onClick={() => setConfidence(level)}
                className={`w-10 h-10 rounded-full border-2 transition-colors ${
                  confidence === level 
                    ? 'bg-green-500 text-white border-green-500' 
                    : 'bg-white text-gray-700 border-gray-300 hover:border-green-300'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        {/* Validation Message */}
        {showValidation && (
          <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-lg">
            ⚠️ This question is required. Please provide an answer before continuing.
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mb-6">
          <button
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
          >
            Previous
          </button>
          
          {currentQuestion < questions.length - 1 ? (
            <button
              onClick={handleNext}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Submit Survey
            </button>
          )}
        </div>

        {/* User Behavior Stats */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium mb-2">Your Activity:</h4>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Time Spent:</span>
              <span className="ml-2 font-medium">{Math.round(userBehavior.timeSpent / 1000)}s</span>
            </div>
            <div>
              <span className="text-gray-600">Changes:</span>
              <span className="ml-2 font-medium">{userBehavior.changes}</span>
            </div>
            <div>
              <span className="text-gray-600">Hesitations:</span>
              <span className="ml-2 font-medium">{userBehavior.hesitations}</span>
            </div>
          </div>
        </div>

        {/* User Notes */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">
            Additional comments about this survey:
          </label>
          <textarea
            className="w-full p-3 border rounded-lg"
            rows={3}
            placeholder="Any additional thoughts or feedback..."
            value={userNotes}
            onChange={(e) => setUserNotes(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
} 