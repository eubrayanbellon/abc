import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Fix: Cast process to any to avoid TS error regarding cwd property on Process type
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    plugins: [react()],
    // Permite usar process.env.API_KEY no código do cliente, pegando do ambiente de build (Netlify)
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY)
    }
  };
});