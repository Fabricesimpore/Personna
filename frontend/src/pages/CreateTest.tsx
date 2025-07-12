/**
 * CreateTest Page Component
 * 
 * Main page for creating tests from templates. This component:
 * - Fetches test templates from the API
 * - Displays featured templates in a highlighted section
 * - Provides a "See more" toggle to show all templates
 * - Handles template selection and test creation
 * - Shows loading states and error handling
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TemplateCard from '../components/TemplateCard';
import { getTemplates, createTest, TestTemplate } from '../services/api';

// Component state interface
interface CreateTestState {
  templates: TestTemplate[];
  showAll: boolean;
  loading: boolean;
  error: string | null;
}

/**
 * CreateTest component
 * 
 * Manages the test creation flow including:
 * - Fetching and displaying templates
 * - Template selection and test creation
 * - Loading and error states
 * - Responsive layout with featured/all templates toggle
 */
const CreateTest: React.FC = () => {
  const navigate = useNavigate();
  
  // Component state
  const [state, setState] = useState<CreateTestState>({
    templates: [],
    showAll: false,
    loading: true,
    error: null,
  });

  /**
   * Fetch templates from the API on component mount
   */
  useEffect(() => {
    fetchTemplates();
  }, []);

  /**
   * Fetches all templates from the API
   */
  const fetchTemplates = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const templates = await getTemplates();
      
      // Debug: Log the fetched templates to see if flowDefinition is present
      console.log('Fetched templates:', templates.map(t => ({
        name: t.name,
        flowDefinition: t.flowDefinition,
        flowDefinitionLength: t.flowDefinition?.length
      })));
      
      setState(prev => ({
        ...prev,
        templates,
        loading: false,
      }));
    } catch (error) {
      console.error('Failed to fetch templates:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to load templates. Please try again.',
      }));
    }
  };

  /**
   * Handles template selection and test creation
   * @param templateId - The ID of the selected template
   */
  const handleTemplateSelect = async (templateId: string) => {
    try {
      // Create the test instance
      const { testId } = await createTest(templateId);
      
      // Navigate to the test page
      navigate(`/tests/${testId}`);
    } catch (error) {
      console.error('Failed to create test:', error);
      alert('Failed to create test. Please try again.');
    }
  };

  /**
   * Toggles between showing featured templates only or all templates
   */
  const toggleShowAll = () => {
    setState(prev => ({
      ...prev,
      showAll: !prev.showAll,
    }));
  };

  /**
   * Renders loading state
   */
  const renderLoading = () => (
    <div className="flex items-center justify-center min-h-64">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading templates...</p>
      </div>
    </div>
  );

  /**
   * Renders error state
   */
  const renderError = () => (
    <div className="text-center py-8">
      <div className="text-red-600 mb-4">
        <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Something went wrong</h3>
      <p className="text-gray-600 mb-4">{state.error}</p>
      <button
        onClick={fetchTemplates}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium"
      >
        Try Again
      </button>
    </div>
  );

  // Show loading state
  if (state.loading) {
    return renderLoading();
  }

  // Show error state
  if (state.error) {
    return renderError();
  }

  // Get featured templates (first 3)
  const featuredTemplates = state.templates.slice(0, 3);
  const remainingTemplates = state.templates.slice(3);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Create a New Test
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Choose from our collection of test templates to create your next assessment.
            Featured templates are highlighted for your convenience.
          </p>
          
          {/* Full Persona Run CTA */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              🎯 Complete User Research Session
            </h2>
            <p className="text-gray-600 mb-4">
              Experience our comprehensive persona research suite with three sequential phases
            </p>
            <button
              onClick={() => navigate('/run-suite/fullPersonaRun')}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg text-lg font-semibold transition-colors duration-200 shadow-lg hover:shadow-xl"
            >
              Run Full Persona Run (≈19 min)
            </button>
            <p className="text-sm text-gray-500 mt-2">
              Click Challenge → Memory Recall → Workflow Deep-Dive
            </p>
          </div>
        </div>

        {/* Featured templates section */}
        {featuredTemplates.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Featured Templates</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onSelect={handleTemplateSelect}
                />
              ))}
            </div>
          </div>
        )}

        {/* All templates section */}
        {remainingTemplates.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">All Templates</h2>
              <button
                onClick={toggleShowAll}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                {state.showAll ? 'Show Less' : 'See More'}
              </button>
            </div>
            
            {state.showAll ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {remainingTemplates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    onSelect={handleTemplateSelect}
                  />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {remainingTemplates.slice(0, 3).map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    onSelect={handleTemplateSelect}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {state.templates.length === 0 && !state.loading && !state.error && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No templates available</h3>
            <p className="text-gray-600">Check back later for new test templates.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateTest; 