/**
 * Chyavan - Advanced user behavior tracking library
 */

export interface ChyavanOptions {
  /** API endpoint for sending tracking data */
  apiEndpoint?: string;
  /** Enable debug mode */
  debug?: boolean;
  /** Buffer size for batching events */
  bufferSize?: number;
  /** Callback when events are flushed */
  onFlush?: (events: TrackingEvent[]) => void;
  /** Consent check function */
  consentCheck?: () => boolean;
}

export interface TrackingEvent {
  /** Event type identifier */
  type: string;
  /** Event timestamp */
  timestamp?: number;
  /** Event data payload */
  data?: Record<string, any>;
  /** Element selector if applicable */
  element?: string;
  /** User ID if available */
  userId?: string;
  /** Session ID */
  sessionId?: string;
}

export interface KeystrokeEvent extends TrackingEvent {
  type: 'keystroke';
  data: {
    element: string;
    fieldType: string;
    sanitized: string;
    length: number;
  };
}

export interface MouseEvent extends TrackingEvent {
  type: 'mouse';
  data: {
    x: number;
    y: number;
    element?: string;
    action: 'click' | 'move' | 'hover';
  };
}

export interface ScrollEvent extends TrackingEvent {
  type: 'scroll';
  data: {
    x: number;
    y: number;
    percentage: number;
  };
}

export type ChyavanEvent = KeystrokeEvent | MouseEvent | ScrollEvent | TrackingEvent;

declare class Chyavan {
  constructor(options?: ChyavanOptions);
  
  /** Track a custom event */
  track(type: string, data?: Record<string, any>): void;
  
  /** Flush buffered events */
  flush(): void;
  
  /** Check if tracking is enabled */
  isEnabled(): boolean;
  
  /** Enable tracking */
  enable(): void;
  
  /** Disable tracking */
  disable(): void;
  
  /** Destroy the instance */
  destroy(): void;
  
  /** Get current configuration */
  getConfig(): ChyavanOptions;
  
  /** Update configuration */
  updateConfig(options: Partial<ChyavanOptions>): void;
}

export default Chyavan;
