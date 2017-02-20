using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Umbraco.Core;

/// <summary>
/// Summary description for UpdatePublished
/// </summary>
public class UpdatePublished : ApplicationEventHandler
{
    protected override void ApplicationStarted(UmbracoApplicationBase umbracoApplication, ApplicationContext applicationContext)
    {
        Umbraco.Core.Services.ContentService.Publishing += ContentService_Publishing;
    }

    void ContentService_Publishing(Umbraco.Core.Publishing.IPublishingStrategy sender, Umbraco.Core.Events.PublishEventArgs<Umbraco.Core.Models.IContent> e)
    {
        var content = e.PublishedEntities.FirstOrDefault();
        if (content.HasProperty("headline") && content.HasProperty("headlineEnglish") && content.HasProperty("urlDanish") && content.HasProperty("urlEnglish"))
        {
            content.SetValue("urlDanish", Library.Tools.StringExtensions.ToSeoUrl(content.GetValue<string>("headline")));
            content.SetValue("urlEnglish", Library.Tools.StringExtensions.ToSeoUrl(content.GetValue<string>("headlineEnglish")));

            ApplicationContext.Current.Services.ContentService.Save(content);
        }
    }
}
