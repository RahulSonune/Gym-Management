import { HttpErrorResponse } from '@angular/common/http';

/** Browser-only “Http failure response for … : 400 Bad Request” — not end-user text. */
function isAngularHttpFailureNoise(text: string): boolean {
  return /^Http failure response for /i.test(text.trim());
}

/** Turn JSON error body (object or string/ArrayBuffer from HttpClient) into a value to read `message` from. */
function normalizeErrorBody(raw: unknown): unknown {
  if (raw === null || raw === undefined) return raw;
  if (typeof raw === 'string') {
    const t = raw.trim();
    if (t.startsWith('{') || t.startsWith('[')) {
      try {
        return JSON.parse(t) as unknown;
      } catch {
        return raw;
      }
    }
    return raw;
  }
  if (typeof ArrayBuffer !== 'undefined' && raw instanceof ArrayBuffer) {
    const text = new TextDecoder().decode(raw);
    try {
      return JSON.parse(text) as unknown;
    } catch {
      return text;
    }
  }
  return raw;
}

/** Spring Boot default body: `message`, ProblemDetail: `detail`; avoid using `error`: "Bad Request" alone. */
function readSpringUserMessage(o: Record<string, unknown>): string {
  const rawMsg = o['message'];
  if (typeof rawMsg === 'string' && rawMsg.trim()) {
    return rawMsg.trim();
  }
  const detail = o['detail'];
  if (typeof detail === 'string' && detail.trim()) {
    return detail.trim();
  }
  const title = o['title'];
  if (typeof title === 'string' && title.trim()) {
    return title.trim();
  }
  const err = o['error'];
  if (typeof err === 'string' && err.trim()) {
    const et = err.trim();
    if (!/^(Bad Request|Not Found|Forbidden|Unauthorized|Internal Server Error)$/i.test(et)) {
      return et;
    }
  }
  return '';
}

/**
 * Parses Angular HttpClient / Spring error bodies so the UI shows the server `message`
 * (e.g. duplicate phone), not “Http failure response for …”.
 */
export function messageFromHttpError(error: unknown, fallback: string): string {
  let payload: unknown;

  if (error instanceof HttpErrorResponse) {
    payload = normalizeErrorBody(error.error);
  } else if (typeof error === 'object' && error !== null && 'error' in error) {
    payload = normalizeErrorBody((error as { error?: unknown }).error);
  } else {
    payload = undefined;
  }

  if (payload !== null && typeof payload === 'object' && !Array.isArray(payload)) {
    const o = payload as Record<string, unknown>;
    const primary = readSpringUserMessage(o);

    const errors = o['errors'] as unknown;
    if (Array.isArray(errors) && errors.length > 0) {
      const parts = errors.map((entry) => {
        const er = entry as Record<string, unknown>;
        const d =
          typeof er['defaultMessage'] === 'string' ? er['defaultMessage'].trim() : '';
        const f = typeof er['field'] === 'string' ? er['field'] : '';
        if (f && d) return `${f}: ${d}`;
        return d;
      });
      const joined = parts.filter(Boolean).join(' ');
      if (joined.length > 0) {
        const base = primary;
        return base ? `${base} ${joined}`.trim() : joined;
      }
    }

    if (primary) {
      return primary;
    }

    const skip = new Set([
      'timestamp',
      'status',
      'path',
      'trace',
      'errors',
      'error',
      'requestId',
      'request_id',
    ]);
    const fieldMsgs = Object.entries(o)
      .filter(
        ([k, v]) =>
          typeof v === 'string' &&
          v.trim().length > 0 &&
          !skip.has(k) &&
          k.length <= 64
      )
      .map(([k, v]) => `${k}: ${(v as string).trim()}`);
    if (fieldMsgs.length === 1) return fieldMsgs[0]!;
    if (fieldMsgs.length > 1) return fieldMsgs.join('. ');
  }

  if (typeof payload === 'string' && payload.trim()) {
    const t = payload.trim();
    if (!isAngularHttpFailureNoise(t)) return t;
  }

  if (typeof error === 'object' && error !== null) {
    const em = (error as { message?: string }).message;
    if (typeof em === 'string' && em.trim() && !isAngularHttpFailureNoise(em)) {
      return em.trim();
    }
  }

  return fallback;
}
