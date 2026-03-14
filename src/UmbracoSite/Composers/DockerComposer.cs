using Umbraco.Cms.Core.Composing;
using Umbraco.Cms.Infrastructure.Runtime.RuntimeModeValidators;

namespace UmbracoSite.Composers;

/// <summary>
/// Removes the UseHttpsValidator so Umbraco can run over HTTP inside a Docker
/// container (SSL termination is handled by a reverse proxy or the host).
/// See: https://docs.umbraco.com/umbraco-cms/fundamentals/setup/server-setup/running-umbraco-in-docker
/// </summary>
public class DockerComposer : IComposer
{
    public void Compose(IUmbracoBuilder builder)
        => builder.RuntimeModeValidators()
            .Remove<UseHttpsValidator>();
}
