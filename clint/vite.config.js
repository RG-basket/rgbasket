import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'fs'
import path from 'path'

// Custom plugin to inject environment variables into the service worker
const injectServiceWorkerEnv = () => {
  return {
    name: 'inject-service-worker-env',
    closeBundle() {
      const env = loadEnv('production', process.cwd());
      const swPath = path.resolve(__dirname, 'dist/firebase-messaging-sw.js');

      if (fs.existsSync(swPath)) {
        let content = fs.readFileSync(swPath, 'utf8');

        // Replace placeholders with real environment variables
        content = content.replace('VITE_FIREBASE_API_KEY_PLACEHOLDER', env.VITE_FIREBASE_API_KEY || '');
        content = content.replace('VITE_FIREBASE_AUTH_DOMAIN_PLACEHOLDER', env.VITE_FIREBASE_AUTH_DOMAIN || '');
        content = content.replace('VITE_FIREBASE_PROJECT_ID_PLACEHOLDER', env.VITE_FIREBASE_PROJECT_ID || '');
        content = content.replace('VITE_FIREBASE_STORAGE_BUCKET_PLACEHOLDER', env.VITE_FIREBASE_STORAGE_BUCKET || '');
        content = content.replace('VITE_FIREBASE_MESSAGING_SENDER_ID_PLACEHOLDER', env.VITE_FIREBASE_MESSAGING_SENDER_ID || '');
        content = content.replace('VITE_FIREBASE_APP_ID_PLACEHOLDER', env.VITE_FIREBASE_APP_ID || '');

        fs.writeFileSync(swPath, content);
        console.log('✅ Injected environment variables into service worker');
      }
    },
    // Also handle development mode injection
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url.startsWith('/firebase-messaging-sw.js')) {
          const env = loadEnv('development', process.cwd());
          const swPath = path.resolve(__dirname, 'public/firebase-messaging-sw.js');
          let content = fs.readFileSync(swPath, 'utf8');

          content = content.replace('VITE_FIREBASE_API_KEY_PLACEHOLDER', env.VITE_FIREBASE_API_KEY || '');
          content = content.replace('VITE_FIREBASE_AUTH_DOMAIN_PLACEHOLDER', env.VITE_FIREBASE_AUTH_DOMAIN || '');
          content = content.replace('VITE_FIREBASE_PROJECT_ID_PLACEHOLDER', env.VITE_FIREBASE_PROJECT_ID || '');
          content = content.replace('VITE_FIREBASE_STORAGE_BUCKET_PLACEHOLDER', env.VITE_FIREBASE_STORAGE_BUCKET || '');
          content = content.replace('VITE_FIREBASE_MESSAGING_SENDER_ID_PLACEHOLDER', env.VITE_FIREBASE_MESSAGING_SENDER_ID || '');
          content = content.replace('VITE_FIREBASE_APP_ID_PLACEHOLDER', env.VITE_FIREBASE_APP_ID || '');

          res.setHeader('Content-Type', 'application/javascript');
          res.end(content);
          return;
        }
        next();
      });
    }
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), injectServiceWorkerEnv()],
  server: {
    host: true, // Allow local network access
    port: 5173
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
})
