type EventHandler = (data?: any) => void;

class EventBus {
  private events: Map<string, EventHandler[]> = new Map();

  on(eventName: string, handler: EventHandler): void {
    if (!this.events.has(eventName)) {
      this.events.set(eventName, []);
    }
    this.events.get(eventName)!.push(handler);
  }

  off(eventName: string, handler: EventHandler): void {
    if (!this.events.has(eventName)) return;
    
    const handlers = this.events.get(eventName)!;
    const index = handlers.indexOf(handler);
    if (index > -1) {
      handlers.splice(index, 1);
    }
  }

  emit(eventName: string, data?: any): void {
    if (!this.events.has(eventName)) return;
    
    const handlers = this.events.get(eventName)!;
    handlers.forEach(handler => {
      try {
        handler(data);
      } catch (error) {
        console.error(`Error in event handler for ${eventName}:`, error);
      }
    });
  }

  once(eventName: string, handler: EventHandler): void {
    const onceHandler = (data?: any) => {
      handler(data);
      this.off(eventName, onceHandler);
    };
    this.on(eventName, onceHandler);
  }

  clear(): void {
    this.events.clear();
  }

  getEventCount(eventName: string): number {
    return this.events.get(eventName)?.length || 0;
  }
}

// Create a singleton instance
const eventBus = new EventBus();

// Export the singleton instance and types
export default eventBus;
export { EventBus };
export type { EventHandler }; 