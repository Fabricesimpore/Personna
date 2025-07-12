import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

// Types
interface TestTemplate {
  id: string;
  name: string;
  icon?: string;
  flowDefinition: string[];
}

interface TestInstance {
  id: string;
  name: string;
  templateId: string;
  template: TestTemplate;
  // Add other fields as needed
}

const TestInstancePage: React.FC = () => {
  const { testId } = useParams<{ testId: string }>();
  const [test, setTest] = useState<TestInstance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!testId) return;
    setLoading(true);
    setError(null);
    fetch(`/api/tests/${testId}`)
      .then(async (res) => {
        if (!res.ok) throw new Error('Test not found');
        return res.json();
      })
      .then((response) => {
        // Handle the backend response structure where data is wrapped in a 'data' property
        const testData = response.data || response;
        setTest(testData);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [testId]);

  if (loading) return <div className="p-8 text-center">Loading test...</div>;
  if (error) return <div className="p-8 text-center text-red-600">Error: {error}</div>;
  if (!test) return <div className="p-8 text-center">Test not found.</div>;

  return (
    <div className="max-w-xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-4">{test.name}</h1>
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          {test.template?.icon && (
            <span className="inline-block text-2xl">{test.template.icon}</span>
          )}
          <span className="text-lg font-semibold">Template: {test.template?.name || 'Unknown Template'}</span>
        </div>
        <h2 className="text-xl font-semibold mt-4 mb-2">Test Steps</h2>
        <ol className="list-decimal list-inside space-y-2 bg-gray-50 rounded-lg p-4">
          {test.template?.flowDefinition && test.template.flowDefinition.length > 0 ? (
            test.template.flowDefinition.map((step, idx) => (
              <li key={idx} className="text-gray-800">{step}</li>
            ))
          ) : (
            <li>No steps defined for this template.</li>
          )}
        </ol>
      </div>
      {/* Add more test instance details here if needed */}
    </div>
  );
};

export default TestInstancePage; 