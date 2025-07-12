/**
 * TemplateCard Component
 * 
 * Displays a single test template with its details and a button to use the template.
 * This component is responsible for presenting template information in a card format
 * and handling the template selection action.
 * 
 * @component
 * @example
 * ```tsx
 * <TemplateCard
 *   template={templateData}
 *   onSelect={handleTemplateSelect}
 * />
 * ```
 */

import React from 'react';
import { TestTemplate } from '../services/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Clock, Tag, List } from 'lucide-react';
import * as Icons from 'lucide-react';

// Props interface for TemplateCard component
export interface TemplateCardProps {
  /** The template data to display */
  template: TestTemplate;
  /** Callback function called when the template is selected */
  onSelect: (templateId: string) => void;
}

/**
 * TemplateCard component
 * 
 * Renders a card displaying template information including:
 * - Template name and description
 * - Category and difficulty level
 * - Estimated duration
 * - Tags
 * - Featured badge (if applicable)
 * - "Use this template" button
 * 
 * The component handles the visual presentation and user interaction
 * for selecting a template to create a new test instance.
 */
const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  onSelect
}) => {
  // Debug: Log the template data to see if flowDefinition is present
  console.log('TemplateCard render:', {
    name: template.name,
    flowDefinition: template.flowDefinition,
    flowDefinitionLength: template.flowDefinition?.length
  });

  /**
   * Handles the template selection action
   * Calls the onSelect callback with the template ID
   */
  const handleSelect = () => {
    onSelect(template.id);
  };

  /**
   * Gets the difficulty color class based on the template difficulty
   */
  const getDifficultyColor = (difficulty: TestTemplate['difficulty']) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  /**
   * Formats the duration in a human-readable format
   */
  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      {/* Featured badge */}
      {template.featured && (
        <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-medium z-10">
          Featured
        </div>
      )}

      <CardHeader>
        <div className="flex items-center space-x-2 mb-2">
          {(() => {
            const Icon = Icons[template.icon as keyof typeof Icons] as React.ComponentType<{ className?: string }>;
            return Icon ? <Icon className="h-5 w-5 text-blue-600" /> : <div className="h-5 w-5" />;
          })()}
          <CardTitle className="text-xl">{template.name}</CardTitle>
        </div>
        <CardDescription className="text-sm leading-relaxed">
          {template.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Template metadata */}
        <div className="space-y-3">
          {/* Category and difficulty */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {template.category}
            </span>
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${getDifficultyColor(template.difficulty)}`}>
              {template.difficulty}
            </span>
          </div>

          {/* Duration */}
          <div className="flex items-center text-sm text-muted-foreground">
            <Clock className="h-4 w-4 mr-2" />
            {formatDuration(template.estimatedDuration)}
          </div>

          {/* Tags */}
          {template.tags.length > 0 && (
            <div className="flex items-center space-x-2">
              <Tag className="h-4 w-4 text-muted-foreground" />
              <div className="flex flex-wrap gap-1">
                {template.tags.slice(0, 3).map((tag, index) => (
                  <span
                    key={index}
                    className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded"
                  >
                    {tag}
                  </span>
                ))}
                {template.tags.length > 3 && (
                  <span className="text-xs text-muted-foreground">
                    +{template.tags.length - 3} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Flow Definition Steps */}
          {template.flowDefinition && template.flowDefinition.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <List className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Test Steps:</span>
              </div>
              <div className="space-y-1">
                {template.flowDefinition.map((step, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <span className="text-xs bg-blue-100 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center font-medium mt-0.5">
                      {index + 1}
                    </span>
                    <span className="text-xs text-muted-foreground leading-relaxed">
                      {step}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="space-y-2">
          <Button 
            variant="outline" 
            className="w-full"
            onClick={handleSelect}
          >
            Use this template
          </Button>
          <Button 
            variant="default" 
            className="w-full"
            onClick={() => window.location.href = `/run-test/${template.id}`}
          >
            Run Individual Test · {template.estimatedDuration} min
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TemplateCard; 