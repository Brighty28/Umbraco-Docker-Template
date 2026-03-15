using Microsoft.AspNetCore.Mvc;
using Umbraco.Cms.Core.PublishedCache;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Cms.Web.Common;

namespace UmbracoSite.ViewComponents;

public class LatestBlogPostsViewComponent : ViewComponent
{
    private readonly UmbracoHelper _umbracoHelper;
    private readonly IPublishedValueFallback _publishedValueFallback;

    public LatestBlogPostsViewComponent(UmbracoHelper umbracoHelper, IPublishedValueFallback publishedValueFallback)
    {
        _umbracoHelper = umbracoHelper;
        _publishedValueFallback = publishedValueFallback;
    }

    public IViewComponentResult Invoke(int numberOfPosts = 3, Guid? startNodeKey = null)
    {
        var posts = Enumerable.Empty<IPublishedContent>();

        IPublishedContent? startNode = null;
        if (startNodeKey.HasValue && startNodeKey.Value != Guid.Empty)
        {
            startNode = _umbracoHelper.Content(startNodeKey.Value);
        }

        if (startNode != null)
        {
            posts = startNode
                .DescendantsOrSelf()
                .Where(x => x.ContentType.Alias == "blogPost" && x.IsPublished())
                .OrderByDescending(x => x.CreateDate)
                .Take(numberOfPosts);
        }

        return View(posts);
    }
}
