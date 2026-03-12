namespace UmbracoSite.Configuration;

public class ClientSettings
{
    public const string SectionName = "Client";

    public string Id { get; set; } = "default";
    public string Name { get; set; } = "Site Name";
    public string TagLine { get; set; } = string.Empty;
    public string LogoPath { get; set; } = "/images/logo.svg";
    public string SupportEmail { get; set; } = string.Empty;
}
