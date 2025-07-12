import React from 'react';
import { CheckCircle, AlertCircle, Clock, Lightbulb } from 'lucide-react';

interface TaskFeedbackProps {
  type: 'success' | 'error' | 'hint' | 'timeout';
  message: string;
  showHint?: boolean;
  hintText?: string;
  onShowHint?: () => void;
}

const TaskFeedback: React.FC<TaskFeedbackProps> = ({ 
  type, 
  message, 
  showHint = false, 
  hintText, 
  onShowHint 
}) => {
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'hint':
        return <Lightbulb className="h-5 w-5 text-yellow-500" />;
      case 'timeout':
        return <Clock className="h-5 w-5 text-orange-500" />;
      default:
        return null;
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'hint':
        return 'bg-yellow-50 border-yellow-200';
      case 'timeout':
        return 'bg-orange-50 border-orange-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className={`p-4 border rounded-lg ${getBackgroundColor()} transition-all duration-300`}>
      <div className="flex items-start space-x-3">
        {getIcon()}
        <div className="flex-1">
          <p className="text-sm font-medium">{message}</p>
          {showHint && hintText && (
            <div className="mt-2">
              <button
                onClick={onShowHint}
                className="text-xs text-blue-600 hover:text-blue-800 underline"
              >
                Need a hint?
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskFeedback; 