import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';

// Define project structure
const projectName = 'botnet-protection';
const projectStructure = {
  'package.json': `{
  "name": "botnet-protection",
  "version": "1.0.0",
  "description": "Basic botnet protection implementation",
  "main": "dist/botnet-protection.js",
  "scripts": {
    "build": "tsc",
    "start": "node dist/botnet-protection.js",
    "start:express": "node dist/express-integration.js",
    "dev": "ts-node src/botnet-protection.ts",
    "dev:express": "ts-node src/express-integration.ts"
  },
  "keywords": ["security", "botnet", "protection"],
  "author": "",
  "license": "ISC",
  "devDependencies": {
    "@types/express": "^4.17.17",
    "@types/node": "^18.15.11",
    "ts-node": "^10.9.1",
    "typescript": "^5.0.4"
  },
  "dependencies": {
    "express": "^4.18.2"
  }
}`,
  'tsconfig.json': `{
  "compilerOptions": {
    "target": "es2020",
    "module": "commonjs",
    "outDir": "./dist",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"]
}`,
  'src/rate-limiter.ts': `export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private threshold: number;
  private timeWindow: number;

  constructor(threshold = 100, timeWindow = 60000) {
    this.threshold = threshold;
    this.timeWindow = timeWindow;
  }

  isRateLimited(ip: string): boolean {
    const now = Date.now();
    
    if (!this.requests.has(ip)) {
      this.requests.set(ip, [now]);
      return false;
    }

    const requests = this.requests.get(ip)!;
    
    // Remove old requests outside the time window
    const recentRequests = requests.filter(time => now - time < this.timeWindow);
    this.requests.set(ip, recentRequests);
    
    // Check if request count exceeds threshold
    if (recentRequests.length >= this.threshold) {
      console.log(\`Rate limit exceeded for IP: \${ip}\`);
      return true;
    }
    
    // Add current request timestamp
    recentRequests.push(now);
    return false;
  }
}`,
  'src/botnet-protection.ts': `import http from 'http';
import { RateLimiter } from './rate-limiter';

const rateLimiter = new RateLimiter();

const server = http.createServer((req, res) => {
  const ip = req.socket.remoteAddress || '';
  
  // Check for rate limiting
  if (rateLimiter.isRateLimited(ip)) {
    res.writeHead(429, { 'Content-Type': 'text/plain' });
    res.end('Too Many Requests');
    return;
  }
  
  // Check for suspicious patterns in user agent
  const userAgent = req.headers['user-agent'] || '';
  if (userAgent.includes('bot') || userAgent === '' || userAgent.length < 10) {
    console.log(\`Suspicious user agent detected: "\${userAgent}" from IP: \${ip}\`);
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden');
    return;
  }
  
  // Normal request handling
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Hello World');
});

server.listen(3000, () => {
  console.log('Server running on port 3000');
});`,
  'src/express-integration.ts': `import express from 'express';
import { RateLimiter } from './rate-limiter';

const app = express();
const rateLimiter = new RateLimiter(100, 60000); // 100 requests per minute

// Middleware for botnet protection
app.use((req, res, next) => {
  const ip = req.ip;
  
  // Check for rate limiting
  if (rateLimiter.isRateLimited(ip)) {
    return res.status(429).send('Too Many Requests');
  }
  
  // Check for suspicious patterns in user agent
  const userAgent = req.headers['user-agent'] || '';
  if (userAgent.includes('bot') || userAgent === '' || userAgent.length < 10) {
    console.log(\`Suspicious user agent detected: "\${userAgent}" from IP: \${ip}\`);
    return res.status(403).send('Forbidden');
  }
  
  next();
});

// Your regular routes
app.get('/', (req, res) => {
  res.send('Hello World');
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});`,
  'README.md': `# Botnet Protection

A simple implementation of botnet protection techniques using Node.js.

## Features

- Rate limiting to prevent DDoS attacks
- User agent analysis to detect suspicious bots
- Available as a standalone HTTP server or Express middleware

## Installation

\`\`\`bash
npm install
\`\`\`

## Usage

Build the project:
\`\`\`bash
npm run build
\`\`\`

Run the basic HTTP server:
\`\`\`bash
npm start
\`\`\`

Run the Express version:
\`\`\`bash
npm run start:express
\`\`\`

## Project Structure

- \`src/rate-limiter.ts\`: Rate limiting implementation
- \`src/botnet-protection.ts\`: Standalone HTTP server
- \`src/express-integration.ts\`: Express middleware implementation
`
};

async function generateProject() {
  try {
    // Create project directory
    console.log(`Creating project directory: ${projectName}`);
    await fs.mkdir(projectName, { recursive: true });
    
    // Create src directory
    console.log('Creating src directory');
    await fs.mkdir(path.join(projectName, 'src'), { recursive: true });
    
    // Create all files
    for (const [filePath, content] of Object.entries(projectStructure)) {
      const fullPath = path.join(projectName, filePath);
      console.log(`Creating file: ${fullPath}`);
      await fs.writeFile(fullPath, content);
    }
    
    console.log('\nProject created successfully!');
    console.log('\nTo use the project:');
    console.log(`1. cd ${projectName}`);
    console.log('2. npm install');
    console.log('3. npm run build');
    console.log('4. npm start (or npm run start:express)');
    
    return true;
  } catch (error) {
    console.error('Error generating project:', error);
    return false;
  }
}

// Execute the function
await generateProject();