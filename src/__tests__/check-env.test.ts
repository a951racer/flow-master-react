import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { execSync } from 'child_process';

describe('check-env.js integration tests', () => {
  const originalEnv = process.env.VITE_API_BASE_URL;

  afterEach(() => {
    // Restore original env
    if (originalEnv !== undefined) {
      process.env.VITE_API_BASE_URL = originalEnv;
    } else {
      delete process.env.VITE_API_BASE_URL;
    }
  });

  it('should fail with descriptive message when VITE_API_BASE_URL is unset', () => {
    // Remove the env var
    delete process.env.VITE_API_BASE_URL;

    try {
      execSync('node scripts/check-env.js', {
        cwd: process.cwd().replace(/\/src\/__tests__$/, ''),
        stdio: 'pipe',
        encoding: 'utf-8'
      });
      // If we reach here, the script didn't exit with error
      expect.fail('check-env.js should have exited with error');
    } catch (error: any) {
      // Script should exit with non-zero code
      expect(error.status).toBe(1);
      expect(error.stderr || error.stdout).toContain('Build failed');
      expect(error.stderr || error.stdout).toContain('VITE_API_BASE_URL');
    }
  });

  it('should pass when VITE_API_BASE_URL is set', () => {
    process.env.VITE_API_BASE_URL = 'https://api.example.com';

    try {
      const output = execSync('node scripts/check-env.js', {
        cwd: process.cwd().replace(/\/src\/__tests__$/, ''),
        stdio: 'pipe',
        encoding: 'utf-8',
        env: { ...process.env, VITE_API_BASE_URL: 'https://api.example.com' }
      });
      
      expect(output).toContain('Environment validation passed');
    } catch (error: any) {
      expect.fail(`check-env.js should have passed: ${error.message}`);
    }
  });

  it('should validate the required environment variables list', () => {
    // Test that the script checks for the correct variable name
    const scriptContent = require('fs').readFileSync('scripts/check-env.js', 'utf-8');
    expect(scriptContent).toContain('VITE_API_BASE_URL');
  });
});
