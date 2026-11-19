import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Em desenvolvimento, o Vite encaminha /api/* para a API .NET (sem precisar de CORS).
// Ex.: GET /api/worlds  ->  http://localhost:5191/worlds
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const target = env.LOREWIKI_API_URL || 'http://localhost:5191';

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
  };
});
