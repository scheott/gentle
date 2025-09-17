// src/lib/posthog.ts
import posthog from 'posthog-js';

export function initPostHog() {
  const key = import.meta.env.VITE_POSTHOG_KEY;
  if (!key) return;
  posthog.init(key, {
    api_host: import.meta.env.VITE_POSTHOG_HOST || 'https://app.posthog.com',
    persistence: 'localStorage',
    autocapture: true,
  });
}

export function identifyUser(user?: { id?: string; email?: string } | null) {
  if (!user?.id) return;
  posthog.identify(user.id, user.email ? { email: user.email } : undefined);
}

export function resetPostHog() {
  posthog.reset();
}

// ✅ add one of these lines:
export { posthog };                      // if you keep the `import posthog from 'posthog-js'` above
// or equivalently:
// export { default as posthog } from 'posthog-js';
