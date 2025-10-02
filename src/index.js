/**
 * Chyavan - Advanced user behavior tracking library
 * Production-ready implementation with privacy-first approach
 */

class Chyavan {
  constructor(options = {}) {
    this.config = {
      apiEndpoint: '/track',
      debug: false,
      bufferSize: 20,
      flushInterval: 5000,
      onFlush: null,
      consentCheck: () => localStorage.getItem('trackingConsent') === 'true',
      ...options
    };

    this.eventBuffer = [];
    this.isEnabled = false;
    this.observers = [];
    this.listeners = [];
    this.flushTimer = null;
    this.sessionId = this.generateSessionId();

    this.init();
  }

  /**
   * Initialize the tracker
   */
  init() {
    try {
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
    if (this.isEnabled) return;
    
    this.isEnabled = true;
    this.setupEventListeners();
    this.startFlushTimer();
    
    if (this.config.debug) {
      this.log('Tracking enabled');
    }
  }

  /**
   * Disable tracking
   */
  disable() {
    if (!this.isEnabled) return;
    
    this.isEnabled = false;
    this.cleanup();
    
    if (this.config.debug) {
      this.log('Tracking disabled');
    }
  }

  /**
   * Check if tracking is enabled
   */
  isEnabled() {
    return this.isEnabled;
  }

  /**
   * Track a custom event
   */
  track(type, data = {}) {
    if (!this.isEnabled) return;

    const event = {
      type,
      timestamp: Date.now(),
      data,
      sessionId: this.sessionId,
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    this.eventBuffer.push(event);

    if (this.config.debug) {
      this.log('Event tracked:', type, data);
    }

    // Auto-flush if buffer is full
    if (this.eventBuffer.length >= this.config.bufferSize) {
      this.flush();
    }
  }

  /**
   * Flush buffered events
   */
  async flush() {
    if (this.eventBuffer.length === 0) return;

    const events = [...this.eventBuffer];
    this.eventBuffer = [];

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
    if (!this.config.apiEndpoint) return;

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
   * Destroy the instance
   */
  destroy() {
    this.disable();
    this.eventBuffer = [];
    this.sessionId = null;
  }
}

// Auto-initialize if DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    // Auto-initialization happens in constructor
  });
}

export default Chyavan;
  