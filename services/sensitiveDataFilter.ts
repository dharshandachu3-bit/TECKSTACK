import { ActivityEvent } from '../shared/types.js';

export interface FilterResult {
  scrubbedEvent: ActivityEvent;
  hasSensitiveData: boolean;
  redactedFields: string[];
}

export class SensitiveDataFilter {
  // Regex patterns for sensitive knowledge-worker data
  private static CREDIT_CARD_REGEX = /\b(?:\d{4}[-\s]?){3}\d{4}\b/g;
  private static SSN_REGEX = /\b\d{3}-\d{2}-\d{4}\b/g;
  private static API_KEY_REGEX = /(?:api[_-]?key|secret|token|bearer|auth[_-]?token)[\s:=]+([a-zA-Z0-9_\-\.]{16,})/gi;
  private static PASSWORD_PARAM_REGEX = /(password|passwd|pwd|secret|access_token|refresh_token)[\s:=]+([^\s,;]+)/gi;
  private static JWT_REGEX = /eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}/g;

  /**
   * Filter and sanitize a string of potential sensitive tokens
   */
  public static scrubText(text: string): { cleanText: string; redacted: boolean } {
    if (!text || typeof text !== 'string') return { cleanText: text, redacted: false };

    let cleaned = text;
    let redacted = false;

    if (this.CREDIT_CARD_REGEX.test(cleaned)) {
      cleaned = cleaned.replace(this.CREDIT_CARD_REGEX, '[REDACTED_CREDIT_CARD]');
      redacted = true;
    }

    if (this.SSN_REGEX.test(cleaned)) {
      cleaned = cleaned.replace(this.SSN_REGEX, '[REDACTED_SSN]');
      redacted = true;
    }

    if (this.JWT_REGEX.test(cleaned)) {
      cleaned = cleaned.replace(this.JWT_REGEX, '[REDACTED_AUTH_TOKEN]');
      redacted = true;
    }

    if (this.PASSWORD_PARAM_REGEX.test(cleaned)) {
      cleaned = cleaned.replace(this.PASSWORD_PARAM_REGEX, '$1=[REDACTED_SECRET]');
      redacted = true;
    }

    return { cleanText: cleaned, redacted };
  }

  /**
   * Recursively scrub JSON metadata
   */
  public static scrubObject(obj: any, redactedList: string[] = []): any {
    if (obj === null || obj === undefined) return obj;

    if (typeof obj === 'string') {
      const { cleanText, redacted } = this.scrubText(obj);
      if (redacted) redactedList.push('text_content');
      return cleanText;
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.scrubObject(item, redactedList));
    }

    if (typeof obj === 'object') {
      const sanitized: Record<string, any> = {};
      for (const [key, value] of Object.entries(obj)) {
        const lowerKey = key.toLowerCase();
        if (
          lowerKey.includes('password') ||
          lowerKey.includes('secret') ||
          lowerKey.includes('token') ||
          lowerKey.includes('apikey') ||
          lowerKey.includes('creditcard') ||
          lowerKey.includes('cvv')
        ) {
          sanitized[key] = '[REDACTED_CONFIDENTIAL_KEY]';
          redactedList.push(key);
        } else {
          sanitized[key] = this.scrubObject(value, redactedList);
        }
      }
      return sanitized;
    }

    return obj;
  }

  /**
   * Full pipeline processor for an ActivityEvent
   */
  public static processEvent(rawEvent: Partial<ActivityEvent>): FilterResult {
    const redactedFields: string[] = [];

    const scrubbedAction = this.scrubText(rawEvent.action || '');
    if (scrubbedAction.redacted) redactedFields.push('action');

    const scrubbedTarget = this.scrubText(rawEvent.target || '');
    if (scrubbedTarget.redacted) redactedFields.push('target');

    const scrubbedMetadata = this.scrubObject(rawEvent.metadata || {}, redactedFields);

    const hasSensitiveData = redactedFields.length > 0;

    const scrubbedEvent: ActivityEvent = {
      id: rawEvent.id || `evt_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      userId: rawEvent.userId || '',
      sessionId: rawEvent.sessionId || 'sess_default',
      timestamp: rawEvent.timestamp || new Date().toISOString(),
      source: rawEvent.source || 'PROTOTYPE_SIMULATOR',
      application: rawEvent.application || 'Chrome',
      eventType: rawEvent.eventType || 'BUTTON_CLICKED',
      action: scrubbedAction.cleanText,
      target: scrubbedTarget.cleanText,
      metadata: scrubbedMetadata,
      isSimulated: rawEvent.isSimulated ?? true,
      sensitiveDataScrubbed: hasSensitiveData,
    };

    return {
      scrubbedEvent,
      hasSensitiveData,
      redactedFields,
    };
  }
}
