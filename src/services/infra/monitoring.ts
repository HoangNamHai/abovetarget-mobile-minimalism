import { sentryEnabled, SENTRY_DSN } from '../../config/env';

export type MonitoringClient = {
  init: (opts: Record<string, unknown>) => void;
  captureException: (error: unknown, hint?: { extra?: Record<string, unknown> }) => void;
  wrap: <T>(component: T) => T;
};

let client: MonitoringClient | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  client = require('@sentry/react-native') as MonitoringClient;
} catch {
  client = null;
}

/** Test seam: inject a fake client (or null to reset to the real one). */
export function __setMonitoringClientForTests(c: MonitoringClient | null): void {
  client = c;
}

export function initMonitoring(): void {
  if (!client || !sentryEnabled()) return;
  client.init({
    dsn: SENTRY_DSN,
    enabled: true,
    tracesSampleRate: 1.0,
    enableAutoSessionTracking: true,
    environment: 'production',
  });
}

export function captureException(error: unknown, extra?: Record<string, unknown>): void {
  if (!client || !sentryEnabled()) return;
  client.captureException(error, extra ? { extra } : undefined);
}

export function wrapRoot<T>(component: T): T {
  if (!client) return component;
  return client.wrap(component);
}
