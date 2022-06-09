package views.admin.programs;

import static com.google.common.base.Preconditions.checkNotNull;
import static j2html.TagCreator.div;
import static j2html.TagCreator.each;
import static j2html.TagCreator.h1;
import static j2html.TagCreator.input;
import static j2html.TagCreator.label;
import static j2html.TagCreator.p;

import auth.CiviFormProfile;
import com.google.inject.Inject;
import com.typesafe.config.Config;
import controllers.admin.routes;
import j2html.tags.ContainerTag;
import j2html.tags.specialized.DivTag;
import j2html.tags.specialized.FormTag;
import j2html.tags.specialized.LabelTag;
import java.time.Instant;
import java.time.ZoneId;
import java.util.Optional;
import java.util.concurrent.CompletionException;
import play.mvc.Http;
import play.twirl.api.Content;
import services.LocalizedStrings;
import services.program.ActiveAndDraftPrograms;
import services.program.ProgramDefinition;
import views.BaseHtmlView;
import views.HtmlBundle;
import views.admin.AdminLayout;
import views.admin.AdminLayout.NavPage;
import views.admin.AdminLayoutFactory;
import views.components.LinkElement;
import views.components.Modal;
import views.style.ReferenceClasses;
import views.style.StyleUtils;
import views.style.Styles;

/** Renders a page so the admin can view all active programs and draft programs. */
public final class ProgramIndexView extends BaseHtmlView {
  private final AdminLayout layout;
  private final String baseUrl;
  private final ZoneId zoneId;

  @Inject
  public ProgramIndexView(AdminLayoutFactory layoutFactory, Config config, ZoneId zoneId) {
    this.layout = checkNotNull(layoutFactory).getLayout(NavPage.PROGRAMS);
    this.baseUrl = checkNotNull(config).getString("base_url");
    this.zoneId = checkNotNull(zoneId);
  }

  public Content render(
      ActiveAndDraftPrograms programs, Http.Request request, Optional<CiviFormProfile> profile) {
    if (profile.isPresent() && profile.get().isProgramAdmin() && !profile.get().isCiviFormAdmin()) {
      layout.setOnlyProgramAdminType();
    }

    String pageTitle = "All programs";
    DivTag publishAllModalContent =
        div()
            .withClasses(Styles.FLEX, Styles.FLEX_COL, Styles.GAP_4)
            .with(p("Are you sure you want to publish all programs?").withClasses(Styles.P_2))
            .with(maybeRenderPublishButton(programs, request));
    Modal publishAllModal =
        Modal.builder("publish-all-programs-modal", publishAllModalContent)
            .setModalTitle("Confirmation")
            .setTriggerButtonText("Publish all programs")
            .build();

    DivTag contentDiv =
        div()
            .withClasses(Styles.PX_20)
            .with(
                h1(pageTitle).withClasses(Styles.MY_4),
                div()
                    .withClasses(Styles.FLEX, Styles.ITEMS_CENTER)
                    .with(renderNewProgramButton())
                    .with(div().withClass(Styles.FLEX_GROW))
                    .condWith(programs.anyDraft(), publishAllModal.getButton()),
                div()
                    .withClasses(ReferenceClasses.ADMIN_PROGRAM_CARD_LIST, Styles.INVISIBLE)
                    .with(
                        p("Loading")
                            .withClasses(ReferenceClasses.ADMIN_PROGRAM_CARD_LIST_PLACEHOLDER),
                        each(
                            programs.getProgramNames(),
                            name ->
                                this.renderProgramListItem(
                                    programs.getActiveProgramDefinition(name),
                                    programs.getDraftProgramDefinition(name),
                                    request,
                                    profile))))
            .with(renderDownloadExportCsvButton());

    HtmlBundle htmlBundle =
        layout
            .getBundle()
            .setTitle(pageTitle)
            .addMainContent(contentDiv)
            .addModals(publishAllModal)
            .addFooterScripts(layout.viewUtils.makeLocalJsTag("admin_programs"));
    return layout.renderCentered(htmlBundle);
  }

  private DivTag renderDownloadExportCsvButton() {
    return new LinkElement()
        .setId("download-export-csv-button")
        .setHref(routes.AdminApplicationController.downloadDemographics().url())
        .setText("Download Exported Data (CSV)")
        .asButton();
  }

  private ContainerTag<?> maybeRenderPublishButton(ActiveAndDraftPrograms programs, Http.Request request) {
    // We should only render the publish button if there is at least one draft.
    if (programs.anyDraft()) {
      String link = routes.AdminProgramController.publish().url();
      return new LinkElement()
              .setId("publish-programs-button")
              .setHref(link)
              .setText("Publish all drafts")
              .asHiddenForm(request);
    } else {
      return div();
    }
  }

  private DivTag renderNewProgramButton() {
    String link = controllers.admin.routes.AdminProgramController.newOne().url();
    return new LinkElement()
        .setId("new-program-button")
        .setHref(link)
        .setText("Create new program")
        .asButton();
  }

  public ProgramDefinition getDisplayProgram(
      Optional<ProgramDefinition> draftProgram, Optional<ProgramDefinition> activeProgram) {
    if (draftProgram.isPresent()) {
      return draftProgram.get();
    }
    return activeProgram.get();
  }

  public DivTag renderProgramListItem(
      Optional<ProgramDefinition> activeProgram,
      Optional<ProgramDefinition> draftProgram,
      Http.Request request,
      Optional<CiviFormProfile> profile) {
    String programStatusText = extractProgramStatusText(draftProgram, activeProgram);

    ProgramDefinition displayProgram = getDisplayProgram(draftProgram, activeProgram);

    String lastEditText =
        displayProgram.lastModifiedTime().isPresent()
            ? "Last updated: " + renderDateTime(displayProgram.lastModifiedTime().get(), zoneId)
            : "Could not find latest update time";
    String programTitleText = displayProgram.adminName();
    String programDescriptionText = displayProgram.adminDescription();
    String blockCountText = "Screens: " + displayProgram.getBlockCount();
    String questionCountText = "Questions: " + displayProgram.getQuestionCount();

    DivTag topContent =
        div(
                div(
                    p(programStatusText).withClasses(Styles.TEXT_SM, Styles.TEXT_GRAY_700),
                    div(programTitleText)
                        .withClasses(
                            ReferenceClasses.ADMIN_PROGRAM_CARD_TITLE,
                            Styles.TEXT_BLACK,
                            Styles.FONT_BOLD,
                            Styles.TEXT_XL,
                            Styles.MB_2)),
                p().withClasses(Styles.FLEX_GROW),
                div(p(blockCountText), p(questionCountText))
                    .withClasses(
                        Styles.TEXT_RIGHT,
                        Styles.TEXT_XS,
                        Styles.TEXT_GRAY_700,
                        Styles.MR_2,
                        StyleUtils.applyUtilityClass(StyleUtils.RESPONSIVE_MD, Styles.MR_4)))
            .withClasses(Styles.FLEX);

    DivTag midContent =
        div(programDescriptionText)
            .withClasses(Styles.TEXT_GRAY_700, Styles.TEXT_BASE, Styles.MB_8, Styles.LINE_CLAMP_3);

    LabelTag programDeepLink =
        label("Deep link, use this URL to link to this program from outside of CiviForm:")
            .withClasses(Styles.W_FULL)
            .with(
                input()
                    .attr(
                        "value",
                        baseUrl
                            + controllers.applicant.routes.RedirectController.programByName(
                                    displayProgram.slug())
                                .url())
                    .attr("disabled", "readonly")
                    .withClasses(Styles.W_FULL, Styles.MB_2)
                    .attr("type", "text"));

    DivTag bottomContent =
        div(
                p(lastEditText).withClasses(Styles.TEXT_GRAY_700, Styles.ITALIC),
                p().withClasses(Styles.FLEX_GROW),
                maybeRenderManageTranslationsLink(draftProgram),
                maybeRenderEditLink(draftProgram, activeProgram, request),
                maybeRenderViewApplicationsLink(activeProgram, profile),
                renderManageProgramAdminsLink(draftProgram, activeProgram))
            .withClasses(Styles.FLEX, Styles.TEXT_SM, Styles.W_FULL);

    DivTag innerDiv =
        div(topContent, midContent, programDeepLink, bottomContent)
            .withClasses(
                Styles.BORDER, Styles.BORDER_GRAY_300, Styles.BG_WHITE, Styles.ROUNDED, Styles.P_4);

    return div(innerDiv)
        .withClasses(
            ReferenceClasses.ADMIN_PROGRAM_CARD, Styles.W_FULL, Styles.SHADOW_LG, Styles.MB_4)
        // Add data attributes used for client-side sorting.
        .withData(
            "last-updated-millis",
            Long.toString(extractLastUpdated(draftProgram, activeProgram).toEpochMilli()))
        .withData("name", programTitleText);
  }

  private static Instant extractLastUpdated(
      Optional<ProgramDefinition> draftProgram, Optional<ProgramDefinition> activeProgram) {
    // Prefer when the draft was last updated, since active versions should be immutable after
    // being published.
    if (draftProgram.isEmpty() && activeProgram.isEmpty()) {
      throw new IllegalArgumentException("Program neither active nor draft.");
    }
    ProgramDefinition program = draftProgram.isPresent() ? draftProgram.get() : activeProgram.get();
    return program.lastModifiedTime().orElse(Instant.EPOCH);
  }

  private String extractProgramStatusText(
      Optional<ProgramDefinition> draftProgram, Optional<ProgramDefinition> activeProgram) {
    if (draftProgram.isPresent() && activeProgram.isPresent()) {
      return "Active, with draft";
    } else if (draftProgram.isPresent()) {
      return "Draft";
    } else if (activeProgram.isPresent()) {
      return "Active";
    }
    throw new IllegalArgumentException("Program neither active nor draft.");
  }

  ContainerTag<?> maybeRenderEditLink(
      Optional<ProgramDefinition> draftProgram,
      Optional<ProgramDefinition> activeProgram,
      Http.Request request) {
    String editLinkText = "Edit →";
    String newVersionText = "New Version";
    FormTag linkElementAsForm;

    if (draftProgram.isPresent()) {
      String editLink =
          controllers.admin.routes.AdminProgramController.edit(draftProgram.get().id()).url();

      return new LinkElement()
          .setId("program-edit-link-" + draftProgram.get().id())
          .setHref(editLink)
          .setText(editLinkText)
          .setStyles(Styles.MR_2)
          .asAnchorText();
    } else if (activeProgram.isPresent()) {
      String newVersionLink =
          controllers.admin.routes.AdminProgramController.newVersionFrom(activeProgram.get().id())
              .url();

      linkElementAsForm =
          new LinkElement()
              .setId("program-new-version-link-" + activeProgram.get().id())
              .setHref(newVersionLink)
              .setText(newVersionText)
              .setStyles(Styles.MR_2)
              .asHiddenForm(request);
      return linkElementAsForm;
    } else {
      // obsolete or deleted, no edit link, empty div.
      return div();
    }
  }

  private ContainerTag<?> maybeRenderManageTranslationsLink(
      Optional<ProgramDefinition> draftProgram) {
    if (draftProgram.isPresent()) {
      String linkText = "Manage Translations →";
      String linkDestination =
          routes.AdminProgramTranslationsController.edit(
                  draftProgram.get().id(), LocalizedStrings.DEFAULT_LOCALE.toLanguageTag())
              .url();
      return new LinkElement()
          .setId("program-translations-link-" + draftProgram.get().id())
          .setHref(linkDestination)
          .setText(linkText)
          .setStyles(Styles.MR_2)
          .asAnchorText();
    } else {
      return div();
    }
  }

  private ContainerTag<?> maybeRenderViewApplicationsLink(
      Optional<ProgramDefinition> activeProgram, Optional<CiviFormProfile> userProfile) {
    // TODO(#2582): Determine if this has N+1 query behavior and fix if
    // necessary.
    if (activeProgram.isPresent() && userProfile.isPresent()) {
      boolean userIsAuthorized = true;
      try {
        userProfile.get().checkProgramAuthorization(activeProgram.get().adminName()).join();
      } catch (CompletionException e) {
        userIsAuthorized = false;
      }
      if (userIsAuthorized) {
        String editLink =
            routes.AdminApplicationController.index(
                    activeProgram.get().id(), Optional.empty(), Optional.empty())
                .url();

        return new LinkElement()
            .setId("program-view-apps-link-" + activeProgram.get().id())
            .setHref(editLink)
            .setText("Applications →")
            .setStyles(Styles.MR_2)
            .asAnchorText();
      }
    }
    return div();
  }

  private ContainerTag<?> renderManageProgramAdminsLink(
      Optional<ProgramDefinition> draftProgram, Optional<ProgramDefinition> activeProgram) {
    // We can use the ID of either, since we just add the program name and not ID to indicate
    // ownership.
    long programId =
        draftProgram.isPresent() ? draftProgram.get().id() : activeProgram.orElseThrow().id();
    String adminLink = routes.ProgramAdminManagementController.edit(programId).url();
    return new LinkElement()
        .setId("manage-program-admin-link-" + programId)
        .setHref(adminLink)
        .setText("Manage Admins →")
        .setStyles(Styles.MR_2)
        .asAnchorText();
  }
}
