// Production Universal Server Entrypoint for Render / Cloud Hosts
const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const port = process.env.PORT || '10000';
const host = process.env.HOST || '0.0.0.0';

// Check build artifacts
const apiDistPath = path.join(__dirname, 'apps', 'api', 'dist', 'main.js');
const nextDirPath = path.join(__dirname, 'apps', 'web', '.next');

const hasApiDist = fs.existsSync(apiDistPath);
const hasNextBuild = fs.existsSync(nextDirPath);

// Determine service type:
// 1. Explicit environment variable: SERVICE_TYPE=api or APP_TYPE=api
// 2. Or if API is built but Web is not
const isApi =
  process.env.SERVICE_TYPE === 'api' ||
  process.env.APP_TYPE === 'api' ||
  process.env.RENDER_SERVICE_TYPE === 'api' ||
  (hasApiDist && !hasNextBuild);

if (isApi) {
  console.log(`[Apna-Ghar] Starting NestJS Backend API on ${host}:${port}...`);

  if (!hasApiDist) {
    console.log('[Apna-Ghar] apps/api/dist/main.js not found. Compiling API now...');
    execSync('pnpm run build:api', { stdio: 'inherit', cwd: __dirname });
  }

  // Execute NestJS backend directly with Node
  const child = spawn(process.execPath, [apiDistPath], {
    cwd: path.join(__dirname, 'apps', 'api'),
    stdio: 'inherit',
    env: {
      ...process.env,
      PORT: String(port),
      HOST: host,
    },
  });

  child.on('error', (err) => {
    console.error('[Apna-Ghar API] Process launch error:', err);
    process.exit(1);
  });

  child.on('exit', (code) => {
    process.exit(code ?? 0);
  });
} else {
  console.log(`[Apna-Ghar] Starting Next.js Web Frontend on ${host}:${port}...`);

  // If .next directory is missing, build it automatically instead of crashing
  if (!hasNextBuild) {
    console.log('[Apna-Ghar] .next build directory not found. Running pnpm run build:web automatically...');
    execSync('pnpm run build:web', { stdio: 'inherit', cwd: __dirname });
  }

  const isWin = process.platform === 'win32';
  const nextBin = path.join(__dirname, 'apps', 'web', 'node_modules', '.bin', isWin ? 'next.cmd' : 'next');
  const fallbackBin = path.join(__dirname, 'node_modules', '.bin', isWin ? 'next.cmd' : 'next');
  const execBin = fs.existsSync(nextBin) ? nextBin : (fs.existsSync(fallbackBin) ? fallbackBin : 'next');

  const child = spawn(execBin, ['start', '-H', host, '-p', String(port)], {
    cwd: path.join(__dirname, 'apps', 'web'),
    stdio: 'inherit',
    env: {
      ...process.env,
      PORT: String(port),
      HOSTNAME: host,
    },
  });

  child.on('error', (err) => {
    console.error('[Apna-Ghar Web] Process launch error:', err);
    process.exit(1);
  });

  child.on('exit', (code) => {
    process.exit(code ?? 0);
  });
}
