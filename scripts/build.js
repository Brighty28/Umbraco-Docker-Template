#!/usr/bin/env node
// =============================================================================
// Build Script
// =============================================================================
// Orchestrates the full build pipeline:
//   1. Load & merge client configuration (default + client overrides)
//   2. Copy the correct client SCSS theme to _client-theme.scss
//   3. Compile SCSS → CSS (minified)
//   4. Bundle & minify JavaScript
//   5. Render HTML templates with client content via Mustache
//   6. Copy static assets
//   7. Generate runtime-config.js with placeholder tokens
// =============================================================================

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const deepmerge = require('deepmerge');
const Mustache = require('mustache');

// ---------------------------------------------------------------------------
// Parse CLI args
// ---------------------------------------------------------------------------
const args = process.argv.slice(2).reduce((acc, arg) => {
    const [key, val] = arg.replace('--', '').split('=');
    acc[key] = val;
    return acc;
}, {});

const CLIENT_ID = args.client || process.env.CLIENT_ID || 'default';
const ENVIRONMENT = args.env || process.env.ENVIRONMENT || 'production';

console.log(`\n🔨 Building for client: ${CLIENT_ID} (${ENVIRONMENT})\n`);

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------
const ROOT = process.cwd();
const DIST = path.join(ROOT, 'dist');
const SRC = path.join(ROOT, 'src');
const CONFIG_DIR = path.join(ROOT, 'config');

// ---------------------------------------------------------------------------
// Step 1: Load & merge configuration
// ---------------------------------------------------------------------------
console.log('📋 Step 1: Loading configuration...');

const defaultConfig = JSON.parse(
    fs.readFileSync(path.join(CONFIG_DIR, 'default.json'), 'utf8')
);

let clientConfig = {};
const clientConfigPath = path.join(CONFIG_DIR, 'clients', `${CLIENT_ID}.json`);

if (fs.existsSync(clientConfigPath)) {
    clientConfig = JSON.parse(fs.readFileSync(clientConfigPath, 'utf8'));
    console.log(`   ✓ Loaded client config: ${clientConfigPath}`);
} else if (CLIENT_ID !== 'default') {
    console.warn(`   ⚠ No client config found for "${CLIENT_ID}", using defaults`);
}

// Deep merge: client values override defaults
const config = deepmerge(defaultConfig, clientConfig, {
    arrayMerge: (_, source) => source, // Client arrays replace defaults entirely
});

// Template variable expansion (e.g., {{client.name}})
const templateVars = {
    ...config.client,
    year: new Date().getFullYear(),
};

function expandTemplates(obj) {
    if (typeof obj === 'string') {
        return Mustache.render(obj, templateVars);
    }
    if (Array.isArray(obj)) {
        return obj.map(expandTemplates);
    }
    if (typeof obj === 'object' && obj !== null) {
        return Object.fromEntries(
            Object.entries(obj).map(([k, v]) => [k, expandTemplates(v)])
        );
    }
    return obj;
}

const finalConfig = expandTemplates(config);
console.log(`   ✓ Final config merged for "${finalConfig.client.name}"`);

// ---------------------------------------------------------------------------
// Step 2: Apply client SCSS theme
// ---------------------------------------------------------------------------
console.log('🎨 Step 2: Applying client theme...');

const themeSrc = path.join(SRC, 'scss', 'themes', `_${CLIENT_ID}.scss`);
const themeDest = path.join(SRC, 'scss', 'themes', '_client-theme.scss');

if (fs.existsSync(themeSrc)) {
    fs.copyFileSync(themeSrc, themeDest);
    console.log(`   ✓ Applied theme: ${CLIENT_ID}`);
} else {
    // Write empty theme file so the import doesn't break
    fs.writeFileSync(themeDest, '// Auto-generated: no custom theme for this client\n:root {}\n');
    console.log(`   ℹ No theme file found, using defaults`);
}

// ---------------------------------------------------------------------------
// Step 3: Compile SCSS
// ---------------------------------------------------------------------------
console.log('🎨 Step 3: Compiling SCSS...');

fs.mkdirSync(path.join(DIST, 'css'), { recursive: true });

execSync(
    `npx sass src/scss/main.scss dist/css/main.css ` +
    `--style=compressed --no-source-map --load-path=node_modules`,
    { cwd: ROOT, stdio: 'inherit' }
);

console.log('   ✓ SCSS compiled to dist/css/main.css');

// ---------------------------------------------------------------------------
// Step 4: Bundle JavaScript
// ---------------------------------------------------------------------------
console.log('📦 Step 4: Bundling JavaScript...');

fs.mkdirSync(path.join(DIST, 'js'), { recursive: true });

// Copy and minify JS files
const jsDir = path.join(SRC, 'js');
if (fs.existsSync(jsDir)) {
    const jsFiles = fs.readdirSync(jsDir).filter(f => f.endsWith('.js'));
    for (const file of jsFiles) {
        const content = fs.readFileSync(path.join(jsDir, file), 'utf8');
        if (ENVIRONMENT === 'production') {
            const { minify } = require('terser');
            minify(content).then(result => {
                fs.writeFileSync(path.join(DIST, 'js', file), result.code);
            });
        } else {
            fs.copyFileSync(path.join(jsDir, file), path.join(DIST, 'js', file));
        }
    }
}

// Generate runtime-config.js with placeholder tokens
const runtimeConfig = `
window.__SITE_CONFIG__ = {
    siteTitle: "__SITE_TITLE__",
    analyticsId: "__ANALYTICS_ID__",
    apiBaseUrl: "__API_BASE_URL__",
    featureFlags: "__FEATURE_FLAGS__",
    client: ${JSON.stringify(finalConfig.client)},
    features: ${JSON.stringify(finalConfig.features)}
};
`.trim();

fs.writeFileSync(path.join(DIST, 'js', 'runtime-config.js'), runtimeConfig);
console.log('   ✓ JavaScript bundled + runtime-config.js generated');

// ---------------------------------------------------------------------------
// Step 5: Render HTML templates
// ---------------------------------------------------------------------------
console.log('📄 Step 5: Rendering HTML templates...');

const templateDir = path.join(SRC, 'templates');
if (fs.existsSync(templateDir)) {
    const templates = fs.readdirSync(templateDir)
        .filter(f => f.endsWith('.html'));

    for (const file of templates) {
        const template = fs.readFileSync(path.join(templateDir, file), 'utf8');
        const rendered = Mustache.render(template, {
            config: finalConfig,
            client: finalConfig.client,
            content: finalConfig.content,
            branding: finalConfig.branding,
            seo: finalConfig.seo,
            features: finalConfig.features,
            year: new Date().getFullYear(),
        });
        fs.writeFileSync(path.join(DIST, file), rendered);
    }
    console.log(`   ✓ Rendered ${templates.length} template(s)`);
}

// ---------------------------------------------------------------------------
// Step 6: Copy static assets
// ---------------------------------------------------------------------------
console.log('📁 Step 6: Copying static assets...');

function copyDir(src, dest) {
    if (!fs.existsSync(src)) return;
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        if (entry.isDirectory()) {
            copyDir(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

copyDir(path.join(SRC, 'assets'), path.join(DIST, 'assets'));

// Copy client-specific assets if they exist
const clientAssetsDir = path.join(SRC, 'assets', 'images', 'clients', CLIENT_ID);
if (fs.existsSync(clientAssetsDir)) {
    copyDir(clientAssetsDir, path.join(DIST, 'assets', 'images'));
    console.log(`   ✓ Client assets copied from ${clientAssetsDir}`);
}

console.log('   ✓ Static assets copied');

// ---------------------------------------------------------------------------
// Step 7: Write build manifest
// ---------------------------------------------------------------------------
const manifest = {
    client: CLIENT_ID,
    environment: ENVIRONMENT,
    builtAt: new Date().toISOString(),
    config: finalConfig.client,
};

fs.writeFileSync(
    path.join(DIST, 'build-manifest.json'),
    JSON.stringify(manifest, null, 2)
);

console.log(`\n✅ Build complete → ${DIST}\n`);
