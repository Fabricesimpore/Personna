/**
 * Scenario Generator Service
 * Generates personalized scenarios for each persona
 */

interface PersonaTraits {
  name: string;
  age: number;
  occupation: string;
  experience: string;
  goals: string[];
  painPoints: string[];
  preferences: string[];
}

interface ScenarioRequest {
  personaTraits: PersonaTraits;
  taskPrompt: string;
  templateName: string;
}

/**
 * Generate personalized scenario for a task
 */
export async function generateScenario(request: ScenarioRequest): Promise<string> {
  const { personaTraits, taskPrompt, templateName } = request;
  
  try {
    // In a real implementation, this would call OpenAI API
    // For demo purposes, we'll generate contextual scenarios based on persona and task
    const scenario = generateContextualScenario(request);
    return scenario;
  } catch (error) {
    console.error('Error generating scenario:', error);
    return `As ${personaTraits.name}, you need to complete this task: ${taskPrompt}`;
  }
}

/**
 * Generate contextual scenarios based on persona and task
 */
function generateContextualScenario(request: ScenarioRequest): string {
  const { personaTraits, taskPrompt, templateName } = request;
  
  const scenarios: Record<string, string[]> = {
    'Basic Usability Test': [
      `You're ${personaTraits.name}, a ${personaTraits.age}-year-old ${personaTraits.occupation}. You're in a hurry to prepare for an important meeting and need to quickly update your profile settings.`,
      `As ${personaTraits.name}, you've just started using this new platform for your ${personaTraits.occupation.toLowerCase()} work. You need to configure your account settings before your first client call.`,
      `You're ${personaTraits.name}, and you're ${personaTraits.experience.toLowerCase()}. You're testing this interface because you want to ensure it meets your ${personaTraits.goals[0].toLowerCase()} needs.`
    ],
    'Click Test': [
      `You're ${personaTraits.name}, a ${personaTraits.occupation} who needs to quickly add a new client contact to your database. Time is of the essence as you have a meeting in 10 minutes.`,
      `As ${personaTraits.name}, you're ${personaTraits.experience.toLowerCase()} and need to efficiently manage your contact list. You're looking for the fastest way to add new contacts.`,
      `You're ${personaTraits.name}, and you value ${personaTraits.preferences[0].toLowerCase()}. You need to add a contact quickly while maintaining accuracy.`
    ],
    'Survey': [
      `You're ${personaTraits.name}, a ${personaTraits.age}-year-old ${personaTraits.occupation} who has been using this platform for a while. Your feedback is crucial for improving the user experience.`,
      `As ${personaTraits.name}, you're ${personaTraits.experience.toLowerCase()} and have experienced ${personaTraits.painPoints[0].toLowerCase()}. Your insights will help make this platform better for everyone.`,
      `You're ${personaTraits.name}, and you're focused on ${personaTraits.goals[0].toLowerCase()}. You want to provide detailed feedback to help improve this interface.`
    ],
    'Card Sort': [
      `You're ${personaTraits.name}, a ${personaTraits.occupation} who needs to organize product information for your team. Your categorization will help improve the site's navigation.`,
      `As ${personaTraits.name}, you're ${personaTraits.experience.toLowerCase()} and have a good understanding of how users think. Your organization skills will help create better user experiences.`,
      `You're ${personaTraits.name}, and you value ${personaTraits.preferences[0].toLowerCase()}. You want to organize these products in a way that makes sense to users like you.`
    ],
    'Tree Test': [
      `You're ${personaTraits.name}, a ${personaTraits.age}-year-old ${personaTraits.occupation} who needs to find specific information quickly. You're testing the navigation structure.`,
      `As ${personaTraits.name}, you're ${personaTraits.experience.toLowerCase()} and expect intuitive navigation. You're helping evaluate how easy it is to find information.`,
      `You're ${personaTraits.name}, and you've experienced ${personaTraits.painPoints[0].toLowerCase()}. You want to ensure this navigation is better than what you've used before.`
    ],
    'Live Intercept': [
      `You're ${personaTraits.name}, a ${personaTraits.occupation} who's exploring this interface for the first time. You're sharing your immediate thoughts and reactions.`,
      `As ${personaTraits.name}, you're ${personaTraits.experience.toLowerCase()} and have high expectations for user interfaces. You're providing real-time feedback on your experience.`,
      `You're ${personaTraits.name}, and you're focused on ${personaTraits.goals[0].toLowerCase()}. You're testing whether this interface meets your needs.`
    ],
    'Advanced UX Research': [
      `You're ${personaTraits.name}, a ${personaTraits.age}-year-old ${personaTraits.occupation} participating in comprehensive UX research. Your detailed feedback will shape future improvements.`,
      `As ${personaTraits.name}, you're ${personaTraits.experience.toLowerCase()} and have experienced ${personaTraits.painPoints[0].toLowerCase()}. You're providing in-depth analysis of this interface.`,
      `You're ${personaTraits.name}, and you value ${personaTraits.preferences[0].toLowerCase()}. You're conducting thorough testing to ensure this platform meets your standards.`
    ]
  };
  
  const templateScenarios = scenarios[templateName] || scenarios['Basic Usability Test'];
  const randomIndex = Math.floor(Math.random() * templateScenarios.length);
  
  return templateScenarios[randomIndex];
}

/**
 * Generate scenario for a specific task
 */
export function generateTaskScenario(personaTraits: PersonaTraits, taskPrompt: string, expectedEvent?: string): string {
  const baseScenarios: Record<string, string> = {
    'settings.opened': `You're ${personaTraits.name}, a ${personaTraits.occupation} who needs to access settings quickly. You're looking for the settings icon.`,
    'contact.added': `As ${personaTraits.name}, you need to add a new contact to your list. You're looking for the add contact button.`,
    'search.activated': `You're ${personaTraits.name}, and you need to find specific information. You're looking for the search functionality.`,
    'survey.completed': `As ${personaTraits.name}, you want to provide feedback about your experience. You're looking for the survey section.`,
    'cardSort.completed': `You're ${personaTraits.name}, and you need to organize information logically. You're looking for the card sort exercise.`,
    'rating.submitted': `As ${personaTraits.name}, you want to rate your experience. You're looking for the rating interface.`
  };
  
  if (expectedEvent && baseScenarios[expectedEvent]) {
    return baseScenarios[expectedEvent];
  }
  
  return `You're ${personaTraits.name}, a ${personaTraits.age}-year-old ${personaTraits.occupation}. ${taskPrompt}`;
} 