// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,

    // Adjust this value in production, or use tracesSampler for greater control
    tracesSampleRate: 1.0,

    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: false,

    // Replay configuration - captures user sessions
    replaysOnErrorSampleRate: 1.0,
    replaysSessionSampleRate: 0.1,

    // Integration configuration
    integrations: [
      Sentry.replayIntegration({
        // Additional replay config
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],

    // Filter out specific errors
    beforeSend(event) {
      // Don't send events in development
      if (process.env.NODE_ENV === 'development') {
        return null;
      }
      return event;
    },

    // Set sample rate for error events
    sampleRate: 1.0,

    // Environment tag
    environment: process.env.NODE_ENV,

    // Release version (you can set this from your CI/CD)
    // release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,
  });
}
