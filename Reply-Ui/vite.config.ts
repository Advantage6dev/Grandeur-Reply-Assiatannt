import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  server: {
    watch: { usePolling: true },
    allowedHosts: ['lucently-toyless-babara.ngrok-free.dev'],
  },
});
