# Umbraco 17 Docker Template

A production-ready, per-client configurable [Umbraco 17](https://umbraco.com/) CMS template packaged as Docker containers. Features traditional **Razor views**, **7-1 SCSS architecture** for maintainable theming, **feature toggles**, and **per-client brand overrides** — designed for deployment on Azure App Services.

---

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (or Docker Engine + Compose plugin)
- At least 4 GB RAM allocated to Docker (SQL Server requirement)

## Quick Start

1. **Clone the repository**

   ```bash
   git clone https://github.com/Brighty28/Umbraco-Docker-Template.git
   cd Umbraco-Docker-Template
   ```

2. **Start the containers**

   ```bash
   docker compose up -d
   ```

3. **Open Umbraco**

   Navigate to [http://localhost:8080](http://localhost:8080) and complete the Umbraco installer. You will be prompted to create your admin account on first run.

4. **Access the backoffice**

   Once installed, the backoffice is available at [http://localhost:8080/umbraco](http://localhost:8080/umbraco).

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                Docker Compose Network                │
│                                                      │
│  ┌────────────────────┐   ┌───────────────────────┐ │
│  │   Umbraco 17       │   │   SQL Server 2022     │ │
│  │   (.NET 9)         │──▶│   (Linux)             │ │
│  │   + Razor Views    │   │   Separate DB per     │ │
│  │   + SCSS Themes    │   │   client              │ │
│  │   Port: 8080       │   │   Port: 1433          │ │
│  └────────────────────┘   └───────────────────────┘ │
│         │                          │                 │
│    ┌────┴────┐                ┌────┴────┐            │
│    │  Media  │                │ SQL Data│            │
│    │ Volume  │                │ Volume  │            │
│    └─────────┘                └─────────┘            │
└─────────────────────────────────────────────────────┘
```

### Multi-stage Docker Build

```
┌─────────────────────────────────────────────────────┐
│  Stage 1: Node.js (Alpine)                           │
│  Compile SCSS → CSS with CLIENT_ID theme overrides   │
├─────────────────────────────────────────────────────┤
│  Stage 2: .NET 9 SDK                                 │
│  Restore, build & publish Umbraco project            │
│  Copy compiled CSS from Stage 1                      │
├─────────────────────────────────────────────────────┤
│  Stage 3: ASP.NET 9 Runtime                          │
│  Lightweight production image                        │
└─────────────────────────────────────────────────────┘
```

## Project Structure

```
Umbraco-Docker-Template/
├── Dockerfile                      # 3-stage build (Node → SDK → Runtime)
├── docker-compose.yml              # Base services (Umbraco + SQL Server)
├── docker-compose.acme.yml         # Acme client override
├── docker-compose.globex.yml       # Globex client override
├── .env.example                    # Environment variable template
│
└── src/UmbracoSite/
    ├── UmbracoSite.csproj          # .NET 9 + Umbraco 17
    ├── Program.cs                  # Bootstrap with client config loading
    ├── appsettings.json            # Base config (features, client defaults)
    ├── appsettings.Development.json
    │
    ├── appsettings.Clients/        # Per-client config overlays
    │   ├── appsettings.acme.json
    │   └── appsettings.globex.json
    │
    ├── Configuration/              # Strongly-typed settings
    │   ├── ClientSettings.cs
    │   └── FeatureSettings.cs
    │
    ├── TagHelpers/
    │   └── FeatureTagHelper.cs     # <feature name="Blog">...</feature>
    │
    ├── Views/
    │   ├── _Layout.cshtml          # Master layout
    │   ├── _ViewImports.cshtml
    │   ├── _ViewStart.cshtml
    │   ├── Home.cshtml             # Home page template
    │   ├── ContentPage.cshtml      # Generic content page
    │   ├── Contact.cshtml          # Contact page with feature-toggled form
    │   ├── BlogPost.cshtml         # Blog post template
    │   └── Partials/
    │       ├── _Header.cshtml      # Sticky header + nav with feature toggles
    │       └── _Footer.cshtml      # Multi-column footer
    │
    ├── Styles/                     # 7-1 SCSS Architecture
    │   ├── main.scss               # Entry point
    │   ├── abstracts/              # Variables, mixins (no CSS output)
    │   ├── base/                   # Reset, typography
    │   ├── layout/                 # Grid, header, footer, navigation
    │   ├── components/             # Buttons, cards, forms, hero
    │   ├── pages/                  # Home, contact, blog page styles
    │   ├── vendors/                # Third-party CSS
    │   └── themes/                 # Client brand overrides
    │       ├── _default.scss
    │       ├── client-acme/
    │       └── client-globex/
    │
    ├── build-theme.js              # SCSS build script (client-aware)
    ├── package.json                # Node deps (sass)
    │
    └── wwwroot/
        ├── css/                    # Compiled CSS output
        ├── js/site.js              # Mobile nav toggle
        └── images/
            ├── logo.svg            # Default logo
            └── clients/            # Per-client logos
```

## Per-Client Configuration

Each client gets their own:
- **Umbraco backoffice** — separate database, separate content
- **Brand theme** — colours, fonts, border-radius via CSS custom properties
- **Feature toggles** — blog on/off, contact form, search
- **Logo and assets** — per-client image directory

### Configuration Layers

| Layer | When | Source | What changes |
|-------|------|--------|-------------|
| **Base defaults** | Always | `appsettings.json` | Default features, client name |
| **Client overlay** | Build/run time | `appsettings.Clients/appsettings.{clientId}.json` | Brand name, features, email |
| **Theme overrides** | Build time | `Styles/themes/client-{clientId}/` | Colours, fonts, shapes |
| **Environment vars** | Run time | `docker compose` / App Service | DB connection, ports |

### Deploy a Client

```bash
# Using environment variable
CLIENT_ID=acme docker compose up --build -d

# Using compose override file (recommended for CI/CD)
docker compose -f docker-compose.yml -f docker-compose.acme.yml up --build -d
```

### Add a New Client

1. Create a config overlay: `appsettings.Clients/appsettings.newcorp.json`
2. Create a theme: `Styles/themes/client-newcorp/_overrides.scss`
3. Add logo: `wwwroot/images/clients/newcorp/logo.svg`
4. Optionally add a compose override: `docker-compose.newcorp.yml`

## 7-1 SCSS Architecture

```
Styles/
├── abstracts/          # No CSS output – design tokens only
│   ├── _variables.scss    # CSS custom properties on :root
│   └── _mixins.scss       # respond-to(), flex-center(), focus-ring()
├── base/               # Global element styles
│   ├── _reset.scss        # Box model reset + base body styles
│   └── _typography.scss   # Headings, body text, .sr-only
├── layout/             # Structural page sections
│   ├── _grid.scss         # .container, .grid--2/3, .section
│   ├── _header.scss       # Sticky header with backdrop blur
│   ├── _footer.scss       # Multi-column footer grid
│   └── _navigation.scss   # Desktop nav + mobile hamburger menu
├── components/         # Reusable UI blocks
│   ├── _buttons.scss      # .btn variants (primary, secondary)
│   ├── _cards.scss        # .card with body, image, hover shadow
│   ├── _forms.scss        # Inputs, labels, validation
│   └── _hero.scss         # Full-width hero with gradient
├── pages/              # Page-specific styles
│   ├── _home.scss
│   ├── _contact.scss
│   └── _blog.scss
├── vendors/            # Third-party CSS
└── themes/             # Client brand overrides
    ├── _default.scss
    ├── client-acme/
    │   └── _overrides.scss    # Red palette, Oswald headings
    └── client-globex/
        └── _overrides.scss    # Green palette, Nunito, rounded shapes
```

### How Client Theming Works

All styles use **CSS custom properties** declared on `:root`. Client themes simply override these variables — no SCSS recompilation of component styles needed:

```scss
// Styles/themes/client-acme/_overrides.scss
:root {
    --color-primary: #e11d48;
    --font-heading: 'Oswald', sans-serif;
    --radius-md: 4px;
}
```

The build script (`build-theme.js`) compiles `main.scss` then appends the client override CSS, so client values win via the CSS cascade.

## Feature Toggles

Features are configured in `appsettings.json` (or client overlays) and used in Razor views via a custom `<feature>` tag helper:

```json
{
  "Features": {
    "Blog": true,
    "ContactForm": true,
    "Search": false
  }
}
```

```html
<!-- In any Razor view -->
<feature name="Blog">
    <li><a href="/blog">Blog</a></li>
</feature>

<feature name="ContactForm">
    <form>...</form>
</feature>
```

When a feature is disabled, the tag helper suppresses the enclosed HTML entirely.

## Environment Variables

Copy the example file and adjust as needed:

```bash
cp .env.example .env
```

| Variable | Default | Description |
|----------|---------|-------------|
| `CLIENT_ID` | `default` | Client ID for theme & config |
| `SA_PASSWORD` | `Umbraco_Docker_P@ss1` | SQL Server SA password |
| `UMBRACO_PORT` | `8080` | Host port for Umbraco |
| `SQL_PORT` | `1433` | Host port for SQL Server |
| `UMBRACO_DB` | `UmbracoDb` | Database name |
| `ASPNETCORE_ENVIRONMENT` | `Development` | ASP.NET environment |

## Common Commands

```bash
# Start with default theme
docker compose up -d

# Start with a specific client theme
CLIENT_ID=acme docker compose up --build -d

# Using compose override (sets ports, DB name, client)
docker compose -f docker-compose.yml -f docker-compose.acme.yml up --build -d

# Rebuild after code changes
docker compose up --build -d

# View Umbraco logs
docker compose logs -f umbraco

# Stop all services
docker compose down

# Stop and remove all data (database, media)
docker compose down -v
```

## Production Deployment

For production use, consider the following:

1. **Change the SA password** – Use a strong password via the `SA_PASSWORD` environment variable
2. **Set `ASPNETCORE_ENVIRONMENT=Production`**
3. **Use persistent storage** – Mount volumes to reliable storage
4. **Configure HTTPS** – Place a reverse proxy (Nginx, Traefik, Azure App Gateway) in front
5. **Unattended install** – Set `Umbraco:CMS:Unattended:InstallUnattended` to `true` for automated deployments

### Azure App Service Deployment

```bash
# Build with client theme
docker build --build-arg CLIENT_ID=acme \
    -t your-registry.azurecr.io/umbraco-site:acme-latest .

# Push to Azure Container Registry
az acr login --name your-registry
docker push your-registry.azurecr.io/umbraco-site:acme-latest

# Deploy to App Service
az webapp config container set \
    --name app-acme-prod \
    --resource-group your-rg \
    --container-image your-registry.azurecr.io/umbraco-site:acme-latest

# Set runtime config
az webapp config appsettings set \
    --name app-acme-prod \
    --resource-group your-rg \
    --settings CLIENT_ID=acme ASPNETCORE_ENVIRONMENT=Production
```

## Tech Stack

- **Umbraco 17** – Open-source .NET CMS
- **.NET 9** – Runtime and SDK
- **Razor Views** – Traditional server-rendered templates
- **SQL Server 2022** – Database (Linux container, Azure SQL in production)
- **7-1 SCSS** – Maintainable stylesheet architecture
- **Docker** – Multi-stage containerisation
- **Docker Compose** – Multi-container orchestration with per-client overrides

## Troubleshooting

| Issue | Solution |
|-------|----------|
| SQL Server won't start | Ensure Docker has at least 4 GB RAM allocated |
| Connection refused on first start | SQL Server needs ~30s to initialise – Umbraco will retry |
| Port conflict | Change `UMBRACO_PORT` or `SQL_PORT` in `.env` |
| Umbraco database error | Check SQL Server logs: `docker compose logs sql` |
| SCSS not compiling | Verify Node.js stage in `docker build` output |
| Client theme not applied | Check `CLIENT_ID` is set and theme exists in `Styles/themes/client-{id}/` |

## License

This template is provided as-is for use in your own projects. Umbraco CMS is licensed under the [MIT License](https://github.com/umbraco/Umbraco-CMS/blob/contrib/LICENSE.md).
