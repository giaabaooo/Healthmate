// src/config.ts
export const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:8000' : 'https://healthmate-y9vt.onrender.com');