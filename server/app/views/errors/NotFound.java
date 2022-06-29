package views.errors;

import static com.google.common.base.Preconditions.checkNotNull;
import static j2html.TagCreator.a;
import static j2html.TagCreator.div;
import static j2html.TagCreator.h1;
import static j2html.TagCreator.p;
import static j2html.TagCreator.span;

import com.google.inject.Inject;
import j2html.tags.ContainerTag;
import play.i18n.Messages;
import play.mvc.Http;
import play.twirl.api.Content;
import services.MessageKey;
import views.BaseHtmlView;
import views.HtmlBundle;
import views.LanguageSelector;
import views.applicant.ApplicantLayout;
import views.style.BaseStyles;
import views.style.ErrorStyles;
import views.style.Styles;

public class NotFound extends BaseHtmlView {

  private final ApplicantLayout layout;
  private final LanguageSelector languageSelector;

  @Inject
  public NotFound(ApplicantLayout layout, LanguageSelector languageSelector) {
    this.layout = layout;
    this.languageSelector = checkNotNull(languageSelector);
  }

  private ContainerTag h1Content(Messages messages) {
    return h1(
            span(messages.at(MessageKey.ERROR_NOT_FOUND_TITLE.getKeyName())),
            space(),
            spanNowrap(messages.at(MessageKey.ERROR_NOT_FOUND_TITLE_END.getKeyName())))
        .withClasses(ErrorStyles.H1_NOT_FOUND);
  }

  private ContainerTag descriptionContent(Messages messages) {
    return div(p(
                span(messages.at(MessageKey.ERROR_NOT_FOUND_DESCRIPTION_A.getKeyName())),
                space(),
                spanNowrap(messages.at(MessageKey.ERROR_NOT_FOUND_DESCRIPTION_A_END.getKeyName())),
                space(),
                a(messages.at(MessageKey.ERROR_NOT_FOUND_DESCRIPTION_LINK.getKeyName()))
                    .withHref("/")
                    .withClasses(BaseStyles.LINK_TEXT, BaseStyles.LINK_HOVER_TEXT))
            .withClasses(ErrorStyles.P_MOBILE_INLINE))
        .withClasses(ErrorStyles.P_DESCRIPTION);
  }

  /** Page returned on 404 error */
  private ContainerTag mainContent(Messages messages) {
    return div(h1Content(messages), descriptionContent(messages))
        .withClasses(Styles.TEXT_CENTER, Styles.MAX_W_SCREEN_SM, Styles.W_5_6, Styles.MX_AUTO);
  }

  private HtmlBundle addBodyFooter(Http.RequestHeader request, Messages messages) {
    HtmlBundle bundle = layout.getBundle();
    String language = languageSelector.getPreferredLangage(request).code();
    ContainerTag supportLink = layout.getSupportLink(messages).withClasses(Styles.TEXT_CENTER);
    bundle.setLanguage(language);
    bundle.addMainContent(mainContent(messages));
    bundle.addFooterContent(supportLink);

    return bundle;
  }

  public Content renderLoggedOut(Http.RequestHeader request, Messages messages) {
    HtmlBundle bundle = addBodyFooter(request, messages);
    bundle.addHeaderContent(layout.renderNavBarLoggedOut(request, messages));
    return layout.render(bundle);
  }

  public Content renderLoggedIn(Http.RequestHeader request, Messages messages, String userName) {
    HtmlBundle bundle = addBodyFooter(request, messages);
    bundle.addHeaderContent(layout.renderNavBarLoggedIn(request, userName, messages));
    return layout.render(bundle);
  }
}