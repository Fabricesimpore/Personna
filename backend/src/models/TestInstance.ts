/**
 * TestInstance model - defines the schema for created test instances
 */

export interface TestInstance {
  id: string;
  templateId: string;
  name: string;
  description: string;
  status: 'draft' | 'active' | 'completed' | 'archived';
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  score?: number;
  maxScore?: number;
  userId?: string; // For future user authentication
}

// In-memory storage for test instances
class TestInstanceStore {
  private instances: TestInstance[] = [];
  private nextId = 1;

  /**
   * Create a new test instance from a template
   */
  createFromTemplate(templateId: string, templateName: string, templateDescription: string): TestInstance {
    const instance: TestInstance = {
      id: this.nextId.toString(),
      templateId,
      name: templateName,
      description: templateDescription,
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.instances.push(instance);
    this.nextId++;

    return instance;
  }

  /**
   * Get all test instances
   */
  getAll(): TestInstance[] {
    return [...this.instances];
  }

  /**
   * Get test instance by ID
   */
  getById(id: string): TestInstance | undefined {
    return this.instances.find(instance => instance.id === id);
  }

  /**
   * Get test instances by template ID
   */
  getByTemplateId(templateId: string): TestInstance[] {
    return this.instances.filter(instance => instance.templateId === templateId);
  }

  /**
   * Update test instance status
   */
  updateStatus(id: string, status: TestInstance['status']): TestInstance | null {
    const instance = this.instances.find(inst => inst.id === id);
    if (!instance) return null;

    instance.status = status;
    instance.updatedAt = new Date();

    // Set startedAt if transitioning to active
    if (status === 'active' && !instance.startedAt) {
      instance.startedAt = new Date();
    }

    // Set completedAt if transitioning to completed
    if (status === 'completed' && !instance.completedAt) {
      instance.completedAt = new Date();
    }

    return instance;
  }

  /**
   * Update test instance score
   */
  updateScore(id: string, score: number, maxScore: number): TestInstance | null {
    const instance = this.instances.find(inst => inst.id === id);
    if (!instance) return null;

    instance.score = score;
    instance.maxScore = maxScore;
    instance.updatedAt = new Date();

    return instance;
  }

  /**
   * Delete test instance
   */
  delete(id: string): boolean {
    const index = this.instances.findIndex(instance => instance.id === id);
    if (index === -1) return false;

    this.instances.splice(index, 1);
    return true;
  }

  /**
   * Get statistics for test instances
   */
  getStats() {
    const total = this.instances.length;
    const byStatus = this.instances.reduce((acc, instance) => {
      acc[instance.status] = (acc[instance.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const averageScore = this.instances
      .filter(instance => instance.score !== undefined)
      .reduce((sum, instance) => sum + (instance.score || 0), 0) / 
      this.instances.filter(instance => instance.score !== undefined).length;

    return {
      total,
      byStatus,
      averageScore: isNaN(averageScore) ? 0 : averageScore
    };
  }
}

// Export singleton instance
export const testInstanceStore = new TestInstanceStore(); 