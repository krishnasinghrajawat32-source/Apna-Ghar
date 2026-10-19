// Production Server Entrypoint for Render / Cloud Platforms
const { spawn } = require('child_process');
const path = require('path');

const port = process.env.PORT || '3000';
const host = process.env.HOST || '0.0.0.0';

console.log(`[Apna-Ghar] Launching Next.js production server on ${host}:${port}...`);

const isWin = process.platform === 'win32';
const nextBin = path.join(__dirname, 'apps', 'web', 'node_modules', '.bin', isWin ? 'next.cmd' : 'next');
const fallbackBin = path.join(__dirname, 'node_modules', '.bin', isWin ? 'next.cmd' : 'next');

const fs = require('fs');
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
  console.error('[Apna-Ghar] Failed to start Next.js process:', err);
  process.exit(1);
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});
