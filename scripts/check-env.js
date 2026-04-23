// Load .env file
import { config } from 'dotenv';
config();

const required = ['VITE_API_BASE_URL'];
const missing = required.filter(k => !process.env[k]);

if (missing.length) {
  console.error(`Build failed: missing required environment variables: ${missing.join(', ')}`);
  process.exit(1);
}

console.log('Environment validation passed');
