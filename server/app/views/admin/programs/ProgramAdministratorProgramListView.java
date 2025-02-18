package views.admin.programs;

import static com.google.common.base.Preconditions.checkNotNull;
import static j2html.TagCreator.div;
import static j2html.TagCreator.each;
import static j2html.TagCreator.h1;

import auth.CiviFormProfile;
import com.google.common.collect.ImmutableList;
import com.typesafe.config.Config;
import controllers.admin.routes;
import j2html.tags.specialized.ButtonTag;
import j2html.tags.specialized.DivTag;
import java.util.List;
import java.util.Optional;
import javax.inject.Inject;
import play.twirl.api.Content;
import services.program.ActiveAndDraftPrograms;
import services.program.ProgramDefinition;
import views.BaseHtmlView;
import views.HtmlBundle;
import views.admin.AdminLayout;
import views.admin.AdminLayout.NavPage;
import views.admin.AdminLayoutFactory;
import views.components.Icons;
import views.components.ProgramCardFactory;
import views.components.ProgramCardFactory.ProgramCardData;
import views.style.AdminStyles;
import views.style.Styles;

/** Renders a page for program admins to view programs they administer. */
public final class ProgramAdministratorProgramListView extends BaseHtmlView {

  private final AdminLayout layout;
  private final String baseUrl;
  private final ProgramCardFactory programCardFactory;

  @Inject
  public ProgramAdministratorProgramListView(
      AdminLayoutFactory layoutFactory, Config config, ProgramCardFactory programCardFactory) {
    this.layout = checkNotNull(layoutFactory).getLayout(NavPage.PROGRAMS);
    this.baseUrl = checkNotNull(config).getString("base_url");
    this.programCardFactory = checkNotNull(programCardFactory);
  }

  public Content render(
      ActiveAndDraftPrograms programs,
      List<String> authorizedPrograms,
      Optional<CiviFormProfile> civiformProfile) {
    if (civiformProfile.isPresent()
        && civiformProfile.get().isProgramAdmin()
        && !civiformProfile.get().isCiviFormAdmin()) {
      layout.setOnlyProgramAdminType();
    }

    String title = "Your programs";
    DivTag contentDiv =
        div()
            .withClasses(Styles.PX_20)
            .with(
                h1(title).withClasses(Styles.MY_4),
                each(
                    programs.getActivePrograms().stream()
                        .filter(program -> authorizedPrograms.contains(program.adminName()))
                        .map(this::buildCardData)
                        .sorted(ProgramCardFactory.lastModifiedTimeThenNameComparator())
                        .map(programCardFactory::renderCard)));

    HtmlBundle htmlBundle =
        layout
            .getBundle()
            .setTitle(title)
            .addMainContent(contentDiv)
            .addFooterScripts(layout.viewUtils.makeLocalJsTag("admin_programs"));

    return layout.renderCentered(htmlBundle);
  }

  private ProgramCardFactory.ProgramCardData buildCardData(ProgramDefinition activeProgram) {
    return ProgramCardFactory.ProgramCardData.builder()
        .setActiveProgram(
            Optional.of(
                ProgramCardData.ProgramRow.builder()
                    .setProgram(activeProgram)
                    .setRowActions(
                        ImmutableList.of(
                            renderShareLink(activeProgram),
                            renderViewApplicationsLink(activeProgram)))
                    .setExtraRowActions(ImmutableList.of())
                    .build()))
        .build();
  }

  private ButtonTag renderViewApplicationsLink(ProgramDefinition activeProgram) {
    String viewApplicationsLink =
        routes.AdminApplicationController.index(
                activeProgram.id(),
                /* search= */ Optional.empty(),
                /* page= */ Optional.empty(),
                /* fromDate= */ Optional.empty(),
                /* untilDate= */ Optional.empty(),
                /* applicationStatus= */ Optional.empty(),
                /* selectedApplicationUri= */ Optional.empty())
            .url();
    ButtonTag button =
        makeSvgTextButton("Applications", Icons.TEXT_SNIPPET)
            .withClass(AdminStyles.TERTIARY_BUTTON_STYLES);
    return asRedirectElement(button, viewApplicationsLink);
  }

  private ButtonTag renderShareLink(ProgramDefinition program) {
    String programLink =
        baseUrl
            + controllers.applicant.routes.RedirectController.programBySlug(program.slug()).url();
    return makeSvgTextButton("Share link", Icons.CONTENT_COPY)
        .withClass(AdminStyles.TERTIARY_BUTTON_STYLES)
        .withData("copyable-program-link", programLink);
  }
}
