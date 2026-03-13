using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.HttpOverrides;
using UmbracoSite.Configuration;

WebApplicationBuilder builder = WebApplication.CreateBuilder(args);

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

// Allow auth cookies to work over HTTP in Docker development.
builder.Services.ConfigureApplicationCookie(options =>
{
    options.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
});

builder.CreateUmbracoBuilder()
    .AddBackOffice()
    .AddWebsite()
    .AddComposers()
    .Build();

WebApplication app = builder.Build();

await app.BootUmbracoAsync();

// Trust forwarded headers from Docker / reverse proxies so OpenIddict
// sees the correct scheme and host during OAuth token exchange.
var forwardedHeaderOptions = new ForwardedHeadersOptions
{
    ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto
};
forwardedHeaderOptions.KnownNetworks.Clear();
forwardedHeaderOptions.KnownProxies.Clear();
app.UseForwardedHeaders(forwardedHeaderOptions);

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
