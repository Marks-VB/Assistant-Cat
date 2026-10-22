import * as Sentry from "@sentry/react";

function sanitize(event: Sentry.ErrorEvent): Sentry.ErrorEvent {
  if (event.request) {
    const h = event.request.headers as Record<string, unknown> | undefined;
    if (h) {
      delete h["authorization"];
      delete h["Authorization"];
      delete h["cookie"];
      delete h["Cookie"];
    }
    delete event.request.cookies;
    delete event.request.data;
    delete event.request.query_string;
  }
  if (event.user) {
    delete event.user.email;
    delete event.user.ip_address;
    delete event.user.username;
  }
  return event;
}

export function initSentry(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
  if (!dsn) return;
  const isProd = import.meta.env.PROD;
  Sentry.init({
    dsn,
    environment: isProd ? "production" : "development",
    tracesSampleRate: isProd ? 0.2 : 1.0,
    beforeSend: sanitize,
  });
}

export { sanitize as sanitizeSentryEvent };
