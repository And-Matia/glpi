import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class LoggerService {
  /**
   * Logs a PS API error to the console with full context and returns a
   * human-readable message suitable for re-throwing.
   */
  apiError(err: HttpErrorResponse): string {
    const status   = err.status;
    const url      = err.url ?? '?';
    const body     = typeof err.error === 'string' ? err.error : '';
    const psErrors = parsePsErrors(body);
    const message  = psErrors.length
      ? psErrors.join(' | ')
      : (err.statusText || `HTTP ${status}`);

    console.group(`[PS API ${status}] ${url}`);
    if (psErrors.length) {
      console.error('PS error(s):', psErrors);
    } else {
      console.error('HTTP error:', err.message);
    }
    if (body) {
      console.error('Response body:', body);
    }
    console.groupEnd();

    return `[${status}] ${message}`;
  }

  /** Called when PS returned 2xx but the response body was not parseable as expected. */
  parseError(message: string): void {
    console.error('[PS API] Parse error (2xx with unexpected body):', message);
  }

  warn(message: string, ...args: unknown[]): void {
    console.warn(`[App] ${message}`, ...args);
  }

  error(message: string, ...args: unknown[]): void {
    console.error(`[App] ${message}`, ...args);
  }

  info(message: string, ...args: unknown[]): void {
    console.info(`[App] ${message}`, ...args);
  }
}

// ── PS XML error parser ───────────────────────────────────────────────────────

function parsePsErrors(xml: string): string[] {
  if (!xml) return [];

  // PS8 wraps messages in CDATA: <message><![CDATA[...]]></message>
  const cdataMatches = [...xml.matchAll(/<message><!\[CDATA\[([\s\S]*?)]]><\/message>/g)]
    .map(m => m[1].trim())
    .filter(Boolean);
  if (cdataMatches.length) return cdataMatches;

  // Fallback: plain text <message>...</message>
  return [...xml.matchAll(/<message>([\s\S]*?)<\/message>/g)]
    .map(m => m[1].trim())
    .filter(Boolean);
}
