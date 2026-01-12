
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
  },
  // process.env.API_KEY를 브라우저에서 사용할 수 있도록 정의
  define: {
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY),
  },
});
