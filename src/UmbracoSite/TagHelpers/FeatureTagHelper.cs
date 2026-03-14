using Microsoft.AspNetCore.Razor.TagHelpers;
using Microsoft.Extensions.Options;
using UmbracoSite.Configuration;

namespace UmbracoSite.TagHelpers;

[HtmlTargetElement("feature", Attributes = "name")]
public class FeatureTagHelper : TagHelper
{
    private readonly FeatureSettings _features;

    public FeatureTagHelper(IOptions<FeatureSettings> features)
    {
        _features = features.Value;
    }

    public string Name { get; set; } = string.Empty;

    public override void Process(TagHelperContext context, TagHelperOutput output)
    {
        output.TagName = null; // Remove the <feature> wrapper element

        bool enabled = Name.ToLowerInvariant() switch
        {
            "blog" => _features.Blog,
            "contactform" => _features.ContactForm,
            "search" => _features.Search,
            _ => false
        };

        if (!enabled)
        {
            output.SuppressOutput();
        }
    }
}
