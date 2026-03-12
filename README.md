# Umbraco 17 Docker Template

A production-ready Docker template for running [Umbraco 17](https://umbraco.com/) CMS with SQL Server. Includes a multi-stage Dockerfile, Docker Compose configuration, and everything you need to get an Umbraco site running in containers.

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
┌─────────────────────────────────────────────────┐
│              Docker Compose Network              │
│                                                  │
│  ┌──────────────────┐   ┌─────────────────────┐ │
│  │   Umbraco 17     │   │   SQL Server 2022   │ │
│  │   (.NET 9)       │──▶│   (Linux)           │ │
│  │   Port: 8080     │   │   Port: 1433        │ │
│  └──────────────────┘   └─────────────────────┘ │
│         │                        │               │
│    ┌────┴────┐              ┌────┴────┐          │
│    │  Media  │              │ SQL Data│          │
│    │ Volume  │              │ Volume  │          │
│    └─────────┘              └─────────┘          │
└─────────────────────────────────────────────────┘
```

## Project Structure

```
Umbraco-Docker-Template/
├── Dockerfile              # Multi-stage build (SDK → Runtime)
├── docker-compose.yml      # Umbraco + SQL Server services
├── .dockerignore            # Files excluded from Docker build
├── .env.example             # Environment variable template
└── src/
    └── UmbracoSite/
        ├── UmbracoSite.csproj   # .NET 9 project with Umbraco 17
        ├── Program.cs            # Application entry point
        ├── appsettings.json      # Umbraco configuration
        ├── appsettings.Development.json
        └── Views/
            └── _ViewImports.cshtml
```

## Configuration

### Environment Variables

Copy the example file and adjust as needed:

```bash
cp .env.example .env
```

| Variable | Default | Description |
|----------|---------|-------------|
| `SA_PASSWORD` | `Umbraco_Docker_P@ss1` | SQL Server SA password |
| `UMBRACO_PORT` | `8080` | Host port for Umbraco |
| `SQL_PORT` | `1433` | Host port for SQL Server |
| `ASPNETCORE_ENVIRONMENT` | `Development` | ASP.NET environment |

### Connection String

The connection string is configured in `docker-compose.yml` and automatically connects Umbraco to the SQL Server container. For production, override via environment variables or mounted config files.

## Common Commands

```bash
# Start all services in the background
docker compose up -d

# Rebuild and start (after code changes)
docker compose up --build -d

# View Umbraco logs
docker compose logs -f umbraco

# Stop all services
docker compose down

# Stop and remove all data (database, media)
docker compose down -v

# Connect to SQL Server from host (requires sqlcmd or Azure Data Studio)
# Server: localhost,1433 | User: sa | Password: (see .env)
```

## Production Deployment

For production use, consider the following:

1. **Change the SA password** – Use a strong password via the `SA_PASSWORD` environment variable
2. **Set `ASPNETCORE_ENVIRONMENT=Production`** in your environment
3. **Use persistent storage** – The Docker volumes persist data, but for production mount to reliable storage
4. **Configure HTTPS** – Place a reverse proxy (Nginx, Traefik, Azure App Gateway) in front of Umbraco
5. **Unattended install** – Set `Umbraco:CMS:Unattended:InstallUnattended` to `true` in `appsettings.json` for automated deployments

### Azure App Service Deployment

```bash
# Build and tag the image
docker build -t your-registry.azurecr.io/umbraco-site:latest .

# Push to Azure Container Registry
az acr login --name your-registry
docker push your-registry.azurecr.io/umbraco-site:latest

# Deploy to App Service
az webapp config container set \
    --name your-app-name \
    --resource-group your-rg \
    --container-image your-registry.azurecr.io/umbraco-site:latest
```

## Tech Stack

- **Umbraco 17** – Open-source .NET CMS
- **.NET 9** – Runtime and SDK
- **SQL Server 2022** – Database (Linux container)
- **Docker** – Containerisation
- **Docker Compose** – Multi-container orchestration

## Troubleshooting

| Issue | Solution |
|-------|----------|
| SQL Server won't start | Ensure Docker has at least 4 GB RAM allocated |
| Connection refused on first start | SQL Server needs ~30s to initialise – Umbraco will retry automatically |
| Port conflict on 8080 or 1433 | Change `UMBRACO_PORT` or `SQL_PORT` in your `.env` file |
| Umbraco shows database error | Check SQL Server logs: `docker compose logs sql` |

## License

This template is provided as-is for use in your own projects. Umbraco CMS is licensed under the [MIT License](https://github.com/umbraco/Umbraco-CMS/blob/contrib/LICENSE.md).
