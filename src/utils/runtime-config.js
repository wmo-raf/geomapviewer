export function getRuntimeConfig() {
  if (typeof window !== "undefined") {
    return window.RUNTIME_CONFIG || {};
  }

  // fallback for server
  return {
    CMS_API: process.env.CMS_API,
  };
}