const POSTHOG_CDN_URL = "https://cdn.posthog.com/posthog.js";

let loadPromise: Promise<any> | null = null;

const getWindow = () => (typeof window !== "undefined" ? window : undefined);

const loadPosthogScript = () => {
  const w = getWindow();
  if (!w) {
    return Promise.resolve(null);
  }

  if (w.posthog && (w as any).__posthogLoaded) {
    return Promise.resolve(w.posthog);
  }

  if (!loadPromise) {
    loadPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = POSTHOG_CDN_URL;
      script.async = true;
      script.onload = () => {
        (w as any).__posthogLoaded = true;
        resolve(w.posthog);
      };
      script.onerror = (error) => reject(error);
      document.head.appendChild(script);
    });
  }

  return loadPromise;
};

export const initPosthog = async (key: string, host: string) => {
  if (!key) {
    return null;
  }

  const w = getWindow();
  if (!w) {
    return null;
  }

  const client = await loadPosthogScript();

  if (!client || (w as any).__posthogInitialized) {
    return w.posthog ?? null;
  }

  client.init(key, {
    api_host: host,
    capture_pageview: false,
    capture_pageleave: false,
    persistence: "localStorage",
    session_recording: { maskAllInputs: true },
  });

  (w as any).__posthogInitialized = true;

  return client;
};

export const captureEvent = (name: string, props?: Record<string, any>) => {
  try {
    const w = getWindow();
    w?.posthog?.capture?.(name, props);
  } catch (error) {
    console.debug("[PostHog] capture error", error);
  }
};

export const identifyUser = (id: string, props?: Record<string, any>) => {
  try {
    const w = getWindow();
    w?.posthog?.identify?.(id, props);
  } catch (error) {
    console.debug("[PostHog] identify error", error);
  }
};

export const resetPosthog = () => {
  try {
    const w = getWindow();
    w?.posthog?.reset?.();
    if (w) {
      (w as any).__posthogInitialized = false;
    }
  } catch (error) {
    console.debug("[PostHog] reset error", error);
  }
};

declare global {
  interface Window {
    posthog?: {
      init: (key: string, options?: Record<string, any>) => void;
      capture?: (event: string, props?: Record<string, any>) => void;
      identify?: (id: string, props?: Record<string, any>) => void;
      reset?: () => void;
    };
    __posthogLoaded?: boolean;
    __posthogInitialized?: boolean;
  }
}
