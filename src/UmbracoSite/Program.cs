using System.Security.Cryptography;
using System.Security.Cryptography.X509Certificates;
using UmbracoSite.Configuration;

WebApplicationBuilder builder = WebApplication.CreateBuilder(args);

// Configure Kestrel with HTTPS using a self-signed cert for Docker development
var certPath = Path.Combine(builder.Environment.ContentRootPath, "devcert.crt");
var keyPath = Path.Combine(builder.Environment.ContentRootPath, "devcert.key");
if (File.Exists(certPath) && File.Exists(keyPath))
{
    builder.WebHost.ConfigureKestrel(kestrel =>
    {
        kestrel.ListenAnyIP(8080);
        kestrel.ListenAnyIP(8443, opts =>
        {
            opts.UseHttps(X509Certificate2.CreateFromPemFile(certPath, keyPath));
        });
    });
}

// Load client-specific configuration overlay if CLIENT_ID is set
string clientId = builder.Configuration["Client:Id"]
    ?? Environment.GetEnvironmentVariable("CLIENT_ID")
    ?? "default";

string clientConfigPath = Path.Combine("appsettings.Clients", $"appsettings.{clientId}.json");
if (File.Exists(clientConfigPath))
{
    builder.Configuration.AddJsonFile(clientConfigPath, optional: true, reloadOnChange: true);
}

// Bind strongly-typed configuration
builder.Services.Configure<FeatureSettings>(
    builder.Configuration.GetSection(FeatureSettings.SectionName));
builder.Services.Configure<ClientSettings>(
    builder.Configuration.GetSection(ClientSettings.SectionName));

builder.CreateUmbracoBuilder()
    .AddBackOffice()
    .AddWebsite()
    .AddComposers()
    .Build();

WebApplication app = builder.Build();

await app.BootUmbracoAsync();

app.UseUmbraco()
    .WithMiddleware(u =>
    {
        u.UseBackOffice();
        u.UseWebsite();
    })
    .WithEndpoints(u =>
    {
        u.UseBackOfficeEndpoints();
        u.UseWebsiteEndpoints();
    });

await app.RunAsync();
