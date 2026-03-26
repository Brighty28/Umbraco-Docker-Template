using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.Models.Blocks;
using Umbraco.Cms.Core.Models.PublishedContent;

namespace UmbracoSite.Models;

/// <summary>
/// Strongly-typed model for the Home document type.
/// Property aliases must match those defined in the Umbraco backoffice.
/// </summary>
[PublishedModel("home")]
public class Home : PublishedContentModel
{
    public Home(IPublishedContent content, IPublishedValueFallback publishedValueFallback)
        : base(content, publishedValueFallback)
    {
        _publishedValueFallback = publishedValueFallback;
    }

    private readonly IPublishedValueFallback _publishedValueFallback;

    // Hero section
    public virtual IPublishedContent? HeroBackgroundImage =>
        this.Value<IPublishedContent>(_publishedValueFallback, "heroBackgroundImage");

    public virtual string? HeroHeader =>
        this.Value<string>(_publishedValueFallback, "heroHeader");

    public virtual string? HeroDescription =>
        this.Value<string>(_publishedValueFallback, "heroDescription");

    public virtual Link? HeroCtalink =>
        this.Value<Link>(_publishedValueFallback, "heroCtalink");

    public virtual string? HeroCtacaption =>
        this.Value<string>(_publishedValueFallback, "heroCtacaption");

    // Body
    public virtual BlockGridModel? BodyText =>
        this.Value<BlockGridModel>(_publishedValueFallback, "bodyText");

    // Footer CTA section
    public virtual string? FooterHeader =>
        this.Value<string>(_publishedValueFallback, "footerHeader");

    public virtual string? FooterDescription =>
        this.Value<string>(_publishedValueFallback, "footerDescription");

    public virtual Link? FooterCtalink =>
        this.Value<Link>(_publishedValueFallback, "footerCtalink");

    public virtual string? FooterCtacaption =>
        this.Value<string>(_publishedValueFallback, "footerCtacaption");
}
