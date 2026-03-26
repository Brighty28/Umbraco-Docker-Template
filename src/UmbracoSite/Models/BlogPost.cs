using Umbraco.Cms.Core.Models.Blocks;
using Umbraco.Cms.Core.Models.PublishedContent;

namespace UmbracoSite.Models;

/// <summary>
/// Strongly-typed model for the BlogPost document type.
/// </summary>
[PublishedModel("blogPost")]
public class BlogPost : PublishedContentModel
{
    public BlogPost(IPublishedContent content, IPublishedValueFallback publishedValueFallback)
        : base(content, publishedValueFallback)
    {
        _publishedValueFallback = publishedValueFallback;
    }

    private readonly IPublishedValueFallback _publishedValueFallback;

    public virtual BlockGridModel? BodyText =>
        this.Value<BlockGridModel>(_publishedValueFallback, "bodyText");
}
