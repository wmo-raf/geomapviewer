export function getRuntimeConfig() {
  if (typeof window !== "undefined") {
    return window.RUNTIME_CONFIG || {};
  }

  // fallback for server
  return {
    NEXT_PUBLIC_CMS_API: process.env.NEXT_PUBLIC_CMS_API,
  };
}