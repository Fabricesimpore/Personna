/**
 * Persona service - handles persona generation from test run data
 */

import { personaStore } from '../models/Persona';

// In-memory test runs storage (imported from tests.ts)
const testRuns: Map<string, any> = new Map();

export interface PersonaData {
  personaId: string;
  persona: {
    id: string;
    userId: string;
    runId: string;
    name: string;
    traitScores: Record<string, number>;
    painPoints: string[];
    quotes: string[];
    createdAt: Date;
    updatedAt: Date;
  };
}

/**
 * Build persona from test run data
 */
export async function buildPersona(runId: string): Promise<PersonaData> {
  // Get test run data
  const testRun = testRuns.get(runId);
  if (!testRun) {
    throw new Error(`Test run ${runId} not found`);
  }

  // Extract data from test run
  const { events = [], transcript = '', surveyResponses = [], userId } = testRun;

  // Compute trait scores from insights engine
  const traitScores = computeTraitScores(events, transcript, surveyResponses);

  // Extract pain points from transcript
  const painPoints = extractPainPoints(transcript);

  // Extract quotes from transcript
  const quotes = extractQuotes(transcript);

  // Generate persona name based on dominant traits
  const name = generatePersonaName(traitScores);

  // Create persona
  const persona = personaStore.create({
    userId,
    runId,
    name,
    traitScores,
    painPoints,
    quotes
  });

  return {
    personaId: persona.id,
    persona
  };
}

/**
 * Compute trait scores from test run data
 */
function computeTraitScores(events: any[], transcript: string, surveyResponses: any[]): Record<string, number> {
  const scores: Record<string, number> = {
    'Analytical': 0,
    'Creative': 0,
    'Social': 0,
    'Practical': 0,
    'Confident': 0,
    'Cautious': 0,
    'Efficient': 0,
    'Thorough': 0
  };

  // Analyze events for behavioral patterns
  const eventTypes = events.map(e => e.type);
  const eventCounts = eventTypes.reduce((acc, type) => {
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Score based on event patterns
  if (eventCounts['click'] > 10) scores['Practical'] += 0.3;
  if (eventCounts['hover'] > 5) scores['Cautious'] += 0.2;
  if (eventCounts['scroll'] > 3) scores['Thorough'] += 0.2;
  if (eventCounts['keypress'] > 20) scores['Efficient'] += 0.3;

  // Analyze transcript for personality indicators
  const transcriptLower = transcript.toLowerCase();
  
  if (transcriptLower.includes('think') || transcriptLower.includes('analyze')) {
    scores['Analytical'] += 0.4;
  }
  if (transcriptLower.includes('creative') || transcriptLower.includes('imagine')) {
    scores['Creative'] += 0.4;
  }
  if (transcriptLower.includes('people') || transcriptLower.includes('team')) {
    scores['Social'] += 0.4;
  }
  if (transcriptLower.includes('confident') || transcriptLower.includes('sure')) {
    scores['Confident'] += 0.3;
  }

  // Analyze survey responses
  surveyResponses.forEach(response => {
    if (response.question && response.answer) {
      const question = response.question.toLowerCase();
      const answer = response.answer.toLowerCase();
      
      if (question.includes('confidence') && answer.includes('high')) {
        scores['Confident'] += 0.2;
      }
      if (question.includes('preference') && answer.includes('creative')) {
        scores['Creative'] += 0.2;
      }
    }
  });

  // Normalize scores to 0-1 range
  Object.keys(scores).forEach(key => {
    scores[key] = Math.min(Math.max(scores[key], 0), 1);
  });

  return scores;
}

/**
 * Extract pain points from transcript
 */
function extractPainPoints(transcript: string): string[] {
  const painPoints: string[] = [];
  const sentences = transcript.split(/[.!?]+/).filter(s => s.trim().length > 10);
  
  const painKeywords = [
    'frustrated', 'confused', 'difficult', 'hard', 'problem', 'issue',
    'doesn\'t work', 'broken', 'slow', 'complicated', 'unclear',
    'annoying', 'bothersome', 'trouble', 'struggle', 'challenge'
  ];

  sentences.forEach(sentence => {
    const lowerSentence = sentence.toLowerCase();
    if (painKeywords.some(keyword => lowerSentence.includes(keyword))) {
      const cleanSentence = sentence.trim().replace(/^["']|["']$/g, '');
      if (cleanSentence.length > 10 && cleanSentence.length < 200) {
        painPoints.push(cleanSentence);
      }
    }
  });

  // Return top 3 pain points
  return painPoints.slice(0, 3);
}

/**
 * Extract quotes from transcript
 */
function extractQuotes(transcript: string): string[] {
  const quotes: string[] = [];
  const sentences = transcript.split(/[.!?]+/).filter(s => s.trim().length > 15);
  
  // Look for sentences that sound like direct quotes
  sentences.forEach(sentence => {
    const cleanSentence = sentence.trim().replace(/^["']|["']$/g, '');
    if (cleanSentence.length > 20 && cleanSentence.length < 150) {
      // Check if it sounds like a direct quote (contains personal pronouns, opinions, etc.)
      const lowerSentence = cleanSentence.toLowerCase();
      if (
        lowerSentence.includes('i ') || 
        lowerSentence.includes('me ') ||
        lowerSentence.includes('my ') ||
        lowerSentence.includes('think') ||
        lowerSentence.includes('feel') ||
        lowerSentence.includes('like') ||
        lowerSentence.includes('prefer')
      ) {
        quotes.push(cleanSentence);
      }
    }
  });

  // Return 3-5 quotes
  return quotes.slice(0, 5);
}

/**
 * Generate persona name based on dominant traits
 */
function generatePersonaName(traitScores: Record<string, number>): string {
  const dominantTraits = Object.entries(traitScores)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 2)
    .map(([trait]) => trait);

  const names = [
    'Alex', 'Jordan', 'Casey', 'Taylor', 'Morgan', 'Riley', 'Quinn', 'Avery',
    'Sam', 'Drew', 'Blake', 'Cameron', 'Jamie', 'Parker', 'Reese', 'Dakota'
  ];

  const randomName = names[Math.floor(Math.random() * names.length)];
  const traitDescriptor = dominantTraits[0]?.toLowerCase() || 'balanced';
  
  return `${randomName} the ${traitDescriptor}`;
}

/**
 * Set test runs data (called from tests.ts)
 */
export function setTestRuns(runs: Map<string, any>) {
  Object.assign(testRuns, runs);
} 