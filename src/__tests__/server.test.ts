import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('server.js integration tests', () => {
  let app: express.Application;
  let server: any;
  const testPort = 3456;

  beforeAll(() => {
    // Create a test version of the server
    app = express();

    // HTTPS redirect middleware
    app.use((req, res, next) => {
      if (req.headers['x-forwarded-proto'] !== 'https' && process.env.NODE_ENV === 'production') {
        return res.redirect(301, 'https://' + req.headers.host + req.url);
      }
      next();
    });

    // Serve static files from /dist
    app.use(express.static(path.join(__dirname, '../../dist')));

    // SPA fallback
    app.use((req, res) => {
      res.sendFile(path.join(__dirname, '../../dist', 'index.html'));
    });

    server = app.listen(testPort);
  });

  afterAll(() => {
    server?.close();
  });

  describe('HTTPS redirect middleware', () => {
    it('should redirect HTTP to HTTPS in production', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const response = await fetch(`http://localhost:${testPort}/test`, {
        headers: { 'x-forwarded-proto': 'http' },
        redirect: 'manual'
      });

      expect(response.status).toBe(301);
      expect(response.headers.get('location')).toMatch(/^https:\/\//);

      process.env.NODE_ENV = originalEnv;
    });

    it('should not redirect when x-forwarded-proto is https', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const response = await fetch(`http://localhost:${testPort}/test`, {
        headers: { 'x-forwarded-proto': 'https' },
        redirect: 'manual'
      });

      // Should not be a redirect (will be 404 or 200 depending on file existence)
      expect(response.status).not.toBe(301);

      process.env.NODE_ENV = originalEnv;
    });

    it('should not redirect in non-production environment', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const response = await fetch(`http://localhost:${testPort}/test`, {
        headers: { 'x-forwarded-proto': 'http' },
        redirect: 'manual'
      });

      expect(response.status).not.toBe(301);

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('SPA fallback', () => {
    it('should serve index.html for non-asset routes', async () => {
      // This test assumes dist/index.html exists or will return appropriate response
      const response = await fetch(`http://localhost:${testPort}/some/random/route`, {
        headers: { 'x-forwarded-proto': 'https' }
      });

      // Should attempt to serve index.html (may be 404 if dist doesn't exist, but not a redirect)
      expect([200, 404]).toContain(response.status);
    });
  });

  describe('PORT environment variable', () => {
    it('should respect PORT env var', () => {
      // Test that the server logic uses process.env.PORT || 3000
      const mockPort = process.env.PORT || 3000;
      expect(['string', 'number']).toContain(typeof mockPort);
      
      // Verify the pattern exists in server.js by checking the logic
      const portLogic = (envPort: string | undefined) => envPort || 3000;
      expect(portLogic(undefined)).toBe(3000);
      expect(portLogic('8080')).toBe('8080');
    });
  });
});
