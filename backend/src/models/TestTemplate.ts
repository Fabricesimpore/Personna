/**
 * TestTemplate model - defines the schema and storage for test templates
 */

export interface TestTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  estimatedDuration: number; // in minutes
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  featured: boolean;
  icon: string; // Lucide React icon name
  shell: string; // Shell component name for the template
  flowDefinition: string[]; // Generated flow steps for the test
  preTestInstructions: string; // Instructions shown before the test starts
  tasks: TestTask[]; // Array of tasks to complete
  postTestQuestions: PostTestQuestion[]; // Questions asked after test completion
  personaTraits: PersonaTraits; // Persona information for the test
  createdAt: Date;
  updatedAt: Date;
}

export interface TestTask {
  id: string;
  prompt: string;
  duration: number; // in seconds
  targetElement?: string; // Optional element to click/find
  instructions: string;
  expectedEvent?: string; // Event that should be fired when task is completed
}

export interface PostTestQuestion {
  id: string;
  question: string;
  type: 'text' | 'rating' | 'multiple-choice';
  options?: string[]; // For multiple choice questions
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

// In-memory storage for templates
class TestTemplateStore {
  private templates: TestTemplate[] = [
    {
      id: 'spotOnClick',
      name: 'Spot-On Click Challenge',
      description: 'Quick click testing to evaluate user intuition and navigation patterns.',
      category: 'Interaction',
      estimatedDuration: 5,
      difficulty: 'beginner',
      tags: ['click', 'navigation', 'intuition'],
      featured: true,
      icon: 'MousePointer',
      shell: 'SpotOnClickShell',
      flowDefinition: [],
      preTestInstructions: 'You will be asked to find and click on specific elements. Trust your instincts and click naturally.',
      tasks: [
        {
          id: 'spotClick',
          prompt: 'Your goal: find our **Pricing** page. When you see it, click it—don\'t overthink it.',
          duration: 120,
          targetElement: 'pricing-link',
          instructions: 'Look for a pricing link or button and click it',
          expectedEvent: 'spotClick'
        },
        {
          id: 'clickRationale',
          prompt: 'Tell us why you clicked there, and if you hadn\'t found it, where you\'d look next.',
          duration: 180,
          targetElement: 'rationale-form',
          instructions: 'Explain your reasoning for the click and alternative search strategies',
          expectedEvent: 'rationale.submitted'
        },
        {
          id: 'confidenceRating',
          prompt: 'On a 1–5 scale, how confident are you that that was the Pricing link?',
          duration: 60,
          targetElement: 'confidence-scale',
          instructions: 'Rate your confidence from 1 (not confident) to 5 (very confident)',
          expectedEvent: 'rating.submitted'
        }
      ],
      postTestQuestions: [
        {
          id: 'q1',
          question: 'How intuitive was the pricing link placement?',
          type: 'rating',
          required: true
        },
        {
          id: 'q2',
          question: 'What would make the pricing link more discoverable?',
          type: 'text',
          required: false
        }
      ],
      personaTraits: {
        name: 'Quick Clicker',
        age: 0,
        occupation: 'Various',
        experience: 'Mixed',
        goals: ['Fast navigation', 'Intuitive interaction'],
        painPoints: ['Hidden elements', 'Unclear affordances'],
        preferences: ['Clear labels', 'Obvious buttons', 'Logical placement']
      },
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    },
    {
      id: 'rapidRecall',
      name: 'Rapid Recall Sprint',
      description: 'Memory testing through brief exposure and rapid recall exercises.',
      category: 'Memory',
      estimatedDuration: 6,
      difficulty: 'intermediate',
      tags: ['memory', 'recall', 'sprint'],
      featured: true,
      icon: 'Brain',
      shell: 'SprintRecallShell',
      flowDefinition: [],
      preTestInstructions: 'You will see screens briefly and then recall what you remember. Pay attention to details.',
      tasks: [
        {
          id: 'snapshotView',
          prompt: 'You\'ll see this screen for exactly 5 seconds. Absorb what you can—go!',
          duration: 5,
          targetElement: 'snapshot-screen',
          instructions: 'Observe the screen for exactly 5 seconds',
          expectedEvent: 'snapshotView.completed'
        },
        {
          id: 'memoryRecall',
          prompt: 'List everything you remember—features, labels, visuals.',
          duration: 180,
          targetElement: 'recall-form',
          instructions: 'Write down everything you can remember from the screen',
          expectedEvent: 'recall.submitted'
        },
        {
          id: 'highlightSelect',
          prompt: 'Which **two** elements stuck with you most, and why?',
          duration: 120,
          targetElement: 'highlight-form',
          instructions: 'Select the two most memorable elements and explain why',
          expectedEvent: 'highlight.submitted'
        }
      ],
      postTestQuestions: [
        {
          id: 'q1',
          question: 'How memorable was the interface design?',
          type: 'rating',
          required: true
        },
        {
          id: 'q2',
          question: 'What made certain elements more memorable than others?',
          type: 'text',
          required: false
        }
      ],
      personaTraits: {
        name: 'Memory Tester',
        age: 0,
        occupation: 'Various',
        experience: 'Mixed',
        goals: ['Quick learning', 'Visual retention'],
        painPoints: ['Forgettable interfaces', 'Poor visual hierarchy'],
        preferences: ['Clear visuals', 'Distinctive elements', 'Logical layout']
      },
      createdAt: new Date('2024-01-02'),
      updatedAt: new Date('2024-01-02')
    },
    {
      id: 'workflowDeepDive',
      name: 'Workflow Deep-Dive Review',
      description: 'Comprehensive workflow testing with think-aloud and task completion.',
      category: 'Workflow',
      estimatedDuration: 8,
      difficulty: 'advanced',
      tags: ['workflow', 'think-aloud', 'deep-dive'],
      featured: true,
      icon: 'Workflow',
      shell: 'DeepDiveShell',
      flowDefinition: [],
      preTestInstructions: 'You will explore workflows and complete tasks while thinking aloud. Share your thoughts freely.',
      tasks: [
        {
          id: 'exploreThinkAloud',
          prompt: 'You have 60 seconds to explore our new dashboard—think aloud what you expect each part to do.',
          duration: 60,
          targetElement: 'dashboard-explore',
          instructions: 'Explore the dashboard while thinking aloud about functionality',
          expectedEvent: 'explore.completed'
        },
        {
          id: 'updateProfile',
          prompt: 'Now, log in, open **Account Settings**, and upload a new profile picture.',
          duration: 300,
          targetElement: 'profile-upload',
          instructions: 'Complete the login and profile picture upload workflow',
          expectedEvent: 'profile.updated'
        },
        {
          id: 'flowFeedback',
          prompt: 'Rate the ease of that flow (1–5), then suggest one thing we could improve.',
          duration: 120,
          targetElement: 'feedback-form',
          instructions: 'Rate the workflow ease and provide improvement suggestions',
          expectedEvent: 'feedback.submitted'
        }
      ],
      postTestQuestions: [
        {
          id: 'q1',
          question: 'How intuitive was the overall workflow?',
          type: 'rating',
          required: true
        },
        {
          id: 'q2',
          question: 'What was the most challenging part of the workflow?',
          type: 'text',
          required: false
        },
        {
          id: 'q3',
          question: 'How would you improve the user experience?',
          type: 'text',
          required: false
        }
      ],
      personaTraits: {
        name: 'Workflow Explorer',
        age: 0,
        occupation: 'Various',
        experience: 'Mixed',
        goals: ['Efficient workflows', 'Intuitive processes'],
        painPoints: ['Complex steps', 'Unclear flows'],
        preferences: ['Logical sequences', 'Clear guidance', 'Efficient paths']
      },
      createdAt: new Date('2024-01-03'),
      updatedAt: new Date('2024-01-03')
    }
  ];

  /**
   * Get all templates
   */
  getAll(): TestTemplate[] {
    return [...this.templates];
  }

  /**
   * Get featured templates only
   */
  getFeatured(): TestTemplate[] {
    return this.templates.filter(template => template.featured);
  }

  /**
   * Get template by ID
   */
  getById(id: string): TestTemplate | undefined {
    return this.templates.find(template => template.id === id);
  }

  /**
   * Get templates by category
   */
  getByCategory(category: string): TestTemplate[] {
    return this.templates.filter(template => template.category === category);
  }

  /**
   * Search templates by name or description
   */
  search(query: string): TestTemplate[] {
    const lowerQuery = query.toLowerCase();
    return this.templates.filter(template => 
      template.name.toLowerCase().includes(lowerQuery) ||
      template.description.toLowerCase().includes(lowerQuery) ||
      template.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }
}

// Export singleton instance
export const testTemplateStore = new TestTemplateStore(); 