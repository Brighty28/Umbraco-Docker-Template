namespace UmbracoSite.Configuration;

public class FeatureSettings
{
    public const string SectionName = "Features";

    public bool Blog { get; set; }
    public bool ContactForm { get; set; } = true;
    public bool Search { get; set; } = true;
}
