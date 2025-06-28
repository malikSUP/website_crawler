const config = {
  API_BASE_URL: window.__env__?.VITE_API_BASE_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
};

export default config; 