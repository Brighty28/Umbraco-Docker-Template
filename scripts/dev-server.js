#!/usr/bin/env node
// =============================================================================
// Development Server – SCSS watch + BrowserSync live reload
// =============================================================================

const { execSync, spawn } = require('child_process');
const path = require('path');

const CLIENT_ID = process.env.CLIENT_ID || 'default';

console.log(`\n🚀 Dev server starting for client: ${CLIENT_ID}\n`);

// Initial build
execSync(`node scripts/build.js --client=${CLIENT_ID} --env=development`, {
    stdio: 'inherit',
});

// Watch SCSS
const sassWatch = spawn('npx', [
    'sass', 'src/scss/main.scss', 'dist/css/main.css',
    '--watch', '--source-map', '--load-path=node_modules',
], { stdio: 'inherit', shell: true });

// BrowserSync
const bs = spawn('npx', [
    'browser-sync', 'start',
    '--server', 'dist',
    '--files', 'dist/**/*',
    '--port', '3000',
    '--no-open',
], { stdio: 'inherit', shell: true });

process.on('SIGINT', () => {
    sassWatch.kill();
    bs.kill();
    process.exit(0);
});
