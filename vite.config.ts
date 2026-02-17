
import { defineConfig } from 'vite';

export default defineConfig({
  define: {
    // We use JSON.stringify to ensure the value is wrapped in quotes in the final bundle.
    // If process.env.API_KEY is not set, we default to an empty string to avoid "undefined" being treated as a variable.
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || ""),
  },
  server: {
    port: 3000,
  }
});
