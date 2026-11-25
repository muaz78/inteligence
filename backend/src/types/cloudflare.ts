// Minimal Structural Cloudflare Workers & Durable Objects Interfaces
// Keeps backend strongly typed cleanly before installing `@cloudflare/workers-types`.
// Once `@cloudflare/workers-types` is installed, this can augment or alias its types directly.

export interface DurableObjectId {
  toString(): string;
  equals(other: DurableObjectId): boolean;
  readonly name?: string;
}

export interface DurableObjectStub {
  readonly id: DurableObjectId;
  readonly name?: string;
  fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
}

export interface DurableObjectNamespace {
  newUniqueId(options?: { jurisdiction?: string }): DurableObjectId;
  idFromName(name: string): DurableObjectId;
  idFromString(id: string): DurableObjectId;
  get(id: DurableObjectId): DurableObjectStub;
}

export interface DurableObjectStorage {
  get<T = unknown>(key: string): Promise<T | undefined>;
  get<T = unknown>(keys: string[]): Promise<Map<string, T>>;
  put<T = unknown>(key: string, value: T): Promise<void>;
  put<T = unknown>(entries: Record<string, T>): Promise<void>;
  delete(key: string): Promise<boolean>;
  delete(keys: string[]): Promise<number>;
  deleteAll(): Promise<void>;
  list<T = unknown>(options?: { prefix?: string; limit?: number }): Promise<Map<string, T>>;
  getAlarm(): Promise<number | null>;
  setAlarm(scheduledTime: number | Date): Promise<void>;
  deleteAlarm(): Promise<void>;
  transaction<T>(closure: (txn: DurableObjectStorage) => Promise<T>): Promise<T>;
}

export interface DurableObjectWebSocket extends WebSocket {
  serializeAttachment(attachment: unknown): void;
  deserializeAttachment(): unknown;
}

export interface DurableObjectState {
  readonly id: DurableObjectId;
  readonly storage: DurableObjectStorage;
  blockConcurrencyWhile<T>(callback: () => Promise<T>): Promise<T>;
  acceptWebSocket(ws: WebSocket, tags?: string[]): void;
  getWebSockets(tag?: string): DurableObjectWebSocket[];
  setWebSocketAutoResponse?(maybeReqResp?: unknown): void;
}

export interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}
