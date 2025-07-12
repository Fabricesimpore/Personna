/**
 * Persona model - defines the schema for user personas
 */

export interface Persona {
  id: string;
  userId: string;
  runId: string;
  name: string;
  traitScores: Record<string, number>;
  painPoints: string[];
  quotes: string[];
  createdAt: Date;
  updatedAt: Date;
}

// In-memory storage for personas
class PersonaStore {
  private personas: Persona[] = [];
  private nextId = 1;

  /**
   * Create a new persona
   */
  create(data: Omit<Persona, 'id' | 'createdAt' | 'updatedAt'>): Persona {
    const persona: Persona = {
      id: this.nextId.toString(),
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.personas.push(persona);
    this.nextId++;

    return persona;
  }

  /**
   * Get persona by ID
   */
  getById(id: string): Persona | undefined {
    return this.personas.find(persona => persona.id === id);
  }

  /**
   * Get latest persona for a user
   */
  getLatestByUserId(userId: string): Persona | undefined {
    return this.personas
      .filter(persona => persona.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
  }

  /**
   * Get personas by user ID
   */
  getByUserId(userId: string): Persona[] {
    return this.personas
      .filter(persona => persona.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * Get persona by run ID
   */
  getByRunId(runId: string): Persona | undefined {
    return this.personas.find(persona => persona.runId === runId);
  }

  /**
   * Update persona
   */
  update(id: string, updates: Partial<Omit<Persona, 'id' | 'createdAt'>>): Persona | null {
    const persona = this.personas.find(p => p.id === id);
    if (!persona) return null;

    Object.assign(persona, updates, { updatedAt: new Date() });
    return persona;
  }

  /**
   * Delete persona
   */
  delete(id: string): boolean {
    const index = this.personas.findIndex(persona => persona.id === id);
    if (index === -1) return false;

    this.personas.splice(index, 1);
    return true;
  }

  /**
   * Get statistics for personas
   */
  getStats() {
    const total = this.personas.length;
    const byUser = this.personas.reduce((acc, persona) => {
      acc[persona.userId] = (acc[persona.userId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total,
      byUser,
      averageTraitScores: this.personas.length > 0 
        ? this.personas.reduce((acc, persona) => {
            Object.entries(persona.traitScores).forEach(([trait, score]) => {
              acc[trait] = (acc[trait] || 0) + score;
            });
            return acc;
          }, {} as Record<string, number>)
        : {}
    };
  }
}

// Export singleton instance
export const personaStore = new PersonaStore(); 