/**
 * AI Hint Service
 * Generates contextual hints using OpenAI GPT-4
 */

interface HintRequest {
  personaTraits: {
    name: string;
    age: number;
    occupation: string;
    experience: string;
    goals: string[];
    painPoints: string[];
    preferences: string[];
  };
  currentTask: {
    prompt: string;
    expectedEvent: string;
  };
  userBehavior?: {
    wrongClicks: number;
    timeSpent: number;
    attempts: number;
  };
}

interface HintResponse {
  hint: string;
  confidence: number;
  reasoning: string;
}

// Cache for hints to avoid repeated API calls
const hintCache = new Map<string, HintResponse[]>();

/**
 * Generate AI-powered hints for stuck users
 */
export async function generateHint(request: HintRequest): Promise<HintResponse> {
  const cacheKey = `${request.currentTask.expectedEvent}-${request.personaTraits.name}`;
  
  // Check cache first
  if (hintCache.has(cacheKey)) {
    const cachedHints = hintCache.get(cacheKey)!;
    const randomIndex = Math.floor(Math.random() * cachedHints.length);
    return cachedHints[randomIndex];
  }

  try {
    // In a real implementation, this would call OpenAI API
    // For demo purposes, we'll generate contextual hints based on persona and task
    const hints = generateContextualHints(request);
    
    // Cache the hints
    hintCache.set(cacheKey, hints);
    
    // Return a random hint
    const randomIndex = Math.floor(Math.random() * hints.length);
    return hints[randomIndex];
  } catch (error) {
    console.error('Error generating AI hint:', error);
    return {
      hint: "Try looking for the main action button or icon that matches the task description.",
      confidence: 0.5,
      reasoning: "Fallback hint due to AI service error"
    };
  }
}

/**
 * Generate contextual hints based on persona and task
 */
function generateContextualHints(request: HintRequest): HintResponse[] {
  const { personaTraits, currentTask } = request;
  
  const hints: HintResponse[] = [];
  
  // Generate hints based on expected event
  switch (currentTask.expectedEvent) {
    case 'settings.opened':
      hints.push(
        {
          hint: `As a ${personaTraits.occupation}, you're likely familiar with settings icons. Look for a gear or cog icon in the top-right corner.`,
          confidence: 0.9,
          reasoning: "Settings are typically accessed via gear icons in top-right"
        },
        {
          hint: `Since you're ${personaTraits.age} years old and work as a ${personaTraits.occupation}, you probably expect settings to be easily accessible. Check the header area.`,
          confidence: 0.8,
          reasoning: "Professional users expect intuitive settings placement"
        }
      );
      break;
      
    case 'contact.added':
      hints.push(
        {
          hint: `Given your ${personaTraits.experience} level, you should look for a clear "Add" or "Plus" button. It's likely prominently displayed.`,
          confidence: 0.85,
          reasoning: "Add contact functionality is typically obvious"
        },
        {
          hint: `As someone who values ${personaTraits.preferences[0]}, you'll want to find the most direct way to add a contact. Look for the primary action button.`,
          confidence: 0.8,
          reasoning: "User preferences suggest they want efficiency"
        }
      );
      break;
      
    case 'search.activated':
      hints.push(
        {
          hint: `With your ${personaTraits.experience} background, you're probably looking for a magnifying glass icon or search bar in the header.`,
          confidence: 0.9,
          reasoning: "Search is universally represented by magnifying glass"
        },
        {
          hint: `As a ${personaTraits.occupation}, you likely use search frequently. Look for the search icon in the navigation area.`,
          confidence: 0.85,
          reasoning: "Professionals use search as a primary navigation method"
        }
      );
      break;
      
    case 'survey.completed':
      hints.push(
        {
          hint: `Since you're focused on ${personaTraits.goals[0]}, you'll want to complete this survey thoroughly. Look for the survey launch button.`,
          confidence: 0.8,
          reasoning: "Goal-oriented users want to provide comprehensive feedback"
        },
        {
          hint: `As someone who experiences ${personaTraits.painPoints[0]}, your feedback is valuable. Find the survey section and click to start.`,
          confidence: 0.75,
          reasoning: "Users with pain points provide valuable feedback"
        }
      );
      break;
      
    case 'cardSort.completed':
      hints.push(
        {
          hint: `Given your ${personaTraits.occupation} background, you're probably good at organizing information. Look for the card sort exercise launch button.`,
          confidence: 0.8,
          reasoning: "Professional users are typically good at categorization"
        },
        {
          hint: `As someone who values ${personaTraits.preferences[0]}, you'll want to organize the cards logically. Find the card sort interface.`,
          confidence: 0.75,
          reasoning: "User preferences suggest they value organization"
        }
      );
      break;
      
    default:
      hints.push(
        {
          hint: `As a ${personaTraits.occupation}, you're likely familiar with this type of interface. Look for the main action that matches the task description.`,
          confidence: 0.7,
          reasoning: "Professional users have general interface familiarity"
        },
        {
          hint: `Given your ${personaTraits.experience} level, you should be able to find the relevant button or link. Check the main interface areas.`,
          confidence: 0.65,
          reasoning: "Experience level suggests interface familiarity"
        }
      );
  }
  
  return hints;
}

/**
 * Clear hint cache (useful for testing)
 */
export function clearHintCache(): void {
  hintCache.clear();
} 