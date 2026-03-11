# Umbraco-Docker-Template
# Website Package – Configurable Docker Container

A production-ready, per-client configurable website packaged as a Docker container, designed for deployment on Azure App Services. Uses the **7-1 SCSS architecture** for maintainable, themeable stylesheets.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Docker Image (per client)                 │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Nginx (Alpine)                                         │ │
│  │  ├── /css/main.css      ← compiled from 7-1 SCSS      │ │
│  │  ├── /js/app.js         ← bundled + minified           │ │
│  │  ├── /js/runtime-config ← env vars injected at start   │ │
│  │  ├── /index.html        ← rendered from Mustache tpl   │ │
│  │  └── /assets/           ← images, fonts, client logos  │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
         ▲                                    ▲
    Build-time config                   Runtime config
    (CLIENT_ID arg)                   (env vars on start)
```

## Configuration Layers

The system uses three layers of configuration, each overriding the previous:

| Layer | When | What | Example |
|-------|------|------|---------|
| **Base defaults** | Always loaded | `config/default.json` | Default nav, features, SEO |
| **Client overrides** | Build time (`--build-arg CLIENT_ID=acme`) | `config/clients/acme.json` | Brand name, colours, content |
| **Runtime env vars** | Container start | `docker run -e API_BASE_URL=...` | API URLs, analytics IDs, feature flags |

## 7-1 SCSS Architecture

```
src/scss/
├── abstracts/          # No CSS output – design tokens only
│   ├── _variables.scss    # Colour palette, typography scale, spacing, breakpoints
│   ├── _mixins.scss       # respond-to(), flex-center(), focus-ring(), etc.
│   ├── _functions.scss    # rem(), fluid(), tint(), shade(), z()
│   └── _placeholders.scss # %reset-list, %clearfix, etc.
│
├── base/               # Global element styles
│   ├── _reset.scss        # Box model + CSS custom properties on :root
│   ├── _typography.scss   # Headings, body text, fluid type scale
│   ├── _animations.scss   # @keyframes: fade-in, slide-up, scale-in
│   └── _utilities.scss    # .sr-only, .text-center, .mx-auto, etc.
│
├── layout/             # Structural page sections
│   ├── _grid.scss         # .container, .grid--2/3/4, .section
│   ├── _header.scss       # Sticky header with backdrop blur
│   ├── _footer.scss       # Multi-column footer grid
│   ├── _sidebar.scss      # Sticky sidebar layout
│   └── _navigation.scss   # Desktop nav + mobile hamburger menu
│
├── components/         # Reusable UI blocks
│   ├── _buttons.scss      # .btn variants (primary, secondary, ghost, sizes)
│   ├── _cards.scss        # .card with image, body, footer, elevated variant
│   ├── _forms.scss        # Inputs, textareas, labels, validation states
│   ├── _modal.scss        # Overlay + centred modal with animations
│   ├── _hero.scss         # Full-width hero with gradient background
│   └── _alerts.scss       # Info, success, warning, error alerts
│
├── pages/              # Page-specific styles
│   ├── _home.scss
│   ├── _about.scss
│   └── _contact.scss
│
├── themes/             # Client-specific overrides
│   ├── _client-theme.scss  # ← auto-replaced at build time
│   ├── _acme.scss          # Acme Corp: red palette, Oswald headings
│   └── _globex.scss        # Globex: green palette, Nunito, rounded shapes
│
├── vendors/            # Third-party CSS
│   ├── _normalize.scss
│   └── _vendor-overrides.scss
│
└── main.scss           # Entry point – imports all partials in order
```

### How Client Theming Works

Client themes override **CSS custom properties** declared on `:root` in `base/_reset.scss`. This means:

1. All SCSS compiles with default values (fast, cacheable builds)
2. Client branding is applied through CSS custom properties
3. Themes can even be swapped at runtime by changing CSS variables

```scss
// src/scss/themes/_acme.scss
:root {
    --color-primary:  #e11d48;
    --font-heading:   'Oswald', sans-serif;
    --radius-md:      4px;
}
```

## Quick Start

### Add a new client

```bash
npm run new-client -- --id=newcorp --name="NewCorp Inc"
```

This scaffolds:
- `config/clients/newcorp.json` – content & feature config
- `src/scss/themes/_newcorp.scss` – brand theme overrides
- `src/assets/images/clients/newcorp/` – logo & assets directory

### Build & run locally

```bash
# Development (hot reload)
CLIENT_ID=acme docker compose up dev

# Production build
CLIENT_ID=acme docker compose up --build client-site

# Visit http://localhost:8080
```

### Build a Docker image

```bash
docker build \
    --build-arg CLIENT_ID=acme \
    --build-arg ENVIRONMENT=production \
    -t website-package:acme .
```

### Deploy to Azure App Service

```bash
# Tag and push to Azure Container Registry
az acr login --name yourregistry
docker tag website-package:acme yourregistry.azurecr.io/website-package:acme-latest
docker push yourregistry.azurecr.io/website-package:acme-latest

# Deploy to App Service
az webapp config container set \
    --name app-acme-prod \
    --resource-group your-rg \
    --container-image yourregistry.azurecr.io/website-package:acme-latest \
    --container-registry-url https://yourregistry.azurecr.io

# Set runtime overrides
az webapp config appsettings set \
    --name app-acme-prod \
    --resource-group your-rg \
    --settings \
        ANALYTICS_ID="G-XXXXXXXXXX" \
        API_BASE_URL="https://api.acme.com"
```

## Runtime Environment Variables

These are injected at container startup (no rebuild needed):

| Variable | Description | Example |
|----------|-------------|---------|
| `SITE_TITLE` | Override page title | `"Acme Corp"` |
| `ANALYTICS_ID` | GA4 or similar tracking ID | `"G-ABC123"` |
| `API_BASE_URL` | Backend API endpoint | `"https://api.acme.com"` |
| `FEATURE_FLAGS` | JSON string of feature flags | `'{"dark_mode":true}'` |

## CI/CD

The included `azure-pipelines.yml` automatically:
1. Builds a Docker image for each configured client
2. Pushes to Azure Container Registry
3. Deploys to the corresponding Azure App Service

See the pipeline file for configuration details.
