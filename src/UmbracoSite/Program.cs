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

builder.CreateUmbracoBuilder()
    .AddBackOffice()
    .AddWebsite()
    .AddComposers()
    .Build();

// Override cookie Secure flag AFTER Umbraco registers its own cookie config.
// Umbraco's AddBackOffice() sets Secure=Always which breaks HTTP auth flow.
builder.Services.PostConfigure<Microsoft.AspNetCore.Authentication.Cookies.CookieAuthenticationOptions>(
    Microsoft.AspNetCore.Identity.IdentityConstants.ApplicationScheme,
    options => options.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest);
builder.Services.PostConfigure<Microsoft.AspNetCore.Authentication.Cookies.CookieAuthenticationOptions>(
    Microsoft.AspNetCore.Identity.IdentityConstants.ExternalScheme,
    options => options.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest);
builder.Services.PostConfigure<Microsoft.AspNetCore.Authentication.Cookies.CookieAuthenticationOptions>(
    Microsoft.AspNetCore.Identity.IdentityConstants.TwoFactorUserIdScheme,
    options => options.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest);

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

// Force all cookies to respect the request scheme (HTTP or HTTPS).
// This overrides at the middleware level, so even if Umbraco sets
// Secure=Always on its auth cookies, they'll work over plain HTTP.
app.UseCookiePolicy(new CookiePolicyOptions
{
    Secure = CookieSecurePolicy.SameAsRequest
});

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
