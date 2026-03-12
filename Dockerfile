# ==============================================================================
# Multi-stage Dockerfile for Umbraco 17 CMS
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Build – restore, build, and publish the Umbraco project
# ------------------------------------------------------------------------------
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build

WORKDIR /src

# Copy project file and restore dependencies
COPY src/UmbracoSite/UmbracoSite.csproj ./UmbracoSite/
RUN dotnet restore ./UmbracoSite/UmbracoSite.csproj

# Copy the rest of the source and publish
COPY src/ .
RUN dotnet publish ./UmbracoSite/UmbracoSite.csproj \
    -c Release \
    -o /app/publish \
    --no-restore

# ------------------------------------------------------------------------------
# Stage 2: Production – lightweight ASP.NET runtime
# ------------------------------------------------------------------------------
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS production

WORKDIR /app

# Install ICU for globalisation support
RUN apt-get update && \
    apt-get install -y --no-install-recommends libicu-dev && \
    rm -rf /var/lib/apt/lists/*

# Copy published output
COPY --from=build /app/publish .

# Umbraco stores media and logs in these directories
VOLUME ["/app/umbraco/Data", "/app/umbraco/Logs", "/app/wwwroot/media"]

# ASP.NET listens on port 8080 by default in .NET 8+
EXPOSE 8080

ENV ASPNETCORE_URLS=http://+:8080
ENV DOTNET_SYSTEM_GLOBALIZATION_INVARIANT=false

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:8080/umbraco/api/keepalive/ping || exit 1

ENTRYPOINT ["dotnet", "UmbracoSite.dll"]
