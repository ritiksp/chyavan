/**
 * Chyavan - Advanced user behavior tracking library
 * Production-ready implementation with privacy-first approach
 */

class Chyavan {
    constructor(options = {}) {
      this.config = {
        mode: 'console', // 'console' | 'hosted' | 'self-hosted'
        apiKey: null, // For hosted mode
        apiEndpoint: null, // For self-hosted mode
        debug: false,
        bufferSize: 20,
        flushInterval: 5000,
        onFlush: null,
        consentCheck: () => localStorage.getItem('trackingConsent') === 'true',
        ...options
      };
  
      // Determine actual endpoint based on mode
      this.config.apiEndpoint = this.getEndpoint();
  
      this.eventBuffer = [];
      this.isTrackingEnabled = false;
      this.observers = [];
      this.listeners = [];
      this.flushTimer = null;
      this.sessionId = this.generateSessionId();
  
      this.init();
    }
  
    /**
     * Determine endpoint based on mode
     */
    getEndpoint() {
      const { mode, apiKey, apiEndpoint } = this.config;
  
      if (mode === 'console') return null;
      if (mode === 'self-hosted' && apiEndpoint) return apiEndpoint;
      if (mode === 'hosted' && apiKey) {
        return `https://api.chyavan.io/track?key=${apiKey}`;
      }
      
      // Legacy support: if apiEndpoint is provided directly
      if (apiEndpoint) return apiEndpoint;
      
      return null;
    }
  
    /**
     * Initialize the tracker
     */
    init() {
      try {
        // Console mode doesn't need consent
        if (this.config.mode === 'console') {
          this.enable();
          this.logConsole('🚀 Chyavan initialized in CONSOLE mode');
          this.logConsole('💡 Events will be displayed in this console');
          this.logConsole('📊 Try interacting with the page to see events!');
          return;
        }
  
        // Other modes need consent
        if (this.config.consentCheck()) {
          this.enable();
          if (this.config.debug) {
            this.log('Chyavan initialized with consent');
          }
        } else {
          if (this.config.debug) {
            this.log('Chyavan initialized but tracking disabled - no consent');
          }
        }
      } catch (error) {
        this.log('Error initializing Chyavan:', error);
      }
    }
  
    /**
     * Enable tracking
     */
    enable() {
      if (this.isTrackingEnabled) return;
      
      this.isTrackingEnabled = true;
      this.setupEventListeners();
      
      if (this.config.mode !== 'console') {
        this.startFlushTimer();
      }
      
      if (this.config.debug) {
        this.log('Tracking enabled');
      }
    }
  
    /**
     * Disable tracking
     */
    disable() {
      if (!this.isTrackingEnabled) return;
      
      this.isTrackingEnabled = false;
      this.cleanup();
      
      if (this.config.debug) {
        this.log('Tracking disabled');
      }
    }
  
    /**
     * Check if tracking is enabled
     */
    isEnabled() {
      return this.isTrackingEnabled;
    }
  
    /**
     * Track a custom event
     */
    track(type, data = {}) {
      if (!this.isTrackingEnabled) return;
  
      const event = {
        type,
        timestamp: Date.now(),
        data,
        sessionId: this.sessionId,
        url: window.location.href,
        userAgent: navigator.userAgent
      };
  
      this.eventBuffer.push(event);
  
      // Console mode: show immediately
      if (this.config.mode === 'console') {
        this.displayEventInConsole(event);
      }
  
      if (this.config.debug) {
        this.log('Event tracked:', type, data);
      }
  
      // Auto-flush if buffer is full
      if (this.eventBuffer.length >= this.config.bufferSize) {
        this.flush();
      }
    }
  
    /**
     * Display event in console (console mode)
     */
    displayEventInConsole(event) {
      const styles = {
        header: 'background: #667eea; color: white; padding: 4px 8px; border-radius: 3px; font-weight: bold;',
        type: 'color: #4299e1; font-weight: bold;',
        timestamp: 'color: #718096; font-size: 0.9em;',
        data: 'color: #2d3748;'
      };
  
      console.groupCollapsed(
        `%c🔍 Chyavan %c${event.type}%c @ ${new Date(event.timestamp).toLocaleTimeString()}`,
        styles.header,
        styles.type,
        styles.timestamp
      );
      
      console.log('%cEvent Type:', styles.type, event.type);
      console.log('%cTimestamp:', styles.timestamp, new Date(event.timestamp).toLocaleString());
      console.log('%cSession ID:', styles.data, event.sessionId);
      console.log('%cData:', styles.data, event.data);
      console.log('%cURL:', styles.data, event.url);
      
      console.groupEnd();
    }
  
    /**
     * Flush buffered events
     */
    async flush() {
      if (this.eventBuffer.length === 0) return;
  
      const events = [...this.eventBuffer];
      this.eventBuffer = [];
  
      // Console mode: display summary
      if (this.config.mode === 'console') {
        this.logConsole(`📦 Buffer contains ${events.length} events`);
        console.table(events.map(e => ({
          Type: e.type,
          Time: new Date(e.timestamp).toLocaleTimeString(),
          Data: JSON.stringify(e.data).substring(0, 50)
        })));
        return;
      }
  
      try {
        if (this.config.onFlush) {
          this.config.onFlush(events);
        }
  
        await this.sendEvents(events);
        
        if (this.config.debug) {
          this.log(`Flushed ${events.length} events`);
        }
      } catch (error) {
        this.log('Error flushing events:', error);
        // Re-add events to buffer on failure
        this.eventBuffer.unshift(...events);
      }
    }
  
    /**
     * Send events to server
     */
    async sendEvents(events) {
      if (!this.config.apiEndpoint) {
        if (this.config.debug) {
          this.log('No API endpoint configured, events not sent');
        }
        return;
      }
  
      const response = await fetch(this.config.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ events })
      });
  
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
  
      return response.json();
    }
  
    /**
     * Setup event listeners
     */
    setupEventListeners() {
      // Keystroke tracking
      this.setupKeystrokeTracking();
      
      // Mouse tracking
      this.setupMouseTracking();
      
      // Scroll tracking
      this.setupScrollTracking();
    }
  
    /**
     * Setup keystroke tracking
     */
    setupKeystrokeTracking() {
      const debouncedLog = this.debounce((target, value) => {
        if (this.isSensitiveField(target)) return;
  
        this.track('keystroke', {
          element: target.tagName,
          fieldType: target.type,
          sanitized: this.sanitizeText(value),
          length: value.length
        });
      }, 400);
  
      // Input event listeners
      const inputs = document.querySelectorAll('input, textarea');
      inputs.forEach(input => {
        if (this.isSensitiveField(input)) return;
        
        const listener = (e) => debouncedLog(e.target, e.target.value);
        input.addEventListener('input', listener);
        this.listeners.push({ element: input, event: 'input', handler: listener });
      });
  
      // Mutation observer for dynamic content
      const observer = new MutationObserver((mutations) => {
        try {
          for (const mutation of mutations) {
            if (mutation.type === 'characterData') {
              const el = mutation.target.parentElement;
              if (!el || this.isSensitiveField(el)) continue;
              
              const value = mutation.target.nodeValue;
              debouncedLog(el, value);
            }
          }
        } catch (err) {
          this.log('Observer error:', err);
        }
      });
  
      observer.observe(document.body, {
        subtree: true,
        characterData: true,
        childList: true,
      });
  
      this.observers.push(observer);
    }
  
    /**
     * Setup mouse tracking
     */
    setupMouseTracking() {
      const mouseHandler = (e) => {
        this.track('mouse', {
          x: e.clientX,
          y: e.clientY,
          element: e.target.tagName,
          action: e.type
        });
      };
  
      document.addEventListener('click', mouseHandler);
      this.listeners.push({ element: document, event: 'click', handler: mouseHandler });
    }
  
    /**
     * Setup scroll tracking
     */
    setupScrollTracking() {
      const scrollHandler = this.debounce(() => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
        const maxScrollTop = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercentage = Math.round((scrollTop / maxScrollTop) * 100);
  
        this.track('scroll', {
          x: scrollLeft,
          y: scrollTop,
          percentage: scrollPercentage
        });
      }, 200);
  
      window.addEventListener('scroll', scrollHandler);
      this.listeners.push({ element: window, event: 'scroll', handler: scrollHandler });
    }
  
    /**
     * Check if field is sensitive
     */
    isSensitiveField(el) {
      if (!el) return false;
      
      const type = (el.type || '').toLowerCase();
      const name = (el.name || '').toLowerCase();
      const autocomplete = (el.autocomplete || '').toLowerCase();
  
      return (
        type === 'password' ||
        type === 'hidden' ||
        name.includes('card') ||
        name.includes('cvv') ||
        name.includes('password') ||
        name.includes('ssn') ||
        name.includes('secret') ||
        name.includes('token') ||
        autocomplete.startsWith('cc-')
      );
    }
  
    /**
     * Sanitize text before logging
     */
    sanitizeText(text) {
      if (!text) return '';
      
      const onlyDigits = /^\d+$/;
      if (onlyDigits.test(text)) {
        return `[${text.length} digits]`;
      }
      return `[${text.length} characters]`;
    }
  
    /**
     * Debounce function
     */
    debounce(fn, delay) {
      let timeout;
      return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn.apply(this, args), delay);
      };
    }
  
    /**
     * Start flush timer
     */
    startFlushTimer() {
      this.flushTimer = setInterval(() => {
        this.flush();
      }, this.config.flushInterval);
    }
  
    /**
     * Cleanup resources
     */
    cleanup() {
      // Clear flush timer
      if (this.flushTimer) {
        clearInterval(this.flushTimer);
        this.flushTimer = null;
      }
  
      // Disconnect observers
      this.observers.forEach(observer => observer.disconnect());
      this.observers = [];
  
      // Remove event listeners
      this.listeners.forEach(({ element, event, handler }) => {
        element.removeEventListener(event, handler);
      });
      this.listeners = [];
    }
  
    /**
     * Generate session ID
     */
    generateSessionId() {
      return 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    }
  
    /**
     * Get current configuration
     */
    getConfig() {
      return { ...this.config };
    }
  
    /**
     * Update configuration
     */
    updateConfig(newConfig) {
      this.config = { ...this.config, ...newConfig };
      this.config.apiEndpoint = this.getEndpoint();
    }
  
    /**
     * Logging utility
     */
    log(...args) {
      if (this.config.debug) {
        console.log('[Chyavan]', ...args);
      }
    }
  
    /**
     * Console mode logging
     */
    logConsole(...args) {
      if (this.config.mode === 'console') {
        console.log(
          '%c[Chyavan]',
          'background: #667eea; color: white; padding: 2px 6px; border-radius: 3px; font-weight: bold;',
          ...args
        );
      }
    }
  
    /**
     * Export events (useful for local development)
     */
    export(format = 'json') {
      const data = {
        sessionId: this.sessionId,
        exportedAt: new Date().toISOString(),
        events: this.eventBuffer,
        config: {
          mode: this.config.mode,
          bufferSize: this.config.bufferSize
        }
      };
  
      if (format === 'json') {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chyavan-events-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        this.logConsole('📥 Events exported as JSON');
      }
    }
  
    /**
     * Destroy the instance
     */
    destroy() {
      this.disable();
      this.eventBuffer = [];
      this.sessionId = null;
      
      if (this.config.mode === 'console') {
        this.logConsole('👋 Chyavan tracker destroyed');
      }
    }
  }
  
  // Auto-initialize if DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      // Auto-initialization happens in constructor
    });
  }
  
  export default Chyavan;