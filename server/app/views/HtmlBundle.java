package views;

import static j2html.TagCreator.div;
import static j2html.TagCreator.document;
import static j2html.TagCreator.each;
import static j2html.TagCreator.footer;
import static j2html.TagCreator.head;
import static j2html.TagCreator.header;
import static j2html.TagCreator.html;
import static j2html.TagCreator.link;
import static j2html.TagCreator.main;
import static j2html.TagCreator.title;

import com.google.common.base.Strings;
import j2html.tags.Tag;
import j2html.tags.specialized.BodyTag;
import j2html.tags.specialized.DivTag;
import j2html.tags.specialized.FooterTag;
import j2html.tags.specialized.HeadTag;
import j2html.tags.specialized.HeaderTag;
import j2html.tags.specialized.HtmlTag;
import j2html.tags.specialized.LinkTag;
import j2html.tags.specialized.MainTag;
import j2html.tags.specialized.MetaTag;
import j2html.tags.specialized.ScriptTag;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import play.twirl.api.Content;
import views.components.Modal;
import views.components.ToastMessage;
import views.style.BaseStyles;

/** The HtmlBundle class stores all of the data necessary for rendering a page. */
public final class HtmlBundle {
  private static final Logger logger = LoggerFactory.getLogger(HtmlBundle.class);

  private String pageTitle;
  private String language = "en";
  private Optional<String> faviconURL = Optional.empty();

  private ArrayList<String> bodyStyles = new ArrayList<>();
  private ArrayList<Tag> footerContent = new ArrayList<>();
  private ArrayList<ScriptTag> footerScripts = new ArrayList<>();
  private ArrayList<String> footerStyles = new ArrayList<>();
  private ArrayList<ScriptTag> headScripts = new ArrayList<>();
  private ArrayList<Tag> headerContent = new ArrayList<>();
  private ArrayList<String> headerStyles = new ArrayList<>();
  private ArrayList<Tag> mainContent = new ArrayList<>();
  private ArrayList<String> mainStyles = new ArrayList<>();
  private ArrayList<MetaTag> metadata = new ArrayList<>();
  private ArrayList<Modal> modals = new ArrayList<>();
  private ArrayList<LinkTag> stylesheets = new ArrayList<>();
  private ArrayList<ToastMessage> toastMessages = new ArrayList<>();

  public HtmlBundle addBodyStyles(String... styles) {
    bodyStyles.addAll(Arrays.asList(styles));
    return this;
  }

  public HtmlBundle addFooterContent(Tag... tags) {
    footerContent.addAll(Arrays.asList(tags));
    return this;
  }

  public HtmlBundle addFooterScripts(ScriptTag... sources) {
    footerScripts.addAll(Arrays.asList(sources));
    return this;
  }

  public HtmlBundle addFooterStyles(String... styles) {
    footerStyles.addAll(Arrays.asList(styles));
    return this;
  }

  public HtmlBundle addHeadScripts(ScriptTag... sources) {
    headScripts.addAll(Arrays.asList(sources));
    return this;
  }

  public HtmlBundle addHeaderContent(Tag... tags) {
    headerContent.addAll(Arrays.asList(tags));
    return this;
  }

  public HtmlBundle addHeaderStyles(String... styles) {
    headerStyles.addAll(Arrays.asList(styles));
    return this;
  }

  public HtmlBundle addMainContent(Tag... tags) {
    mainContent.addAll(Arrays.asList(tags));
    return this;
  }

  public HtmlBundle addMainStyles(String... styles) {
    mainStyles.addAll(Arrays.asList(styles));
    return this;
  }

  public HtmlBundle addMetadata(MetaTag... tags) {
    metadata.addAll(Arrays.asList(tags));
    return this;
  }

  public HtmlBundle addStylesheets(LinkTag... sources) {
    stylesheets.addAll(Arrays.asList(sources));
    return this;
  }

  public HtmlBundle addToastMessages(ToastMessage... messages) {
    toastMessages.addAll(Arrays.asList(messages));
    return this;
  }

  public HtmlBundle addModals(Modal... modalTags) {
    return addModals(Arrays.asList(modalTags));
  }

  public HtmlBundle addModals(Collection<Modal> modalTags) {
    modals.addAll(modalTags);
    return this;
  }

  private HtmlTag getContent() {
    return html(renderHead(), renderBody()).withLang(language);
  }

  public String getTitle() {
    return pageTitle;
  }

  public String getFavicon() {
    return faviconURL.orElse("");
  }

  public HtmlBundle setLanguage(String lang) {
    language = lang;
    return this;
  }

  public HtmlBundle setTitle(String title) {
    pageTitle = title;
    return this;
  }

  public HtmlBundle setFavicon(String url) {
    faviconURL = Optional.ofNullable(Strings.emptyToNull(url));
    return this;
  }

  /** The page body contains: - header - main - footer */
  private BodyTag renderBody() {
    BodyTag bodyTag = j2html.TagCreator.body().with(renderHeader()).with(renderMain());
    bodyTag.with(renderModals());
    bodyTag.with(renderFooter());

    if (bodyStyles.size() > 0) {
      bodyTag.withClasses(bodyStyles.toArray(new String[0]));
    }

    return bodyTag;
  }

  private FooterTag renderFooter() {
    FooterTag footerTag = footer().with(footerContent).with(footerScripts);

    if (footerStyles.size() > 0) {
      footerTag.withClasses(footerStyles.toArray(new String[0]));
    }

    return footerTag;
  }

  /**
   * The page head contains:
   *
   * <ul>
   *   <li>page title
   *   <li>favicon link
   *   <li>page metadata
   *   <li>CSS styles
   *   <li>javascript that needs to run immediately
   * </ul>
   */
  private HeadTag renderHead() {
    // TODO: Throw exception if page title is not set.
    return head()
        .with(title(pageTitle))
        // The "orElse" value is never used, but it must be included because the
        // "withHref" evaluates even if the "condWith" is false.
        .condWith(faviconURL.isPresent(), link().withRel("icon").withHref(faviconURL.orElse("")))
        .with(metadata)
        .with(stylesheets)
        .with(headScripts);
  }

  private HeaderTag renderHeader() {
    // TODO: Sort toastMessages by priority before displaying.
    HeaderTag headerTag =
        header()
            .with(each(toastMessages, toastMessage -> toastMessage.getContainerTag()))
            .with(headerContent);

    if (headerStyles.size() > 0) {
      headerTag.withClasses(headerStyles.toArray(new String[0]));
    }

    return headerTag;
  }

  private MainTag renderMain() {
    MainTag mainTag = main().with(mainContent);

    if (mainStyles.size() > 0) {
      mainTag.withClasses(mainStyles.toArray(new String[0]));
    }

    return mainTag;
  }

  private DivTag renderModals() {
    DivTag modalContainer =
        div()
            .withId("modal-container")
            .withClasses(BaseStyles.MODAL_CONTAINER)
            .with(div().withId("modal-glass-pane").withClasses(BaseStyles.MODAL_GLASS_PANE));
    // Validate that only one modal has the "displayOnLoad" setting, since popping multiple
    // modals doesn't make sense. A warning is logged rather than throwing since client-side
    // code will choose the first modal with the attribute.
    long displayOnLoadModalCount = modals.stream().filter(Modal::displayOnLoad).count();
    if (displayOnLoadModalCount > 1) {
      logger.warn(
          String.format(
              "Multiple (%d) modals found containing display on load.", displayOnLoadModalCount));
    }
    modals.forEach(modal -> modalContainer.with(modal.getContainerTag()));
    return modalContainer;
  }

  public Content render() {
    return new HtmlBundleContent(getContent());
  }

  private static class HtmlBundleContent implements Content {
    HtmlTag bundleContent;

    public HtmlBundleContent(HtmlTag bundleContent) {
      this.bundleContent = bundleContent;
    }

    @Override
    public String body() {
      return document(bundleContent);
    }

    @Override
    public String contentType() {
      return "text/html";
    }
  }
}
