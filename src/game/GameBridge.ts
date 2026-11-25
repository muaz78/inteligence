// GameBridge: Decoupled event bus connecting React UI and Phaser 3 scenes
type Listener<T = unknown> = (data: T) => void;

class GameBridgeBus {
  private events: Map<string, Set<Listener>> = new Map();

  public on<T = unknown>(event: string, fn: Listener<T>) {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event)!.add(fn as Listener);
  }

  public off<T = unknown>(event: string, fn: Listener<T>) {
    if (this.events.has(event)) {
      this.events.get(event)!.delete(fn as Listener);
    }
  }

  public emit<T = unknown>(event: string, data?: T) {
    if (this.events.has(event)) {
      this.events.get(event)!.forEach((fn) => {
        try {
          fn(data);
        } catch (err) {
          console.error(`Error in GameBridge event [${event}]:`, err);
        }
      });
    }
  }
}

export const GameBridge = new GameBridgeBus();
