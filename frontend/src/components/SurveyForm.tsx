import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';

interface SurveyFormProps {
  isOpen: boolean;
  onClose: () => void;
  onEvent: (eventName: string, data?: any) => void;
}

const SurveyForm: React.FC<SurveyFormProps> = ({ isOpen, onClose, onEvent }) => {
  const [surveyData, setSurveyData] = useState({
    satisfaction: 0,
    easeOfUse: 0,
    features: 0,
    comments: ''
  });

  const handleRatingChange = (field: string, value: number) => {
    setSurveyData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onEvent('survey.completed', surveyData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">User Experience Survey</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <label className="block font-medium">How satisfied are you with the overall experience?</label>
              <div className="flex space-x-2">
                {[1, 2, 3, 4, 5].map(rating => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => handleRatingChange('satisfaction', rating)}
                    className={`px-4 py-2 rounded border ${
                      surveyData.satisfaction === rating
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    {rating}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="block font-medium">How easy was it to use the interface?</label>
              <div className="flex space-x-2">
                {[1, 2, 3, 4, 5].map(rating => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => handleRatingChange('easeOfUse', rating)}
                    className={`px-4 py-2 rounded border ${
                      surveyData.easeOfUse === rating
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    {rating}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="block font-medium">How would you rate the available features?</label>
              <div className="flex space-x-2">
                {[1, 2, 3, 4, 5].map(rating => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => handleRatingChange('features', rating)}
                    className={`px-4 py-2 rounded border ${
                      surveyData.features === rating
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    {rating}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="block font-medium">Additional comments or suggestions:</label>
              <textarea
                value={surveyData.comments}
                onChange={(e) => setSurveyData(prev => ({ ...prev, comments: e.target.value }))}
                className="w-full p-3 border rounded-md"
                rows={4}
                placeholder="Share your thoughts about the experience..."
              />
            </div>

            <div className="flex space-x-3">
              <Button type="submit" className="flex-1">
                Submit Survey
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SurveyForm; 