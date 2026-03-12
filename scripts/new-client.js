#!/usr/bin/env node
// =============================================================================
// New Client Scaffolding Script
// =============================================================================
// Usage: npm run new-client -- --id=newcorp --name="NewCorp Inc"
//
// Creates:
//   config/clients/{id}.json       – client config overrides
//   src/scss/themes/_{id}.scss     – client SCSS theme
//   src/assets/images/clients/{id}/  – asset directory
// =============================================================================

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2).reduce((acc, arg) => {
    const [key, val] = arg.replace('--', '').split('=');
    acc[key] = val;
    return acc;
}, {});

const CLIENT_ID = args.id;
const CLIENT_NAME = args.name || CLIENT_ID;

if (!CLIENT_ID) {
    console.error('❌ Please provide a client ID: --id=myclient');
    process.exit(1);
}

// Validate ID format
if (!/^[a-z0-9-]+$/.test(CLIENT_ID)) {
    console.error('❌ Client ID must be lowercase alphanumeric with hyphens only');
    process.exit(1);
}

console.log(`\n🆕 Creating new client: ${CLIENT_NAME} (${CLIENT_ID})\n`);

// 1. Config file
const configPath = path.join('config', 'clients', `${CLIENT_ID}.json`);
if (!fs.existsSync(configPath)) {
    fs.mkdirSync(path.dirname(configPath), { recursive: true });
    fs.writeFileSync(configPath, JSON.stringify({
        client: {
            id: CLIENT_ID,
            name: CLIENT_NAME,
            tagline: `Welcome to ${CLIENT_NAME}`
        },
        branding: {
            logo: `/assets/images/clients/${CLIENT_ID}/logo.svg`,
            favicon: `/assets/images/clients/${CLIENT_ID}/favicon.ico`,
            fonts: []
        },
        content: {
            hero: {
                title: `Welcome to ${CLIENT_NAME}`,
                subtitle: "Your tagline here",
                cta_primary: { text: "Get Started", url: "#" },
                cta_secondary: { text: "Learn More", url: "#about" }
            }
        },
        features: {
            analytics: false,
            contact_form: true,
            blog: false,
            dark_mode: false
        }
    }, null, 4));
    console.log(`   ✓ Config:  ${configPath}`);
} else {
    console.log(`   ℹ Config already exists: ${configPath}`);
}

// 2. Theme file
const themePath = path.join('src', 'scss', 'themes', `_${CLIENT_ID}.scss`);
if (!fs.existsSync(themePath)) {
    fs.writeFileSync(themePath, `// =============================================================================
// Themes: ${CLIENT_NAME}
// =============================================================================
// Client: ${CLIENT_NAME} (CLIENT_ID=${CLIENT_ID})
//
// Override CSS custom properties here to apply client branding.
// See src/scss/base/_reset.scss for the full list of available properties.
// =============================================================================

:root {
    // Brand palette – replace with client brand colours
    // --color-primary:       #2563eb;
    // --color-primary-light: #60a5fa;
    // --color-primary-dark:  #1d4ed8;
    // --color-secondary:     #7c3aed;
    // --color-accent:        #f59e0b;

    // Typography – replace with client brand fonts
    // --font-heading: 'YourFont', sans-serif;
    // --font-body:    'YourFont', sans-serif;

    // Shape
    // --radius-md: 8px;
}
`);
    console.log(`   ✓ Theme:   ${themePath}`);
}

// 3. Assets directory
const assetsPath = path.join('src', 'assets', 'images', 'clients', CLIENT_ID);
fs.mkdirSync(assetsPath, { recursive: true });
fs.writeFileSync(path.join(assetsPath, '.gitkeep'), '');
console.log(`   ✓ Assets:  ${assetsPath}/`);

console.log(`\n✅ Client "${CLIENT_ID}" scaffolded!`);
console.log(`\nNext steps:`);
console.log(`  1. Edit ${configPath} with client details`);
console.log(`  2. Edit ${themePath} with client brand colours & fonts`);
console.log(`  3. Add logo/favicon to ${assetsPath}/`);
console.log(`  4. Build: CLIENT_ID=${CLIENT_ID} npm run build`);
console.log(`  5. Docker: CLIENT_ID=${CLIENT_ID} npm run docker:build\n`);
