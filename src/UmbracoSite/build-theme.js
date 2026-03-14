#!/usr/bin/env node
// ==============================================================================
// Theme-aware SCSS build script
// Compiles main.scss and appends client theme overrides if CLIENT_ID is set.
//
// Usage:
//   CLIENT_ID=acme node build-theme.js
//   node build-theme.js                 (uses default theme)
// ==============================================================================

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const clientId = process.env.CLIENT_ID || 'default';
const stylesDir = path.join(__dirname, 'Styles');
const outputDir = path.join(__dirname, 'wwwroot', 'css');
const outputFile = path.join(outputDir, 'site.css');

// Ensure output directory exists
fs.mkdirSync(outputDir, { recursive: true });

// Compile the main SCSS
console.log(`Building CSS for client: ${clientId}`);
execSync(`npx sass "${path.join(stylesDir, 'main.scss')}" "${outputFile}" --style=compressed --no-source-map`, {
    stdio: 'inherit'
});

// If a client theme exists, compile and append it
if (clientId !== 'default') {
    const clientOverride = path.join(stylesDir, 'themes', `client-${clientId}`, '_overrides.scss');
    if (fs.existsSync(clientOverride)) {
        const tempFile = path.join(outputDir, 'client-override.css');
        execSync(`npx sass "${clientOverride}" "${tempFile}" --style=compressed --no-source-map`, {
            stdio: 'inherit'
        });
        const overrideCss = fs.readFileSync(tempFile, 'utf8');
        fs.appendFileSync(outputFile, '\n' + overrideCss);
        fs.unlinkSync(tempFile);
        console.log(`Appended theme overrides from: ${clientOverride}`);
    } else {
        console.warn(`Warning: No theme found for client "${clientId}" at ${clientOverride}`);
    }
}

console.log(`CSS output: ${outputFile}`);
