/**
 * API service module
 * Exports functions for communicating with the backend API
 */

// Base API URL - uses proxy in development
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-api-domain.com' 
  : '';

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  meta?: any;
}

export interface TestTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  estimatedDuration: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  featured: boolean;
  icon: string;
  shell: string;
  flowDefinition: string[];
  preTestInstructions: string;
  tasks: TestTask[];
  postTestQuestions: PostTestQuestion[];
  personaTraits: PersonaTraits;
  createdAt: string;
  updatedAt: string;
}

export interface TestTask {
  id: string;
  prompt: string;
  duration: number;
  targetElement?: string;
  instructions: string;
  expectedEvent?: string; // Event that should be fired when task is completed
}

export interface PostTestQuestion {
  id: string;
  question: string;
  type: 'text' | 'rating' | 'multiple-choice';
  options?: string[];
  required: boolean;
}

export interface PersonaTraits {
  name: string;
  age: number;
  occupation: string;
  experience: string;
  goals: string[];
  painPoints: string[];
  preferences: string[];
}

export interface CreateTestResponse {
  testId: string;
}

/**
 * Generic API request function with error handling
 */
async function apiRequest<T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

/**
 * Fetch all test templates
 * @returns Promise with templates data
 */
export async function getTemplates(): Promise<TestTemplate[]> {
  const response = await apiRequest<TestTemplate[]>('/api/test-templates');
  return response.data;
}

/**
 * Create a new test instance from a template
 * @param templateId - The ID of the template to use
 * @returns Promise with the created test ID
 */
export async function createTest(templateId: string): Promise<{ testId: string }> {
  const response = await apiRequest<any>('/api/tests', {
    method: 'POST',
    body: JSON.stringify({ templateId }),
  });
  // The backend returns { data: { ...testInstance } }
  return { testId: response.data.id };
}

/**
 * Submit test responses and collect persona data
 * @param data - The test response data
 * @returns Promise with the submission result
 */
export async function submitTestResponses(data: {
  templateId: string;
  testType: string;
  responses?: any[];
  userNotes?: string;
  totalTime?: number;
  completionRate?: number;
  averageDifficulty?: number;
  totalErrors?: number;
  totalAttempts?: number;
  userBehavior?: any;
  averageAccuracy?: number;
  totalMousePathPoints?: number;
  averageTaskTime?: number;
  averageResponseTime?: number;
  averageConfidence?: number;
  totalChanges?: number;
  totalHesitations?: number;
}): Promise<{ personaId: string; insights: any }> {
  const response = await apiRequest<{
    personaId: string;
    insights: any;
  }>('/api/test-responses', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return {
    personaId: response.data.personaId,
    insights: response.data.insights
  };
}

/**
 * Get the current user's latest persona
 * @returns Promise with the persona data
 */
export async function getMyPersona(): Promise<{
  personaId: string;
  name: string;
  traitScores: Record<string, number>;
  painPoints: string[];
  quotes: string[];
  createdAt: string;
}> {
  const response = await apiRequest<{
    personaId: string;
    name: string;
    traitScores: Record<string, number>;
    painPoints: string[];
    quotes: string[];
    createdAt: string;
  }>('/api/personas/me');
  return response.data;
}

/**
 * Get a specific persona by ID
 * @param id - The persona ID
 * @returns Promise with the persona data
 */
export async function getPersonaById(id: string): Promise<{
  id: string;
  userId: string;
  runId: string;
  name: string;
  traitScores: Record<string, number>;
  painPoints: string[];
  quotes: string[];
  createdAt: string;
  updatedAt: string;
}> {
  const response = await apiRequest<{
    id: string;
    userId: string;
    runId: string;
    name: string;
    traitScores: Record<string, number>;
    painPoints: string[];
    quotes: string[];
    createdAt: string;
    updatedAt: string;
  }>(`/api/personas/${id}`);
  return response.data;
} 